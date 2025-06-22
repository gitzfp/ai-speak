'use client'

import { useState } from 'react'
import { LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useAuthStore from '@/stores/auth'
import { toast } from 'sonner'

export default function UserMenu() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      toast.success('退出登录成功')
    } catch (error) {
      console.error('退出登录失败:', error)
      toast.error('退出登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-lg">{user.nickname || '用户'}</CardTitle>
        <p className="text-sm text-gray-600">
          {user.role === 'VISITOR' ? '访客用户' : '注册用户'}
        </p>
        {user.phone && (
          <p className="text-sm text-gray-500">
            {user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">学习设置</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>源语言: {user.settings?.sourceLanguage || 'zh-CN'}</p>
            <p>目标语言: {user.settings?.targetLanguage || 'en-US'}</p>
            <p>语音速度: {user.settings?.voiceSpeed || 1.0}x</p>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => toast.info('设置功能开发中...')}
          >
            <Settings className="w-4 h-4 mr-2" />
            设置
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoading ? '退出中...' : '退出登录'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 