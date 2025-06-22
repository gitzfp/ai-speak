import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'

// 获取学习语言设置
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      )
    }

    const settings = await prisma.accountSettings.findUnique({
      where: { accountId: userId }
    })

    if (!settings) {
      return NextResponse.json(
        { code: 404, message: '设置不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
      data: {
        source_language: settings.sourceLanguage,
        target_language: settings.targetLanguage,
        target_language_label: getLanguageLabel(settings.targetLanguage)
      }
    })

  } catch (error) {
    console.error('获取学习语言失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 设置学习语言
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const { target_language, source_language } = await req.json()
    
    if (!userId) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      )
    }

    if (!target_language) {
      return NextResponse.json(
        { code: 400, message: '目标语言不能为空' },
        { status: 400 }
      )
    }

    const updateData: any = {
      targetLanguage: target_language
    }

    if (source_language) {
      updateData.sourceLanguage = source_language
    }

    const settings = await prisma.accountSettings.update({
      where: { accountId: userId },
      data: updateData
    })

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
      message: '学习语言设置成功',
      data: {
        source_language: settings.sourceLanguage,
        target_language: settings.targetLanguage,
        target_language_label: getLanguageLabel(settings.targetLanguage)
      }
    })

  } catch (error) {
    console.error('设置学习语言失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 获取语言标签
function getLanguageLabel(languageCode: string): string {
  const languageMap: { [key: string]: string } = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)', 
    'zh-CN': '中文 (简体)',
    'zh-TW': '中文 (繁體)',
    'ja-JP': '日本語',
    'ko-KR': '한국어',
    'fr-FR': 'Français',
    'de-DE': 'Deutsch',
    'es-ES': 'Español',
    'it-IT': 'Italiano',
    'pt-BR': 'Português',
    'ru-RU': 'Русский'
  }
  
  return languageMap[languageCode] || languageCode
} 