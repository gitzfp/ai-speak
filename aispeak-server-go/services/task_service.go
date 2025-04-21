package services

import (
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/gitzfp/ai-speak/aispeak-server-go/repositories"
	"gorm.io/gorm"
)

// 问题：缺少单词和句子仓库的依赖
type TaskService struct {
    repo        *repositories.TaskRepository
    wordRepo    *repositories.WordRepository     // 需要添加
    sentenceRepo *repositories.SentenceRepository // 需要添加
}

// 需要修改构造函数
func NewTaskService(repo *repositories.TaskRepository, 
    wordRepo *repositories.WordRepository,
    sentenceRepo *repositories.SentenceRepository) *TaskService {
    return &TaskService{
        repo: repo,
        wordRepo: wordRepo,
        sentenceRepo: sentenceRepo,
    }
}

func (s *TaskService) CreateTaskWithContents(task *models.Task, contents []*models.TaskContent) error {
	return s.repo.DB.Transaction(func(tx *gorm.DB) error {  // Changed db -> DB
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
	if err := s.repo.DB.Where("task_id = ?", id).Find(&contents).Error; err != nil { // Changed db -> DB
		return nil, err
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
    query := s.repo.DB.Preload("TaskContents")  // Changed s.db to s.repo.DB
    
    if teacherID != "" {
        query = query.Where("teacher_id = ?", teacherID)
    }
    if status != "" {
        query = query.Where("status = ?", status)
    }
    
    var tasks []models.Task
    err := query.Offset((page - 1) * pageSize).Limit(pageSize).Find(&tasks).Error
    return tasks, err
}

func (s *TaskService) CreateTask(task models.Task) error {
    // 开启事务
    return s.repo.DB.Transaction(func(tx *gorm.DB) error {
        // 创建主任务记录
        // 问题：应该使用仓库方法而不是直接操作DB
        // 修改前：
        if err := tx.Create(&task).Error; ... 
        
        // 修改后：
        if err := s.repo.CreateInTransaction(tx, &task); ...
        if err := tx.Create(&task).Error; err != nil {
            return err
        }

        // 处理每个内容项
        for i := range task.TaskContents {
            content := &task.TaskContents[i]
            content.TaskID = task.ID

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

// generateAutoSentenceRepeat 自动生成跟读内容 
// 输入：教材单元所有句子 + 配置参数
// 输出：按难度过滤后随机选取的句子元数据
func generateAutoSentenceRepeat(sentences []models.LessonSentence, config map[string]interface{}) *models.SentenceRepeatMetadata {
    // 实现筛选逻辑示例
    filtered := filterByDifficulty(sentences, config["difficulty"].(string))
    selected := randomSelectSentences(filtered, config["sentence_count"].(int))
    
    return &models.SentenceRepeatMetadata{
        SentenceIDs: extractSentenceIDs(selected),
        RepeatCount: config["repeat_count"].(int),
    }
}

