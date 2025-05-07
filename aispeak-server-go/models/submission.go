package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"

	"gorm.io/gorm"
	// Remove time import if not actually used
)

// MediaFile 表示一个媒体文件
type MediaFile struct {
	URL      string `json:"url"`       // 文件URL
	Type     string `json:"type"`      // 文件类型: audio, image, file 等
	Name     string `json:"name,omitempty"`     // 可选的文件名
	Size     int64  `json:"size,omitempty"`     // 可选的文件大小
	MimeType string `json:"mime_type,omitempty"` // 可选的MIME类型
}

// MediaFiles 类型用于存储媒体文件数组
type MediaFiles []MediaFile

// Value 实现 driver.Valuer 接口
func (m MediaFiles) Value() (driver.Value, error) {
	if len(m) == 0 {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan 实现 sql.Scanner 接口
func (m *MediaFiles) Scan(value interface{}) error {
	if value == nil {
		*m = MediaFiles{}
		return nil
	}
	
	b, ok := value.([]byte)
	if !ok {
		return errors.New("类型断言为[]byte失败")
	}
	
	return json.Unmarshal(b, m)
}

// 保留StringArray类型用于兼容性目的
type StringArray []string

// Value 实现 driver.Valuer 接口
func (a StringArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return nil, nil
	}
	return json.Marshal(a)
}

// Scan 实现 sql.Scanner 接口
func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = StringArray{}
		return nil
	}
	
	b, ok := value.([]byte)
	if !ok {
		return errors.New("类型断言为[]byte失败")
	}
	
	return json.Unmarshal(b, a)
}

type Submission struct {
	gorm.Model
	Timestamp
	
	// 关联的学生任务ID
	StudentTaskID uint `gorm:"not null;index;comment:学生任务ID"`
	
	// 关联的任务内容ID
	ContentID uint `gorm:"not null;index;comment:内容ID"`
	
	// 文本回答内容
	Response string `gorm:"type:text;comment:回答内容"`
	
	// 统一的媒体文件字段 (包含音频、图片、文件等)
	MediaFiles MediaFiles `gorm:"type:json;comment:统一媒体文件"`
	
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