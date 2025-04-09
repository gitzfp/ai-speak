<template>
  <view class="speech-recognition">
    <!-- 控制按钮 -->
    <view class="audio-icons-container">
      <view class="audio-icon" v-if="!isRecording">
        <image 
          @tap="startRecording" 
          class="mid-icon" 
          src="https://dingguagua.fun/static/img/pronucation.png" 
        />
      </view>
      <!-- 新增录音停止按钮 -->
      <view v-if="isRecording" class="audio-icon" @tap="stopRecording">
        <view class="stop-button">
          <view class="stop-icon"></view>
        </view>
        <text class="icon-text">停止</text>
      </view>
    </view>
    <!-- 移动后的识别结果展示 -->
      <view v-if="recognitionResults.length > 0" class="result-container">
        <text 
          class="result-text"
        >
          {{ recognitionResults.join(', ') }}
        </text>
         <AudioPlayer :audioUrl="audioUrl" />
      </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue';
import { useSpeechRecognition } from './index';
import utils from '@/utils/utils';
import AudioPlayer from "@/components/AudioPlayer.vue";
import env from "@/config/env";

const props = defineProps({
  language: {
    type: String,
    default: 'zh' // 支持 'zh' 或 'en'
  }
});

const emit = defineEmits(['success', 'result']);

const isRecording = ref(false);
const recognitionResult = ref('');
const audioUrl = ref('');
const recordingTimeout = ref<number | null>(null);

// SDK配置
const sdkConfig = computed(() => ({
  secretid: env.secretid,
  secretkey: env.secretkey,
  appid: "1321827414",
  engine_type: props.language === 'zh' ? '16k_zh' : '16k_en',
  voice_format: 1,
  needvad: 1,
  filter_dirty: 1,
  filter_modal: 1,
  filter_punc: 1,
  convert_num_mode: 1
}));

// 使用语音识别Hook
const {
  start: startSdk,
  stop: stopSdk,
  OnRecognitionStart,
  OnRecognitionResultChange,
  OnRecognitionComplete,
  OnAudioComplete,
  OnError
} = useSpeechRecognition(sdkConfig.value, true);

// 设置回调函数
// 在回调函数设置部分添加以下内容
OnRecognitionStart.value = () => {
  console.log('识别开始');
  isRecording.value = true;
  uni.showToast({
    title: '正在录音中...',
    icon: 'none',
    duration: 2000
  });
};

// 修改识别结果为数组形式
const recognitionResults = ref<string[]>([]);

// 修改OnRecognitionResultChange回调
OnRecognitionResultChange.value = (res: any) => {
  const resultText = res?.result?.voice_text_str || res?.FinalResult?.voice_text_str;
  if (resultText) {
    recognitionResults.value.push(resultText);
    emit('result', resultText);
    console.log('%c识别内容:', 'color: #4CAF50; font-weight: bold', resultText);
  }
};

// 修改startRecording方法，清空历史结果
const startRecording = () => {
  recognitionResults.value = [];
  try {
    recognitionResult.value = '';
    audioUrl.value = '';

    OnRecognitionStart.value = () => {
      console.log('识别器回调触发:', new Date().toISOString());
      isRecording.value = true;
      uni.vibrateShort({ type: 'heavy' });
    };

    // 启动SDK时添加错误捕获
    console.log('开始初始化SDK:', new Date().toISOString());
    isRecording.value = true;
    startSdk(() => {
      console.log('SDK内部回调触发:', new Date().toISOString());
      // 添加状态强制更新
      nextTick(() => isRecording.value = true);
    });

    // 添加错误回调
    OnError.value = (err) => {
      console.error('SDK错误:', err);
      isRecording.value = false;
    };

  } catch (error) {
    console.error('启动异常:', error);
    isRecording.value = false;
  }
};

// 修改回调设置部分
OnRecognitionStart.value = () => {
  console.log('识别开始');
  isRecording.value = true;
  // 添加振动反馈
  uni.vibrateShort({ type: 'heavy' });
  uni.showToast({
    title: '正在录音中...',
    icon: 'none',
    duration: 2000
  });
};


OnError.value = (err: any) => {
  console.error('识别错误:', err);
  uni.showToast({
    title: '识别出错，请重试',
    icon: 'none'
  });
  stopRecording();
};

const handleComplete = (int8Data: any, retry=0) => {
    if(recognitionResults.value.length == 0 && retry < 2) {
      console.log("重试第", retry, "次");
      retry++;
      setTimeout(() => {
        handleComplete(int8Data, retry);
      }, 500);
      return
    };
    console.log('[SpeechRecognition] 完整评测结果，音频数据接收完成', int8Data.byteLength);
    const userId = uni.getStorageSync("user_id");
    utils.processAudioToWAV(int8Data, userId, {word_id: "_message"})
      .then(url => {
        isRecording.value = false;
        audioUrl.value = url;
        // 触发success事件，传递识别结果和音频URL
        emit('success', {
          text: recognitionResults.value.join(', '),
          audioUrl: url
        });
        recognitionResults.value = [];
      })
      .catch(error => {
        console.error('文件上传失败:', error);
        isRecording.value = false;
      }); 
}

// 处理音频数据
OnAudioComplete.value = async (int8Data: Int8Array) => {
   handleComplete(int8Data, 0); 
};


// 停止录音
const stopRecording = () => {
  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
    recordingTimeout.value = null;
  }
  stopSdk();
  isRecording.value = false;
};

// 组件卸载时清理
onUnmounted(() => {
  if (recordingTimeout.value) {
    clearTimeout(recordingTimeout.value);
  }
  stopRecording();
});
</script>

<style scoped>

.speech-recognition {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  height: 100%;
}

.recognition-result-panel {
  width: 100%;
  min-height: 200rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

.result-container {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
}

.result-text {
  font-size: 32rpx;
  color: #333;
  line-height: 1.5;
  margin-right: 20rpx;
  padding: 10rpx 20rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  display: inline-block;
}

.audio-icons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 50rpx;
  gap: 100rpx;
}

.audio-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.mid-icon {
  width: 160rpx;
  height: 160rpx;
}

.mid-text {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.recording-active {
  transform: scale(0.98);
  background-color: #dc3545;
}

.icon-text {
  font-size: 24rpx;
  color: #666;
  margin-top: 18rpx;
}

.stop-button {
  width: 180rpx;
  height: 180rpx;
  background: #dc3545;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 1.5s infinite;
}

.stop-icon {
  width: 30rpx;
  height: 30rpx;
  background: #fff;
  border-radius: 4rpx;
}

@keyframes pulse {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.1); }
  100% { transform: scale(0.95); }
}
</style>