import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 测试数据库连接
    await prisma.$connect()
    
    // 测试查询
    const userCount = await prisma.account.count()
    
    // 断开连接
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: "Supabase PostgreSQL 连接成功!",
      userCount,
      database: "PostgreSQL (Supabase)"
    })
  } catch (error: any) {
    console.error('数据库连接失败:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      database: "连接失败"
    }, { status: 500 })
  }
} 