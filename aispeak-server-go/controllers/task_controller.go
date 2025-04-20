package controllers

import (
	"net/http"
	"strconv"

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
func (c *TaskController) CreateTask(ctx *gin.Context) {
	var req CreateTaskRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task := req.ToModel()
	if err := c.service.CreateTaskWithContents(task, req.Contents); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	ctx.JSON(http.StatusCreated, NewTaskResponse(task))
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
	
	tasks, err := c.service.ListTasks(page, pageSize)
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
	
	ctx.JSON(http.StatusOK, NewTaskResponse(task))
}