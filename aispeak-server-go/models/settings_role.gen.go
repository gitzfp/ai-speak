// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.
// Code generated by gorm.io/gen. DO NOT EDIT.

package models

import (
	"time"
)

const TableNameSettingsRole = "settings_role"

// SettingsRole mapped from table <settings_role>
type SettingsRole struct {
	ID         int32     `gorm:"column:id;type:int;primaryKey;autoIncrement:true" json:"id"`
	Locale     string    `gorm:"column:locale;type:varchar(80);not null" json:"locale"`
	LocalName  string    `gorm:"column:local_name;type:varchar(80);not null" json:"local_name"`
	Name       string    `gorm:"column:name;type:varchar(255);not null" json:"name"`
	ShortName  string    `gorm:"column:short_name;type:varchar(80);not null" json:"short_name"`
	Gender     int32     `gorm:"column:gender;type:int;not null" json:"gender"`
	Avatar     *string   `gorm:"column:avatar;type:varchar(350)" json:"avatar"`
	Audio      *string   `gorm:"column:audio;type:varchar(350)" json:"audio"`
	Styles     *string   `gorm:"column:styles;type:varchar(350)" json:"styles"`
	Status     string    `gorm:"column:status;type:varchar(80);not null" json:"status"`
	Sequence   int32     `gorm:"column:sequence;type:int;not null" json:"sequence"`
	CreateTime time.Time `gorm:"column:create_time;type:datetime;not null" json:"create_time"`
	UpdateTime time.Time `gorm:"column:update_time;type:datetime;not null" json:"update_time"`
	Deleted    int32     `gorm:"column:deleted;type:int;not null" json:"deleted"`
}

// TableName SettingsRole's table name
func (*SettingsRole) TableName() string {
	return TableNameSettingsRole
}
