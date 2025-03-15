let audioInstance: any = null

export const createPlayer = () => {
  // 如果已经存在实例，先销毁
  if (audioInstance) {
    try {
      audioInstance.stop()
      audioInstance.destroy()
    } catch (error) {
      console.error('销毁音频实例失败:', error)
    }
  }

  // 创建新实例
  if (uni.getBackgroundAudioManager) {
    // 微信小程序环境，使用后台播放能力
    audioInstance = uni.getBackgroundAudioManager()
    // 设置默认标题，避免微信小程序报错
    audioInstance.title = '音频播放'
  } else {
    // 其他环境使用普通音频实例
    audioInstance = uni.createInnerAudioContext()
  }

  return audioInstance
}

export const getPlayer = () => {
  if (!audioInstance) {
    return createPlayer()
  }
  return audioInstance
}

export const destroyPlayer = () => {
  if (audioInstance) {
    try {
      audioInstance.stop()
      audioInstance.destroy()
      audioInstance = null
    } catch (error) {
      console.error('销毁音频实例失败:', error)
    }
  }
}