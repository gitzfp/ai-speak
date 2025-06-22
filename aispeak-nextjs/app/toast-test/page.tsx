'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ToastTestPage() {
  const testSuccess = () => {
    toast.success('这是一个成功消息！')
  }

  const testError = () => {
    toast.error('这是一个错误消息！')
  }

  const testInfo = () => {
    toast.info('这是一个信息消息！')
  }

  const testWarning = () => {
    toast.warning('这是一个警告消息！')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Toast 测试页面</h1>
        
        <div className="space-y-4">
          <Button onClick={testSuccess} className="w-full">
            测试成功Toast
          </Button>
          
          <Button onClick={testError} variant="destructive" className="w-full">
            测试错误Toast
          </Button>
          
          <Button onClick={testInfo} variant="secondary" className="w-full">
            测试信息Toast
          </Button>
          
          <Button onClick={testWarning} variant="outline" className="w-full">
            测试警告Toast
          </Button>
          
          <Button onClick={() => window.location.href = '/'} variant="ghost" className="w-full">
            返回主页
          </Button>
        </div>
      </div>
    </div>
  )
} 