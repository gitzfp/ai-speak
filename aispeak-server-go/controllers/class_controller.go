package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/services" // Updated import path
)

type ClassController struct {
	classService *services.ClassService
}

func NewClassController(classService *services.ClassService) *ClassController {
	return &ClassController{
		classService: classService,
	}
}


// CreateClass godoc
// @Summary 创建班级
// @Description 创建一个新的班级
// @Tags classes
// @Accept json
// @Produce json
// @Param request body services.CreateClassRequest true "班级信息"
// @Success 201 {object} models.Class "创建成功"
// @Failure 400 {object} map[string]string "请求参数错误"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes [post]
func (c *ClassController) CreateClass(ctx *gin.Context) {
	var req services.CreateClassRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	class, err := c.classService.CreateClass(ctx, req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, class)
}

// UpdateClass godoc
// @Summary 更新班级
// @Description 更新班级信息
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Param request body services.UpdateClassRequest true "更新信息"
// @Success 200 {object} models.Class "更新成功"
// @Failure 400 {object} map[string]string "请求参数错误"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id} [put]
func (c *ClassController) UpdateClass(ctx *gin.Context) {
	id := ctx.Param("id")
	var req services.UpdateClassRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	class, err := c.classService.UpdateClass(ctx, id, req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, class)
}

// DeleteClass godoc
// @Summary 删除班级
// @Description 删除指定班级
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Success 204 "删除成功"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id} [delete]
func (c *ClassController) DeleteClass(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.classService.DeleteClass(ctx, id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// GetClass godoc
// @Summary 获取班级信息
// @Description 获取指定班级的详细信息
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Success 200 {object} models.Class "班级信息"
// @Failure 404 {object} map[string]string "班级不存在"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id} [get]
func (c *ClassController) GetClass(ctx *gin.Context) {
	id := ctx.Param("id")
	class, err := c.classService.GetClassByID(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if class == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	ctx.JSON(http.StatusOK, class)
}

// AddTeacher godoc
// @Summary 添加教师到班级
// @Description 将教师添加到指定班级
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Param request body services.AddTeacherRequest true "教师信息"
// @Success 201 "添加成功"
// @Failure 400 {object} map[string]string "请求参数错误"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id}/teachers [post]
func (c *ClassController) AddTeacher(ctx *gin.Context) {
	id := ctx.Param("id")
	var req services.AddTeacherRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.classService.AddTeacherToClass(ctx, id, req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusCreated)
}

// RemoveTeacher godoc
// @Summary 从班级移除教师
// @Description 从指定班级移除教师
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Param teacher_id path string true "教师ID"
// @Success 204 "移除成功"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id}/teachers/{teacher_id} [delete]
func (c *ClassController) RemoveTeacher(ctx *gin.Context) {
	id := ctx.Param("id")
	teacherID := ctx.Param("teacher_id")

	if err := c.classService.RemoveTeacherFromClass(ctx, id, teacherID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// GetClassStudents godoc
// @Summary 获取班级的所有学生
// @Description 获取指定班级的所有学生列表
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Success 200 {array} models.ClassStudent "学生列表"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id}/students [get]
func (c *ClassController) GetClassTeachers(ctx *gin.Context) {
	id := ctx.Param("id")
	teachers, err := c.classService.GetClassTeachers(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, teachers)
}

// GetTeacherClasses godoc
// @Summary 获取教师管理的所有班级
// @Description 获取指定教师管理的所有班级列表
// @Tags classes
// @Accept json
// @Produce json
// @Param teacher_id path string true "教师ID"
// @Success 200 {array} models.Class "班级列表"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/teacher/{teacher_id} [get]
func (c *ClassController) GetTeacherClasses(ctx *gin.Context) {
	teacherID := ctx.Param("teacher_id")
	classes, err := c.classService.GetTeacherClasses(ctx, teacherID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, classes)
}

// AddStudent godoc
// @Summary 添加学生到班级
// @Description 将学生添加到指定班级
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Param request body services.AddStudentRequest true "学生信息"
// @Success 201 "添加成功"
// @Failure 400 {object} map[string]string "请求参数错误"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id}/students [post]
func (c *ClassController) AddStudent(ctx *gin.Context) {
	id := ctx.Param("id")
	var req services.AddStudentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.classService.AddStudentToClass(ctx, id, req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusCreated)
}

// RemoveStudent godoc
// @Summary 从班级移除学生
// @Description 从指定班级移除学生
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Param student_id path string true "学生ID"
// @Success 204 "移除成功"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id}/students/{student_id} [delete]
func (c *ClassController) RemoveStudent(ctx *gin.Context) {
	id := ctx.Param("id")
	studentID := ctx.Param("student_id")

	if err := c.classService.RemoveStudentFromClass(ctx, id, studentID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// GetClassStudents godoc
// @Summary 获取班级的所有学生
// @Description 获取指定班级的所有学生列表
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Success 200 {array} models.ClassStudent "学生列表"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id}/students [get]
func (c *ClassController) GetClassStudents(ctx *gin.Context) {
	id := ctx.Param("id")
	students, err := c.classService.GetClassStudents(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, students)
}

// GetStudentClasses godoc
// @Summary 获取学生加入的所有班级
// @Description 获取指定学生加入的所有班级列表
// @Tags classes
// @Accept json
// @Produce json
// @Param student_id path string true "学生ID"
// @Success 200 {array} models.Class "班级列表"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/student/{student_id} [get]
func (c *ClassController) GetStudentClasses(ctx *gin.Context) {
	studentID := ctx.Param("student_id")
	classes, err := c.classService.GetStudentClasses(ctx, studentID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, classes)
}

// GetClassTasks godoc
// @Summary 获取班级的所有任务
// @Description 获取指定班级的所有任务列表
// @Tags classes
// @Accept json
// @Produce json
// @Param id path string true "班级ID"
// @Success 200 {array} models.Task "任务列表"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Security BearerAuth
// @Router /classes/{id}/tasks [get]
func (c *ClassController) GetClassTasks(ctx *gin.Context) {
	id := ctx.Param("id")
	tasks, err := c.classService.GetClassTasks(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, tasks)
}
