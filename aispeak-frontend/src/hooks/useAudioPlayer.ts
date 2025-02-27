// useAudioPlayer.ts
import { ref, onBeforeUnmount, onMounted, computed } from 'vue'
import { getPlayer } from '@/utils/initPlayer'

type Sentence = {
  is_lock: number
  audio_url: string
  audio_start?: number
  audio_end?: number
}

export function useAudioPlayer(onIndexChange?: (index: number) => void) {
  const currentAudio = ref<ReturnType<typeof getPlayer> | null>(null)
  const isPlaying = ref(false)
  const currentIndex = ref(0)
  const isRandomMode = ref(false)
  const playbackRate = ref(1.0)
  const repeatCount = ref(0)
  const currentRepeat = ref(0)
  const playHistory = ref<number[]>([]) // 随机模式历史记录
  const loopMode = ref<'list' | 'single' | 'none'>('none') // 新增循环模式状态


  // 环境适配检测
  onMounted(() => {
    const testAudio = uni.createInnerAudioContext()
    if (typeof testAudio.playbackRate === 'undefined') {
      // showToast('当前环境不支持变速播放')
    }
    testAudio.destroy()
  })

  // 新增循环模式切换函数
  const toggleLoopMode = () => {
    const modes: ('none' | 'single' | 'list')[] = ['none', 'single', 'list']
    const index = modes.indexOf(loopMode.value)
    const nextIndex = (index + 1) % modes.length
    loopMode.value = modes[nextIndex]
    uni.showToast({
      title: `当前循环模式：${loopModeText.value}`,
      icon: 'none'
    })
  }

  // 计算循环模式显示文本
  const loopModeText = computed(() => {
    switch(loopMode.value) {
      case 'list': return '列表循环'
      case 'single': return '单次循环'
      default: return '不循环'
    }
  })

  // 更新 currentIndex 并触发回调的辅助函数
  const updateCurrentIndex = (newIndex: number) => {
    currentIndex.value = newIndex
    onIndexChange?.(newIndex)
  }

  // 修改 playNextSentence
  const playNextSentence = (sentences: Sentence[]) => {
    const nextIndex = (currentIndex.value + 1) % sentences.length
    updateCurrentIndex(nextIndex)
    console.log('playNextSentence', currentIndex.value, sentences) 
    playSentence(sentences[currentIndex.value], sentences)
  }

  // 修改 playPrevSentence
  const playPrevSentence = (sentences: Sentence[]) => {
    const prevIndex = (currentIndex.value - 1 + sentences.length) % sentences.length
    updateCurrentIndex(prevIndex)
    playSentence(sentences[currentIndex.value], sentences)
  }

  // 核心播放函数
  const playSentence = (sentence: Sentence, sentences?: Sentence[]) => {
    if (sentence.is_lock === 1) {
      uni.showToast({title: '内容已锁定'})
      return
    }
    console.log('播放句子开始:', sentence, sentences) 
	
    stopCurrentAudio()
	
    const audio = uni.createInnerAudioContext()
    currentAudio.value = audio
    audio.src = sentence.audio_url
    
    // 设置时间范围
    if (sentence.audio_start !== undefined && sentence.audio_end !== undefined) {
      const startTime = sentence.audio_start / 1000
      const endTime = sentence.audio_end / 1000
      audio.startTime = startTime
      
      // 监听播放进度
      audio.onTimeUpdate(() => {
		  
        if (audio.currentTime >= endTime - 0.1) { // 防止浮点误差
			// console.log("audio.currentTime")
			// console.log(audio.currentTime)
			// console.log("startTime - 0.1")
			// console.log(startTime)
			// console.log("endTime - 0.1")
			// console.log(endTime)
			// console.log(endTime - 0.1)
			// console.log("一直调")
          // audio.stop()
          handlePlayEnd(sentences)  // 处理播放结束
        }
      })
    }
    
    // 设置通用事件监听
    audio.onError((res) => {
      console.error('播放错误:', res)
      stopCurrentAudio()
      isPlaying.value = false
	  console.log('播放错误isPlaying:')
	  console.log(isPlaying.value) 
    })
  
    audio.onEnded(() => {
       console.log('播放句子结束onEnd:', sentence) 
      // 如果没有设置时间范围，或者播放到自然结束时触发
      // if (!sentence.audio_start || !sentence.audio_end) {
        handlePlayEnd(sentences)
      // }
    })
  
    audio.onStop(() => {
      // 手动停止或到达指定结束时间时触发
      console.log('onStop:',  sentences) 
      isPlaying.value = false
	  console.log('onStop----isPlaying:')
	  console.log(isPlaying.value) 
      // handlePlayEnd(sentences)
    })
    
    audio.playbackRate = playbackRate.value
    audio.play()
    isPlaying.value = true
  }

  // 播放结束处理
  const handlePlayEnd = (sentences?: Sentence[]) => {
    // console.log('播放句子结束handlePlayEnd:', sentences, loopMode.value)
    if (!sentences) {
      stopCurrentAudio()
      return
    }

    // 根据循环模式处理
    switch(loopMode.value) {
      case 'list':
        playNextSentence(sentences)
        break
      case 'single':
        // 单曲循环时重新播放当前句子
        playSentence(sentences[currentIndex.value], sentences)
        break
      case 'none':
      default:
        stopCurrentAudio()
        isPlaying.value = false
		console.log('default----isPlaying:')
		console.log(isPlaying.value) 
        break
    }
  }


  // 切换播放状态
  const togglePlay = (sentences: Sentence[]) => {
    console.log('播放togglePlay:', sentences, currentIndex.value)
    if (isPlaying.value) {
      stopCurrentAudio()
      isPlaying.value = false
    } else {
      isPlaying.value = true
      playSentence(sentences[currentIndex.value], sentences)
    }
  }

  // 设置播放速度
  const setPlaybackRate = (rate: number) => {
  // 确保速率在合法范围内
  const validRates = [0.5, 0.8, 1.0, 1.2, 1.5, 2.0]
  if (!validRates.includes(rate)) {
    uni.showToast({ title: '不支持的播放速率', icon: 'none' })
    return
  }
  
  playbackRate.value = rate
  if (currentAudio.value) {
    try {
      currentAudio.value.playbackRate = rate
    } catch (e) {
      console.error('速率设置失败:', e)
    }
  }
}

// Update stopCurrentAudio to clean up properly
function stopCurrentAudio() {

  if (currentAudio.value) {
    uni.hideToast()
    const audio = currentAudio.value // Store reference before nullifying
    try {
      audio.stop()
	  
      console.log("Audio stopped successfully")
    } catch (error) {
      console.error("Error stopping audio:", error)
    } finally {
      currentAudio.value = null
    }
  }
}

  // 设置重复次数
  const setRepeatCount = (count: number) => {
    repeatCount.value = count
    currentRepeat.value = 0
  }

  // 清理资源
  // 修改 onBeforeUnmount
  onBeforeUnmount(() => {
    // uni.showToast({title: '播放结束'})
    isPlaying.value = false
    stopCurrentAudio()
    updateCurrentIndex(0)
    playHistory.value = []
    currentRepeat.value = 0
  })

  return {
    isPlaying,
    isRandomMode,
    playbackRate,
    repeatCount,
    currentIndex,
    playNextSentence,
    playPrevSentence, 
    playSentence,
    togglePlay,
    setPlaybackRate,
    setRepeatCount,
    loopMode,
    toggleLoopMode,
    stopCurrentAudio
  }
}