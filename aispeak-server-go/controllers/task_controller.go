package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/gitzfp/ai-speak/aispeak-server-go/services"
    "time"
)

type TaskController struct {
	service *services.TaskService
}

func NewTaskController(service *services.TaskService) *TaskController {
	return &TaskController{service: service}
}

// CreateTask godoc
// @Summary 创建任务
// @Tags tasks
// @Accept json
// @Produce json
// @Param body body CreateTaskRequest true "任务数据"
// @Success 201 {object} TaskResponse
// @Router /tasks [post]
// In CreateTask method, convert request contents to model
func (c *TaskController) CreateTask(ctx *gin.Context) {
    var req CreateTaskRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    task := req.ToModel()
    
    // Convert contents to model objects
    var modelContents []*models.TaskContent
    for _, reqContent := range req.Contents {
        modelContents = append(modelContents, &models.TaskContent{
            ContentType:   reqContent.ContentType,
            ContentID:     reqContent.ContentID,
            CustomContent: reqContent.CustomContent,
            Points:        reqContent.Points,
            Difficulty:    reqContent.Difficulty,
            Metadata:      reqContent.Metadata,
            OrderNum:      reqContent.OrderNum,
        })
    }

    if err := c.service.CreateTaskWithContents(task, modelContents); err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
        return
    }

    ctx.JSON(http.StatusCreated, NewTaskResponse(task))
}

// Add the response builder implementations
// Fix the ambiguous CreatedAt field reference in NewTaskResponse
func NewTaskResponse(task *models.Task) TaskResponse {
    return TaskResponse{
        ID:        task.ID,
        Title:     task.Title,
        Status:    task.Status,
        Contents:  convertContents(task.TaskContents),
        CreatedAt: task.Model.CreatedAt, // Use the gorm.Model's CreatedAt field
    }
}

// Remove the duplicate convertContents function at line 264
// Keep only the first implementation at line 84
func NewListTaskResponse(tasks []models.Task) ListTaskResponse {
    var responses []TaskResponse
    for _, t := range tasks {
        responses = append(responses, NewTaskResponse(&t))
    }
    return ListTaskResponse{
        Tasks: responses,
        Total: len(tasks),
    }
}

// Complete the content conversion
func convertContents(contents []models.TaskContent) []TaskContentResponse {
    var result []TaskContentResponse
    for _, c := range contents {
        result = append(result, TaskContentResponse{
            ID:          c.ID,
            ContentType: c.ContentType,
            Points:      c.Points,
            OrderNum:    c.OrderNum,
        })
    }
    return result
}

// GetTask godoc
// @Summary 获取任务详情
// @Tags tasks
// @Produce json
// @Param id path int true "任务ID"
// @Success 200 {object} TaskResponse
// @Router /tasks/{id} [get]
func (c *TaskController) GetTask(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	task, err := c.service.GetTaskDetails(uint(id))
	
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "任务不存在"})
		return
	}
	
	ctx.JSON(http.StatusOK, NewTaskResponse(task))
}

// ListTasks godoc
// @Summary 分页查询任务
// @Tags tasks
// @Produce json
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} ListTaskResponse
// @Router /tasks [get]
func (c *TaskController) ListTasks(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("page_size", "10"))
	
	// 新增查询参数
	teacherID := ctx.Query("teacher_id")
	status := ctx.Query("status")
	
	tasks, err := c.service.ListTasks(teacherID, status, page, pageSize)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	
	ctx.JSON(http.StatusOK, NewListTaskResponse(tasks))
}

// UpdateTask godoc
// @Summary 更新任务
// @Tags tasks
// @Accept json
// @Produce json
// @Param id path int true "任务ID"
// @Param body body UpdateTaskRequest true "更新数据"
// @Success 200 {object} TaskResponse
// @Router /tasks/{id} [put]
func (c *TaskController) UpdateTask(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var req UpdateTaskRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	task := req.ToModel()
	task.ID = uint(id)
	if err := c.service.UpdateTask(task); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}
	
	// 新增状态校验
	if task.Status == models.Published && task.Deadline == nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "已发布任务必须设置截止时间"})
		return
	}
	
	ctx.JSON(http.StatusOK, NewTaskResponse(task))
}

// 新增删除接口
// DeleteTask godoc
// @Summary 删除任务
// @Tags tasks
// @Produce json
// @Param id path int true "任务ID"
// @Success 204
// @Router /tasks/{id} [delete]
func (c *TaskController) DeleteTask(ctx *gin.Context) {
    id, _ := strconv.Atoi(ctx.Param("id"))
    if err := c.service.DeleteTask(uint(id)); err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
        return
    }
    ctx.Status(http.StatusNoContent)
}


// Add these structs before TaskController definition
type CreateTaskRequest struct {
    Title              string                     `json:"title"`
    Description        string                     `json:"description"`
    TaskType           models.TaskType           `json:"task_type"`
    Subject            models.SubjectType         `json:"subject"`
    Deadline           *time.Time                 `json:"deadline"`
    Status             models.TaskStatus         `json:"status"`
    AllowLateSubmission bool                      `json:"allow_late_submission"`
    Contents           []CreateTaskContentRequest `json:"contents"`
}

type UpdateTaskRequest struct {
    Title       string             `json:"title"`
    Description string             `json:"description"`
    Status      models.TaskStatus  `json:"status"`
    Deadline    *time.Time         `json:"deadline"`
}

type CreateTaskContentRequest struct {
    ContentType    string         `json:"content_type"`
    ContentID      *uint          `json:"content_id"`
    CustomContent  string         `json:"custom_content"`
    Points         int            `json:"points"`
    Difficulty     string         `json:"difficulty"`
    Metadata       models.JSON    `json:"metadata"`
    OrderNum       int            `json:"order_num"`
}

type TaskResponse struct {
    ID         uint                     `json:"id"`
    Title      string                   `json:"title"`
    Status     models.TaskStatus        `json:"status"`
    Contents   []TaskContentResponse    `json:"contents"`
    CreatedAt  time.Time                `json:"created_at"`
}

type TaskContentResponse struct {
    ID           uint      `json:"id"`
    ContentType  string    `json:"content_type"`
    Points       int       `json:"points"`
    OrderNum     int       `json:"order_num"`
}

type ListTaskResponse struct {
    Tasks []TaskResponse `json:"tasks"`
    Total int            `json:"total"`
}

// Add these converter methods
func (r *CreateTaskRequest) ToModel() *models.Task {
    return &models.Task{
        Title:              r.Title,
        Description:        r.Description,
        TaskType:           r.TaskType,
        Subject:            r.Subject,
        Deadline:           r.Deadline,
        Status:             r.Status,
        AllowLateSubmission: r.AllowLateSubmission,
    }
}

func (r *UpdateTaskRequest) ToModel() *models.Task {
    return &models.Task{
        Title:       r.Title,
        Description: r.Description,
        Status:      r.Status,
        Deadline:    r.Deadline,
    }
}


func convertTasks(tasks []models.Task) []TaskResponse {
    var result []TaskResponse
    for _, t := range tasks {
        result = append(result, NewTaskResponse(&t))
    }
    return result
}