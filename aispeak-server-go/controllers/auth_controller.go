package controllers

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/middleware"
	"github.com/gitzfp/ai-speak/aispeak-server-go/types"
	"github.com/gitzfp/ai-speak/aispeak-server-go/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Password string `gorm:"not null" json:"-"` // 不在 JSON 中显示密码
	Role     types.Role `gorm:"not null" json:"role"`
	Name     string `gorm:"not null" json:"name"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required" example:"teacher1"` // 用户名
	Password string `json:"password" binding:"required" example:"password123"` // 密码
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required" example:"teacher1"` // 用户名
	Password string `json:"password" binding:"required" example:"password123"` // 密码
	Role     types.Role `json:"role" binding:"required,oneof=teacher student" example:"teacher"` // 角色：teacher 或 student
	Name     string `json:"name" binding:"required" example:"张老师"` // 姓名
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token    string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."` // JWT token
	UserID   string `json:"user_id" example:"1"` // 用户ID
	Role     types.Role `json:"role" example:"teacher"` // 用户角色
	UserName string `json:"user_name" example:"张老师"` // 用户姓名
}

type AuthController struct {
	db *gorm.DB
}

func NewAuthController(db *gorm.DB) *AuthController {
	// 自动迁移用户表
	db.AutoMigrate(&User{})
	return &AuthController{db: db}
}

// RegisterRoutes 注册路由
func (c *AuthController) RegisterRoutes(router *gin.RouterGroup) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", c.Register)
		auth.POST("/login", c.Login)
		auth.POST("/refresh", middleware.AuthMiddleware(), c.RefreshToken)
	}
}

// Register godoc
// @Summary 用户注册
// @Description 注册新用户，支持教师和学生角色
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "注册信息"
// @Success 201 {object} map[string]string "注册成功"
// @Failure 400 {object} map[string]string "请求参数错误"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Router /api/v1/auth/register [post]
func (c *AuthController) Register(ctx *gin.Context) {
	var req RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查用户名是否已存在
	var existingUser User
	if err := c.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "username already exists"})
		return
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// 创建用户
	user := User{
		Username: req.Username,
		Password: string(hashedPassword),
		Role:     req.Role,
		Name:     req.Name,
	}

	if err := c.db.Create(&user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "user registered successfully"})
}

// Login godoc
// @Summary 用户登录
// @Description 用户登录并获取 JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "登录信息"
// @Success 200 {object} LoginResponse "登录成功"
// @Failure 400 {object} map[string]string "请求参数错误"
// @Failure 401 {object} map[string]string "用户名或密码错误"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Router /api/v1/auth/login [post]
func (c *AuthController) Login(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找用户
	var user User
	if err := c.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	// 生成 token
	secretKey := os.Getenv("JWT_SECRET_KEY")
	if secretKey == "" {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "server configuration error"})
		return
	}

	token, err := utils.GenerateToken(fmt.Sprintf("%d", user.ID), user.Role, user.Name, secretKey)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	ctx.JSON(http.StatusOK, LoginResponse{
		Token:    token,
		UserID:   fmt.Sprintf("%d", user.ID),
		Role:     user.Role,
		UserName: user.Name,
	})
}

// RefreshToken godoc
// @Summary 刷新 token
// @Description 使用当前 token 获取新的 token
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string "刷新成功"
// @Failure 401 {object} map[string]string "token 无效或已过期"
// @Failure 500 {object} map[string]string "服务器内部错误"
// @Router /api/v1/auth/refresh [post]
func (c *AuthController) RefreshToken(ctx *gin.Context) {
	token := ctx.GetHeader("Authorization")
	token = strings.TrimPrefix(token, "Bearer ")

	secretKey := os.Getenv("JWT_SECRET_KEY")
	if secretKey == "" {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "server configuration error"})
		return
	}

	newToken, err := utils.RefreshToken(token, secretKey)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "failed to refresh token"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"token": newToken})
} 