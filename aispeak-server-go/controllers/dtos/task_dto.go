package dtos

import (
	"github.com/gitzfp/ai-speak/aispeak-server-go/controllers"
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
)

type CreateTaskRequest struct {
	Title        string             `json:"title" binding:"required"`
	Description  string             `json:"description"`
	TaskType     models.TaskType    `json:"task_type" binding:"required"`
	Contents     []controllers.CreateTaskContentRequest `json:"contents"`
	// 其他字段...
}

type TaskResponse struct {
	ID           uint              `json:"id"`
	Title        string            `json:"title"`
	Status       models.TaskStatus `json:"status"`
	Contents     []controllers.TaskContentResponse `json:"contents"`
	// 其他响应字段...
}

// 转换方法
func (r *CreateTaskRequest) ToModel() *models.Task {
	return &models.Task{
		Title:       r.Title,
		Description: r.Description,
		TaskType:    r.TaskType,
		Status:      models.Draft, // Default status
		// Contents:    convertContents(r.Contents),
	}
}


// Implement the ToModel function

// Implement the NewTaskResponse function

// Helper function to convert contents