package services

import (
	"context"
	"errors"
	"strconv"

	"github.com/gitzfp/ai-speak/aispeak-server-go/models"       // Updated import path
	"github.com/gitzfp/ai-speak/aispeak-server-go/repositories" // Updated import path
)

// Rename the interface to ClassServiceInterface
type ClassServiceInterface interface {
	GetClassByID(ctx context.Context, id string) (*models.Class, error)
	ClassExists(classID string) (bool, error) // Add this line
}

// Keep the struct as ClassService
type ClassService struct {
	classRepo *repositories.ClassRepository
}

func NewClassService(classRepo *repositories.ClassRepository) *ClassService {
	return &ClassService{
		classRepo: classRepo,
	}
}

// CreateClassRequest 创建班级请求
type CreateClassRequest struct {
	Name        string `json:"name" binding:"required"`
	GradeLevel  string `json:"grade_level" binding:"required"`
	Subject     string `json:"subject"`
	SchoolID    string `json:"school_id"`
	TeacherID   string `json:"teacher_id" binding:"required"`
	Description string `json:"description"`
	MaxStudents int    `json:"max_students" binding:"required,min=1"`
}

// CreateClass 创建新班级
func (s *ClassService) CreateClass(ctx context.Context, req CreateClassRequest) (*models.Class, error) {
	class := &models.Class{
		Name:        req.Name,
		GradeLevel:  req.GradeLevel,
		Subject:     req.Subject,
		SchoolID:    req.SchoolID,
		TeacherID:   req.TeacherID,
		Description: req.Description,
		MaxStudents: req.MaxStudents,
		Status:      "active",
	}

	if err := s.classRepo.CreateClass(ctx, class); err != nil {
		return nil, err
	}

	// 自动将创建者添加为班级教师
	if err := s.classRepo.AddTeacherToClass(ctx, strconv.FormatUint(uint64(class.ID), 10), req.TeacherID, "班主任"); err != nil {
		return nil, err
	}

	return class, nil
}

// UpdateClassRequest 更新班级请求
type UpdateClassRequest struct {
	Name        string `json:"name"`
	GradeLevel  string `json:"grade_level"`
	Subject     string `json:"subject"`
	SchoolID    string `json:"school_id"`
	Description string `json:"description"`
	MaxStudents int    `json:"max_students" binding:"min=1"`
	Status      string `json:"status"`
}

// UpdateClass 更新班级信息
func (s *ClassService) UpdateClass(ctx context.Context, classID string, req UpdateClassRequest) (*models.Class, error) {
	class, err := s.classRepo.GetClassByID(ctx, classID)
	if err != nil {
		return nil, err
	}
	if class == nil {
		return nil, errors.New("class not found")
	}

	// 更新字段
	if req.Name != "" {
		class.Name = req.Name
	}
	if req.GradeLevel != "" {
		class.GradeLevel = req.GradeLevel
	}
	if req.Subject != "" {
		class.Subject = req.Subject
	}
	if req.SchoolID != "" {
		class.SchoolID = req.SchoolID
	}
	if req.Description != "" {
		class.Description = req.Description
	}
	if req.MaxStudents > 0 {
		class.MaxStudents = req.MaxStudents
	}
	if req.Status != "" {
		class.Status = req.Status
	}

	if err := s.classRepo.UpdateClass(ctx, class); err != nil {
		return nil, err
	}

	return class, nil
}

// DeleteClass 删除班级
func (s *ClassService) DeleteClass(ctx context.Context, classID string) error {
	return s.classRepo.DeleteClass(ctx, classID)
}

// AddTeacherRequest 添加教师请求
type AddTeacherRequest struct {
	TeacherID string `json:"teacher_id" binding:"required"`
	Role      string `json:"role" binding:"required"`
}

// AddTeacherToClass 添加教师到班级
func (s *ClassService) AddTeacherToClass(ctx context.Context, classID string, req AddTeacherRequest) error {
	// 检查班级是否存在
	class, err := s.classRepo.GetClassByID(ctx, classID)
	if err != nil {
		return err
	}
	if class == nil {
		return errors.New("class not found")
	}

	return s.classRepo.AddTeacherToClass(ctx, classID, req.TeacherID, req.Role)
}

// RemoveTeacherFromClass 从班级移除教师
func (s *ClassService) RemoveTeacherFromClass(ctx context.Context, classID, teacherID string) error {
	// 检查是否是班主任
	class, err := s.classRepo.GetClassByID(ctx, classID)
	if err != nil {
		return err
	}
	if class == nil {
		return errors.New("class not found")
	}

	if class.TeacherID == teacherID {
		return errors.New("cannot remove the head teacher")
	}

	return s.classRepo.RemoveTeacherFromClass(ctx, classID, teacherID)
}

// AddStudentRequest 添加学生请求
type AddStudentRequest struct {
	StudentID string `json:"student_id" binding:"required"`
	Role      string `json:"role"`
}

// AddStudentToClass 添加学生到班级
func (s *ClassService) AddStudentToClass(ctx context.Context, classID string, req AddStudentRequest) error {
	// 检查班级是否存在
	class, err := s.classRepo.GetClassByID(ctx, classID)
	if err != nil {
		return err
	}
	if class == nil {
		return errors.New("class not found")
	}

	return s.classRepo.AddStudentToClass(ctx, classID, req.StudentID, req.Role)
}

// RemoveStudentFromClass 从班级移除学生
func (s *ClassService) RemoveStudentFromClass(ctx context.Context, classID, studentID string) error {
	return s.classRepo.RemoveStudentFromClass(ctx, classID, studentID)
}

// GetClassTeachers 获取班级的所有教师
func (s *ClassService) GetClassTeachers(ctx context.Context, classID string) ([]models.ClassTeacher, error) {
	return s.classRepo.GetClassTeachers(ctx, classID)
}

// GetClassStudents 获取班级的所有学生
func (s *ClassService) GetClassStudents(ctx context.Context, classID string) ([]models.ClassStudent, error) {
	return s.classRepo.GetClassStudents(ctx, classID)
}

// GetTeacherClasses 获取教师管理的所有班级
func (s *ClassService) GetTeacherClasses(ctx context.Context, teacherID string) ([]models.Class, error) {
	return s.classRepo.GetTeacherClasses(ctx, teacherID)
}

// GetStudentClasses 获取学生加入的所有班级
func (s *ClassService) GetStudentClasses(ctx context.Context, studentID string) ([]models.Class, error) {
	return s.classRepo.GetStudentClasses(ctx, studentID)
}

// Add the implementation for ClassExists
func (s *ClassService) ClassExists(classID string) (bool, error) {
	// Instead of trying to access DB directly, use the GetClassByID method
	class, err := s.classRepo.GetClassByID(context.Background(), classID)
	if err != nil {
		return false, err
	}
	return class != nil, nil
}

// GetClassTasks 获取班级的所有任务
func (s *ClassService) GetClassTasks(ctx context.Context, classID string) ([]models.Task, error) {
	return s.classRepo.GetClassTasks(ctx, classID)
}

// 生成UUID的辅助函数
func generateUUID() string {
	// 这里需要实现一个生成UUID的函数
	// 可以使用 github.com/google/uuid 包
	return "" // 临时返回空字符串，需要实现
}

// GetClassByID 根据ID获取班级信息
func (s *ClassService) GetClassByID(ctx context.Context, id string) (*models.Class, error) {
	return s.classRepo.GetClassByID(ctx, id)
}
