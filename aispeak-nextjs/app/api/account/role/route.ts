import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'

// 获取用户角色
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
      select: { role: true }
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
      data: { role: account.role }
    })

  } catch (error) {
    console.error('获取用户角色失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新用户角色
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const { role } = await req.json()
    
    if (!userId) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      )
    }

    if (!role || !['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { code: 400, message: '无效的角色' },
        { status: 400 }
      )
    }

    const account = await prisma.account.update({
      where: { id: userId },
      data: { role },
      select: { role: true }
    })

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
      data: { role: account.role }
    })

  } catch (error) {
    console.error('更新用户角色失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 