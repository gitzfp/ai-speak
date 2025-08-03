<template>
  <view class="simple-audio-button" @click="togglePlay" v-if="audioUrl" :data-size="size">
    <image 
      v-if="!isPlaying" 
      class="audio-icon" 
      src="https://dingguagua.fun/static/voice_play.png" 
      mode="aspectFit"
    />
    <image 
      v-else 
      class="audio-icon" 
      src="https://dingguagua.fun/static/voice_playing.gif" 
      mode="aspectFit"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, onMounted } from 'vue';

// Props
interface Props {
  audioUrl: string;
  playIcon?: string;
  pauseIcon?: string;
  size?: 'small' | 'medium' | 'large';
  startTime?: number; // 开始时间（秒）
  endTime?: number; // 结束时间（秒）
  autoPlay?: boolean; // 是否自动播放
}

const props = withDefaults(defineProps<Props>(), {
  playIcon: '🔊',
  pauseIcon: '⏸️',
  size: 'medium',
  autoPlay: false
});

// Emits
const emit = defineEmits<{
  playStart: [];
  playEnd: [];
  error: [error: any];
}>();

// State
const isPlaying = ref(false);
let audio: any = null;

// Methods
const play = () => {
  if (!props.audioUrl) return;
  
  // 停止其他音频
  uni.$emit('stopAllAudio');
  
  // 创建新的音频上下文
  audio = uni.createInnerAudioContext();
  audio.src = props.audioUrl;
  
  // 设置开始时间
  if (props.startTime !== undefined && props.startTime >= 0) {
    audio.startTime = props.startTime;
  }
  
  // 设置事件监听
  audio.onPlay(() => {
    isPlaying.value = true;
    emit('playStart');
  });
  
  // 如果设置了结束时间，监听播放进度
  if (props.endTime !== undefined && props.endTime > 0) {
    audio.onTimeUpdate(() => {
      if (audio.currentTime >= props.endTime - 0.1) { // 防止浮点误差
        stop(); // 到达结束时间，停止播放
      }
    });
  }
  
  audio.onEnded(() => {
    isPlaying.value = false;
    emit('playEnd');
    destroyAudio();
  });
  
  audio.onError((error: any) => {
    console.error('音频播放失败:', error);
    isPlaying.value = false;
    emit('error', error);
    uni.showToast({ 
      title: '播放失败', 
      icon: 'none' 
    });
    destroyAudio();
  });
  
  // 开始播放
  audio.play();
};

const stop = () => {
  if (audio) {
    audio.stop();
    destroyAudio();
    isPlaying.value = false;
  }
};

const togglePlay = () => {
  if (isPlaying.value) {
    stop();
  } else {
    play();
  }
};

const destroyAudio = () => {
  if (audio) {
    audio.destroy();
    audio = null;
  }
};

// 监听停止所有音频事件
uni.$on('stopAllAudio', () => {
  if (isPlaying.value) {
    stop();
  }
});

// 监听 audioUrl 变化
watch(() => props.audioUrl, (newUrl, oldUrl) => {
  if (newUrl !== oldUrl) {
    if (isPlaying.value) {
      stop();
    }
    // 如果设置了自动播放，URL变化时自动播放新的音频
    if (props.autoPlay && newUrl) {
      setTimeout(() => {
        play();
      }, 100); // 小延迟确保组件已更新
    }
  }
});

// 组件挂载时自动播放
onMounted(() => {
  if (props.autoPlay && props.audioUrl) {
    setTimeout(() => {
      play();
    }, 100);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  destroyAudio();
  uni.$off('stopAllAudio');
});

// 暴露方法
defineExpose({
  play,
  stop,
  togglePlay,
  isPlaying
});
</script>

<style scoped lang="less">
.simple-audio-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx;
  border-radius: 8rpx;
  transition: all 0.2s ease;
  
  &:active {
    opacity: 0.7;
    transform: scale(0.95);
  }
  
  .audio-icon {
    display: block;
  }
  
  &[data-size="small"] .audio-icon {
    width: 28rpx;
    height: 28rpx;
  }
  
  &[data-size="medium"] .audio-icon {
    width: 36rpx;
    height: 36rpx;
  }
  
  &[data-size="large"] .audio-icon {
    width: 44rpx;
    height: 44rpx;
  }
}
</style>