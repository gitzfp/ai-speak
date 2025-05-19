package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/gitzfp/ai-speak/aispeak-server-go/models" // Updated import path
	"gorm.io/gorm"
)

type ClassRepository struct {
	db *gorm.DB
}

func NewClassRepository(db *gorm.DB) *ClassRepository {
	return &ClassRepository{db: db}
}

// CreateClass 创建新班级
func (r *ClassRepository) CreateClass(ctx context.Context, class *models.Class) error {
	return r.db.WithContext(ctx).Create(class).Error
}

// GetClassByID 根据ID获取班级信息
func (r *ClassRepository) GetClassByID(ctx context.Context, id string) (*models.Class, error) {
	var class models.Class
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&class).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &class, nil
}

// UpdateClass 更新班级信息
func (r *ClassRepository) UpdateClass(ctx context.Context, class *models.Class) error {
	return r.db.WithContext(ctx).Save(class).Error
}

// DeleteClass 删除班级
func (r *ClassRepository) DeleteClass(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 删除班级
		if err := tx.Where("id = ?", id).Delete(&models.Class{}).Error; err != nil {
			return err
		}
		// 删除相关的学生关系
		if err := tx.Where("class_id = ?", id).Delete(&models.ClassStudent{}).Error; err != nil {
			return err
		}
		// 删除相关的教师关系
		if err := tx.Where("class_id = ?", id).Delete(&models.ClassTeacher{}).Error; err != nil {
			return err
		}

		return nil
	})
}

// AddTeacherToClass 添加教师到班级
func (r *ClassRepository) AddTeacherToClass(ctx context.Context, classID, teacherID string, role string) error {
	relation := &models.ClassTeacher{
		ClassID:   classID,
		TeacherID: teacherID,
		Role:      role,
		Status:    "active",
		JoinDate:  time.Now(),
	}
	return r.db.WithContext(ctx).Create(relation).Error
}

// RemoveTeacherFromClass 从班级移除教师
func (r *ClassRepository) RemoveTeacherFromClass(ctx context.Context, classID, teacherID string) error {
	return r.db.WithContext(ctx).Where("class_id = ? AND teacher_id = ?", classID, teacherID).
		Updates(map[string]interface{}{
			"status":     "inactive",
			"leave_date": time.Now(),
		}).Error
}

// AddStudentToClass 添加学生到班级
func (r *ClassRepository) AddStudentToClass(ctx context.Context, classID, studentID string, role string) error {
	// 检查班级是否已满
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.ClassStudent{}).
		Where("class_id = ? AND status = ?", classID, "active").Count(&count).Error; err != nil {
		return err
	}

	var class models.Class
	if err := r.db.WithContext(ctx).Where("id = ?", classID).First(&class).Error; err != nil {
		return err
	}

	if int(count) >= class.MaxStudents {
		return errors.New("class is full")
	}

	relation := &models.ClassStudent{
		ClassID:   classID,
		StudentID: studentID,
		Role:      role,
		Status:    "active",
		JoinDate:  time.Now(),
	}
	return r.db.WithContext(ctx).Create(relation).Error
}

// RemoveStudentFromClass 从班级移除学生
func (r *ClassRepository) RemoveStudentFromClass(ctx context.Context, classID, studentID string) error {
	return r.db.WithContext(ctx).Where("class_id = ? AND student_id = ?", classID, studentID).
		Updates(map[string]interface{}{
			"status":     "inactive",
			"leave_date": time.Now(),
		}).Error
}

// GetClassTeachers 获取班级的所有教师
func (r *ClassRepository) GetClassTeachers(ctx context.Context, classID string) ([]models.ClassTeacher, error) {
	var teachers []models.ClassTeacher
	err := r.db.WithContext(ctx).Where("class_id = ? AND status = ?", classID, "active").Find(&teachers).Error
	return teachers, err
}

// GetClassStudents 获取班级的所有学生
func (r *ClassRepository) GetClassStudents(ctx context.Context, classID string) ([]models.ClassStudent, error) {
	var students []models.ClassStudent
	err := r.db.WithContext(ctx).Where("class_id = ? AND status = ?", classID, "active").Find(&students).Error
	return students, err
}

// GetTeacherClasses 获取教师管理的所有班级
func (r *ClassRepository) GetTeacherClasses(ctx context.Context, teacherID string) ([]models.Class, error) {
	var classes []models.Class
	err := r.db.WithContext(ctx).
		Joins("JOIN class_teacher ON class_teacher.class_id = class.id").
		Where("class_teacher.teacher_id = ? AND class_teacher.status = ?", teacherID, "active").
		Find(&classes).Error
	return classes, err
}

// GetStudentClasses 获取学生加入的所有班级
func (r *ClassRepository) GetStudentClasses(ctx context.Context, studentID string) ([]models.Class, error) {
	var classes []models.Class
	err := r.db.WithContext(ctx).
		Joins("JOIN class_student ON class_student.class_id = class.id").
		Where("class_student.student_id = ? AND class_student.status = ?", studentID, "active").
		Find(&classes).Error
	return classes, err
}

// GetClassTasks 获取班级的所有任务
func (r *ClassRepository) GetClassTasks(ctx context.Context, classID string) ([]models.Task, error) {
	var tasks []models.Task
	err := r.db.WithContext(ctx).
		Joins("JOIN task_class_relation ON task_class_relation.task_id = task.id").
		Where("task_class_relation.class_id = ?", classID).
		Find(&tasks).Error
	return tasks, err
}
