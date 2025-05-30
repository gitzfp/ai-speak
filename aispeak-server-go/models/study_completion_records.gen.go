// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.

package models

import (
	"time"
)

const TableNameStudyCompletionRecord = "study_completion_records"

// StudyCompletionRecord mapped from table <study_completion_records>
type StudyCompletionRecord struct {
	ID             int32      `gorm:"column:id;type:int;primaryKey;autoIncrement:true;comment:完成记录唯一标识" json:"id"`                  // 完成记录唯一标识
	UserID         string     `gorm:"column:user_id;type:varchar(50);not null;comment:用户ID" json:"user_id"`                         // 用户ID
	BookID         string     `gorm:"column:book_id;type:varchar(50);not null;comment:书籍ID" json:"book_id"`                         // 书籍ID
	Date           time.Time  `gorm:"column:date;type:date;not null;comment:完成日期" json:"date"`                                      // 完成日期
	Status         *int32     `gorm:"column:status;type:int;comment:完成状态（0: 未完成, 1: 已完成）" json:"status"`                            // 完成状态（0: 未完成, 1: 已完成）
	ContinuousDays *int32     `gorm:"column:continuous_days;type:int;comment:连续完成天数" json:"continuous_days"`                        // 连续完成天数
	CreateTime     *time.Time `gorm:"column:create_time;type:datetime;comment:创建时间" json:"create_time"`                             // 创建时间
	UpdateTime     *time.Time `gorm:"column:update_time;type:datetime;comment:更新时间" json:"update_time"`                             // 更新时间
	LessonID       *int32     `gorm:"column:lesson_id;type:int;comment:课程ID" json:"lesson_id"`                                      // 课程ID
	Type           *int32     `gorm:"column:type;type:int;comment:类型（0: 单词, 1: 句子,2.背词计划用了, 3:真正的单词拼写）" json:"type"`                // 类型（0: 单词, 1: 句子,2.背词计划用了, 3:真正的单词拼写）
	SpeakCount     *int32     `gorm:"column:speak_count;type:int;comment:开口次数" json:"speak_count"`                                  // 开口次数
	Points         *int32     `gorm:"column:points;type:int;comment:积分" json:"points"`                                              // 积分
	ProgressData   *string    `gorm:"column:progress_data;type:text;comment:存储类似 study_progress_reports 表的数据" json:"progress_data"` // 存储类似 study_progress_reports 表的数据
}

// TableName StudyCompletionRecord's table name
func (*StudyCompletionRecord) TableName() string {
	return TableNameStudyCompletionRecord
}
