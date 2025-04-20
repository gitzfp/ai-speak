package models

import (
    "gorm.io/gorm"
    // Remove time import if not actually used
)

type Submission struct {
    gorm.Model
    Timestamp
    
    // 关联的学生任务ID
    StudentTaskID uint `gorm:"not null;index;comment:学生任务ID"`
    
    // 关联的任务内容ID
    ContentID uint `gorm:"not null;index;comment:内容ID"`
    
    // 文本回答内容
    Response string `gorm:"type:text;comment:回答内容"`
    
    // 音频回答URL
    AudioURL string `gorm:"type:varchar(500);comment:音频URL"`
    
    // 图片回答URL
    ImageURL string `gorm:"type:varchar(500);comment:图片URL"`
    
    // 文件回答URL
    FileURL string `gorm:"type:varchar(500);comment:文件URL"`
    
    // 自动评分是否正确
    IsCorrect *bool `gorm:"index;comment:是否正确"`
    
    // 自动评分得分
    AutoScore *float64 `gorm:"comment:自动评分"`
    
    // 教师评分得分
    TeacherScore *float64 `gorm:"comment:教师评分"`
    
    // 单项反馈内容
    Feedback string `gorm:"type:text;comment:单项反馈"`
    
    // 尝试次数（默认1次）
    AttemptCount int `gorm:"default:1;comment:尝试次数"`
}