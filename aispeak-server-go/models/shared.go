package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// 任务类型枚举
type TaskType string

const (
	Dictation        TaskType = "dictation"       // 单词听写
	Spelling         TaskType = "spelling"        // 单词拼写
	Pronunciation    TaskType = "pronunciation"   // 发音测评
	SentenceRepeat   TaskType = "sentence_repeat" // 句子跟读
	Quiz             TaskType = "quiz"            // 测验
)

// 学科类型枚举
type SubjectType string

const (
	English           SubjectType = "english"      // 英语
	Chinese           SubjectType = "chinese"      // 语文
	Math              SubjectType = "math"         // 数学
	Science           SubjectType = "science"      // 科学
	History           SubjectType = "history"      // 历史
	Geography         SubjectType = "geography"    // 地理
	Art               SubjectType = "art"          // 美术
	Music             SubjectType = "music"        // 音乐
	PhysicalEducation SubjectType = "physical_education" // 体育
	Other             SubjectType = "other"        // 其他
)

// 任务状态枚举
type TaskStatus string

const (
	Draft     TaskStatus = "draft"      // 草稿
	Published TaskStatus = "published"  // 已发布
	InProgress TaskStatus = "in_progress" // 进行中
	Completed TaskStatus = "completed"  // 已完成
	Archived  TaskStatus = "archived"   // 已归档
)

// JSON类型处理（用于存储结构化数据）
type JSON map[string]interface{}

// 实现GORM的Scanner接口
func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("类型断言失败：非字节数组类型")
	}
	return json.Unmarshal(bytes, j)
}

// 实现GORM的Valuer接口
func (j JSON) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// 时间戳（嵌入其他结构体使用）
type Timestamp struct {
	CreatedAt time.Time `gorm:"autoCreateTime;comment:创建时间"`
	UpdatedAt time.Time `gorm:"autoUpdateTime;comment:更新时间"`
}
