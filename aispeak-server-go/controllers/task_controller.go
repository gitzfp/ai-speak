package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/gitzfp/ai-speak/aispeak-server-go/services"
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

	// 验证请求中的内容类型是否合法
	for _, reqContent := range req.Contents {
		contentType := models.ContentType(reqContent.ContentType)
		if err := models.ValidateContentTypeOnly(contentType); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "内容类型无效: " + reqContent.ContentType})
			return
		}
		
		// 验证任务类型和内容类型是否匹配
		if err := models.ValidateTaskTypeAndContentType(task.TaskType, contentType); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// Convert contents to model objects
	var modelContents []*models.TaskContent
	for _, reqContent := range req.Contents {
		content := &models.TaskContent{
			ContentType:  reqContent.ContentType,
			GenerateMode: "manual",
			RefBookID:    reqContent.RefBookID,
			RefLessonID:  reqContent.RefLessonID,
			Points:       reqContent.Points,
			Metadata:     reqContent.Metadata,
			OrderNum:     reqContent.OrderNum,
			SelectedWordIDs:     reqContent.SelectedWordIDs,
			SelectedSentenceIDs: reqContent.SelectedSentenceIDs,
		}

		modelContents = append(modelContents, content)
	}

	if err := c.service.CreateTaskWithContents(task, modelContents); err != nil {
		// Consider logging the actual error from the service
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败: " + err.Error()}) // Provide more context
		return
	}

	// Fetch the created task with contents to ensure the response is complete
	createdTask, err := c.service.GetTaskDetails(task.ID)
	if err != nil {
		// Handle error fetching the created task
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取创建的任务失败"})
		return
	}

	ctx.JSON(http.StatusCreated, NewTaskResponse(createdTask))
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
        contentResp := TaskContentResponse{
            ID:          c.ID,
            ContentType: c.ContentType,
            Points:      c.Points,
            OrderNum:    c.OrderNum,
        }
        
        // 根据内容类型处理元数据，确保返回单词和句子数据
        switch c.ContentType {
        case "dictation":
            meta, err := c.GetDictationMetadata()
            if err == nil && meta != nil {
                // 将元数据转换为JSON
                metaBytes, err := json.Marshal(meta)
                if err == nil {
                    contentResp.Metadata = metaBytes
                }
            }
        case "sentence_repeat":
            meta, err := c.GetSentenceRepeatMetadata()
            if err == nil && meta != nil {
                // 将元数据转换为JSON
                metaBytes, err := json.Marshal(meta)
                if err == nil {
                    contentResp.Metadata = metaBytes
                }
            }
        }
        
        result = append(result, contentResp)
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
// CreateTaskRequest 创建任务请求体
// swagger:model
type CreateTaskRequest struct {
    // 任务标题（必填，3-100字符）
    // Required: true
    // MinLength: 3
    // MaxLength: 100
    Title       string         `json:"title" binding:"required,min=3,max=100"`
    
    // 任务类型（dictation: 听写，sentence_repeat: 句子跟读）
    // Required: true
    // Enum: dictation,sentence_repeat
    TaskType    models.TaskType `json:"task_type" binding:"required"`
    
    // 学科类型（目前仅支持english）
    // Required: true
    // Enum: english
    Subject     models.SubjectType `json:"subject" binding:"required"`
    
    // 任务内容集合（至少包含1个内容项）
    // Required: true
    // MinSize: 1
    Contents    []CreateTaskContentRequest `json:"contents" binding:"required,min=1"`
    
    // 是否允许迟交（默认false）
    // Example: true
    AllowLateSubmission bool `json:"allow_late_submission"`
    
    // 截止时间（当status=published时必填）
    // Format: date-time
    Deadline    *time.Time     `json:"deadline,omitempty" binding:"required_if=Status published"`
    
    // 任务描述（可选，最大500字符）
    // MaxLength: 500
    Description string         `json:"description,omitempty" binding:"max=500"`
    
    // 任务状态（draft: 草稿，published: 已发布）
    // Enum: draft,published
    Status      models.TaskStatus `json:"status" binding:"omitempty,oneof=draft published"`
}

// CreateTaskContentRequest 任务内容项
type CreateTaskContentRequest struct {
    // 内容类型（dictation: 听写，sentence_repeat: 句子跟读）
    // Required: true
    // Enum: dictation,sentence_repeat
    ContentType         string         `json:"content_type" binding:"required"`
    
    // 关联内容ID（可选）
    ContentID           *uint          `json:"content_id"`
    
    // 自定义内容文本（可选，最大长度1000）
    // MaxLength: 1000
    CustomContent       string         `json:"custom_content" binding:"max=1000"`
    
    // 题目分值（1-100分）
    // Required: true
    // Minimum: 1
    // Maximum: 100
    Points              int            `json:"points" binding:"required,min=1,max=100"`
    
    // 难度等级（easy/medium/hard）
    // Enum: easy,medium,hard
    Difficulty          string         `json:"difficulty"`
    
    // 元数据（自动生成，无需手动填写）
    Metadata            models.JSON    `json:"metadata" swaggerignore:"true"`
    
    // 排序序号（>=0）
    // Required: true
    // Minimum: 0
    OrderNum            int            `json:"order_num" binding:"required,min=0"`
    
    // 教材ID（generate_mode=auto时必填）
    // Example: pep_english
    RefBookID           string         `json:"ref_book_id" binding:"required_if=GenerateMode auto"`
    
    // 教材单元ID（generate_mode=auto时必填）
    // Example: 3
    RefLessonID         int            `json:"ref_lesson_id" binding:"required_if=GenerateMode auto"`
    
    // 已选单词ID列表（generate_mode=manual且content_type=dictation时必填）
    // Example: [1,2,3]
    SelectedWordIDs     []int32        `json:"selected_word_ids" binding:"required_if=GenerateMode manual ContentType dictation"`
    
    // 已选句子ID列表（generate_mode=manual且content_type=sentence_repeat时必填）
    // Example: [101,102]
    SelectedSentenceIDs []int32        `json:"selected_sentence_ids" binding:"required_if=GenerateMode manual ContentType sentence_repeat"`
}

type UpdateTaskRequest struct {
    Title       string             `json:"title"`
    Description string             `json:"description"`
    Status      models.TaskStatus  `json:"status"`
    Deadline    *time.Time         `json:"deadline"`
}

type TaskResponse struct {
    ID         uint                     `json:"id"`
    Title      string                   `json:"title"`
    Status     models.TaskStatus        `json:"status"`
    Contents   []TaskContentResponse    `json:"contents"`
    CreatedAt  time.Time                `json:"created_at"`
}

type TaskContentResponse struct {
    ID           uint             `json:"id"`
    ContentType  string           `json:"content_type"`
    Points       int              `json:"points"`
    OrderNum     int              `json:"order_num"`
    // Metadata contains structured content details
    // swagger:strfmt byte
    Metadata     json.RawMessage  `json:"metadata,omitempty" swaggertype:"object"`
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