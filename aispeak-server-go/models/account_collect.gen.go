// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.

package models

import (
	"time"
)

const TableNameAccountCollect = "account_collect"

// AccountCollect mapped from table <account_collect>
type AccountCollect struct {
	ID          int32      `gorm:"column:id;type:int;primaryKey;autoIncrement:true" json:"id"`
	MessageID   *string    `gorm:"column:message_id;type:varchar(80)" json:"message_id"`
	AccountID   string     `gorm:"column:account_id;type:varchar(80);not null" json:"account_id"`
	Type        string     `gorm:"column:type;type:varchar(80);not null" json:"type"`
	Content     *string    `gorm:"column:content;type:varchar(2500)" json:"content"`
	Translation *string    `gorm:"column:translation;type:varchar(2500)" json:"translation"`
	Deleted     *int32     `gorm:"column:deleted;type:int" json:"deleted"`
	CreateTime  *time.Time `gorm:"column:create_time;type:datetime" json:"create_time"`
	UpdateTime  *time.Time `gorm:"column:update_time;type:datetime" json:"update_time"`
	WordID      *int32     `gorm:"column:word_id;type:int" json:"word_id"`
	BookID      *string    `gorm:"column:book_id;type:varchar(80)" json:"book_id"`
}

// TableName AccountCollect's table name
func (*AccountCollect) TableName() string {
	return TableNameAccountCollect
}
