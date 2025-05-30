// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.

package models

import (
	"time"
)

const TableNameTextbookPage = "textbook_page"

// TextbookPage mapped from table <textbook_page>
type TextbookPage struct {
	ID            string     `gorm:"column:id;type:varchar(80);primaryKey" json:"id"`
	BookID        string     `gorm:"column:book_id;type:varchar(80);not null" json:"book_id"`
	PageName      string     `gorm:"column:page_name;type:varchar(200);not null" json:"page_name"`
	PageNo        int32      `gorm:"column:page_no;type:int;not null" json:"page_no"`
	PageNoV2      *string    `gorm:"column:page_no_v2;type:varchar(50)" json:"page_no_v2"`
	PageURL       *string    `gorm:"column:page_url;type:varchar(500)" json:"page_url"`
	PageURLSource *string    `gorm:"column:page_url_source;type:varchar(500)" json:"page_url_source"`
	Version       *string    `gorm:"column:version;type:varchar(50)" json:"version"`
	CreateTime    *time.Time `gorm:"column:create_time;type:datetime" json:"create_time"`
	UpdateTime    *time.Time `gorm:"column:update_time;type:datetime" json:"update_time"`
}

// TableName TextbookPage's table name
func (*TextbookPage) TableName() string {
	return TableNameTextbookPage
}
