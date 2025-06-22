import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { phone, phone_number, code, password } = await req.json()
    
    // 支持两种字段格式：phone 或 phone_number
    const phoneValue = phone || phone_number
    
    if (!phoneValue) {
      return NextResponse.json(
        { code: 400, message: '手机号不能为空' },
        { status: 400 }
      )
    }

    // 支持验证码登录或密码登录
    if (!code && !password) {
      return NextResponse.json(
        { code: 400, message: '验证码或密码不能为空' },
        { status: 400 }
      )
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phoneValue)) {
      return NextResponse.json(
        { code: 400, message: '手机号格式不正确' },
        { status: 400 }
      )
    }

    // 验证码登录
    if (code && !password) {
      // 验证短信验证码
      // 在真实环境中，这里应该验证存储在Redis/数据库中的验证码
      // 目前为了测试，只接受特定的验证码
      const validCodes = ['123456', '000000', '888888'] // 测试用验证码
      if (!validCodes.includes(code)) {
        return NextResponse.json(
          { code: 400, message: '验证码错误或已过期' },
          { status: 400 }
        )
      }
    }

    // 获取客户端IP
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // 查找或创建手机账户
    let account = await prisma.account.findUnique({
      where: { phone: phoneValue },
      include: { settings: true }
    })

    let isFirstLogin = false

    if (!account) {
      // 用户不存在，需要先注册
      return NextResponse.json(
        { code: 400, message: '该手机号未注册，请先注册账户' },
        { status: 400 }
      )
    } else {
      // 检查是否为首次登录（lastLoginAt为空表示刚注册的用户）
      isFirstLogin = !account.lastLoginAt

      // 如果是密码登录，验证密码
      if (password && !code) {
        // TODO: 这里应该验证密码哈希，暂时简单比较
        // 实际应用中需要使用 bcrypt 等方式验证密码
        // if (!await bcrypt.compare(password, existingAccount.passwordHash)) {
        //   return NextResponse.json(
        //     { code: 400, message: '密码错误' },
        //     { status: 400 }
        //   )
        // }
      }

      // 如果不是首次登录，才更新登录信息
      if (!isFirstLogin) {
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
      // 如果是首次登录，则不更新任何信息，直接使用查出来的账户数据
      // 这样可以保留 lastLoginAt: null 的状态，以便前端触发角色选择
    }

    // 生成JWT token
    const token = generateToken(account.id, account.role)

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
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
          isFirstLogin // 标记是否为首次登录，用于前端判断是否需要角色选择
        },
        token
      }
    })

  } catch (error) {
    console.error('手机登录失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 