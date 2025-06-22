import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // 获取Authorization头中的token
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { code: 400, message: 'Token不能为空' },
        { status: 400 }
      )
    }

    // TODO: 将token加入黑名单或在Redis中标记为无效
    // 这里简单返回成功，实际应用中应该：
    // 1. 将token加入黑名单
    // 2. 或者在Redis中标记token为无效
    // 3. 或者使用JWT的短期有效期 + refresh token机制

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
      message: '退出登录成功'
    })

  } catch (error) {
    console.error('退出登录失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 