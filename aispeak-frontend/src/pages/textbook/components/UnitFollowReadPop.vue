<template>
  <!-- 蒙版 -->
  <view v-if="isModalVisible" class="modal-mask" @click="handleMaskClick"></view>
  
  <!-- 弹窗 -->
  <view v-if="isModalVisible" class="modal-container">
    <view class="modal-content">
      <view class="follow-reading">
        <view class="result-selection">
          <view class="result-header">
            <view class="result-score">评分: {{ pronunciationResult?.pronunciation_score }}</view>
            <view class="result-tips" @click="toggleScoreTips">评估分数 <span class="toggle-icon">{{ showScoreTips ? '▲' : '▼' }}</span></view>
            
            <!-- 分数解读提示 -->
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
          <view class="result-detail" v-if="pronunciationResult">
            <view class="result-text">{{ pronunciationResult?.content }}</view>
            <view class="result-dimensions">
              <view class="dimension-item" :class="getScoreClass(pronunciationResult.fluency_score)">流畅度: {{ pronunciationResult.fluency_score }}</view>
              <view class="dimension-item" :class="getScoreClass(pronunciationResult.accuracy_score)">准确度: {{ pronunciationResult.accuracy_score }}</view>
              <view class="dimension-item" :class="getScoreClass(pronunciationResult.completeness_score)">完整度: {{ pronunciationResult.completeness_score }}</view>
            </view>
            
            <!-- 单词得分显示部分 -->
            <view class="word-scores-container" v-if="pronunciationResult?.words && pronunciationResult.words.length > 0">
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
          
          <!-- 操作按钮区域 -->
          <view class="action-buttons">
            <!-- 播放录音按钮 -->
            <view v-if="voiceFileName" class="play-recording-button">
              我的发音
              <AudioPlayer :audioUrl="voiceFileUrl" />
            </view>
            <!-- 关闭按钮 -->
            <view class="reassess-button" @click="resetAll">关闭</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits, watch } from 'vue'
import AudioPlayer from "@/components/AudioPlayer.vue"
import utils from "@/utils/utils"

const emits = defineEmits(['reevaluation']);

const props = defineProps({
  optionSentence: {
    type: Object,
    default: () => ({})
  }
})

const pronunciationResult = ref(null)
const showScoreTips = ref(false)
const voiceFileName = ref(null)
const isModalVisible = ref(false)

// 计算录音文件URL
const voiceFileUrl = computed(() => {
  if (!voiceFileName.value) return ''
  return utils.getVoiceFileUrl(voiceFileName.value)
})

const toggleScoreTips = () => {
  showScoreTips.value = !showScoreTips.value
}

// 加载缓存逻辑
onMounted(() => {
  if (props.optionSentence && props.optionSentence.json_data && props.optionSentence.json_data.length > 20) {
    pronunciationResult.value = JSON.parse(props.optionSentence.json_data)
    voiceFileName.value = props.optionSentence.voice_file
  }
})

// 监听 optionSentence 的变化
watch(
  () => props.optionSentence,
  (newVal) => {
    if (newVal && Object.keys(newVal).length > 0) {
      if (newVal.json_data && newVal.json_datalength > 20) {
        pronunciationResult.value = JSON.parse(newVal.json_data)
        voiceFileName.value = newVal.voice_file
      }
    }
  },
  { deep: true }
)

const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-fair'
  return 'score-poor'
}

const resetAll = () => {
  pronunciationResult.value = null
  closeModal()
  emits("reevaluation")
}

const handleMaskClick = () => {
  resetAll()
}

// 打开弹窗
const openModal = () => {
  isModalVisible.value = true
}

// 关闭弹窗
const closeModal = () => {
  isModalVisible.value = false
}

defineExpose({
	openModal,
	closeModal
});
</script>

<style scoped>
/* 蒙版样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 弹窗容器样式 */
.modal-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  width: 90%;
  max-width: 600rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  max-height: 40vh;
  overflow-y: auto
  
}

/* 弹窗内容样式 */
.modal-content {
  padding: 20rpx;
}

/* 结果头部样式 */
.result-header {
  text-align: center;
  margin-bottom: 20rpx;
}

.result-score {
  font-size: 48rpx;
  font-weight: bold;
  color: #007bff;
}

.result-tips {
  font-size: 24rpx;
  color: #999;
  margin-top: 16rpx;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon {
  margin-left: 10rpx;
  font-size: 20rpx;
}

/* 分数解读提示样式 */
.score-tips-container {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 10rpx;
  font-size: 20rpx;
  text-align: left;
}

.score-tips-section {
  margin-bottom: 20rpx;
}

.score-tips-title {
  font-weight: bold;
  margin-bottom: 10rpx;
}

.score-tips-item {
  margin-bottom: 6rpx;
  padding: 6rpx 10rpx;
  border-radius: 6rpx;
}

/* 结果详情样式 */
.result-detail {
  border-top: 1rpx solid #eee;
/*  padding: 20rpx 22rpx */;
}

.result-text {
  color: #ff4444;
  font-size: 20rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.result-dimensions {
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: #666;
  font-size: 24rpx;
  margin-bottom: 30rpx;
}

/* 单词得分样式 */
.word-scores-container {
  margin-top: 30rpx;
  border-top: 1rpx solid #eee;
  padding-top: 30rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  /* background-color: red; */
}

.word-score-item {
  border-radius: 12rpx;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120rpx;
  margin: 10rpx;
  padding: 10rpx;
}

.word-text {
  font-weight: bold;
  margin-bottom: 10rpx;
}

.word-score {
  font-size: 36rpx;
  font-weight: bold;
}

.word-error-type {
  font-size: 24rpx;
  color: #ff4444;
  margin-top: 10rpx;
}

/* 分数等级样式 */
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

/* 操作按钮区域样式 */
.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  margin-top: 30rpx;
  gap: 30rpx;
}

.play-recording-button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: #f0f8ff;
  padding: 24rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
}

.reassess-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 30rpx;
  background-color: #007bff;
  color: #fff;
  text-align: center;
  border-radius: 16rpx;
  cursor: pointer;
}
</style>