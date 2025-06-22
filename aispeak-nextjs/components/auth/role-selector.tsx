'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, Shield, Loader2 } from 'lucide-react'
import useAuthStore from '@/stores/auth'
import { toast } from 'sonner'

export default function RoleSelector() {
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | null>(null)
  const { setRole, isLoading, error, user } = useAuthStore()

  const handleRoleSelect = async () => {
    if (!selectedRole) return
    
    try {
      await setRole(selectedRole)
      // 角色设置成功，页面会自动跳转到主页（由于needsRoleSelection变为false）
      console.log('✅ 角色设置成功，即将跳转到主页...')
      toast.success(`身份设置成功！欢迎使用${selectedRole === 'STUDENT' ? '学生' : '教师'}版功能`)
    } catch (error) {
      console.error('角色设置失败:', error)
      toast.error('身份设置失败，请重试')
    }
  }

  const roles = [
    {
      id: 'STUDENT' as const,
      title: '学生',
      description: '我想学习语言，提升语言能力',
      icon: GraduationCap,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-400',
      features: ['AI对话练习', '个性化学习计划', '语音评估', '学习进度跟踪']
    },
    {
      id: 'TEACHER' as const,
      title: '老师',
      description: '我想教授语言，管理学生学习',
      icon: Users,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-400',
      features: ['学生管理', '作业布置', '学习监控', '教学资源']
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            选择您的身份
          </CardTitle>
          <CardDescription>
            欢迎 {user?.nickname}！请选择最符合您需求的身份角色
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {roles.map((role) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id
              
              return (
                <div
                  key={role.id}
                  className={`cursor-pointer rounded-lg border-2 p-6 transition-all ${
                    isSelected ? role.selectedColor : role.color
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div className="flex items-center mb-4">
                    <Icon className="w-8 h-8 mr-3 text-gray-700" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {role.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      主要功能：
                    </div>
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  {isSelected && (
                    <div className="mt-4 p-2 bg-white bg-opacity-60 rounded text-center">
                      <span className="text-sm font-medium text-gray-700">
                        ✓ 已选择
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="text-center space-y-4">
            <Button
              onClick={handleRoleSelect}
              disabled={!selectedRole || isLoading}
              size="lg"
              className="px-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  设置中...
                </>
              ) : (
                '确认选择'
              )}
            </Button>
            
            <p className="text-xs text-gray-500">
              您可以稍后在设置中修改身份角色
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 