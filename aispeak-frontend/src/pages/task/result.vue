<template>
  <view class="container">
    <CommonHeader :leftIcon="true">
      <template v-slot:content>
        <text>任务完成</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 成绩展示 -->
      <view class="score-section">
        <view class="score-circle">
          <text class="score-value">{{ score }}</text>
          <text class="score-label">分</text>
        </view>
        <view class="score-info">
          <text class="score-title">{{ getScoreTitle() }}</text>
          <text class="score-desc">正确率: {{ accuracy }}%</text>
        </view>
      </view>
      
      <!-- 详细信息 -->
      <view class="detail-section">
        <view class="detail-item">
          <text class="detail-label">正确数量</text>
          <text class="detail-value success">{{ correctCount }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">错误数量</text>
          <text class="detail-value error">{{ incorrectCount }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">总题数</text>
          <text class="detail-value">{{ totalCount }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">用时</text>
          <text class="detail-value">{{ formatTime(timeSpent) }}</text>
        </view>
      </view>
      
      <!-- 任务信息 -->
      <view v-if="taskInfo" class="task-info-section">
        <view class="section-title">任务信息</view>
        <view class="task-info-item">
          <text class="info-label">任务名称</text>
          <text class="info-value">{{ taskInfo.title }}</text>
        </view>
        <view class="task-info-item">
          <text class="info-label">任务类型</text>
          <text class="info-value">{{ getTaskTypeName(taskInfo.task_type) }}</text>
        </view>
        <view class="task-info-item">
          <text class="info-label">提交时间</text>
          <text class="info-value">{{ formatDate(new Date()) }}</text>
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view class="action-section">
        <view class="primary-btn" @click="backToTaskList">
          <text class="btn-text">返回任务列表</text>
        </view>
        <view v-if="canRetry" class="secondary-btn" @click="retryTask">
          <text class="btn-text">重新练习</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CommonHeader from '@/components/CommonHeader.vue'
import taskRequest from '@/api/task'

const taskId = ref('')
const score = ref(0)
const correctCount = ref(0)
const incorrectCount = ref(0)
const totalCount = ref(0)
const timeSpent = ref(0)
const taskInfo = ref(null)
const startTime = ref(null)

const accuracy = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round(correctCount.value / totalCount.value * 100)
})

const canRetry = computed(() => {
  if (!taskInfo.value) return false
  
  // 检查是否已过截止时间
  if (taskInfo.value.deadline) {
    const now = new Date()
    const deadline = new Date(taskInfo.value.deadline)
    if (now > deadline && !taskInfo.value.allow_late_submission) {
      return false
    }
  }
  
  // 检查尝试次数限制
  if (taskInfo.value.max_attempts) {
    // 这里需要从后端获取当前尝试次数，暂时假设为1
    const currentAttempts = 1
    return currentAttempts < taskInfo.value.max_attempts
  }
  
  // 如果没有限制，允许重试
  return true
})

onLoad((options) => {
  taskId.value = options.taskId || ''
  score.value = parseInt(options.score || '0')
  correctCount.value = parseInt(options.correct || '0')
  totalCount.value = parseInt(options.total || '0')
  incorrectCount.value = totalCount.value - correctCount.value
  
  // 计算用时（从开始到现在）
  if (options.startTime) {
    startTime.value = new Date(options.startTime)
    timeSpent.value = Date.now() - startTime.value.getTime()
  }
  
  loadTaskInfo()
})

const loadTaskInfo = async () => {
  if (!taskId.value) return
  
  try {
    const res = await taskRequest.getTaskById(taskId.value)
    taskInfo.value = res.data
  } catch (error) {
    console.error('加载任务信息失败:', error)
  }
}

const getScoreTitle = () => {
  if (score.value >= 90) return '优秀！'
  if (score.value >= 80) return '良好！'
  if (score.value >= 70) return '不错！'
  if (score.value >= 60) return '及格！'
  return '继续努力！'
}

const getTaskTypeName = (type: string) => {
  const typeMap = {
    'dictation': '单词听写',
    'spelling': '背单词',
    'pronunciation': '发音练习',
    'sentence_repeat': '句子跟读',
    'quiz': '单元测验'
  }
  return typeMap[type] || type
}

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${seconds}秒`
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const backToTaskList = () => {
  uni.navigateBack({
    delta: 2
  })
}

const retryTask = () => {
  // 返回上一页重新开始
  uni.navigateBack()
}
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
}

.content {
  padding: 20rpx;
}

.score-section {
  background: white;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .score-circle {
    width: 200rpx;
    height: 200rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto 30rpx;
    
    .score-value {
      font-size: 60rpx;
      color: white;
      font-weight: bold;
    }
    
    .score-label {
      font-size: 24rpx;
      color: white;
      margin-top: -10rpx;
    }
  }
  
  .score-info {
    .score-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      display: block;
      margin-bottom: 10rpx;
    }
    
    .score-desc {
      font-size: 28rpx;
      color: #666;
    }
  }
}

.detail-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  
  .detail-item {
    flex: 1;
    min-width: 45%;
    background: #f8f9fa;
    padding: 20rpx;
    border-radius: 12rpx;
    text-align: center;
    
    .detail-label {
      display: block;
      font-size: 24rpx;
      color: #999;
      margin-bottom: 10rpx;
    }
    
    .detail-value {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      
      &.success {
        color: #52c41a;
      }
      
      &.error {
        color: #ff4d4f;
      }
    }
  }
}

.task-info-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .task-info-item {
    display: flex;
    justify-content: space-between;
    padding: 15rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 28rpx;
      color: #666;
    }
    
    .info-value {
      font-size: 28rpx;
      color: #333;
      text-align: right;
      flex: 1;
      margin-left: 20rpx;
    }
  }
}

.action-section {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  
  .primary-btn, .secondary-btn {
    padding: 30rpx;
    border-radius: 16rpx;
    text-align: center;
    
    .btn-text {
      font-size: 32rpx;
      font-weight: 600;
    }
  }
  
  .primary-btn {
    background: #4B7EFE;
    color: white;
    box-shadow: 0 4rpx 20rpx rgba(75, 126, 254, 0.3);
  }
  
  .secondary-btn {
    background: white;
    color: #4B7EFE;
    border: 2rpx solid #4B7EFE;
  }
}
</style>