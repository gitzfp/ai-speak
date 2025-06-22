'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import useAuthStore from '@/stores/auth'
import LoginForm from '@/components/auth/login-form'
import RoleSelector from '@/components/auth/role-selector'
import UserMenu from '@/components/auth/user-menu'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { isAuthenticated, user, fetchUserInfo, logout, needsRoleSelection } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUserInfo()
    }
  }, [isAuthenticated, user, fetchUserInfo])

  if (!isAuthenticated) {
    return <LoginForm />
  }

  // 需要角色选择（访客或新用户）
  if (needsRoleSelection || (user && user.role === 'VISITOR')) {
    return <RoleSelector />
  }

  // 已登录用户显示主界面
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI语言学习平台
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.nickname?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.nickname}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.role === 'STUDENT' && '学生'}
                      {user?.role === 'TEACHER' && '老师'}
                      {user?.role === 'ADMIN' && '管理员'}
                      {user?.role === 'VISITOR' && '访客'}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* 用户菜单下拉框 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                    <UserMenu />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              学习统计
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">今日学习时长</span>
                <span className="text-sm font-medium">0 分钟</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">学习天数</span>
                <span className="text-sm font-medium">1 天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">掌握单词</span>
                <span className="text-sm font-medium">0 个</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              快速开始
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="font-medium">AI 对话练习</div>
                <div className="text-sm text-gray-600">与AI进行对话练习</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                <div className="font-medium">单词学习</div>
                <div className="text-sm text-gray-600">学习新单词和短语</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                <div className="font-medium">语音练习</div>
                <div className="text-sm text-gray-600">练习发音和语调</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              学习进度
            </h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">0%</div>
              <div className="text-sm text-gray-600">今日目标完成度</div>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              最近学习记录
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              暂无学习记录，开始您的第一次学习吧！
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 