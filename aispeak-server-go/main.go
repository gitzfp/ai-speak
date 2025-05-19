package main

import (
	"fmt"
	"log"
	"os"

	// 添加swagger导入
	"github.com/gitzfp/ai-speak/aispeak-server-go/controllers"
	_ "github.com/gitzfp/ai-speak/aispeak-server-go/docs"
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
// @description     AI-Speak服务端API文档，提供任务管理、班级管理和用户认证等功能
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.example.com/support
// @contact.email  support@example.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description 在请求头中添加 Bearer token，例如：Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// @tag.name auth
// @tag.description 用户认证相关接口，包括注册、登录和token刷新

// @tag.name tasks
// @tag.description 任务管理相关接口，包括创建、更新、删除和查询任务

// @tag.name classes
// @tag.description 班级管理相关接口，包括创建、更新、删除班级，以及管理班级成员和任务

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

	// 初始化服务层
	taskRepo := repositories.NewTaskRepository(db)
	wordRepo := repositories.NewWordRepository(db)
	sentenceRepo := repositories.NewContentRepository(db)
	taskService := services.NewTaskService(taskRepo, wordRepo, sentenceRepo)
	classRepo := repositories.NewClassRepository(db)
	classService := services.NewClassService(classRepo)
	taskController := controllers.NewTaskController(taskService, classService)

	// 初始化班级管理相关组件
	classController := controllers.NewClassController(classService)

	// 初始化认证控制器
	authController := controllers.NewAuthController(db)

	// 配置路由
	r := router.SetupRouter(taskController, classController, authController)

	// 添加swagger路由
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 启动服务
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
