<template>
    <view v-if="showAssessSelection" class="assess-popup">
        <!--测评 蒙版 -->
        <view class="asmask" @click="handleMaskClick"></view>

        <!-- 录音选择弹窗 -->
        <view v-if="currentStep === 'select'" class="assess-selection">
        <view>
            <view
            v-for="(option, index) in repeatOptions"
            :key="index"
            class="assess-option"
            :class="{ 'assess-option-active': index === assessStartIndex }"
            @click="handleAssessSelection(index)"
            >
                  <view class="assess-options-item">
                        {{ option.trackText }}
                          <AudioPlayer
                  :audioUrl="option?.audioUrl"/>
                  </view>
                  <!-- 预留跟读按钮位置 -->
                  <FollowReading 
                    :sentence="option.trackText"
                  />
            </view>
        </view>
        </view>
    </view>
    
</template>
<script setup>
import { ref, defineEmits } from "vue"
import FollowReading from './FollowReading.vue' // 导入新组件
import AudioPlayer from '@/components/AudioPlayer.vue'
const emit = defineEmits()

const props = defineProps({
  repeatOptions: {
    type: Array,
    default: () => [],
  },
  showAssessSelection: {
    type: Boolean,
    default: false,
  },
})

const currentStep = ref('select') // 测评 步骤状态：select/result
const assessStartIndex = ref(null) //测评 选中的段落索引
const initPronunciation = {
  accuracy_score: 0,
  completeness_score: 0,
  fluency_score: 0,
  pronunciation_score: 0,
  content: ''
}
const pronunciationResult = ref(initPronunciation)

//-----测评用的方法-----开始------
// 方法
const handleMaskClick = () => {
    if (currentStep.value === "result") {
      // 如果当前是结果页，点击蒙版返回录音页
      currentStep.value = "select";
      assessStartIndex.value = null; // 重置选择
      pronunciationResult.value = initPronunciation
    } else if (currentStep.value === "select") {
      // 如果当前是录音页，点击蒙版关闭弹窗
      emit("assessPopupHide")
      assessStartIndex.value = null; // 重置选择
      pronunciationResult.value = initPronunciation
    }
    
  };
  const resetAll = () => {
    emit("assessPopupHide")
      assessStartIndex.value = null; // 重置选择
      pronunciationResult.value = initPronunciation
  }
  const handleAssessSelection = (index) => {
    assessStartIndex.value = index;
  }

</script>

<style>



/* 测评蒙版样式 */
.asmask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明黑色 */
  z-index: 999; /* 确保蒙版在最上层 */
}

/* 录音选择弹窗样式 */
.assess-selection {
  position: fixed;
  overflow: scroll;
  bottom: 0;
  left: 0;
  width: 100%;
  max-height: 80%;
  background-color: #fff;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  padding: 20px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000; /* 确保弹窗在蒙版之上 */
  box-sizing: border-box; /* 确保内边距不影响宽度 */
}

.assess-header {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
}

.assess-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding: 0 16px; /* 添加内边距，确保内容不贴边 */
}

.assess-options-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assess-option {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.assess-option-active {
  border-color: #007bff;
}


.long-press-button {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%; /* 按钮宽度占满容器 */
}

.long-press-button:hover {
  background-color: #0056b3;
}



.result-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0 16px; /* 添加内边距，确保按钮不贴边 */
}

.result-button {
  flex: 1;
  margin: 0 5px;
  border: 1px solid #007bff;
  border-radius: 5px;
  background: none;
  color: #007bff;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.result-button:last-child {
  background-color: #007bff;
  color: white;
}

.result-button:hover {
  background-color: #0056b3;
  color: white;
}
/* 关闭按钮样式 */
.close-button {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}
/* 返回按钮样式 */
.back-button {
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
  padding: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite, pulse 2s ease-in-out infinite;
}

.loading-text {
  margin-top: 15px;
  color: #666;
  font-size: 14px;
  animation: fadeInOut 2s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}

@keyframes fadeInOut {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
.word-details {
    margin-top: 20px;
    padding: 10px;
    border-top: 1px solid #eee;
    max-height: 200px; /* 设置最大高度 */
    overflow-y: auto; /* 添加垂直滚动 */
    -webkit-overflow-scrolling: touch; /* 在iOS上支持惯性滚动 */
}

.word-item {
    display: flex;
    align-items: center;
    padding: 8px;
    margin: 5px 0;
    border-radius: 4px;
    background-color: #f8f9fa;
}

.word-text {
    flex: 1;
    font-weight: 500;
}

.word-score {
    margin: 0 10px;
    color: #007bff;
}

.word-error-type {
    color: #dc3545;
    font-size: 12px;
    padding: 2px 6px;
    background-color: #fff;
    border: 1px solid #dc3545;
    border-radius: 3px;
}

.word-error {
    background-color: #fff3f3;
    border: 1px solid #ffebeb;
}

.dimension-item {
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.score-excellent {
    color: #28a745;
    background-color: rgba(40, 167, 69, 0.1);
}

.score-good {
    color: #007bff;
    background-color: rgba(0, 123, 255, 0.1);
}

.score-fair {
    color: #ffc107;
    background-color: rgba(255, 193, 7, 0.1);
}

.score-poor {
    color: #dc3545;
    background-color: rgba(220, 53, 69, 0.1);
}

.word-item.score-excellent {
    border-left: 3px solid #28a745;
}

.word-item.score-good {
    border-left: 3px solid #007bff;
}

.word-item.score-fair {
    border-left: 3px solid #ffc107;
}

.word-item.score-poor {
    border-left: 3px solid #dc3545;
}
</style>