package router

import (
	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/controllers" // 修正导入路径
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	api := r.Group("/api/v1")
	{
		// 教材相关路由
		textbooks := api.Group("/textbooks")
		{
			textbooks.GET("", controller.ListTextbooks)
			textbooks.POST("", controller.CreateTextbook)
			textbooks.GET("/:id", controller.GetTextbook)
			textbooks.PUT("/:id", controller.UpdateTextbook)
			textbooks.DELETE("/:id", controller.DeleteTextbook)
		}

		// 课程相关路由
		lessons := api.Group("/lessons")
		{
			lessons.GET("", controller.ListLessons)
			lessons.POST("", controller.CreateLesson)
			lessons.GET("/:id", controller.GetLesson)
		}

		// 添加其他资源路由...

		// 新增任务相关路由
		tasks := api.Group("/tasks")
		{
			tasks.GET("", controllers.ListTasks)
			tasks.POST("", controllers.CreateTask)
			tasks.GET("/:id", controllers.GetTask)
			tasks.PUT("/:id", controllers.UpdateTask)
			tasks.DELETE("/:id", controllers.DeleteTask)
		}
	}

	return r
}