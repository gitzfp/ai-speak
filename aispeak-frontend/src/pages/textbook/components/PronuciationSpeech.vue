<template>
  <view class="pronunciation-speech">
    <!-- 最终结果展示 -->
    <view v-if="finalResult && !hasInvalidScores" class="final-result-panel">
      <view class="score-item">
        <text class="label">准确度：</text>
        <text class="value">{{ `${finalResult.accuracy}%` }}</text>
      </view>
      <view class="score-item">
        <text class="label">流畅度：</text>
        <text class="value">{{ `${finalResult.fluency}%` }}</text>
      </view>
      <view class="score-item">
        <text class="label">完整度：</text>
        <text class="value">{{ `${finalResult.completeness_score}%` }}</text>
      </view>
    </view>
    <view v-if="finalResult && hasInvalidScores" class="final-result-panel">
       <view class="score-item">继续加油喔</view>
    </view>
    <view class="word-scores-container" v-if="finalResult && !hasInvalidScores">
          <view 
            v-for="(word, index) in finalResult.words"
            :key="index" 
            class="word-score-item"
            :class="getScoreClass(word.accuracy_score)"
          >
            <view v-if="word.phones?.length == 0" class="word-text">{{ word.word }}</view>
            <view v-if="word.phones?.length == 0" class="word-score">{{ word.accuracy_score }}</view>
            <view class="word-error-type" v-if="word.error_type !== 'None'">{{ word.error_type }}</view>
            <view class="phones-container">
              <view 
                v-for="(phone, phoneIndex) in word.phones" 
                :key="phoneIndex"
                class="phone-item"
                :class="getScoreClass(phone.accuracy)"
              >
                <text class="phone-text">[{{ phone.phone }}]</text>
                <text class="phone-score">{{ phone.accuracy }}</text>
              </view>
            </view>
          </view>
    
    </view>
    
    <!-- 语音波动动画 -->
    <view v-if="isRecording" class="wave-mask" @tap="stopRecording">
      <view class="countdown-circle"></view>
      <view class="wave-container">
        <view class="wave wave1"></view>
        <view class="wave wave2"></view>
        <view class="wave wave3"></view>
      </view>
    </view>

    <view class="audio-icons-container">
      <view v-if="finalResult?.voice_file" class="audio-icon">
        <image @tap="playbuttonclick" class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
        <Text class="icon-text">标准</Text>
      </view>
      <view class="audio-icon" v-if="!isRecording">
        <image @tap="startLongPress" class="mid-icon" src="https://dingguagua.fun/static/img/pronucation.png" :class="{ 'recording-active': isRecording }" />
        <Text class="mid-text">跟读测评</Text>
      </view>
      <view v-if="finalResult?.voice_file" class="audio-icon">
        <AudioPlayer :audioUrl="finalResult?.voice_file" />
        <Text class="icon-text">我的</Text>
      </view>
    </view>
  </view>
</template>


<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
// 修改导入，使用 Hook 版本
import { useSpeechEvaluation } from '@/components/SpeechEvaluation/index';
import utils from '@/utils/utils'; // 导入上传函数
import AudioPlayer from "@/components/AudioPlayer.vue"
import env from "@/config/env" 
const props = defineProps({
  refObj: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['success']);

const isRecording = ref(false);
// 移除 sdkInstance 变量，因为它将由 hook 管理
// let sdkInstance: any = null;

const currentAudio = ref<any>(null)
// 将 SDK 实例和配置相关的引用改为 ref，以便能够更新它们
const sdkInstance = ref<any>(null);

// 将sdkConfig改为计算属性
const sdkConfig = computed(() => ({
  secretid: env.secretid,
  secretkey: env.secretkey,
  appid: "1321827414",
  ref_text: props.refObj.word,
  sentence_info_enabled: 1,
  server_engine_type: '16k_en',
  eval_mode: props.refObj.word.split(' ').length === 1 ? 7 : 2, // 根据单词数量设置模式
  score_coeff: 1.0
}));

// Add this declaration after other reactive variables
const finalResult = ref<{
  pronunciation_score?: string;
  completeness_score?: string;
  accuracy?: string;
  fluency?: string;
  words?: any;
  voice_file?: string;
} | null>(null);

const realTimeResult = ref<{
  pronunciation_score?: string;
  completeness_score?: string;
  accuracy?: string;
  fluency?: string;
  words?: any;
  voice_file?: string;
} | null>(null);

// 使用 Hook 创建语音评测实例
const { 
  start: startSdk, 
  stop: stopSdk,
  onEvaluationResultChange,
  onEvaluationComplete,
  onAudioComplete
} = useSpeechEvaluation(sdkConfig.value, true);

// 设置回调函数
onEvaluationResultChange.value = (res: any) => {
  console.log('实时评测结果:', res);
  handlePronuciationResult(res, true);
};

onEvaluationComplete.value = (res: any) => {
  console.log('完整评测结果:', res, props.refObj.english);
  handlePronuciationResult(res);
};

onAudioComplete.value = async (int8Data: Int8Array) => {
  console.log('[DEBUG] 完整评测结果，音频数据接收完成', int8Data.byteLength);
  const userId = uni.getStorageSync("user_id")
  utils.processAudioToWAV(int8Data, userId, props.refObj).then(data => {
    isRecording.value = false;
    finalResult.value!.voice_file = data; // 存储录音文件的URL
    emit('success', finalResult.value);
  }).catch(error => {
    console.error('文件上传失败:', error);
    isRecording.value = false;
  });
};

const getScoreClass = (score: number) => {
    if (score >= 90) return 'score-excellent'
    if (score >= 80) return 'score-good'
    if (score >= 60) return 'score-fair'
    return 'score-poor'
}

// 添加计算属性
const hasInvalidScores = computed(() => {
  if (!finalResult.value) return false;
  const scores = [
    parseFloat(finalResult.value.accuracy || '0'),
    parseFloat(finalResult.value.fluency || '0'),
    parseFloat(finalResult.value.completeness_score || '0')
  ];
  return scores.some(score => score <= 0 || score === -100);
});

const handlePronuciationResult = (res: any, isRealTime: boolean = false) => {
    if(res?.result){
      const words = res.result.Words.map((word: any) => ({
          word: word.Word,
          accuracy_score: word.PronAccuracy.toFixed(1),
          error_type: word.MatchTag === 0 ? 'None' : 'Error',
          phones: word.PhoneInfos.map((phone: any) => ({
            phone: phone.Phone,
            accuracy: phone.PronAccuracy.toFixed(1)
          }))
        }));

      const scores = {
        pronunciation_score: res.result.SuggestedScore,
        completeness_score: res.result.PronCompletion * 100,
        accuracy: res.result.PronAccuracy || 0,
        fluency: res.result.PronFluency * 100
      };

      const validResult = {
        pronunciation_score: scores.pronunciation_score.toFixed(1),
        completeness_score: scores.completeness_score.toFixed(1),
        accuracy: scores.accuracy.toFixed(1),
        fluency: scores.fluency.toFixed(1),
        words: words
      };

      if(isRealTime) {
        realTimeResult.value = validResult;
      } else {
        finalResult.value = validResult;
      }
    }
};

// 移除 initSDK 函数，直接使用 hook 提供的 start 方法
// const initSDK = () => { ... }

// 播放录音功能
const playbuttonclick = () => {
  if(!props.refObj?.audio_url) return
  
  // 微信小程序使用 wx.createInnerAudioContext()
  const audio = uni.createInnerAudioContext()
  currentAudio.value = audio
  audio.src = props.refObj.audio_url
  
  // 微信小程序音频事件监听
  audio.onPlay(() => {
    console.log('开始播放')
  })
  
  audio.onError((err) => {
    console.error('播放错误:', err)
    stopCurrentAudio()
  })
  
  // 设置时间范围
  if (props.refObj.audio_start && props.refObj.audio_end) {
    const startTime = props.refObj.audio_start / 1000
    const endTime = props.refObj.audio_end / 1000
    audio.startTime = startTime
    
    audio.onTimeUpdate(() => {
      if (audio.currentTime >= endTime - 0.1) {
        stopCurrentAudio()
      }
    })
  }
  
  audio.play()
}

const stopCurrentAudio = () => {
  // 保持原有代码不变
  if (currentAudio.value) {
    currentAudio.value.pause();
    try {
      currentAudio.value.stop();
      currentAudio.value = null;
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
    currentAudio.value = null;
  }
}

// 添加单词变化监听
watch(() => props.refObj, (newWord) => {
  finalResult.value = null;
  realTimeResult.value = null;
});

const startLongPress = () => {
  uni.$emit('start_recording', { action: 'recording' });
  if(isRecording.value == true){
   stopRecording(); 
  }else{
    startRecording()
  }
};

const recordingTimeout = ref<number | null>(null);

// 初始化 SDK 函数
const initSpeechEvaluation = () => {
  // 如果已经有实例且正在录音，先停止
  if (sdkInstance.value && isRecording.value) {
    stopRecording();
  }
  
  // 使用最新的配置创建 SDK 实例
  const sdk = useSpeechEvaluation(sdkConfig.value, true);
  sdkInstance.value = sdk;

  sdk.onEvaluationStart.value = (res: any) => {
    console.log('评测开始:', res);
    isRecording.value = true;
  };
  
  // 设置回调函数
  sdk.onEvaluationResultChange.value = (res: any) => {
    console.log('实时评测结果:', res);
    handlePronuciationResult(res, true);
  };
  
  sdk.onEvaluationComplete.value = (res: any) => {
    console.log('完整评测结果:', res, props.refObj.english);
    handlePronuciationResult(res);
  };
  
  sdk.onAudioComplete.value = async (int8Data: Int8Array) => {
    // 使用已定义的函数处理音频数据，避免代码重复
    await processAudioData(int8Data);
  };
  
  return sdk;
};

// 提取音频处理逻辑为单独函数，避免代码重复
const processAudioData = async (int8Data: Int8Array) => {
  const userId = uni.getStorageSync("user_id")
  console.log('[DEBUG] 完整评测结果，音频数据接收完成', int8Data.byteLength, userId)
  try {
    let data = await utils.processAudioToWAV(int8Data, userId || 'pronunction', props.refObj)

    if (finalResult.value) {
      finalResult.value.voice_file = data
      emit('success', finalResult.value)
    }
    isRecording.value = false
  } catch (error) {
    console.error('文件上传失败:', error)
    isRecording.value = false
  }
}


// 初始化 SDK
initSpeechEvaluation();

// 监听单词变化，重新初始化 SDK
watch(() => props.refObj.word, () => {
  console.log('单词变化，重新初始化 SDK:', props.refObj.word);
  initSpeechEvaluation();
});

// 修改 startRecording 和 stopRecording 函数，使用当前的 SDK 实例
const startRecording = () => {
  if (!sdkInstance.value) {
    initSpeechEvaluation();
  }
  sdkInstance.value.start();
  finalResult.value = null;
  realTimeResult.value = null;
  
  // 设置定时器以自动停止录音
  const delay = props.refObj.english ? 10000 : 3500;
  recordingTimeout.value = setTimeout(() => {
    if (isRecording.value) {
      stopRecording();
    }
  }, delay) as unknown as number;
};

const stopRecording = (count = 0) => {
  if(realTimeResult.value?.words?.length < props.refObj.word.split(' ').length && count < 3){
    setTimeout(() => {
      stopRecording(count + 1);
    }, 500);
    return
  }
  console.log(realTimeResult.value?.words, '实时录音结果', props.refObj.word.split(' '))
  if (sdkInstance.value) {
    sdkInstance.value.stop();
  }
  isRecording.value = false;
  if (recordingTimeout.value !== null) {
    clearTimeout(recordingTimeout.value);
    recordingTimeout.value = null;
  }
};

// 页面销毁时清除定时器
onUnmounted(() => {
  stopRecording();
});
</script>

<style scoped>
.pronunciation-speech {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative; /* 添加相对定位 */
  height: 100%;
  width: 100%;

}

/* 修改蒙板样式 */
.wave-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200rpx;
  height: 200rpx;
  background: rgba(1, 1, 1, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100; /* 确保蒙板在按钮下方 */
  pointer-events: auto;
  touch-action: manipulation;
}



.recording-active {
  background-color: #dc3545 !important;
  transform: scale(0.98);
}

/* 语音波动动画样式 */
.wave-container {
  position: relative;
  top: auto;
  left: auto;
  transform: none;
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wave {
  width: 10rpx;
  height: 50rpx;
  background: #2b9939;
  margin: 0 5rpx;
  border-radius: 5rpx;
  animation: wave 1s infinite ease-in-out;
}

.wave1 {
  animation-delay: 0s;
}

.wave2 {
  animation-delay: 0.2s;
}

.wave3 {
  animation-delay: 0.4s;
}

@keyframes wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.3);
  }
}

.score-item {
  flex: 1;
  min-width: 30%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx;
  background: #fff;
  border-radius: 8rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05);
}

.label {
  color: #666;
  font-size: 24rpx;
  margin-bottom: 8rpx;
}

.value {
  color: #1890ff;
  font-weight: 500;
  font-size: 32rpx;
}

.final-result-panel {
  display: flex;
  width: 100%;
  background: #fff;
  border-radius: 16rpx;
}

.final-result-panel .score-item {
  display: flex;
  justify-content: space-between;
  margin: 15rpx 0;
  font-size: 30rpx;
}

.final-result-panel .label {
  color: #666;
}

.final-result-panel .value {
  color: #1890ff;
  font-weight: 500;
}

/* 蒙板样式 */
.wave-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 190rpx;
  height: 190rpx;
  background: rgba(1, 1, 1, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100; /* 确保蒙板在按钮下方 */
  pointer-events: auto;
  touch-action: manipulation;
}

/* 倒计时转圈样式 */
.countdown-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4rpx solid #2b9939;
  border-radius: 50%;
  border-top-color: transparent;
  animation: countdown 5s linear forwards;
}

@keyframes countdown {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.word-scores-container {
  display: flex;
  width: 100%;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

.word-score-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx;
  background: #fff;
  border-radius: 8rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05);
}

.word-text {
  color: #666;
  font-size: 24rpx;
}

.word-score {
  color: #1890ff;
  font-weight: 500;
  font-size: 32rpx;
}

.word-error-type {
  color: #ff4d4f;
  font-size: 24rpx;
}
.word-text {
  flex: 1;
  color: #333;
}

.word-score {
  flex: 1;
  text-align: right;
  color: #1890ff;
}

.word-error-type {
  flex: 1;
  text-align: right;
  color: #ff4d4f;
}

.score-excellent {
  background-color: #e6fffb;
}

.score-good {
  background-color: #fffbe6;
}

.score-fair {
  background-color: #fff1f0;
}

.score-poor {
  background-color: #f8d7da;
}

.phones-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin-top: 8rpx;
}

.phone-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  background-color: #f5f5f5;
}

.phone-text {
  font-size: 20rpx;
  color: #666;
}

.phone-score {
  font-size: 18rpx;
  color: #1890ff;
}

.word-error-type {
  color: #ff4d4f;
  font-size: 24rpx;
}
.word-text {
  flex: 1;
  color: #333;
}

.word-score {
  flex: 1;
  text-align: right;
  color: #1890ff;
}

.word-error-type {
  flex: 1;
  text-align: right;
  color: #ff4d4f;
}

.score-excellent {
  background-color: #e6fffb;
}

.score-good {
  background-color: #fffbe6;
}

.score-fair {
  background-color: #fff1f0;
}

.score-poor {
  background-color: #f8d7da;
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

.left-icon {
	width: 38rpx;
	height: 38rpx;
}
.icon-text {
  font-size: 24rpx;
	color: #666;
	margin-top: 18rpx;
}
.mid-icon {
  margin-top: -12rpx;
	width: 60rpx;
	height: 60rpx; 
}
.mid-text {
	font-size: 24rpx;
	color: #666;
	margin-top: 10rpx;
}
  
</style>