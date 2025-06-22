import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken, hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { phone_number, password, user_name, grade } = await req.json()
    
    if (!phone_number || !password) {
      return NextResponse.json(
        { code: 400, message: '手机号和密码不能为空' },
        { status: 400 }
      )
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone_number)) {
      return NextResponse.json(
        { code: 400, message: '手机号格式不正确' },
        { status: 400 }
      )
    }

    // 检查手机号是否已存在
    const existingAccount = await prisma.account.findUnique({
      where: { phone: phone_number }
    })

    if (existingAccount) {
      return NextResponse.json(
        { code: 400, message: '该手机号已注册' },
        { status: 400 }
      )
    }

    // 获取客户端IP
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // 创建新账户 - 默认学生角色，首次登录时会提示选择角色
    const account = await prisma.account.create({
      data: {
        phone: phone_number,
        role: 'STUDENT', // 默认角色，可在首次登录时修改
        status: 'ACTIVE',
        lastLoginIp: clientIP.toString(),
        // 注意：不设置lastLoginAt，这样可以识别为首次登录用户
        nickname: user_name || `用户_${phone_number.slice(-4)}`,
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

    // 生成JWT token
    const token = generateToken(account.id, account.role)

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
      message: '注册成功',
      data: {
        account: {
          id: account.id,
          phone: account.phone,
          nickname: account.nickname,
          avatar: account.avatar,
          role: account.role,
          status: account.status,
          lastLoginAt: account.lastLoginAt,
          createdAt: account.createdAt,
          settings: account.settings,
          isFirstLogin: true // 标记为首次登录，前端可用于角色选择流程
        },
        token
      }
    })

  } catch (error) {
    console.error('用户注册失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 