// useAudioPlayer.ts
import { ref, onBeforeUnmount, onMounted, computed } from 'vue'
import { getPlayer } from '@/utils/initPlayer'

type Sentence = {
  is_lock: number
  audio_url: string
  audio_start?: number
  audio_end?: number
}

export function useAudioPlayer(onIndexChange?: (index: number) => void, onListEnd?: () => void, isRepeatAfter?: boolean) {
  // 从存储中加载播放模式和速度
  let savedLoopMode = uni.getStorageSync('loopMode') || 'none';
  // 如果是跟读模式，强制设置为不循环
  if (isRepeatAfter) {
    savedLoopMode = 'none';
  }
  const localPlaybackRate = parseFloat(uni.getStorageSync('playbackRate') || '1.0');
  const currentAudio = ref<ReturnType<typeof getPlayer> | null>(null)
  const isPlaying = ref(false)
  const currentIndex = ref(0)
  const isRandomMode = ref(false)
  const playbackRate = ref(localPlaybackRate)
  const repeatCount = ref(0)
  const currentRepeat = ref(0)
  const playHistory = ref<number[]>([]) // 随机模式历史记录
  const loopMode = ref<'list' | 'single' | 'none'>(savedLoopMode) // 新增循环模式状态

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
    if (isRepeatAfter) {
      loopMode.value = 'none'; // 在跟读模式下强制设置为不循环
      return;
    }
    const modes: ('none' | 'single' | 'list')[] = ['none', 'single', 'list'];
    const index = modes.indexOf(loopMode.value);
    const nextIndex = (index + 1) % modes.length;
    loopMode.value = modes[nextIndex];
    uni.setStorageSync('loopMode', loopMode.value); // 持久化循环模式
    uni.showToast({
      title: `当前循环模式：${loopModeText.value}`,
      icon: 'none'
    });
  };

  // 设置播放速度
  const setPlaybackRate = (rate: number) => {
    const validRates = [0.5, 0.8, 1.0, 1.2, 1.5, 2.0]
    if (!validRates.includes(rate)) {
      uni.showToast({ title: '不支持的播放速率', icon: 'none' })
      return
    }
    
    playbackRate.value = rate
    uni.setStorageSync('playbackRate', rate) // 持久化播放速度
    if (currentAudio.value) {
      try {
        currentAudio.value.playbackRate = rate
      } catch (e) {
        console.error('速率设置失败:', e)
      }
    }
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
    playSentence(sentences[currentIndex.value], sentences, true)
  }

  // 修改 playPrevSentence
  const playPrevSentence = (sentences: Sentence[]) => {
    const prevIndex = (currentIndex.value - 1 + sentences.length) % sentences.length
    updateCurrentIndex(prevIndex)
    playSentence(sentences[currentIndex.value], sentences, true)
  }

  // 核心播放函数
  const playSentence = (sentence: Sentence, sentences?: Sentence[], forcePlay?: boolean) => {

    if(isPlaying.value && !forcePlay){
      stopCurrentAudio()
      return
    }
    if (sentence.is_lock === 1) {
      uni.showToast({title: '内容已锁定'})
      return
    }
    stopCurrentAudio()
    isPlaying.value = true
    const audio = uni.createInnerAudioContext()
    currentAudio.value = audio
    audio.src = sentence.audio_url
    // 设置时间范围
    if (sentence.audio_start && sentence.audio_end) {
      const startTime = sentence.audio_start / 1000
      const endTime = sentence.audio_end / 1000
      audio.startTime = startTime
      // 监听播放进度
      audio.onTimeUpdate(() => {
        if (audio.currentTime >= endTime - 0.1) { // 防止浮点误差
          handlePlayEnd(sentences)  // 处理播放结束
        }
      })
    }
    
    // 设置通用事件监听
    audio.onError((res) => {
      console.error('播放错误:', res)
      stopCurrentAudio()
    })
  
    audio.onEnded(() => {
        console.log('播放句子结束onEnd:', sentence) 
        handlePlayEnd(sentences)
    })
  
    audio.onStop(() => {
      // 手动停止或到达指定结束时间时触发
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
         if(currentIndex.value === sentences.length - 1){
          stopCurrentAudio();
          onListEnd?.()
          return
        }
        playNextSentence(sentences)
        break
      case 'single':
        // 单曲循环时重新播放当前句子
        playSentence(sentences[currentIndex.value], sentences, true)
        break
      case 'none':
      default:
        stopCurrentAudio()
    }
  }


  // 切换播放状态
  const togglePlay = (sentences: Sentence[]) => {
    console.log('播放togglePlay:', sentences, currentIndex.value, isPlaying.value)
    if (isPlaying.value) {
      stopCurrentAudio()
    } else {
      playSentence(sentences[currentIndex.value], sentences)
    }
  }


// Update stopCurrentAudio to clean up properly
function stopCurrentAudio() {
  isPlaying.value = false
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