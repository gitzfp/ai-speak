import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/auth'

// 获取用户设置
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
        target_language_label: getLanguageLabel(settings.targetLanguage),
        speech_role_name: settings.voiceName,
        voice_speed: settings.voiceSpeed,
        auto_play: settings.autoPlay
      }
    })

  } catch (error) {
    console.error('获取设置失败:', error)
    return NextResponse.json(
      { code: 500, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新用户设置
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const updateData = await req.json()
    
    if (!userId) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      )
    }

    // 构建更新数据
    const prismaUpdateData: any = {}
    
    if (updateData.source_language) {
      prismaUpdateData.sourceLanguage = updateData.source_language
    }
    if (updateData.target_language) {
      prismaUpdateData.targetLanguage = updateData.target_language
    }
    if (updateData.speech_role_name) {
      prismaUpdateData.voiceName = updateData.speech_role_name
    }
    if (updateData.voice_speed !== undefined) {
      prismaUpdateData.voiceSpeed = updateData.voice_speed
    }
    if (updateData.auto_play !== undefined) {
      prismaUpdateData.autoPlay = updateData.auto_play
    }

    const settings = await prisma.accountSettings.update({
      where: { accountId: userId },
      data: prismaUpdateData
    })

    return NextResponse.json({
      code: 1000,
      status: 'SUCCESS',
      message: '设置更新成功',
      data: {
        source_language: settings.sourceLanguage,
        target_language: settings.targetLanguage,
        target_language_label: getLanguageLabel(settings.targetLanguage),
        speech_role_name: settings.voiceName,
        voice_speed: settings.voiceSpeed,
        auto_play: settings.autoPlay
      }
    })

  } catch (error) {
    console.error('更新设置失败:', error)
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