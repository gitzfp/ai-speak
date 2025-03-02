<template>
  <view class="follow-reading">
    <view v-if="sentence && currentStep === 'select'" class="assess-actions">
      <speech @success="submitRecording"></speech>
    </view>
    <view v-if="currentStep === 'submiting'" class="result-selection">
      <!-- 关闭按钮 -->
      <view class="close-button" @click="resetAll">×</view>
      <view class="result-header">评估中</view>
      <view class="result-detail">
        <view class="result-dimensions">
          <view class="loading-spinner result-text"></view>
          <view class="loading-text">正在分析您的发音...</view>
        </view>
      </view>
    </view>
    <view v-if="currentStep === 'result'" class="result-selection">
      <view class="result-header">
        <view class="result-score">评分: {{ pronunciationResult.pronunciation_score }}</view>
        <view class="result-label">评估分数</view>
        <view class="result-tips">分数解读</view>
      </view>
      <view class="result-detail">
        <view class="result-text">{{ pronunciationResult.content }}</view>
        <view class="result-dimensions">
          <view class="dimension-item" :class="getScoreClass(pronunciationResult.fluency_score)">流畅度: {{ pronunciationResult.fluency_score }}</view>
          <view class="dimension-item" :class="getScoreClass(pronunciationResult.accuracy_score)">准确度: {{ pronunciationResult.accuracy_score }}</view>
          <view class="dimension-item" :class="getScoreClass(pronunciationResult.completeness_score)">完整度: {{ pronunciationResult.completeness_score }}</view>
        </view>
      </view>
      <!-- 新增重新测评按钮 -->
      <view class="reassess-button" @click="resetAll">重新测评</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import chatRequest from "@/api/chat"
import Speech from "./PronuciationSpeech.vue"

const props = defineProps({
  sentence: String
})

const currentStep = ref('select') // 新增步骤状态
const pronunciationResult = ref(null)

const submitRecording = (voice) => {
  console.log(voice, "录音对象")
  currentStep.value = 'submiting' // 切换到正在测评状态
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
  width: 20px;
  height: 20px;
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
  padding: 20px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  box-sizing: border-box;
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
}
.reassess-button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  text-align: center;
  border-radius: 5px;
  cursor: pointer;
}
</style>