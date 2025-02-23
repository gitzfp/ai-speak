<template>
    <view class="modal" v-if="isModalVisible" @tap="hideEvaluationModal">
        <view  class="modal-content" :class="{ 'modal-content-active': currentStep === 'select' }" @tap.stop>
            <view class="modal-title">发音测评</view>
            <view class="modal-body">
                {{ currentWord.word }}
            </view>
            <!-- 预留跟读按钮位置 -->
            <view class="assess-actions-placeholder">
                <view class="assess-actions">
                <speech  @success="submitRecording"></speech>
                </view>
            </view>
            <view class="modal-footer">
                <button @tap.stop="hideEvaluationModal">关闭</button>
            </view>
        </view>
		
		<view v-if="currentStep === 'submiting'" class="assess-selection" @tap.stop>
		  <!-- 关闭按钮 -->
		  <view class="close-button" @tap.stop="resetAll">×</view>
		  <view class="assess-header">正在评估</view>
		  <view class="assess-options">
		    <view class="loading-container">
		      <view class="loading-spinner"></view>
		      <view class="loading-text">正在分析您的发音...</view>
		    </view>
		  </view>
		</view>
		<!-- 测评结果弹窗 -->
		<view v-if="currentStep === 'result'" class="result-selection" @tap.stop>
		<!-- 返回按钮 -->
		<view class="back-button" @tap.stop="handleReturn">←</view>
		<view class="result-header">
		    <view class="result-score">{{ pronunciationResult.pronunciation_score }}</view>
		    <view class="result-label">评估分数</view>
		    <view class="result-tips">分数解读 ①</view>
		</view>
		<view class="result-detail">
		    <view class="result-text">{{ pronunciationResult.content }}</view>
		    <view class="result-dimensions">
		        <view class="dimension-item" :class="getScoreClass(pronunciationResult.fluency_score)">
		            流畅度 {{ pronunciationResult.fluency_score }}
		        </view>
		        <view class="dimension-item" :class="getScoreClass(pronunciationResult.accuracy_score)">
		            准确度 {{ pronunciationResult.accuracy_score }}
		        </view>
		        <view class="dimension-item" :class="getScoreClass(pronunciationResult.completeness_score)">
		            完整度 {{ pronunciationResult.completeness_score }}
		        </view>
		    </view>
		    <!-- 单词评分详情 -->
		    <view class="word-details">
		        <view 
		            v-for="(word, index) in pronunciationResult.words" 
		            :key="index"
		            class="word-item"
		            :class="[
		                {'word-error': word.error_type !== 'None'},
		                getScoreClass(word.accuracy_score)
		            ]"
		        >
		            <view class="word-text">{{ word.word }}</view>
		            <view class="word-score">{{ word.accuracy_score }}分</view>
		            <view v-if="word.error_type !== 'None'" class="word-error-type">
		                {{ word.error_type === 'Omission' ? '遗漏' : word.error_type }}
		            </view>
		        </view>
		    <view class="word-phonetic-mark">
				<view class="word-phonetic-item" v-for="(phonetic, index) in phonemes" :key="index">
					<view class="letter">{{phonetic.phoneme}}</view>
					<view class="symbol">{{phonetic.accuracy_score}}</view>
				</view>
			</view>
				
			</view>
		</view>
		
		<view class="result-actions">
		    <button class="result-button" @tap.stop="handleReturn">返回</button>
		    <button class="result-button" @tap.stop="handleRetest">再测一次</button>
		</view>
		</view>
		
    </view>
</template>

<script setup>

    import { ref,defineEmits,computed} from 'vue';
    import Speech from "./components/PronuciationSpeech.vue"
	import chatRequest from "@/api/chat";

    const props = defineProps({
        currentWord: {
        type: Object, 
        required: true
         },
    })

    const isModalVisible = ref(false);
	
	const currentStep = ref('select') // 测评 步骤状态：select/result
	const initPronunciation = {
	  accuracy_score: 0,
	  completeness_score: 0,
	  fluency_score: 0,
	  pronunciation_score: 0,
	  content: '',
	  words:[]
	}
	const pronunciationResult = ref(initPronunciation)
	const getScoreClass = (score) => {
	    if (score >= 90) return 'score-excellent'
	    if (score >= 80) return 'score-good'
	    if (score >= 60) return 'score-fair'
	    return 'score-poor'
	}
	
	
    const emit = defineEmits();
    const hideEvaluationModal = () => {
		if (currentStep.value === "select") {
			isModalVisible.value = false;
		} else {
			currentStep.value = "select"
		}
        
    };
	
	
	const phonemes = computed(() => {
		
		const result = [];
		if (pronunciationResult.value.words.length>0) {
			result.push(...pronunciationResult.value.words[0].phonemes);
		}
		return result
	});


    // 显示弹窗方法
    const showPopup = () => {
        isModalVisible.value = true;
    };
	
	const resetAll = () => {
	  // hideEvaluationModal()
	  currentStep.value = "select"
	}

    const submitRecording = (voice) => {
      console.log(voice, "录音对象")
      currentStep.value = "submiting"; // 切换到结果页
      chatRequest
        .pronunciationByFileInvoke({ file_name: voice.fileName, content: props.currentWord.word})
        .then((data) => {
			console.log("最好喝或或或")
		  if (currentStep.value != "select") {
			  pronunciationResult.value = data.data;
			  if  (pronunciationResult.value==null) {
				  uni.showToast({
				          title: '评估失败重新评估',
				  });
				  currentStep.value = "select"; // 切换到结果页
			  } else {
				 currentStep.value = "result"; // 切换到结果页 
			  }
			  console.log("phonemes.value")
			  console.log(phonemes.value)
			  
		  }
          
    
        }).finally(() => {
			// console.log("最好喝或或或")
			// if (currentStep.value != "select") { 
			// 	currentStep.value = "result"; // 切换到结果页
			// }
          
        });
      }
	  
	  
	
      const handleReturn = () => {
        currentStep.value = "select"; // 返回选择页
        pronunciationResult.value = initPronunciation
      }
      const handleRetest = () => {
        currentStep.value = "select"; // 返回选择页
        // pronunciationResult.value = initPronunciation
      }
    
    // 将方法暴露给父组件
    defineExpose({
    showPopup
    });

</script>

<style scoped lang="scss">
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-end; /* 弹窗从底部弹出 */
    z-index: 1000;
    transition: opacity 0.3s ease;
}

.modal-content {
    background-color: white;
    width: 100%;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    padding: 32rpx;
    transform: translateY(100%); /* 初始位置在屏幕外 */
    transition: transform 0.3s ease;
}

.modal-content-active {
    transform: translateY(0); /* 弹窗弹出时回到屏幕内 */
}

.modal-title {
    font-size: 32rpx;
    // font-weight: bold;
    margin-bottom: 20rpx;
    text-align: center;
}

.modal-body {
    font-size: 35rpx;
    margin-bottom: 20rpx;
    font-weight: bold;
    text-align: center;
}

.modal-footer {
    text-align: right;
}
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
	// background-color: blue;
  height: 220rpx; /* 预留高度 */
  // padding: 0 16px; /* 添加内边距，确保按钮不贴边 */
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
  margin-top: 20rpx;
  padding: 0 16rpx; /* 添加内边距，确保按钮不贴边 */
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

.word-phonetic-mark {
	display: flex;
	flex-wrap: wrap;
	margin-top: 24rpx;
	// margin-bottom: 24rpx;
	justify-content: center;
	/* 紧凑间距 */
	// margin: -8rpx -12rpx; // 外层负边距补偿
	> .word-phonetic-item {
	    margin: 8rpx 12rpx; // 实际间距
	}
	.word-phonetic-item {
	    display: flex;
	    flex-direction: column;
	    align-items: center;
	    min-width: 60rpx; // 更窄的宽度
	    
	    // border-radius: 8rpx; // 圆角
	
	    /* 字母样式 */
	    .letter {
	        padding: 6rpx 0;
	        width: 100%;
	        font-size: 30rpx;
	        background-color: #e1ffef;
	        color: #05c160; // 绿色字母
	        font-weight: 500;
	        // margin-bottom: 4rpx; // 更小的间距
	        line-height: 1.2;
	        text-align: center;
	        border-top-left-radius: 10rpx;
	        border-top-right-radius: 10rpx;
	    }
	
	    /* 音标样式 */
	    .symbol {
	        padding: 6rpx 0;
	        width: 100%;
	        background-color: #BAFCD3;
	        font-size: 23rpx;
	        color: #05c160; // 灰色音标
	        letter-spacing: 0.5rpx;
	        text-align: center;
	        border-bottom-left-radius: 10rpx;
	        border-bottom-right-radius: 10rpx;
	    }
	
	    .playing {
	      color: #ff0000; // 播放时的颜色
	    }
	}
}

</style>