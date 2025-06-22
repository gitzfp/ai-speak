import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    
    if (!code) {
      return NextResponse.json(
        { code: 400, message: '微信授权码不能为空' },
        { status: 400 }
      )
    }

    // TODO: 调用微信API获取用户信息
    // 这里先模拟微信登录成功，实际需要调用微信接口
    const mockWechatUser = {
      openid: `wx_${Date.now()}`,
      nickname: '微信用户',
      avatar: 'https://dingguagua.fun/static/default-account-avatar.png'
    }

    // 获取客户端IP
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // 查找或创建微信账户
    let account = await prisma.account.findUnique({
      where: { wechatId: mockWechatUser.openid }
    })

    if (!account) {
      // 创建新的微信账户
      account = await prisma.account.create({
        data: {
          wechatId: mockWechatUser.openid,
          role: 'STUDENT',
          status: 'ACTIVE',
          lastLoginIp: clientIP.toString(),
          lastLoginAt: new Date(),
          nickname: mockWechatUser.nickname,
          avatar: mockWechatUser.avatar,
          settings: {
            create: {
              sourceLanguage: 'zh-CN',
              targetLanguage: 'en-US'
            }
          }
        },
        include: {
          settings: true
        }
      })
    } else {
      // 更新最后登录信息
      account = await prisma.account.update({
        where: { id: account.id },
        data: {
          lastLoginIp: clientIP.toString(),
          lastLoginAt: new Date(),
          status: 'ACTIVE'
        },
        include: {
          settings: true
        }
      })
    }

    // 生成JWT token
    const token = generateToken(account.id, account.role)

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
      data: {
        account: {
          id: account.id,
          wechatId: account.wechatId,
          nickname: account.nickname,
          avatar: account.avatar,
          role: account.role,
          settings: account.settings
        },
        token,
        user_id: account.id
      }
    })

  } catch (error) {
    console.error('微信登录失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 