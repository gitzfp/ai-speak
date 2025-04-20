package models

import (
    "time"  // Add this import
    "gorm.io/gorm"
)

type Notification struct {
    gorm.Model
    Timestamp
    
    // 关联的任务ID
    TaskID uint `gorm:"not null;index;comment:任务ID"`
    
    // 接收者ID（教师或学生）
    RecipientID string `gorm:"type:varchar(80);not null;index;comment:接收者ID"`
    
    // 通知类型（reminder/grade_update/comment等）
    NotificationType string `gorm:"type:varchar(50);not null;index;comment:通知类型"`
    
    // 通知标题
    Title string `gorm:"type:varchar(200);not null;comment:通知标题"`
    
    // 通知内容
    Message string `gorm:"type:text;not null;comment:通知内容"`
    
    // 是否已读（默认未读）
    IsRead bool `gorm:"default:false;index;comment:是否已读"`
    
    // 阅读时间（可空）
    ReadTime *time.Time `gorm:"index;comment:阅读时间"`
}