import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'LOADED' : 'NOT_LOADED',
    DATABASE_URL_VALUE: process.env.DATABASE_URL?.substring(0, 50) + '...',
    NODE_ENV: process.env.NODE_ENV,
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || 
      key.includes('SUPABASE') || 
      key.includes('DIRECT')
    )
  })
} 