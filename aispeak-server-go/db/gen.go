package main

import (
	"gorm.io/driver/mysql"
	"gorm.io/gen"
	"gorm.io/gorm"
)

func main() {
    dsn := "chatgpt:chatgpt_plus@tcp(114.116.224.128:3306)/fluent_ai?charset=utf8mb4&parseTime=True&loc=Local"
    db, _ := gorm.Open(mysql.Open(dsn))

    g := gen.NewGenerator(gen.Config{
        OutPath:           "../models",
        ModelPkgPath:      "models",
        Mode:             gen.WithDefaultQuery,
        FieldNullable:    true,
        FieldWithTypeTag: true,
    })

    // Register basic type mappings using WithDataType
    // g.WithDataType("datetime", "time.Time")
    // g.WithDataType("tinyint", "int8")
    // g.WithDataType("decimal", "float64")

    g.UseDB(db)
    g.GenerateAllTable()
    g.Execute()
}