<template>
  <view class="container">
    <CommonHeader :leftIcon="true">
      <template v-slot:content>
        <text>提交详情</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 基本信息 -->
      <view class="info-section">
        <view class="section-title">基本信息</view>
        <view class="info-item">
          <text class="label">学生姓名</text>
          <text class="value">{{ studentInfo.student_name || '未知' }}</text>
        </view>
        <view class="info-item">
          <text class="label">任务名称</text>
          <text class="value">{{ studentInfo.task_title || submission.task_title || '未知' }}</text>
        </view>
        <view class="info-item">
          <text class="label">任务类型</text>
          <text class="value">{{ getTaskTypeName(studentInfo.task_type) }}</text>
        </view>
        <view class="info-item">
          <text class="label">提交时间</text>
          <text class="value">{{ formatDate(submission.created_at) }}</text>
        </view>
        <view class="info-item">
          <text class="label">得分</text>
          <text class="value score">{{ submission.auto_score?.toFixed(0) || 0 }}分</text>
        </view>
      </view>
      
      <!-- 答题详情 -->
      <view class="detail-section">
        <view class="section-title">答题详情</view>
        
        <!-- 单词听写详情 -->
        <view v-if="studentInfo.task_type === 'dictation'" class="word-list">
          <view v-for="(item, index) in studentInfo.results" :key="index" 
                class="word-item" :class="{ correct: item.is_correct, incorrect: !item.is_correct }">
            <view class="word-index">{{ index + 1 }}</view>
            <view class="word-content">
              <view class="word-main">
                <text class="word-text">{{ item.word }}</text>
                <text class="word-status">{{ item.is_correct ? '✓' : '✗' }}</text>
              </view>
              <view v-if="!item.is_correct" class="word-answer">
                <text class="answer-label">学生答案：</text>
                <text class="answer-value">{{ item.user_answer || '未作答' }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 背单词详情 -->
        <view v-else-if="studentInfo.task_type === 'spelling'" class="word-list">
          <view v-for="(item, index) in studentInfo.results" :key="index"
                class="word-item" :class="{ correct: item.is_correct, incorrect: !item.is_correct }">
            <view class="word-index">{{ index + 1 }}</view>
            <view class="word-content">
              <view class="word-main">
                <text class="word-text">{{ item.word }}</text>
                <text class="word-chinese">{{ item.chinese }}</text>
                <text class="word-status">{{ item.is_correct ? '✓' : '✗' }}</text>
              </view>
              <view class="word-meta">
                <text class="meta-item">练习类型：{{ getResponseTypeName(item.response_type) }}</text>
                <text class="meta-item">得分：{{ item.score }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 句子跟读详情 -->
        <view v-else-if="studentInfo.task_type === 'sentence_repeat'" class="sentence-list">
          <view v-for="(item, index) in studentInfo.results" :key="index"
                class="sentence-item" :class="{ correct: item.is_correct, incorrect: !item.is_correct }">
            <view class="sentence-index">{{ index + 1 }}</view>
            <view class="sentence-content">
              <view class="sentence-text">{{ item.sentence }}</view>
              <view class="sentence-chinese">{{ item.chinese }}</view>
              <view class="sentence-score">
                <text class="score-label">发音得分：</text>
                <text class="score-value" :class="{ high: item.pronunciation_score >= 80, mid: item.pronunciation_score >= 60 && item.pronunciation_score < 80, low: item.pronunciation_score < 60 }">
                  {{ item.pronunciation_score?.toFixed(0) || 0 }}分
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 统计信息 -->
      <view class="summary-section">
        <view class="section-title">统计信息</view>
        <view class="summary-grid">
          <view class="summary-item">
            <text class="summary-label">总题数</text>
            <text class="summary-value">{{ studentInfo.summary?.total || 0 }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">正确数</text>
            <text class="summary-value success">{{ studentInfo.summary?.correct || 0 }}</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">正确率</text>
            <text class="summary-value">{{ studentInfo.summary?.accuracy?.toFixed(0) || 0 }}%</text>
          </view>
          <view class="summary-item">
            <text class="summary-label">完成时间</text>
            <text class="summary-value">{{ formatTime(studentInfo.summary?.completedAt) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 教师评分 -->
      <view v-if="isTeacher" class="grade-section">
        <view class="section-title">教师评分</view>
        <view class="grade-input">
          <input v-model="teacherScore" type="number" placeholder="请输入分数（0-100）" />
        </view>
        <view class="feedback-input">
          <textarea v-model="feedback" placeholder="请输入评语" />
        </view>
        <view class="grade-button" @click="submitGrade">
          <text>提交评分</text>
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

const submission = ref<any>({})
const studentInfo = ref<any>({})
const submissionId = ref('')
const isTeacher = ref(false)
const teacherScore = ref('')
const feedback = ref('')

onLoad((options) => {
  submissionId.value = options.submissionId || ''
  isTeacher.value = uni.getStorageSync('userRole') === 'teacher'
  loadSubmissionDetail()
})

const loadSubmissionDetail = async () => {
  try {
    const res = await taskRequest.getSubmissionById(submissionId.value)
    submission.value = res.data
    
    // 解析response中的详细信息
    if (submission.value.response) {
      try {
        studentInfo.value = JSON.parse(submission.value.response)
      } catch (e) {
        console.error('解析提交数据失败:', e)
        studentInfo.value = {}
      }
    }
    
    // 如果有教师评分，显示
    if (submission.value.teacher_score !== null) {
      teacherScore.value = submission.value.teacher_score.toString()
    }
    if (submission.value.feedback) {
      feedback.value = submission.value.feedback
    }
  } catch (error) {
    console.error('加载提交详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

const getTaskTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'dictation': '单词听写',
    'spelling': '背单词',
    'pronunciation': '发音练习',
    'sentence_repeat': '句子跟读',
    'quiz': '单元测验'
  }
  return typeMap[type] || type
}

const getResponseTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'picture_selection': '看图选词',
    'word_spelling': '单词拼写'
  }
  return typeMap[type] || type
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return '未知'
  return formatDate(dateStr).split(' ')[1]
}

const submitGrade = async () => {
  if (!teacherScore.value || isNaN(Number(teacherScore.value))) {
    uni.showToast({
      title: '请输入有效分数',
      icon: 'none'
    })
    return
  }
  
  const score = Number(teacherScore.value)
  if (score < 0 || score > 100) {
    uni.showToast({
      title: '分数必须在0-100之间',
      icon: 'none'
    })
    return
  }
  
  try {
    await taskRequest.gradeSubmission(submissionId.value, {
      score: score,
      feedback: feedback.value
    })
    
    uni.showToast({
      title: '评分成功',
      icon: 'success'
    })
    
    // 刷新页面
    setTimeout(() => {
      loadSubmissionDetail()
    }, 1000)
  } catch (error) {
    console.error('评分失败:', error)
    uni.showToast({
      title: '评分失败',
      icon: 'none'
    })
  }
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

.info-section, .detail-section, .summary-section, .grade-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 15rpx 0;
  
  .label {
    font-size: 28rpx;
    color: #666;
  }
  
  .value {
    font-size: 28rpx;
    color: #333;
    
    &.score {
      color: #4B7EFE;
      font-weight: bold;
    }
  }
}

// 单词列表样式
.word-list, .sentence-list {
  margin-top: 20rpx;
}

.word-item, .sentence-item {
  display: flex;
  padding: 20rpx;
  margin-bottom: 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border-left: 4rpx solid transparent;
  
  &.correct {
    border-left-color: #52c41a;
  }
  
  &.incorrect {
    border-left-color: #ff4d4f;
  }
}

.word-index, .sentence-index {
  width: 60rpx;
  height: 60rpx;
  background: #e8e8e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.word-content, .sentence-content {
  flex: 1;
}

.word-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
  
  .word-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .word-chinese {
    font-size: 26rpx;
    color: #666;
    margin-left: 20rpx;
  }
  
  .word-status {
    font-size: 32rpx;
    color: #52c41a;
    
    .incorrect & {
      color: #ff4d4f;
    }
  }
}

.word-answer {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
  
  .answer-label {
    font-size: 24rpx;
    color: #999;
    margin-right: 10rpx;
  }
  
  .answer-value {
    font-size: 26rpx;
    color: #ff4d4f;
  }
}

.word-meta {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
  
  .meta-item {
    font-size: 24rpx;
    color: #999;
  }
}

// 句子样式
.sentence-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 10rpx;
}

.sentence-chinese {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.sentence-score {
  display: flex;
  align-items: center;
  
  .score-label {
    font-size: 24rpx;
    color: #999;
    margin-right: 10rpx;
  }
  
  .score-value {
    font-size: 28rpx;
    font-weight: bold;
    
    &.high {
      color: #52c41a;
    }
    
    &.mid {
      color: #faad14;
    }
    
    &.low {
      color: #ff4d4f;
    }
  }
}

// 统计信息样式
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-top: 20rpx;
}

.summary-item {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 12rpx;
  text-align: center;
  
  .summary-label {
    display: block;
    font-size: 24rpx;
    color: #999;
    margin-bottom: 10rpx;
  }
  
  .summary-value {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    
    &.success {
      color: #52c41a;
    }
  }
}

// 教师评分样式
.grade-input, .feedback-input {
  margin-bottom: 20rpx;
  
  input, textarea {
    width: 100%;
    padding: 20rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    font-size: 28rpx;
  }
  
  textarea {
    min-height: 200rpx;
  }
}

.grade-button {
  background: #4B7EFE;
  color: white;
  padding: 24rpx;
  border-radius: 12rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: bold;
  
  &:active {
    opacity: 0.8;
  }
}
</style>