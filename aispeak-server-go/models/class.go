package models

import (
	"time" // Add this import

	"gorm.io/gorm"
)

// 班级表
type Class struct {
	gorm.Model

	// 班级名称
	Name string `gorm:"type:varchar(200);not null;comment:班级名称"`

	// 所属年级
	GradeLevel string `gorm:"type:varchar(50);not null;index;comment:年级"`

	// 主教学科（可空）
	Subject string `gorm:"type:varchar(50);index;comment:主教学科"`

	// 学校ID（关联学校系统）
	SchoolID string `gorm:"type:varchar(80);index;comment:学校ID"`

	// 班主任ID（教师ID）
	TeacherID string `gorm:"type:varchar(80);not null;index;comment:班主任ID"`

	// 班级状态（active/inactive/archived）
	Status string `gorm:"type:varchar(20);default:'active';index;comment:状态"`

	// 班级描述
	Description string `gorm:"type:text;comment:班级描述"`

	// 最大学生人数
	MaxStudents int `gorm:"type:int;not null;default:50;comment:最大学生人数"`
}

// 班级学生关系表
type ClassStudent struct {
	gorm.Model
	// 关联的班级ID
	ClassID string `gorm:"type:varchar(80);not null;index;comment:班级ID"`

	// 学生账号ID
	StudentID string `gorm:"type:varchar(80);not null;index;comment:学生ID"`

	// 加入日期（默认当前时间）
	JoinDate time.Time `gorm:"type:datetime;not null;default:CURRENT_TIMESTAMP;comment:加入日期"`

	// 离开日期（可空）
	LeaveDate *time.Time `gorm:"comment:离开日期"`

	// 在班状态（active/inactive/transferred）
	Status string `gorm:"type:varchar(20);default:'active';index;comment:状态"`

	// 班级角色（例如：班长、课代表等）
	Role string `gorm:"type:varchar(50);comment:班级角色"`
}

// 班级教师关系表
type ClassTeacher struct {
	gorm.Model // 使用本地GormModel定义而不是gorm.Model
	// 关联的班级ID
	ClassID string `gorm:"type:varchar(80);not null;index;comment:班级ID"`

	// 教师账号ID
	TeacherID string `gorm:"type:varchar(80);not null;index;comment:教师ID"`

	// 加入日期（默认当前时间）
	JoinDate time.Time `gorm:"type:datetime;not null;default:CURRENT_TIMESTAMP;comment:加入日期"`

	// 离开日期（可空）
	LeaveDate *time.Time `gorm:"comment:离开日期"`

	// 在班状态（active/inactive/transferred）
	Status string `gorm:"type:varchar(20);default:'active';index;comment:状态"`

	// 教师角色（例如：主课教师、助教等）
	Role string `gorm:"type:varchar(50);comment:教师角色"`
}
