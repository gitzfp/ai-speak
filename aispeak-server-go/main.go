package main

import (
	"fmt"
	"log"
	"os"
	
	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/controllers"
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/gitzfp/ai-speak/aispeak-server-go/repositories"
	"github.com/gitzfp/ai-speak/aispeak-server-go/router"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(".env"); err != nil {
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

	// 自动迁移模型
	if err := db.AutoMigrate(
		&models.Task{},
		&models.TaskContent{},
		&models.TaskTemplate{},
	); err != nil {
		log.Fatal("Auto migration failed:", err)
	}

	// 初始化服务层
	taskRepo := repositories.NewTaskRepository(db)
	taskService := services.NewTaskService(taskRepo)
	taskController := controllers.NewTaskController(taskService)

	// 配置路由
	r := router.SetupRouter(taskController)
	
	// 启动服务
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}