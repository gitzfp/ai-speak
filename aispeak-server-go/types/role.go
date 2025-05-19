package types

// Role 用户角色
type Role string

const (
	RoleTeacher Role = "teacher"
	RoleStudent Role = "student"
	RoleAdmin   Role = "admin"
) 