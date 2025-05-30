package services

import (
	"encoding/json"
	"fmt"

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
    CreateSubmission(submission *models.Submission) error
    GetSubmissionDetails(id uint) (*models.Submission, error)
    ListSubmissions(taskID uint, page, pageSize int) ([]models.Submission, error)
    UpdateSubmission(submission *models.Submission) error
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
		
		// 新增：校验单词是否存在
		if content.ContentType == "dictation" && len(content.SelectedWordIDs) > 0 {
			for _, wordID := range content.SelectedWordIDs {
				exists, err := s.wordRepo.Exists(wordID)
				if err != nil {
					return fmt.Errorf("校验单词ID失败: %v", err)
				}
				if !exists {
					return fmt.Errorf("单词ID %d 不存在", wordID)
				}
			}
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
    fmt.Println("=== 开始获取任务详情 ===")
    fmt.Printf("任务ID: %d\n", id)
    
    task, err := s.repo.GetTaskByID(id)
    if err != nil {
        fmt.Printf("获取任务失败: %v\n", err)
        return nil, err
    }
    fmt.Printf("成功获取任务: %+v\n", task)
    
    var contents []models.TaskContent
    if err := s.repo.DB.Where("task_id = ?", id).Find(&contents).Error; err != nil {
        fmt.Printf("查询任务内容失败: %v\n", err)
        return nil, err
    }
    fmt.Printf("查询到 %d 个任务内容\n", len(contents))
    
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
            
            // 如果元数据中有单词ID，则加载单词数据
            if meta.WordIDs != nil && len(meta.WordIDs) > 0 {
                // 加载单词数据
                words, wordErr := s.wordRepo.GetByIDs(meta.WordIDs)
                if wordErr != nil {
                    fmt.Printf("查询单词数据失败: %v\n", wordErr)
                    continue
                }
                fmt.Printf("成功查询到 %d 个单词\n", len(words))
                // 确保单词数据被正确设置
                meta.Words = words
                
                // 重要：更新元数据到内容对象
                if err = content.SetDictationMetadata(meta); err != nil {
                    // 记录错误但继续处理
                    fmt.Printf("更新听写元数据失败: %v\n", err)
                } else {
                    fmt.Printf("成功更新听写元数据，包含 %d 个单词\n", len(meta.Words))
                }
            }
            fmt.Printf("Task ID: %d, Content ID: %d, WordIDs: %v\n", task.ID, content.ID, meta.WordIDs)
    
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
                    meta.Words = words // 确保单词实体被设置
                    // 更新元数据
                    content.SetDictationMetadata(meta)
                }
            } else if len(meta.WordIDs) > 0 {
                // 原有逻辑：加载单词数据
                fmt.Printf("正在查询单词数据，ID列表: %v\n", meta.WordIDs)
                words, err := s.wordRepo.GetByIDs(meta.WordIDs)
                if err != nil {
                    fmt.Printf("查询单词数据失败: %v\n", err)
                    continue
                }
                fmt.Printf("成功查询到 %d 个单词: %v\n", len(words), words)
                // 确保单词数据被正确设置
                meta.Words = words
                
                // 重要：更新元数据到内容对象
                if err := content.SetDictationMetadata(meta); err != nil {
                    // 记录错误但继续处理
                    fmt.Printf("更新听写元数据失败: %v\n", err)
                } else {
                    fmt.Printf("成功更新听写元数据，包含 %d 个单词\n", len(meta.Words))
                    // 打印元数据内容
                    metaBytes, _ := json.Marshal(meta)
                    fmt.Printf("元数据内容: %s\n", string(metaBytes))
                }
            } else {
                fmt.Printf("警告：任务ID %d 的内容ID %d 没有设置单词ID\n", task.ID, content.ID)
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
    fmt.Printf("ListTasks============%s\n", "开始查询")
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
                
                // 如果元数据中有单词ID，则加载单词数据
                if meta.WordIDs != nil && len(meta.WordIDs) > 0 {
                    // 加载单词数据
                    fmt.Printf("GetTaskDetails: 正在查询单词数据，ID列表: %v\n", meta.WordIDs)
                    words, err := s.wordRepo.GetByIDs(meta.WordIDs)
                    if err != nil {
                        fmt.Printf("GetTaskDetails: 查询单词数据失败: %v\n", err)
                        continue
                    }
                    fmt.Printf("GetTaskDetails: 成功查询到 %d 个单词\n", len(words))
                    // 确保单词数据被正确设置
                    meta.Words = words
                    
                    // 重要：更新元数据到内容对象
                    if err := content.SetDictationMetadata(meta); err != nil {
                        // 记录错误但继续处理
                        fmt.Printf("GetTaskDetails: 更新听写元数据失败: %v\n", err)
                    } else {
                        fmt.Printf("GetTaskDetails: 成功更新听写元数据，包含 %d 个单词\n", len(meta.Words))
                        // 打印元数据内容
                        metaBytes, _ := json.Marshal(meta)
                        fmt.Printf("GetTaskDetails: 元数据内容: %s\n", string(metaBytes))
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

func (s *TaskService) CreateSubmission(submission *models.Submission) error {
    // 校验任务是否存在
    task, err := s.GetTaskDetails(submission.StudentTaskID)
    if err != nil {
        return fmt.Errorf("任务不存在: %v", err)
    }
    
    // 校验任务内容是否存在
    var contentExists bool
    for _, content := range task.TaskContents {
        if content.ID == submission.ContentID {
            contentExists = true
            break
        }
    }
    if !contentExists {
        return fmt.Errorf("任务内容不存在")
    }
    
    // 创建提交记录
    return s.repo.DB.Create(submission).Error
}

func (s *TaskService) UpdateSubmission(submission *models.Submission) error {
    return s.repo.DB.Save(submission).Error
}

func (s *TaskService) GetSubmissionDetails(id uint) (*models.Submission, error) {
    var submission models.Submission
    err := s.repo.DB.Where("id = ?", id).First(&submission).Error
    return &submission, err
}

func (s *TaskService) ListSubmissions(taskID uint, page, pageSize int) ([]models.Submission, error) {
    var submissions []models.Submission
    err := s.repo.DB.Where("student_task_id = ?", taskID).
        Offset((page - 1) * pageSize).
        Limit(pageSize).
        Find(&submissions).Error
    return submissions, err
}

