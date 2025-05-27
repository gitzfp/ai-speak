package models

import (
	"time"

	"gorm.io/gorm"
)

// Task 主任务模型
// @Description 学习任务主体结构
type Task struct {
	gorm.Model
	// 教师账号ID（业务系统关联ID）
	TeacherID string `gorm:"type:varchar(80);not null;index;comment:教师ID"`

	// 关联班级ID（新增）
	ClassID string `gorm:"type:varchar(80);not null;index;comment:班级ID"`

	// 任务标题（最大长度200字符）
	Title string `gorm:"type:varchar(200);not null;comment:任务标题"`

	// 任务详细描述（长文本）
	Description string `gorm:"type:text;comment:任务描述"`

	// 任务类型（使用枚举）
	TaskType TaskType `gorm:"type:varchar(50);not null;index;comment:任务类型"`

	// 所属学科（使用枚举）
	Subject SubjectType `gorm:"type:varchar(50);not null;index;comment:所属学科"`

	// 截止时间（可空）
	Deadline *time.Time `gorm:"comment:截止时间"`

	// 任务状态（默认草稿）
	Status TaskStatus `gorm:"type:varchar(20);default:'draft';index;comment:任务状态"`

	// 是否允许迟交（默认不允许）
	AllowLateSubmission bool `gorm:"default:false;comment:允许迟交"`

	// 最大尝试次数（空表示不限）
	MaxAttempts *int `gorm:"comment:最大尝试次数"`

	// 评分标准描述（长文本）
	GradingCriteria string `gorm:"type:text;comment:评分标准"`

	// 任务总分（默认100分）
	TotalPoints int `gorm:"default:100;comment:总分"`

	// 附件信息（JSON格式存储）
	// 示例：[{"type":"image","url":"...","name":"..."}]
	Attachments JSON `gorm:"type:json;comment:附件信息"`

	TextbookID *uint `gorm:"index;comment:关联教材ID"`

	LessonID *uint `gorm:"index;comment:关联教学单元ID"`

	// 保留关联关系，但删除TaskContent的具体定义
	// 显式声明关联关系
	TaskContents []TaskContent `gorm:"foreignKey:TaskID;references:ID" json:"contents"`
}
