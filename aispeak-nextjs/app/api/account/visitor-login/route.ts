import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { fingerprint } = await req.json()
    
    if (!fingerprint) {
      return NextResponse.json(
        { code: 400, message: 'fingerprint 不能为空' },
        { status: 400 }
      )
    }

    // 获取客户端IP
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // 查找或创建访客账户
    let account = await prisma.account.findUnique({
      where: { fingerprint }
    })

    if (!account) {
      // 创建新的访客账户
      account = await prisma.account.create({
        data: {
          fingerprint,
          role: 'VISITOR',
          status: 'ACTIVE',
          lastLoginIp: clientIP.toString(),
          lastLoginAt: new Date(),
          nickname: `访客_${fingerprint.slice(-6)}`,
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
          nickname: account.nickname,
          avatar: account.avatar,
          role: account.role,
          settings: account.settings
        },
        token
      }
    })

  } catch (error) {
    console.error('访客登录失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 