package repositories

import (
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"gorm.io/gorm"
)

type TaskRepository struct {
    DB *gorm.DB // Unexported field -> exported
}

func (r *WordRepo) GetByIDs(ids []int32) ([]models.Word, error) {
    var words []models.Word
    err := r.DB.Where("word_id IN (?)", ids).Find(&words).Error
    return words, err
}

func (r *SentenceRepo) GetByLesson(bookID string, lessonID int) ([]models.LessonSentence, error) {
    var sentences []models.LessonSentence
    err := r.DB.Where("book_id = ? AND lesson_id = ?", bookID, lessonID).Find(&sentences).Error
    return sentences, err
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
    return &TaskRepository{DB: db} // Update field name
}

// 创建任务
func (r *TaskRepository) CreateTask(task *models.Task) error {
	return r.DB.Create(task).Error // Changed r.db -> r.DB
}

// 根据ID获取任务
func (r *TaskRepository) GetTaskByID(id uint) (*models.Task, error) {
	var task models.Task
	err := r.DB.Where("id = ?", id).First(&task).Error // Changed r.db -> r.DB
	return &task, err
}

// 更新任务
func (r *TaskRepository) UpdateTask(task *models.Task) error {
	return r.DB.Model(task).Updates(map[string]interface{}{ // Changed r.db -> r.DB
		"title":               task.Title,
		"description":         task.Description,
		"task_type":           task.TaskType,
		"subject":             task.Subject,
		"deadline":            task.Deadline,
		"status":              task.Status,
		"allow_late_submission": task.AllowLateSubmission,
		"max_attempts":        task.MaxAttempts,
		"grading_criteria":    task.GradingCriteria,
		"total_points":        task.TotalPoints,
		"attachments":         task.Attachments,
		"textbook_id":         task.TextbookID,
		"lesson_id":           task.LessonID,
	}).Error
}

// 删除任务（软删除）
func (r *TaskRepository) DeleteTask(id uint) error {
	return r.DB.Delete(&models.Task{}, id).Error // Changed r.db -> r.DB
}

// 获取所有任务（分页）
func (r *TaskRepository) GetAllTasks(page, pageSize int) ([]models.Task, error) {
	var tasks []models.Task
	offset := (page - 1) * pageSize
	err := r.DB.Offset(offset).Limit(pageSize).Find(&tasks).Error // Changed r.db -> r.DB
	return tasks, err
}