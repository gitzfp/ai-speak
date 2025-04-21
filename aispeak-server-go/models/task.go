package models

import (
	"time"

	"gorm.io/gorm"
)

// 任务主表
type Task struct {
	gorm.Model
	Timestamp
	
	// 教师账号ID（业务系统关联ID）
	TeacherID string `gorm:"type:varchar(80);not null;index;comment:教师ID"`
	
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

	TextbookID  *uint `gorm:"index;comment:关联教材ID"`
	
    LessonID      *uint `gorm:"index;comment:关联教学单元ID"`
    
    // 保留关联关系，但删除TaskContent的具体定义
    TaskContents []TaskContent `gorm:"foreignKey:TaskID" json:"contents"`
}

// 删除这里的TaskContent定义，因为它已经在task_content.go中定义了

// 任务模板表
type TaskTemplate struct {
	gorm.Model
	Timestamp
	
	// 模板名称
	Name string `gorm:"type:varchar(200);not null;comment:模板名称"`
	
	// 模板描述
	Description string `gorm:"type:text;comment:模板描述"`
	
	// 任务类型（使用枚举）
	TaskType TaskType `gorm:"type:varchar(50);not null;index;comment:任务类型"`
	
	// 所属学科（使用枚举）
	Subject SubjectType `gorm:"type:varchar(50);not null;index;comment:所属学科"`
	
	// 内容结构（JSON格式定义）
	// 示例：{"sections": [{"type": "text", "required": true}]}
	ContentStructure JSON `gorm:"type:json;not null;comment:内容结构"`
	
	// 默认设置（JSON格式）
	// 示例：{"max_attempts": 3, "time_limit": 3600}
	DefaultSettings JSON `gorm:"type:json;comment:默认设置"`
	
	// 创建者ID（教师ID）
	CreatedBy string `gorm:"type:varchar(80);not null;comment:创建者ID"`
	
	// 是否公开模板（默认不公开）
	IsPublic bool `gorm:"default:false;comment:是否公开"`
}

