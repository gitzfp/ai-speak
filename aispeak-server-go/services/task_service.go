package services

import (
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/gitzfp/ai-speak/aispeak-server-go/repositories"
	"gorm.io/gorm"
)

type TaskService struct {
	repo *repositories.TaskRepository
}

func NewTaskService(repo *repositories.TaskRepository) *TaskService {
	return &TaskService{repo: repo}
}

// CreateTaskWithContents (fix transaction handling)
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

func (s *TaskService) DeleteTask(id uint) error {
    return s.repo.DeleteTask(id)
}

func (s *TaskService) ListTasks(page, pageSize int) ([]models.Task, error) {
    return s.repo.GetAllTasks(page, pageSize)
}