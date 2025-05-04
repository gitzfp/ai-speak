package main

import (
	"fmt"
	"log"
	"os"

	// 添加swagger导入
	"github.com/gitzfp/ai-speak/aispeak-server-go/controllers"
	_ "github.com/gitzfp/ai-speak/aispeak-server-go/docs"
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/gitzfp/ai-speak/aispeak-server-go/repositories"
	"github.com/gitzfp/ai-speak/aispeak-server-go/router"
	"github.com/gitzfp/ai-speak/aispeak-server-go/services"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// @title           AI-Speak API
// @version         1.0
// @description     AI-Speak服务端API文档
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.example.com/support
// @contact.email  support@example.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /

func main() {
	// 加载环境变量
	if err := godotenv.Load("../.env"); err != nil {
		log.Fatal("Error loading .env file")
	}
	// 打印所有环境变量
	for _, e := range os.Environ() {
		fmt.Println(e)
	}
	// 手动设置环境变量
	os.Setenv("DB_HOST", os.Getenv("DB_HOST"))
	os.Setenv("DB_USER", os.Getenv("DB_USER"))
	os.Setenv("DB_PASSWORD", os.Getenv("DB_PASSWORD"))
	os.Setenv("DB_NAME", os.Getenv("DB_NAME"))

	fmt.Println("DB_HOST: ", os.Getenv("DB_HOST"))
	fmt.Println("DB_USER: ", os.Getenv("DB_USER"))
	fmt.Println("DB_PASSWORD: ", os.Getenv("DB_PASSWORD"))
	fmt.Println("DB_NAME: ", os.Getenv("DB_NAME"))
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
	wordRepo := repositories.NewWordRepository(db)
	sentenceRepo := repositories.NewContentRepository(db)
	taskService := services.NewTaskService(taskRepo, wordRepo, sentenceRepo)
	taskController := controllers.NewTaskController(taskService)

	// 配置路由
	r := router.SetupRouter(taskController)
	
	// 添加swagger路由
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	
	// 启动服务
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}