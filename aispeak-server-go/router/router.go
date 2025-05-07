package router

import (
	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/controllers"
)

// SetupRouter 配置路由
func SetupRouter(taskController *controllers.TaskController) *gin.Engine {
	r := gin.Default()

	// 任务相关路由
	tasks := r.Group("/tasks")
	{
		tasks.GET("", taskController.ListTasks)
		tasks.POST("", taskController.CreateTask)
		tasks.GET("/:id", taskController.GetTask)
		tasks.PUT("/:id", taskController.UpdateTask)
		tasks.DELETE("/:id", taskController.DeleteTask)
		
		// 提交相关路由
		tasks.POST("/:id/submissions", taskController.SubmitTask)
		tasks.GET("/:id/submissions", taskController.ListSubmissions)
	}
	
	// 提交详情和评分路由
	submissions := r.Group("/tasks/submissions")
	{
		submissions.GET("/:id", taskController.GetSubmission)
		submissions.POST("/:id/grade", taskController.GradeSubmission)
	}

	// 其他路由组...
	// templates := r.Group("/templates")
	// {
	//     templates.GET("", taskController.ListTemplates)
	//     templates.POST("", taskController.CreateTemplate)
	//     templates.GET("/:id", taskController.GetTemplate)
	// }

	return r
}