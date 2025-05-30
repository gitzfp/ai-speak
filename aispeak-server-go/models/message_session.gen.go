// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.

package models

import (
	"time"
)

const TableNameMessageSession = "message_session"

// MessageSession mapped from table <message_session>
type MessageSession struct {
	ID              string     `gorm:"column:id;type:varchar(80);primaryKey" json:"id"`
	AccountID       string     `gorm:"column:account_id;type:varchar(80);not null" json:"account_id"`
	Type            string     `gorm:"column:type;type:varchar(50);not null" json:"type"`
	MessageCount    *int32     `gorm:"column:message_count;type:int" json:"message_count"`
	IsDefault       *int32     `gorm:"column:is_default;type:int" json:"is_default"`
	Completed       *int32     `gorm:"column:completed;type:int" json:"completed"`
	AchievedTargets *string    `gorm:"column:achieved_targets;type:text" json:"achieved_targets"`
	Deleted         *int32     `gorm:"column:deleted;type:int" json:"deleted"`
	CreateTime      *time.Time `gorm:"column:create_time;type:datetime" json:"create_time"`
	UpdateTime      *time.Time `gorm:"column:update_time;type:datetime" json:"update_time"`
}

// TableName MessageSession's table name
func (*MessageSession) TableName() string {
	return TableNameMessageSession
}
