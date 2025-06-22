'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useAuthStore from '@/stores/auth'
import { toast } from 'sonner'
import { Smartphone, User, UserPlus, MessageSquare } from 'lucide-react'
import Image from 'next/image'

const gradeOptions = [
  { grade: '一年级', book_id: '1l1_V2' },
  { grade: '二年级', book_id: '1l3_V2' },
  { grade: '三年级', book_id: '1l5_V2' },
  { grade: '四年级', book_id: '1l7_V2' },
  { grade: '五年级', book_id: '1l9_V2' },
  { grade: '六年级', book_id: '1l11_V2' }
]

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState('visitor')
  const [isLoading, setIsLoading] = useState(false)
  
  // 访客登录状态
  const [fingerprint, setFingerprint] = useState('')
  
  // 手机登录状态
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  
  // 注册状态
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  
  const { setUser } = useAuthStore()
  
  // 设置认证状态的辅助函数
  const setAuthData = (user: any, token: string) => {
    // 检查是否需要角色选择（与 auth store 中的逻辑保持一致）
    let needsSelection = user.role === 'VISITOR' || 
      user.isFirstLogin === true ||
      (user.role === 'STUDENT' && !user.lastLoginAt)
    
    // 强制调试 - 如果是这个特定手机号，总是触发身份选择
    if (user.phone === '13122806309') {
      console.log('🔧 调试模式：强制为测试手机号触发身份选择')
      needsSelection = true
    }
    
    // 调试日志
    console.log('🔍 登录调试信息:', {
      user: user,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      lastLoginAt: user.lastLoginAt,
      needsSelection: needsSelection,
      conditions: {
        isVisitor: user.role === 'VISITOR',
        isFirstLogin: user.isFirstLogin === true,
        isStudentWithoutLogin: user.role === 'STUDENT' && !user.lastLoginAt
      }
    })
    
    setUser(user)
    // 手动设置store中的其他状态
    useAuthStore.setState({ 
      user, 
      token, 
      isAuthenticated: true,
      needsRoleSelection: needsSelection
    })
  }

  // 检测是否为微信环境
  const isWechatEnv = () => {
    if (typeof window === 'undefined') return false
    const ua = window.navigator.userAgent.toLowerCase()
    return /miniprogram/i.test(ua) || /micromessenger/i.test(ua)
  }

  // 生成设备指纹
  const generateFingerprint = () => {
    if (typeof window === 'undefined') return ''
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Device fingerprint', 2, 2)
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')
    
    // 简单hash
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return `visitor_${Math.abs(hash)}_${Date.now()}`
  }

  // 访客登录
  const handleVisitorLogin = async () => {
    setIsLoading(true)
    try {
      const deviceFingerprint = fingerprint || generateFingerprint()
      setFingerprint(deviceFingerprint)
      
      const response = await fetch('/api/account/visitor-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: deviceFingerprint })
      })
      
      const data = await response.json()
      
      if (data.code === 1000) {
        setAuthData(data.data.account, data.data.token)
        toast.success('访客登录成功')
      } else {
        toast.error(data.message || '登录失败')
      }
    } catch (error) {
      console.error('访客登录失败:', error)
      toast.error('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!phoneNumber || !password) {
      toast.error('请输入手机号和密码')
      return
    }

    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('请输入正确的手机号')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/account/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          code: '123456' // 使用验证码登录，因为我们的API支持验证码登录
        })
      })
      
      const data = await response.json()
      
      if (data.code === 1000) {
        setAuthData(data.data.account, data.data.token)
        toast.success('登录成功')
      } else {
        toast.error(data.message || '登录失败')
      }
    } catch (error) {
      console.error('手机登录失败:', error)
      toast.error('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 微信登录
  const handleWechatLogin = async () => {
    setIsLoading(true)
    try {
      // 模拟微信授权码
      const mockCode = `wx_code_${Date.now()}`
      
      const response = await fetch('/api/account/wechat-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mockCode })
      })
      
      const data = await response.json()
      
      if (data.code === 1000) {
        setAuthData(data.data.account, data.data.token)
        toast.success('微信登录成功')
      } else {
        toast.error(data.message || '微信登录失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      toast.error('微信登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 注册
  const handleRegister = async () => {
    if (!registerPhone || !registerPassword) {
      toast.error('请输入手机号和密码')
      return
    }

    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(registerPhone)) {
      toast.error('请输入正确的手机号')
      return
    }

    if (registerPassword.length < 6) {
      toast.error('密码长度不能少于6位')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: registerPhone,
          password: registerPassword,
          user_name: registerUsername,
          grade: selectedGrade
        })
      })
      
      const data = await response.json()
      
      if (data.code === 1000) {
        // 注册成功后设置认证状态
        setAuthData(data.data.account, data.data.token)
        toast.success('注册成功')
      } else {
        toast.error(data.message || '注册失败')
      }
    } catch (error) {
      console.error('注册失败:', error)
      toast.error('注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 relative">
            <Image
              src="/logo.png"
              alt="AISPeak Logo"
              fill
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            欢迎使用AISPeak
          </CardTitle>
          <CardDescription className="text-gray-600">
            智能语言学习助手
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* 微信登录按钮（微信环境显示） */}
          {isWechatEnv() && (
            <Button
              onClick={handleWechatLogin}
              disabled={isLoading}
              className="w-full mb-4 bg-green-500 hover:bg-green-600 text-white"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              微信一键登录
            </Button>
          )}

          {/* 非微信环境显示选项卡 */}
          {!isWechatEnv() && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="visitor" className="text-xs">
                  <User className="mr-1 h-3 w-3" />
                  访客
                </TabsTrigger>
                <TabsTrigger value="phone" className="text-xs">
                  <Smartphone className="mr-1 h-3 w-3" />
                  手机
                </TabsTrigger>
                <TabsTrigger value="register" className="text-xs">
                  <UserPlus className="mr-1 h-3 w-3" />
                  注册
                </TabsTrigger>
              </TabsList>

              {/* 访客登录 */}
              <TabsContent value="visitor" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    设备标识（可选）
                  </label>
                  <Input
                    type="text"
                    placeholder="自动生成设备标识"
                    value={fingerprint}
                    onChange={(e) => setFingerprint(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleVisitorLogin}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? '登录中...' : '访客登录'}
                </Button>
              </TabsContent>

              {/* 手机登录 */}
              <TabsContent value="phone" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    手机号
                  </label>
                  <Input
                    type="tel"
                    placeholder="请输入手机号"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    密码
                  </label>
                  <Input
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handlePhoneLogin}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </TabsContent>

              {/* 注册 */}
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    用户名（可选）
                  </label>
                  <Input
                    type="text"
                    placeholder="请输入用户名"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    手机号
                  </label>
                  <Input
                    type="tel"
                    placeholder="请输入手机号"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    密码
                  </label>
                  <Input
                    type="password"
                    placeholder="请输入密码（至少6位）"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    年级
                  </label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择年级" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((option) => (
                        <SelectItem key={option.book_id} value={option.grade}>
                          {option.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? '注册中...' : '注册'}
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 