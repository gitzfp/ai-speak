<template>
  <view class="pronunciation-speech">
    <!-- 最终结果展示 -->
    <view v-if="finalResult" class="final-result-panel">
      <view class="score-item">
        <text class="label">准确度：</text>
        <text class="value">{{ finalResult.accuracy }}%</text>
      </view>
      <view class="score-item">
        <text class="label">流畅度：</text>
        <text class="value">{{ finalResult.fluency }}%</text>
      </view>
        <view class="score-item">
        <text class="label">完整度：</text>
        <text class="value">{{ finalResult.completeness_score }}%</text>
      </view>
    </view>
    <view class="word-scores-container" v-if="finalResult">
          <view 
            v-for="(word, index) in finalResult.words"
            :key="index" 
            class="word-score-item"
            :class="getScoreClass(word.accuracy_score)"
          >
            <view class="word-text">{{ word.word }}</view>
            <view class="word-score">{{ word.accuracy_score }}</view>
            <view class="word-error-type" v-if="word.error_type !== 'None'">{{ word.error_type }}</view>
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
      <view v-if="finalResult?.voice_file" class="audio-icon left-view">
        <image @tap="playbuttonclick" class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
        <Text>标准</Text>
      </view>
      <view class="audio-icon" v-if="!isRecording">
        <uni-icons @tap="startLongPress" class="uniIcon" type="mic" size="20" color="#fff" :class="{ 'recording-active': isRecording }" />
        <Text>测评</Text>
      </view>
      <view v-if="finalResult?.voice_file" class="audio-icon right-view" aria-disabled="!recordingUrl">
        <AudioPlayer :audioUrl="finalResult?.voice_file" />
        <Text>我的</Text>
      </view>
    </view>
  </view>
</template>


<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import SowNewSocketSdk from './SpeechEvaluation/index';
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
let sdkInstance: any = null;

const currentAudio = ref<any>(null)
// 将sdkConfig改为计算属性
const sdkConfig = computed(() => ({
  secretid: env.secretid,
  secretkey: env.secretkey,
  appid: "1321827414",
  ref_text: props.refObj.word,
  sentence_info_enabled: 1,
  server_engine_type: '16k_en',
  eval_mode: 2,
}));

const getScoreClass = (score: number) => {
    if (score >= 90) return 'score-excellent'
    if (score >= 80) return 'score-good'
    if (score >= 60) return 'score-fair'
    return 'score-poor'
}


const initSDK = () => {
  // 每次初始化使用最新的配置
  sdkInstance = new SowNewSocketSdk(sdkConfig.value, true);
  console.log('SDK配置已更新，当前单词或句子：', props.refObj.word,); 
  sdkInstance.OnEvaluationResultChange = (res: any) => {
      console.log('实时评测结果:', res);
    
    };

  sdkInstance.OnEvaluationComplete = (res: any) => {
    console.log('完整评测结果:', res, props.refObj.english);
    if (res?.result) {
      // 转换 Words 数据格式
      const words = res.result.Words.map((word: any) => ({
        word: word.Word,
        accuracy_score: word.PronAccuracy.toFixed(1), // 保留一位小数
        error_type: word.MatchTag === 0 ? 'None' : 'Error' // 根据 MatchTag 判断错误类型
      }));
  
      finalResult.value = {
        pronunciation_score: res.result.SuggestedScore.toFixed(1),
        completeness_score: (res.result.PronCompletion * 100).toFixed(1),
        accuracy: (res.result.PronAccuracy || 0).toFixed(1),
        fluency: (res.result.PronFluency * 100).toFixed(1),
        words: props.refObj.english ? words : words[0] || null
      };
    }

  };

  sdkInstance.OnAudioComplete = async function(int8Data: Int8Array) {
      console.log('[DEBUG] 音频数据接收完成', int8Data.byteLength);
      const WAV_HEADER_SIZE = 44;
      const buffer = new ArrayBuffer(WAV_HEADER_SIZE + int8Data.length);
      const view = new DataView(buffer);
      // 写入WAV头
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + int8Data.length, true); 
      view.setUint32(8, 0x57415645, false); // "WAVE"
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true); // 子块大小
      view.setUint16(20, 1, true); // PCM格式
      view.setUint16(22, 1, true); // 单声道
      view.setUint32(24, 16000, true); // 采样率
      view.setUint32(28, 32000, true); // 字节率 (16000*2)
      view.setUint16(32, 2, true); // 块对齐
      view.setUint16(34, 16, true); // 位深
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, int8Data.length, true); // 数据大小
      // 合并头和数据
      const wavData = new Uint8Array(buffer);
      wavData.set(int8Data, WAV_HEADER_SIZE);
      // 创建 Blob
      const blob = new Blob([wavData], {type: 'audio/wav'});
      // 生成文件名，去除所有标点符号，可以使用正则表达式来替换标点符号为空字符串。
      const content = props.refObj.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').replace(/\s+/g, '-');
      const ossKey = `recordings/${content}.wav`;
      await utils.uploadFileToOSS(ossKey, blob).then(async response => {
        console.log('文件上传成功:', response);
        const data = await utils.getFileFromOSS(ossKey, false)
        console.log(data, '上传后的链接', ossKey)
        finalResult.value!.voice_file = data; // 存储录音文件的URL
        emit('success', finalResult.value);
      }).catch(error => {
        console.error('文件上传失败:', error);
      });

  }
};

// 播放录音功能
	const playbuttonclick = () => {
		if(!props.refObj?.audio_url)return
		stopCurrentAudio();
		const audio = uni.createInnerAudioContext();
		currentAudio.value = audio;
		audio.src = props.refObj?.audio_url;
	  console.log(
      props.refObj);
		// 设置时间范围
		if (props.refObj.audio_start && props.refObj.audio_end) {

		  const startTime = props.refObj.audio_start / 1000
		  const endTime = props.refObj.audio_end / 1000
		  audio.startTime = startTime
		  // 监听播放进度
		  audio.onTimeUpdate(() => {
		    if (audio.currentTime >= endTime - 0.1) { // 防止浮点误差
		      stopCurrentAudio()  // 处理播放结束
		    }
		  })
		}
		console.log(
      props.refObj, '播放录音功能');
		audio.play();
	}
	const stopCurrentAudio = () => {
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
  if (sdkInstance) {
    console.log('SDK配置已更新：', newWord, sdkConfig.value);
    // 检查当前单词是否与SDK配置中的单词不同
    if (sdkInstance.config.ref_text !== newWord) {
      sdkInstance = new SowNewSocketSdk(sdkConfig.value, true);
    }
  } else {
    // 如果sdkInstance尚未初始化，则初始化
    initSDK();
  }
});
// 长按处理逻辑
const startLongPress = () => {
  if(isRecording.value == true){
   stopRecording(); 
  }else{
    startRecording()
  }
};


const startRecording = () => {
  if (!sdkInstance) initSDK();
  isRecording.value = true;
  finalResult.value = null;
  sdkInstance.start();
  // 设置5秒后自动停止录音
  const delay = props.refObj.english ? 12000 : 3500;
  setTimeout(() => {
    if (isRecording.value) {
      stopRecording();
    }
  }, delay);
};

const stopRecording = () => {
  isRecording.value = false;
  sdkInstance?.stop();
  sdkInstance = null;
};
// Add this declaration after other reactive variables
const finalResult = ref<{
  pronunciation_score?: string;
  completeness_score?: string;
  accuracy?: string;
  fluency?: string;
  words?: any;
  voice_file?: string;
} | null>(null);
</script>

<style scoped>
.pronunciation-speech {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative; /* 添加相对定位 */
  width: 100%;
  .uniIcon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b9939;
    width: 70rpx;
    height: 70rpx;
    border-radius: 35rpx;
    position: relative; /* 添加相对定位 */
    z-index: 1; /* 确保按钮在蒙板上方 */
    margin-top: 40rpx;
  }
}

/* 修改蒙板样式 */
.wave-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300rpx;
  height: 300rpx;
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
  width: 100rpx;
  height: 100rpx;
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
  width: 170rpx;
  height: 170rpx;
  background: rgba(1, 1, 1, 0.7);
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

.pronunciation-speech {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  .uniIcon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b9939;
    width: 70rpx;
    height: 70rpx;
    border-radius: 35rpx;
    position: relative;
    z-index: 1;
    margin-top: 40rpx;
  }
}

.audio-icons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 20rpx;
  gap: 100rpx;
}

.audio-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.left-view {
  margin-top: 36rpx;
  width: 100rpx;
  height: 100rpx;
  .left-icon {
    width: 38rpx;
    height: 38rpx;
  }
}

.right-view {
  margin-top: 40rpx;
}
</style>