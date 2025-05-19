package utils

import (
	"errors"
	"fmt"
	"time"

	"github.com/gitzfp/ai-speak/aispeak-server-go/types"
	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

// JWTClaims 自定义的 JWT Claims
type JWTClaims struct {
	UserID   string      `json:"user_id"`
	Role     types.Role  `json:"role"`
	UserName string      `json:"user_name"`
	jwt.RegisteredClaims
}

// GenerateToken 生成 JWT token
func GenerateToken(userID string, role types.Role, userName string, secretKey string) (string, error) {
	// 设置 token 过期时间为 24 小时
	expirationTime := time.Now().Add(24 * time.Hour)

	// 创建 claims
	claims := &JWTClaims{
		UserID:   userID,
		Role:     role,
		UserName: userName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "ai-speak",
			Subject:   userID,
		},
	}

	// 创建 token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 使用密钥签名 token
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ParseToken 解析并验证 JWT token
func ParseToken(tokenString string, secretKey string) (*JWTClaims, error) {
	// 解析 token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// 验证签名方法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	// 验证 token
	if !token.Valid {
		return nil, ErrInvalidToken
	}

	// 获取 claims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// RefreshToken 刷新 token
func RefreshToken(tokenString string, secretKey string) (string, error) {
	// 解析旧 token
	claims, err := ParseToken(tokenString, secretKey)
	if err != nil && !errors.Is(err, ErrExpiredToken) {
		return "", err
	}

	// 生成新 token
	return GenerateToken(claims.UserID, claims.Role, claims.UserName, secretKey)
} 