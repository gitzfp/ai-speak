package services

import (
	"encoding/json"
	"errors"
	"math/rand/v2"

	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/gitzfp/ai-speak/aispeak-server-go/repositories"
	"gorm.io/gorm"
)

type ITaskService interface {
    CreateTaskWithContents(task *models.Task, contents []*models.TaskContent) error
    GetTaskDetails(id uint) (*models.Task, error)
    ListTasks(teacherID, status string, page, pageSize int) ([]models.Task, error)
    UpdateTask(task *models.Task) error
    DeleteTask(id uint) error
}

// 问题：缺少单词和句子仓库的依赖
type TaskService struct {
	repo         *repositories.TaskRepository
	wordRepo     *repositories.WordRepository
	contentRepo  *repositories.ContentRepository
}

// 需要修改构造函数
func NewTaskService(repo *repositories.TaskRepository, 
	wordRepo *repositories.WordRepository,
	contentRepo *repositories.ContentRepository) *TaskService {
	return &TaskService{
		repo:         repo,
		wordRepo:     wordRepo,
		contentRepo:  contentRepo,
	}
}

func (s *TaskService) CreateTaskWithContents(task *models.Task, contents []*models.TaskContent) error {
	// 验证任务类型和内容类型是否一致
	for _, content := range contents {
		err := models.ValidateTaskTypeAndContentType(task.TaskType, models.ContentType(content.ContentType))
		if err != nil {
			return err
		}
	}

	return s.repo.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(task).Error; err != nil {
			return err
		}
		for _, content := range contents {
			content.TaskID = task.ID
			if err := tx.Create(content).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *TaskService) GetTaskDetails(id uint) (*models.Task, error) {
	task, err := s.repo.GetTaskByID(id)
	if err != nil {
		return nil, err
	}
	
	var contents []models.TaskContent
	if err := s.repo.DB.Where("task_id = ?", id).Find(&contents).Error; err != nil {
		return nil, err
	}
	
	// 遍历每个内容项，加载单词和句子数据
	for i := range contents {
		content := &contents[i]
		
		// 根据内容类型处理不同的元数据
		switch content.ContentType {
		case "dictation":
			// 获取听写元数据
			meta, err := content.GetDictationMetadata()
			if err != nil {
				continue // 跳过错误内容
			}
			
			// 如果元数据中没有单词ID，但有参考教材和单元信息，则根据教材单元加载单词
			if (meta.WordIDs == nil || len(meta.WordIDs) == 0) && content.RefBookID != "" && content.RefLessonID > 0 {
				words, err := s.wordRepo.GetByLesson(content.RefBookID, content.RefLessonID)
				if err == nil && len(words) > 0 {
					// 使用所有单词或者限制数量
					maxWords := 10 // 设置一个合理的最大值，也可以从配置中读取
					if len(words) > maxWords {
						words = words[:maxWords]
					}
					// 提取单词ID
					var wordIDs []int32
					for _, w := range words {
						wordIDs = append(wordIDs, w.WordID)
					}
					meta.WordIDs = wordIDs
					meta.Words = words
					// 更新元数据
					content.SetDictationMetadata(meta)
				}
			} else if len(meta.WordIDs) > 0 {
				// 原有逻辑：加载单词数据
				words, err := s.wordRepo.GetByIDs(meta.WordIDs)
				if err == nil {
					meta.Words = words
					// 更新元数据
					content.SetDictationMetadata(meta)
				}
			}
			
		case "sentence_repeat":
			// 获取句子重复元数据
			meta, err := content.GetSentenceRepeatMetadata()
			if err != nil {
				continue // 跳过错误内容
			}
			
			// 如果元数据中没有句子ID，但有参考教材和单元信息，则根据教材单元加载句子
			if (meta.SentenceIDs == nil || len(meta.SentenceIDs) == 0) && content.RefBookID != "" && content.RefLessonID > 0 {
				sentences, err := s.contentRepo.GetSentencesByLesson(content.RefBookID, content.RefLessonID)
				if err == nil && len(sentences) > 0 {
					// 使用所有句子或者限制数量
					maxSentences := 5 // 设置一个合理的最大值，也可以从配置中读取
					if len(sentences) > maxSentences {
						sentences = sentences[:maxSentences]
					}
					// 提取句子ID
					var sentenceIDs []int32
					for _, s := range sentences {
						sentenceIDs = append(sentenceIDs, s.ID)
					}
					meta.SentenceIDs = sentenceIDs
					meta.Sentences = sentences
					// 更新元数据
					content.SetSentenceRepeatMetadata(meta)
				}
			} else if len(meta.SentenceIDs) > 0 {
				// 原有逻辑：加载句子数据
				sentences, err := s.contentRepo.GetSentencesByIDs(meta.SentenceIDs)
				if err == nil {
					meta.Sentences = sentences
					// 更新元数据
					content.SetSentenceRepeatMetadata(meta)
				}
			}
		}
	}
	
	task.TaskContents = contents
	return task, nil
}

// Fix missing method implementations
func (s *TaskService) UpdateTask(task *models.Task) error {
    return s.repo.UpdateTask(task)
}

// 删除任务（带关联数据清理）
func (s *TaskService) DeleteTask(id uint) error {
    return s.repo.DB.Transaction(func(tx *gorm.DB) error {  // Changed s.db to s.repo.DB
        // 删除关联内容
        if err := tx.Where("task_id = ?", id).Delete(&models.TaskContent{}).Error; err != nil {
            return err
        }
        // 删除主任务
        return tx.Delete(&models.Task{}, id).Error
    })
}

// 增强列表查询
func (s *TaskService) ListTasks(teacherID, status string, page, pageSize int) ([]models.Task, error) {
    query := s.repo.DB.Preload("TaskContents")
    
    if teacherID != "" {
        query = query.Where("teacher_id = ?", teacherID)
    }
    if status != "" {
        query = query.Where("status = ?", status)
    }
    
    var tasks []models.Task
    err := query.Offset((page - 1) * pageSize).Limit(pageSize).Find(&tasks).Error
    if err != nil {
        return nil, err
    }
    
    // 为每个任务加载单词和句子数据
    for i := range tasks {
        task := &tasks[i]
        for j := range task.TaskContents {
            content := &task.TaskContents[j]
            
            // 根据内容类型处理不同的元数据
            switch content.ContentType {
            case "dictation":
                // 获取听写元数据
                meta, err := content.GetDictationMetadata()
                if err != nil {
                    continue // 跳过错误内容
                }
                
                // 如果元数据中没有单词ID，但有参考教材和单元信息，则根据教材单元加载单词
                if (meta.WordIDs == nil || len(meta.WordIDs) == 0) && content.RefBookID != "" && content.RefLessonID > 0 {
                    words, err := s.wordRepo.GetByLesson(content.RefBookID, content.RefLessonID)
                    if err == nil && len(words) > 0 {
                        // 使用所有单词或者限制数量
                        maxWords := 10 // 设置一个合理的最大值，也可以从配置中读取
                        if len(words) > maxWords {
                            words = words[:maxWords]
                        }
                        // 提取单词ID
                        var wordIDs []int32
                        for _, w := range words {
                            wordIDs = append(wordIDs, w.WordID)
                        }
                        meta.WordIDs = wordIDs
                        meta.Words = words
                        // 更新元数据
                        content.SetDictationMetadata(meta)
                    }
                } else if len(meta.WordIDs) > 0 {
                    // 原有逻辑：加载单词数据
                    words, err := s.wordRepo.GetByIDs(meta.WordIDs)
                    if err == nil {
                        meta.Words = words
                        // 更新元数据
                        content.SetDictationMetadata(meta)
                    }
                }
                
            case "sentence_repeat":
                // 获取句子重复元数据
                meta, err := content.GetSentenceRepeatMetadata()
                if err != nil {
                    continue // 跳过错误内容
                }
                
                // 如果元数据中没有句子ID，但有参考教材和单元信息，则根据教材单元加载句子
                if (meta.SentenceIDs == nil || len(meta.SentenceIDs) == 0) && content.RefBookID != "" && content.RefLessonID > 0 {
                    sentences, err := s.contentRepo.GetSentencesByLesson(content.RefBookID, content.RefLessonID)
                    if err == nil && len(sentences) > 0 {
                        // 使用所有句子或者限制数量
                        maxSentences := 5 // 设置一个合理的最大值，也可以从配置中读取
                        if len(sentences) > maxSentences {
                            sentences = sentences[:maxSentences]
                        }
                        // 提取句子ID
                        var sentenceIDs []int32
                        for _, s := range sentences {
                            sentenceIDs = append(sentenceIDs, s.ID)
                        }
                        meta.SentenceIDs = sentenceIDs
                        meta.Sentences = sentences
                        // 更新元数据
                        content.SetSentenceRepeatMetadata(meta)
                    }
                } else if len(meta.SentenceIDs) > 0 {
                    // 原有逻辑：加载句子数据
                    sentences, err := s.contentRepo.GetSentencesByIDs(meta.SentenceIDs)
                    if err == nil {
                        meta.Sentences = sentences
                        // 更新元数据
                        content.SetSentenceRepeatMetadata(meta)
                    }
                }
            }
        }
    }
    
    return tasks, nil
}

func (s *TaskService) CreateTask(task models.Task) error {
    // 开启事务
    return s.repo.DB.Transaction(func(tx *gorm.DB) error {
        // 创建主任务记录
        if err := tx.Create(&task).Error; err != nil {
            return err
        }

        // 处理每个内容项
        for i := range task.TaskContents {
            content := &task.TaskContents[i]
            content.TaskID = task.ID
            
            // 验证任务类型和内容类型是否一致
            err := models.ValidateTaskTypeAndContentType(task.TaskType, models.ContentType(content.ContentType))
            if err != nil {
                return err
            }

            // 处理手动选择模式
            if content.GenerateMode == "manual" {
                switch content.ContentType {
                case "dictation":
                    words, err := s.getWordsByIDs(content.SelectedWordIDs)
                    if err != nil {
                        return err
                    }
                    meta := buildDictationMetadata(words, content.Metadata)
                    if err := content.SetDictationMetadata(meta); err != nil {
                        return err
                    }

                case "sentence_repeat":
                    sentences, err := s.getSentencesByIDs(content.SelectedSentenceIDs)
                    if err != nil {
                        return err
                    }
                    meta := buildSentenceRepeatMetadata(sentences, content.Metadata)
                    if err := content.SetSentenceRepeatMetadata(meta); err != nil {
                        return err
                    }
                }
            } else {
                // 处理自动生成模式
                switch content.ContentType {
                case "dictation":
                    words, err := s.getWordsByLesson(content.RefBookID, content.RefLessonID)
                    if err != nil {
                        return err
                    }
                    meta := generateAutoDictation(words, content.Metadata)
                    if err := content.SetDictationMetadata(meta); err != nil {
                        return err
                    }

                case "sentence_repeat":
                    sentences, err := s.getSentencesByLesson(content.RefBookID, content.RefLessonID)
                    if err != nil {
                        return err
                    }
                    meta := generateAutoSentenceRepeat(sentences, content.Metadata)
                    if err := content.SetSentenceRepeatMetadata(meta); err != nil {
                        return err
                    }
                }
            }

            // 创建内容项
            if err := tx.Create(content).Error; err != nil {
                return err
            }
        }
        return nil
    })
}

// 辅助函数示例
// buildDictationMetadata 构建手动选择的听写元数据
// 输入：选中的单词列表 + 配置参数
// 输出：包含单词ID和音频配置的元数据
func buildDictationMetadata(words []models.Word, config map[string]interface{}) *models.DictationMetadata {
    var wordIDs []int32
    for _, w := range words {
        wordIDs = append(wordIDs, w.WordID)
    }
    return &models.DictationMetadata{
        WordIDs:   wordIDs,
        AudioType: config["audio_type"].(string), // 实际应添加类型断言检查
        TimeLimit: config["time_limit"].(int),
    }
}

// buildSentenceRepeatMetadata 构建手动选择的跟读元数据
// 输入：选中的句子列表 + 配置参数
// 输出：包含句子ID和重复次数的元数据
func buildSentenceRepeatMetadata(sentences []models.LessonSentence, config map[string]interface{}) *models.SentenceRepeatMetadata {
    var sentenceIDs []int32
    for _, s := range sentences {
        sentenceIDs = append(sentenceIDs, s.ID)
    }
    return &models.SentenceRepeatMetadata{
        SentenceIDs: sentenceIDs,
        RepeatCount: config["repeat_count"].(int),
    }
}

// generateAutoDictation 自动生成听写内容
// 输入：教材单元所有单词 + 配置参数
// 输出：随机选取的单词元数据
func generateAutoDictation(words []models.Word, config map[string]interface{}) *models.DictationMetadata {
    // 实现随机选择逻辑示例
    selected := randomSelectWords(words, config["word_count"].(int))
    
    return &models.DictationMetadata{
        WordIDs:   extractWordIDs(selected),
        AudioType: config["audio_type"].(string),
        TimeLimit: config["time_limit"].(int),
    }
}


// getWordsByIDs retrieves words by their IDs
func (s *TaskService) getWordsByIDs(wordIDs interface{}) ([]models.Word, error) {
    // Convert from JSON to []int32
    var ids []int32
    
    // Handle different input types
    switch v := wordIDs.(type) {
    case []int32:
        ids = v
    case map[string]interface{}:
        // Try to extract from JSON map
        if idsArray, ok := v["word_ids"].([]interface{}); ok {
            for _, id := range idsArray {
                if idFloat, ok := id.(float64); ok {
                    ids = append(ids, int32(idFloat))
                }
            }
        }
    default:
        // Try JSON unmarshaling
        data, err := json.Marshal(wordIDs)
        if err != nil {
            return nil, err
        }
        
        var jsonIDs struct {
            IDs []int32 `json:"word_ids"`
        }
        if err := json.Unmarshal(data, &jsonIDs); err != nil {
            return nil, err
        }
        ids = jsonIDs.IDs
    }
    
    if len(ids) == 0 {
        return []models.Word{}, nil
    }
    
    return s.wordRepo.GetByIDs(ids)
}

// getSentencesByIDs retrieves sentences by their IDs
func (s *TaskService) getSentencesByIDs(sentenceIDs interface{}) ([]models.LessonSentence, error) {
    // Convert from JSON to []int32
    var ids []int32
    
    // Handle different input types
    switch v := sentenceIDs.(type) {
    case []int32:
        ids = v
    case map[string]interface{}:
        // Try to extract from JSON map
        if idsArray, ok := v["sentence_ids"].([]interface{}); ok {
            for _, id := range idsArray {
                if idFloat, ok := id.(float64); ok {
                    ids = append(ids, int32(idFloat))
                }
            }
        }
    default:
        // Try JSON unmarshaling
        data, err := json.Marshal(sentenceIDs)
        if err != nil {
            return nil, err
        }
        
        var jsonIDs struct {
            IDs []int32 `json:"sentence_ids"`
        }
        if err := json.Unmarshal(data, &jsonIDs); err != nil {
            return nil, err
        }
        ids = jsonIDs.IDs
    }
    
    if len(ids) == 0 {
        return []models.LessonSentence{}, nil
    }
    
    return s.contentRepo.GetSentencesByIDs(ids)
}

// getWordsByLesson retrieves words by book ID and lesson ID
func (s *TaskService) getWordsByLesson(bookID string, lessonID int) ([]models.Word, error) {
    return s.wordRepo.GetByLesson(bookID, lessonID)
}

// getSentencesByLesson retrieves sentences by book ID and lesson ID
func (s *TaskService) getSentencesByLesson(bookID string, lessonID int) ([]models.LessonSentence, error) {
    return s.contentRepo.GetSentencesByLesson(bookID, lessonID)
}

// randomSelectWords selects random words from a list based on count
func randomSelectWords(words []models.Word, count int) []models.Word {
    if len(words) <= count {
        return words
    }
    
    // Create a copy to avoid modifying the original
    wordsCopy := make([]models.Word, len(words))
    copy(wordsCopy, words)
    
    // Shuffle the words
    rand.Shuffle(len(wordsCopy), func(i, j int) {
        wordsCopy[i], wordsCopy[j] = wordsCopy[j], wordsCopy[i]
    })
    
    // Return the first 'count' words
    return wordsCopy[:count]
}

// extractWordIDs extracts word IDs from a list of words
func extractWordIDs(words []models.Word) []int32 {
    var ids []int32
    for _, word := range words {
        ids = append(ids, word.WordID)
    }
    return ids
}

// randomSelectSentences selects random sentences from a list based on count
func randomSelectSentences(sentences []models.LessonSentence, count int) []models.LessonSentence {
    if len(sentences) <= count {
        return sentences
    }
    
    // Create a copy to avoid modifying the original
    sentencesCopy := make([]models.LessonSentence, len(sentences))
    copy(sentencesCopy, sentences)
    
    // Shuffle the sentences
    rand.Shuffle(len(sentencesCopy), func(i, j int) {
        sentencesCopy[i], sentencesCopy[j] = sentencesCopy[j], sentencesCopy[i]
    })
    
    // Return the first 'count' sentences
    return sentencesCopy[:count]
}

// generateAutoSentenceRepeat generates automatic sentence repeat content
func generateAutoSentenceRepeat(sentences []models.LessonSentence, config map[string]interface{}) *models.SentenceRepeatMetadata {
    // Get count from config or use default
    count := 5
    if countVal, ok := config["count"].(float64); ok {
        count = int(countVal)
    }
    
    // Get repeat count from config or use default
    repeatCount := 3
    if repeatVal, ok := config["repeat_count"].(float64); ok {
        repeatCount = int(repeatVal)
    }
    
    // Select random sentences
    selectedSentences := randomSelectSentences(sentences, count)
    
    // Extract sentence IDs
    var sentenceIDs []int32
    for _, s := range selectedSentences {
        sentenceIDs = append(sentenceIDs, s.ID)
    }
    
    return &models.SentenceRepeatMetadata{
        SentenceIDs: sentenceIDs,
        RepeatCount: repeatCount,
    }
}

// validateWordIDs 验证单词 ID 是否存在并检查重复
func (s *TaskService) validateWordIDs(wordIDs []int32) error {
    seen := make(map[int32]bool)
    for _, id := range wordIDs {
        if seen[id] {
            return errors.New("单词ID重复")
        }
        seen[id] = true

        exists, err := s.wordRepo.Exists(id)
        if err != nil {
            return err
        }
        if !exists {
            return errors.New("单词ID不存在")
        }
    }
    return nil
}

// validateContentWithLesson 验证内容与教材单元是否匹配
func (s *TaskService) validateContentWithLesson(content *models.TaskContent) error {
    if !s.contentRepo.IsValidForLesson(content.RefBookID, content.RefLessonID, content.SelectedWordIDs) {
        return errors.New("单词不属于指定教材单元")
    }
    return nil
}

