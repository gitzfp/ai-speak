package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/types"
	"github.com/gitzfp/ai-speak/aispeak-server-go/utils"
)

// AuthMiddleware 权限验证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头获取 token
		token := c.GetHeader("Authorization")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing token"})
			c.Abort()
			return
		}

		// 去掉 Bearer 前缀
		token = strings.TrimPrefix(token, "Bearer ")

		// 获取 JWT 密钥
		secretKey := os.Getenv("JWT_SECRET_KEY")
		if secretKey == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server configuration error"})
			c.Abort()
			return
		}

		// 解析并验证 token
		claims, err := utils.ParseToken(token, secretKey)
		if err != nil {
			switch err {
			case utils.ErrExpiredToken:
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: token has expired"})
			case utils.ErrInvalidToken:
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: invalid token"})
			default:
				c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: " + err.Error()})
			}
			c.Abort()
			return
		}

		// 将用户信息存储到上下文中
		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Set("user_name", claims.UserName)

		c.Next()
	}
}

// RequireRole 要求特定角色的中间件
func RequireRole(roles ...types.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized: missing role"})
			c.Abort()
			return
		}

		// 检查用户角色是否在允许的角色列表中
		hasRole := false
		for _, role := range roles {
			if userRole == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetUserID 从上下文中获取用户ID
func GetUserID(c *gin.Context) string {
	userID, _ := c.Get("user_id")
	return userID.(string)
}

// GetUserRole 从上下文中获取用户角色
func GetUserRole(c *gin.Context) types.Role {
	userRole, _ := c.Get("user_role")
	return userRole.(types.Role)
}

// GetUserName 从上下文中获取用户名
func GetUserName(c *gin.Context) string {
	userName, _ := c.Get("user_name")
	return userName.(string)
} 