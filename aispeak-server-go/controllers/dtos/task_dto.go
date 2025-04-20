package dtos

type CreateTaskRequest struct {
	Title        string             `json:"title" binding:"required"`
	Description  string             `json:"description"`
	TaskType     models.TaskType    `json:"task_type" binding:"required"`
	Contents     []TaskContentRequest `json:"contents"`
	// 其他字段...
}

type TaskResponse struct {
	ID           uint              `json:"id"`
	Title        string            `json:"title"`
	Status       models.TaskStatus `json:"status"`
	Contents     []ContentResponse `json:"contents"`
	// 其他响应字段...
}

// 转换方法
func (r *CreateTaskRequest) ToModel() *models.Task { /*...*/ }
func NewTaskResponse(task *models.Task) TaskResponse { /*...*/ }