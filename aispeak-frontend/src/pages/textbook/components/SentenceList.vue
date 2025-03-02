<template>
  <view class="sentence-list">
    <view v-if="!sentences || sentences.length === 0" class="no-data">
      暂无数据
    </view>
    <view 
      v-else
      v-for="(sentence, index) in sentences" 
      :key="`${sentence.id}`"
     
      :class="{ 'locked': sentence.is_lock === 1, 'playing': currentPlaying(index) }"
      @tap="() => changeCurrentIndex(index)"
    >
      <view  class="sentence-item">
        <view class="sentence-content">
          <text class="english">{{ sentence.english }}</text>
          <text class="chinese">{{ sentence.chinese }}</text>
        </view>
        <view class="controls" @tap="playSentence(sentence, sentences, currentIndex !== index)">
          <text v-if="currentIndex === index && isPlaying" class="play-icon">⏸</text>
          <text v-else class="play-icon">▶</text>
          <text v-if="sentence.is_lock" class="lock-icon">🔒</text>
        </view>
      </view>
      <FollowReading 
          v-if="repeatAfter" 
          :sentence="sentence.english"
      />
    </view>

    <!-- 跟读模式按钮 -->
    <view v-if="repeatAfter" class="repeat-btn" >
    </view>
   
    <!-- 控制栏，仅在非跟读模式显示 -->
    <view v-else class="control-bar">
      <!-- 左侧：播放模式 -->
      <view class="control-group">
         <!-- 新增循环模式控制栏 -->
        <control-group>
            <view 
            class="control-item" 
            @tap="toggleLoopMode"
            >
            <text class="picker-btn">{{ loopModeText }}</text>
            </view>
        </control-group> 
      </view>

      <!-- 中间：播放控制 -->
      <view class="play-controls">
        <view class="control-item" @tap="playPrevSentence(sentences)">
          <text class="icon">⏮</text>
        </view>
        <view class="control-item play-btn" @tap="togglePlay(sentences)">
          <text class="icon">{{ isPlaying ? '⏸' : '▶' }}</text>
        </view>
        <view class="control-item" @tap="playNextSentence(sentences)">
          <text class="icon">⏭</text>
        </view>
      </view>

      <!-- 右侧：状态控制 -->
      <view class="status-group">
        <!-- 速度控制 -->
        <view class="control-item">
          <picker 
            @change="onSpeedChange($event.detail.value)"
            :range="speedOptionsDisplay"
            :value="speedIndex"
          >
            <view class="picker-btn">
              <text class="icon">📈</text>
              <text class="value">{{ playbackRate }}x</text>
            </view>
          </picker>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import FollowReading from './FollowReading.vue' // 导入新组件
// 原始选项数据
const speedOptions = [0.5, 0.8, 1.0, 1.2, 1.5, 2.0]

interface Sentence {
  id: number
  is_lock: number
  english: string
  chinese: string
  audio_url: string
  audio_start: number
  audio_end: number
}

const changeCurrentIndex = (index: number) => {
    currentIndex.value = index
}

const loopModeText = computed(() => {
  switch(loopMode.value) {
    case 'list': return '列表循环'
    case 'single': return '单次循环'
    default: return '不循环'
  }
})

const props = withDefaults(defineProps<{
  sentences?: Sentence[]
  repeatAfter?: boolean
  onListEnd?: () => void
}>(), {
  sentences: () => [],
  repeatAfter: false,
  onListEnd: () => {}
})

// 添加更多调试信息
console.log('初始 props:', props)

// 使用 watchEffect 替代 watch 来确保能捕获到变化
watchEffect(() => {
  console.log('watchEffect - repeatAfter:', props.repeatAfter)
})

// 保留原有的 watch
watch(() => props.repeatAfter, (newVal, oldVal) => {
  console.log('watch - repeatAfter changed:', { newVal, oldVal })
}, { immediate: true, deep: true })

// 添加监听器查看数据
watch(() => props.sentences, (newVal) => {
  console.log('sentences changed:', newVal)
}, { immediate: true, deep: true })

const {
  isPlaying,
  playbackRate,
  currentIndex,
  playSentence,
  playNextSentence,
  playPrevSentence,
  togglePlay,
  setPlaybackRate,
  loopMode,
  toggleLoopMode
} = useAudioPlayer(changeCurrentIndex, () => {
  if (typeof props.onListEnd === 'function') {
    props.onListEnd()
  }
}, props.repeatAfter) // 传递 repeatAfter 参数

// 显示格式处理
const speedOptionsDisplay = computed(() => 
  speedOptions.map(v => `${v}x`)
)

// 当前选中索引
const speedIndex = computed(() => 
  speedOptions.findIndex(v => v === playbackRate.value)
)


// 事件处理
const onSpeedChange = (index: number) => {
  setPlaybackRate(speedOptions[index])
}

const currentPlaying = (index: number) => {
  return currentIndex.value === index
}


// 添加 playFirstSentence 方法
const playFirstSentence = () => {
  if (props.sentences && props.sentences.length > 0) {
    playSentence(props.sentences[0], props.sentences)
  }
}

// Expose the method to be accessible from the parent component
defineExpose({
  playFirstSentence
})
</script>

<style scoped>
.sentence-list {
  padding-bottom: 160rpx;
}

.sentence-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  margin: 16rpx 24rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.sentence-item.playing {
  background: #f0fff4;
  border-left: 8rpx solid #4CAF50;
}

.locked {
  opacity: 0.6;
  background: #f5f5f5;
}

.sentence-content {
  flex: 1;
  margin-right: 24rpx;
}

.english {
  display: block;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.chinese {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.play-icon {
  font-size: 40rpx;
  color: #4CAF50;
}

.lock-icon {
  font-size: 36rpx;
  color: #ff4d4f;
}

.control-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.1);
  z-index: 1000;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

/* 新增循环模式控制项样式 */
.control-item.loop-mode {
  margin-left: 24rpx;
}

.play-btn {
  background: #4CAF50;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(76,175,80,0.3);
}

.icon {
  font-size: 48rpx;
  color: #333;
}

.status-group {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.picker-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 48rpx;
}

.value {
  font-size: 28rpx;
  color: #666;
}

.mode-text {
  font-size: 24rpx;
  color: #666;
  margin-top: 4rpx;
}

.no-data {
  text-align: center;
  padding: 48rpx;
  color: #999;
  font-size: 28rpx;
}

/* 修改播放控制组样式 */
.play-controls {
  display: flex;
  align-items: center;
  gap: 32rpx;
  flex: 1;
  justify-content: center;
}

.control-group {
  min-width: 120rpx;
  display: flex;
  justify-content: flex-start;
}

.status-group {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}



.repeat-icon {
  font-size: 40rpx;
}

.repeat-text {
  font-size: 32rpx;
}
</style>