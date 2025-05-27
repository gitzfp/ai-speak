package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// migrate.go - 数据库迁移工具
// 使用方法：go run migrate.go

func main() {
	// 加载环境变量
	if err := godotenv.Load("../.env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	// 初始化数据库连接
	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_NAME"),
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("开始数据库迁移...")

	// 检查现有数据
	var taskCount int64
	db.Model(&models.Task{}).Count(&taskCount)
	fmt.Printf("当前任务表中有 %d 条记录\n", taskCount)

	// 如果有现有数据，需要先处理 ClassID 为空的记录
	if taskCount > 0 {
		fmt.Println("检查是否有 ClassID 为空的记录...")
		
		var emptyClassTasks []models.Task
		// 注意：由于我们已经修改了模型，这里可能需要使用原始SQL查询
		db.Raw("SELECT * FROM tasks WHERE class_id IS NULL OR class_id = ''").Scan(&emptyClassTasks)
		
		if len(emptyClassTasks) > 0 {
			fmt.Printf("发现 %d 条 ClassID 为空的记录，需要先处理这些数据\n", len(emptyClassTasks))
			fmt.Println("建议的处理方案：")
			fmt.Println("1. 为这些记录设置默认的 ClassID（如 'UNKNOWN_CLASS'）")
			fmt.Println("2. 删除这些记录")
			fmt.Println("3. 手动分配正确的 ClassID")
			
			// 自动处理：设置默认值
			fmt.Println("自动为空记录设置默认 ClassID...")
			result := db.Exec("UPDATE tasks SET class_id = 'UNKNOWN_CLASS' WHERE class_id IS NULL OR class_id = ''")
			if result.Error != nil {
				log.Fatal("更新失败:", result.Error)
			}
			fmt.Printf("已更新 %d 条记录\n", result.RowsAffected)
		}
	}

	// 执行自动迁移
	err = db.AutoMigrate(
		&models.Task{},
		&models.TaskContent{},
		&models.Submission{},
		&models.Class{},
		&models.Notification{},
		// 添加其他需要迁移的模型...
	)

	if err != nil {
		log.Fatal("数据库迁移失败:", err)
	}

	fmt.Println("数据库迁移完成！")
	
	// 验证迁移结果
	fmt.Println("验证迁移结果...")
	
	// 检查表结构
	if db.Migrator().HasTable(&models.Task{}) {
		fmt.Println("✅ Task 表存在")
		
		// 检查 ClassID 列约束
		if db.Migrator().HasColumn(&models.Task{}, "class_id") {
			fmt.Println("✅ ClassID 列存在")
		} else {
			fmt.Println("❌ ClassID 列不存在")
		}
	} else {
		fmt.Println("❌ Task 表不存在")
	}
	
	fmt.Println("迁移验证完成！")
}
