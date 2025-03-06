<template>
  <view class="follow-reading">
    <view v-if="sentence && currentStep === 'select'" class="assess-actions">
      <speech @success="submitRecording"></speech>
    </view>
    <view v-if="currentStep === 'submiting'" class="result-selection">
      <!-- 关闭按钮 -->
      <view class="close-button" @click="resetAll">×</view>
      <view class="result-header">发音分析中...</view>
      <view class="result-detail">
        <view class="result-dimensions">
          <view class="loading-spinner result-text"></view>
        </view>
      </view>
    </view>
    <view v-if="currentStep === 'result'" class="result-selection">
      <view class="result-header">
        <view class="result-score">评分: {{ pronunciationResult.pronunciation_score }}</view>
        <view class="result-tips" @click="toggleScoreTips">评估分数 <span class="toggle-icon">{{ showScoreTips ? '▲' : '▼' }}</span></view>
        
        <!-- 添加分数解读提示 -->
        <view v-if="showScoreTips" class="score-tips-container">
          <view class="score-tips-section">
            <view class="score-tips-title">分数等级:</view>
            <view class="score-tips-item score-excellent">优秀 (≥90): 发音非常标准，几乎没有错误</view>
            <view class="score-tips-item score-good">良好 (≥80): 发音良好，有少量错误</view>
            <view class="score-tips-item score-fair">一般 (≥60): 发音基本可以理解，有明显错误</view>
            <view class="score-tips-item score-poor">需改进(小于60)发音存在较多问题，需要加强练习</view>
          </view>
          <view class="score-tips-section">
            <view class="score-tips-title">评分维度:</view>
            <view class="score-tips-item">准确度: 发音是否正确，音素发音是否标准</view>
            <view class="score-tips-item">流利度: 发音是否流利，语速和停顿是否自然</view>
            <view class="score-tips-item">完整度: 内容是否读取完整，是否有遗漏或添加</view>
          </view>
        </view>
      </view>
      <view class="result-detail">
        <view class="result-text">{{ pronunciationResult.content }}</view>
        <view class="result-dimensions">
          <view class="dimension-item" :class="getScoreClass(pronunciationResult.fluency_score)">流畅度: {{ pronunciationResult.fluency_score }}</view>
          <view class="dimension-item" :class="getScoreClass(pronunciationResult.accuracy_score)">准确度: {{ pronunciationResult.accuracy_score }}</view>
          <view class="dimension-item" :class="getScoreClass(pronunciationResult.completeness_score)">完整度: {{ pronunciationResult.completeness_score }}</view>
        </view>
        
        <!-- 添加单词得分显示部分 -->
        <view class="word-scores-container" v-if="pronunciationResult.words && pronunciationResult.words.length > 0">
            <view 
              v-for="(word, index) in pronunciationResult.words" 
              :key="index" 
              class="word-score-item"
              :class="getScoreClass(word.accuracy_score)"
            >
              <view class="word-text">{{ word.word }}</view>
              <view class="word-score">{{ word.accuracy_score }}</view>
              <view class="word-error-type" v-if="word.error_type !== 'None'">{{ word.error_type }}</view>
            </view>
        </view>
      </view>
      
      <!-- 添加操作按钮区域 -->
      <view class="action-buttons">
        <!-- 播放录音按钮 -->
        <view v-if="voiceFileName" class="play-recording-button">
          我的发音
          <AudioPlayer :audioUrl="voiceFileUrl" />
        </view>
        <!-- 重新测评按钮 -->
        <view class="reassess-button" @click="resetAll">重新测评</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import chatRequest from "@/api/chat"
import Speech from "./PronuciationSpeech.vue"
import AudioPlayer from "@/components/AudioPlayer.vue"
import utils from "@/utils/utils"

const props = defineProps({
  sentence: String
})

const currentStep = ref('select') // 新增步骤状态
const pronunciationResult = ref(null)
const showScoreTips = ref(false) // 添加控制分数解读显示的状态
const voiceFileName = ref(null) // 存储录音文件名

// 计算录音文件URL
const voiceFileUrl = computed(() => {
  if (!voiceFileName.value) return ''
  return utils.getVoiceFileUrl(voiceFileName.value)
})

const toggleScoreTips = () => {
  showScoreTips.value = !showScoreTips.value
}

const submitRecording = (voice) => {
  console.log(voice, "录音对象")
  currentStep.value = 'submiting' // 切换到正在测评状态
  voiceFileName.value = voice.fileName // 保存录音文件名
  
  chatRequest
    .pronunciationByFileInvoke({ file_name: voice.fileName, content: props.sentence })
    .then((data) => {
      pronunciationResult.value = data.data
      currentStep.value = 'result' // 切换到结果状态
    })
}

const getScoreClass = (score) => {
    if (score >= 90) return 'score-excellent'
    if (score >= 80) return 'score-good'
    if (score >= 60) return 'score-fair'
    return 'score-poor'
}

const resetAll = () => {
  currentStep.value = 'select'
  pronunciationResult.value = null
  // 不重置voiceFileName，这样用户可以在重新测评时仍然播放上一次的录音
}
</script>

<style scoped>
.assess-actions {
  display: flex;
  justify-content: center;
}

.follow-reading {
  padding: 10px;
}

.close-button {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner {
  width: 45px;
  height: 45px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.result-selection {
  width: 100%;
  background-color: #fff;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  box-sizing: border-box;
  padding-bottom: 10px;
}

.result-header {
  text-align: center;
  margin-bottom: 20px;
}

.result-score {
  font-size: 48px;
  font-weight: bold;
  color: #007bff;
}

.result-label {
  font-size: 16px;
  color: #666;
}

.result-tips {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon {
  margin-left: 5px;
  font-size: 10px;
}

/* 添加分数解读提示样式 */
.score-tips-container {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  font-size: 12px;
  text-align: left;
}

.score-tips-section {
  margin-bottom: 10px;
}

.score-tips-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.score-tips-item {
  margin-bottom: 3px;
  padding: 3px 5px;
  border-radius: 3px;
}

.result-detail {
  border-top: 1px solid #eee;
  padding: 15px 16px;
}

.result-text {
  color: #ff4444;
  font-size: 14px;
  margin-bottom: 12px;
  text-align: center;
}

.result-dimensions {
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.reassess-button {
  padding: 10px 10px;
  margin: 10px 20px;
  background-color: #007bff;
  color: #fff;
  text-align: center;
  border-radius: 5px;
  cursor: pointer;
}

/* 添加单词得分相关样式 */
.word-scores-container {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.word-scores-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.word-scores-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.word-score-item {
  border-radius: 6px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.word-text {
  font-weight: bold;
  margin-bottom: 5px;
}

.word-score {
  font-size: 18px;
  font-weight: bold;
}

.word-error-type {
  font-size: 12px;
  color: #ff4444;
  margin-top: 5px;
}

.score-excellent {
  background-color: #e6f7e6;
  color: #28a745;
}

.score-good {
  background-color: #e6f3ff;
  color: #007bff;
}

.score-fair {
  background-color: #fff3cd;
  color: #ffc107;
}

.score-poor {
  background-color: #f8d7da;
  color: #dc3545;
}

/* 添加操作按钮区域样式 */
.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  margin-top: 15px;
  gap: 15px;
}

.play-recording-button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: #f0f8ff;
  padding: 12px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.play-recording-button:active {
  transform: scale(0.98);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.play-icon-text {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.play-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.play-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.reassess-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 15px;
  background-color: #007bff;
  color: #fff;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  margin: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.reassess-button:active {
  transform: scale(0.98);
  background-color: #0069d9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.reassess-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}
</style>