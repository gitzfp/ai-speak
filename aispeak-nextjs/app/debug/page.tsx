'use client'

import { useEffect } from 'react'
import useAuthStore from '@/stores/auth'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
  const { isAuthenticated, user, needsRoleSelection, logout, setNeedsRoleSelection } = useAuthStore()

  useEffect(() => {
    console.log('🔍 当前Auth状态:', {
      isAuthenticated,
      user,
      needsRoleSelection,
      userRole: user?.role,
      isFirstLogin: user?.isFirstLogin,
      lastLoginAt: user?.lastLoginAt
    })
  }, [isAuthenticated, user, needsRoleSelection])

  const forceRoleSelection = () => {
    setNeedsRoleSelection(true)
  }

  const skipRoleSelection = () => {
    setNeedsRoleSelection(false)
  }

  const clearStorage = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">调试页面</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">当前状态</h2>
          <div className="space-y-2 text-sm">
            <div><strong>已认证:</strong> {isAuthenticated ? '是' : '否'}</div>
            <div><strong>需要角色选择:</strong> {needsRoleSelection ? '是' : '否'}</div>
            <div><strong>用户角色:</strong> {user?.role || '无'}</div>
            <div><strong>首次登录:</strong> {user?.isFirstLogin ? '是' : '否'}</div>
            <div><strong>最后登录:</strong> {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '从未登录'}</div>
            <div><strong>用户昵称:</strong> {user?.nickname || '无'}</div>
            <div><strong>手机号:</strong> {user?.phone || '无'}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">条件检查</h2>
          <div className="space-y-2 text-sm">
            <div>✓ 访客用户: {user?.role === 'VISITOR' ? '是' : '否'}</div>
            <div>✓ 首次登录: {user?.isFirstLogin === true ? '是' : '否'}</div>
            <div>✓ 学生且无登录记录: {(user?.role === 'STUDENT' && !user?.lastLoginAt) ? '是' : '否'}</div>
            <div><strong>应该触发身份选择:</strong> {
              (needsRoleSelection || user?.role === 'VISITOR' || 
               user?.isFirstLogin === true || 
               (user?.role === 'STUDENT' && !user?.lastLoginAt)) ? '是' : '否'
            }</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">操作</h2>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={forceRoleSelection} variant="outline">
              强制显示角色选择
            </Button>
            <Button onClick={skipRoleSelection} variant="outline">
              跳过角色选择
            </Button>
            <Button onClick={clearStorage} variant="destructive">
              清除所有数据
            </Button>
            <Button onClick={logout} variant="secondary">
              退出登录
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              返回主页
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 