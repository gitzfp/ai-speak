import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      )
    }

    const account = await prisma.account.findUnique({
      where: { id: userId },
      include: {
        settings: true
      }
    })

    if (!account) {
      return NextResponse.json(
        { code: 404, message: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
      data: {
        id: account.id,
        phone: account.phone,
        wechatId: account.wechatId,
        nickname: account.nickname,
        avatar: account.avatar,
        role: account.role,
        status: account.status,
        lastLoginAt: account.lastLoginAt,
        createdAt: account.createdAt,
        settings: account.settings
      }
    })

  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 