<template>
    <view v-if="showAssessSelection">
        <!--测评 蒙版 -->
        <view class="asmask" @click="handleMaskClick"></view>

        <!-- 录音选择弹窗 -->
        <view v-if="currentStep === 'select'" class="assess-selection">
        <!-- 关闭按钮 -->
        <view class="close-button" @click="resetAll">×</view>
        <view class="assess-header">选择录音段落</view>
        <view class="assess-options">
            <view
            v-for="(option, index) in repeatOptions"
            :key="index"
            class="assess-option"
            :class="{ 'assess-option-active': index === assessStartIndex }"
            @click="handleAssessSelection(index)"
            >
            {{ option }}
            </view>
        </view>
        <!-- 预留跟读按钮位置 -->
        <view class="assess-actions-placeholder">
            <view v-if="assessStartIndex !== null" class="assess-actions">
            <speech  @success="submitRecording"></speech>
            </view>
        </view>
        </view>

        <!-- 测评结果弹窗 -->
        <view v-if="currentStep === 'result'" class="result-selection">
        <!-- 返回按钮 -->
        <view class="back-button" @click="handleReturn">←</view>
        <view class="result-header">
            <view class="result-score">{{ pronunciationResult.pronunciation_score }}</view>
            <view class="result-label">评估分数</view>
            <view class="result-tips">分数解读 ①</view>
        </view>
        <view class="result-detail">
            <view class="result-text">{{ pronunciationResult.content }}</view>
            <view class="result-dimensions">
            <view>流畅度 {{ pronunciationResult.fluency_score }}</view>
            <view>准确度 {{ pronunciationResult.accuracy_score }}</view>
            <view>完整度 {{ pronunciationResult.completeness_score }}</view>
            </view>
        </view>

        <view class="result-actions">
            <button class="result-button" @click="handleReturn">返回</button>
            <button class="result-button" @click="handleRetest">再测一次</button>
        </view>
        </view>
    </view>
    
</template>
<script setup>
import { ref, defineEmits, onMounted } from "vue"
import Speech from "./PronuciationSpeech.vue"
import chatRequest from "@/api/chat";

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
const isRecording = ref(false) //测评 是否正在录音
const initPronunciation = {
  accuracy_score: 0,
  completeness_score: 0,
  fluency_score: 0,
  pronunciation_score: 0,
  content: ''
}
const pronunciationResult = ref(initPronunciation)
//录音用的对象
const recorder = ref({
  start: false,
  processing: false,
  completed: false,
  voiceFileName: null,
  remainingTime: 0,
})


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

  const submitRecording = (voice) => {
    console.log(voice, "录音对象")
    chatRequest
      .pronunciationByFileInvoke({ file_name: voice.fileName, content: props.repeatOptions[assessStartIndex.value]})
      .then((data) => {
        pronunciationResult.value = data.data;
      }).finally(() => {
      });
      currentStep.value = "result"; // 切换到结果页
    }
    const handleReturn = () => {
      currentStep.value = "select"; // 返回选择页
      assessStartIndex.value = null; // 重置选择
      pronunciationResult.value = initPronunciation
    }
    const handleRetest = () => {
      currentStep.value = "select"; // 返回选择页
      // assessStartIndex.value = null; // 重置选择
      pronunciationResult.value = initPronunciation
    }

  //-----测评用的方法-----结束------


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
  bottom: 0;
  left: 0;
  width: 100%;
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

.assess-option {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.assess-option-active {
  background-color: #007bff;
  color: #fff;
  border-color: #007bff;
}

/* 预留跟读按钮位置 */
.assess-actions-placeholder {
  height: 60px; /* 预留高度 */
  margin-top: 20px;
  padding: 0 16px; /* 添加内边距，确保按钮不贴边 */
}

.assess-actions {
  display: flex;
  justify-content: center;
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

/* 测评结果弹窗样式 */
.result-selection {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  padding: 20px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  box-sizing: border-box; /* 确保内边距不影响宽度 */
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
  padding: 15px 16px; /* 添加内边距，确保内容不贴边 */
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
  color: #666;
  font-size: 14px;
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
  padding: 10px;
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
</style>