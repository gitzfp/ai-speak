package router

import (
	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/controllers"
)

// SetupRouter 配置路由
func SetupRouter(taskController *controllers.TaskController, classController *controllers.ClassController, authController *controllers.AuthController) *gin.Engine {
	r := gin.Default()

	// API 版本分组
	v1 := r.Group("/api/v1")
	{
		// 注册认证路由（不需要认证中间件）
		authController.RegisterRoutes(v1)

		// 添加认证中间件
		// v1.Use(middleware.AuthMiddleware())

		// 任务相关路由
		tasks := v1.Group("/tasks")
		{
			tasks.GET("", taskController.ListTasks)
			tasks.POST("",  taskController.CreateTask)
			tasks.GET("/:id", taskController.GetTask)
			tasks.PUT("/:id",  taskController.UpdateTask)
			tasks.DELETE("/:id", taskController.DeleteTask)

			// 提交相关路由
			tasks.POST("/:id/submissions", taskController.SubmitTask)
			tasks.GET("/:id/submissions", taskController.ListSubmissions)
		}

		// 提交详情和评分路由优化（减少路径嵌套）
		submissions := v1.Group("/submissions") // 改为根路径
		{
			submissions.GET("/:id", taskController.GetSubmission)
			submissions.POST("/:id/grade", taskController.GradeSubmission)
		}

		// 班级管理路由添加Swagger标签
		classGroup := v1.Group("/classes")
		{
			classGroup.POST("", classController.CreateClass)
			classGroup.PUT("/:id", classController.UpdateClass)
			classGroup.DELETE("/:id", classController.DeleteClass)
			classGroup.GET("/:id", classController.GetClass)

			// 教师管理
			classGroup.POST("/:id/teachers", classController.AddTeacher)
			classGroup.DELETE("/:id/teachers/:teacher_id", classController.RemoveTeacher)
			classGroup.GET("/:id/teachers", classController.GetClassTeachers)
			classGroup.GET("/teacher/:teacher_id", classController.GetTeacherClasses)

			// 学生管理
			classGroup.POST("/:id/students", classController.AddStudent)
			classGroup.DELETE("/:id/students/:student_id", classController.RemoveStudent)
			classGroup.GET("/:id/students", classController.GetClassStudents)
			classGroup.GET("/student/classes/:student_id", classController.GetStudentClasses) // 修改路径匹配新分组

			// 任务管理
			classGroup.GET("/:id/tasks", classController.GetClassTasks)
		}
		// 学生专属路由（临时移除权限验证）
		studentClassGroup := v1.Group("/student")
		{
			studentClassGroup.GET("/classes/:student_id", classController.GetStudentClasses)
		}

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
