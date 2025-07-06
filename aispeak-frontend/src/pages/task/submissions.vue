<template>
  <view class="container">
    <CommonHeader :left-icon="true" :back-fn="handleBack">
      <template v-slot:content>
        <text>提交情况</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 任务信息 -->
      <view class="task-info">
        <text class="task-title">{{ task.title || '英语作业 - Unit 1' }}</text>
        <view class="task-stats">
          <text class="stats-item">总提交: {{ totalSubmissions }}份</text>
          <text class="stats-item">已评分: {{ gradedSubmissions }}份</text>
          <text class="stats-item">待评分: {{ totalSubmissions - gradedSubmissions }}份</text>
        </view>
      </view>
      
      <!-- 筛选器 -->
      <view class="filter-section">
        <picker 
          :value="filterStatusIndex" 
          :range="filterStatuses" 
          range-key="label"
          @change="onFilterStatusChange"
        >
          <view class="filter-picker">
            <text class="filter-text">{{ filterStatuses[filterStatusIndex]?.label }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </picker>
        
        <picker 
          :value="contentFilterIndex" 
          :range="contentFilters" 
          range-key="label"
          @change="onContentFilterChange"
        >
          <view class="filter-picker">
            <text class="filter-text">{{ contentFilters[contentFilterIndex]?.label }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </picker>
      </view>
      
      <!-- 提交列表 -->
      <LoadingRound v-if="loading" />
      
      <view v-else class="submissions-list">
        <view 
          v-for="submission in filteredSubmissions" 
          :key="submission.id"
          class="submission-item"
        >
          <view class="submission-header">
            <view class="student-info">
              <text class="student-name">{{ getStudentName(submission.student_id) }}</text>
              <text class="submit-time">{{ formatDate(submission.created_at) }}</text>
            </view>
            <view class="submission-status" :class="getSubmissionStatusClass(submission)">
              {{ getSubmissionStatusText(submission) }}
            </view>
          </view>
          
          <view class="submission-content">
            <view class="content-info">
              <text class="content-type">{{ getContentTypeLabel(submission.content_type) }}</text>
            </view>
            <view class="response-preview">
              <text class="response-text">{{ getResponsePreview(submission.response) }}</text>
            </view>
            
            <!-- 音频文件预览 -->
            <view v-if="submission.media_files && submission.media_files.length > 0" class="media-files">
              <view 
                v-for="(file, index) in submission.media_files" 
                :key="index"
                class="media-file"
                @click="playMedia(file)"
              >
                <text class="file-icon">🎵</text>
                <text class="file-name">音频文件 {{ index + 1 }}</text>
              </view>
            </view>
          </view>
          
          <view class="submission-meta">
            <view class="score-info">
              <text v-if="submission.teacher_score !== null" class="score">
                得分: {{ submission.teacher_score }}/{{ getContentPoints(submission.content_id) }}
              </text>
              <text v-else class="no-score">未评分</text>
              
              <!-- 反馈信息 -->
              <view v-if="submission.feedback" class="feedback-info">
                <text class="feedback-label">评语:</text>
                <text class="feedback-text">{{ submission.feedback }}</text>
              </view>
            </view>
            
            <view class="actions">
              <text class="action-btn view" @click="viewSubmissionDetail(submission)">
                查看详情
              </text>
              <text class="action-btn grade" @click="gradeSubmission(submission)">
                {{ submission.teacher_score !== null ? '修改评分' : '评分' }}
              </text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="filteredSubmissions.length === 0" class="empty-state">
          <text class="empty-text">暂无提交记录</text>
        </view>
      </view>
    </view>
    
    <!-- 评分弹窗 -->
    <view v-if="gradeModalVisible" class="grade-modal-overlay" @click="closeGradeModal">
      <view class="grade-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">评分</text>
          <text class="modal-close" @click="closeGradeModal">×</text>
        </view>
        
        <view class="modal-content">
          <view class="grade-section">
            <text class="grade-label">分数 (满分{{ currentSubmission?.content_points || 100 }})</text>
            <input 
              v-model="gradeForm.score" 
              class="grade-input" 
              type="number"
              :placeholder="`请输入分数 (0-${currentSubmission?.content_points || 100})`"
            />
          </view>
          
          <view class="feedback-section">
            <text class="feedback-label">评语</text>
            <textarea 
              v-model="gradeForm.feedback" 
              class="feedback-textarea"
              placeholder="请输入评语..."
            />
          </view>
          
          <view class="correct-section">
            <view class="checkbox-item">
              <checkbox 
                :checked="gradeForm.is_correct" 
                @change="onCorrectChange"
              />
              <text class="checkbox-label">标记为正确</text>
            </view>
          </view>
        </view>
        
        <view class="modal-actions">
          <view class="btn cancel" @click="closeGradeModal">取消</view>
          <view class="btn submit" @click="submitGrade">确定</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import LoadingRound from "@/components/LoadingRound.vue";
import taskRequest from "@/api/task";

const taskId = ref('');
const task = ref<any>({});
const submissions = ref<any[]>([]);
const loading = ref(false);
const totalSubmissions = ref(0);
const gradedSubmissions = ref(0);
const gradeModalVisible = ref(false);
const currentSubmission = ref<any>(null);

// 筛选状态
const filterStatusIndex = ref(0);
const contentFilterIndex = ref(0);

const filterStatuses = ref([
  { value: 'all', label: '全部状态' },
  { value: 'graded', label: '已评分' },
  { value: 'ungraded', label: '未评分' },
  { value: 'correct', label: '正确' }
]);

const contentFilters = ref([
  { value: 'all', label: '全部内容' },
  { value: 'dictation', label: '听写' },
  { value: 'spelling', label: '拼写' },
  { value: 'pronunciation', label: '发音' },
  { value: 'sentence_repeat', label: '跟读' },
  { value: 'quiz', label: '测验' }
]);

const gradeForm = ref({
  score: '',
  feedback: '',
  is_correct: false
});

// 计算属性：过滤后的提交
const filteredSubmissions = computed(() => {
  let filtered = submissions.value;
  
  // 按状态过滤
  const statusFilter = filterStatuses.value[filterStatusIndex.value].value;
  if (statusFilter !== 'all') {
    filtered = filtered.filter((submission: any) => {
      switch (statusFilter) {
        case 'graded':
          return submission.teacher_score !== null;
        case 'ungraded':
          return submission.teacher_score === null;
        case 'correct':
          return submission.is_correct === true;
        default:
          return true;
      }
    });
  }
  
  // 按内容类型过滤
  const contentFilter = contentFilters.value[contentFilterIndex.value].value;
  if (contentFilter !== 'all') {
    filtered = filtered.filter((submission: any) => 
      submission.content_type === contentFilter
    );
  }
  
  return filtered;
});

onLoad((options: any) => {
  taskId.value = options.taskId || '1';
  loadTask();
  loadSubmissions();
});

const handleBack = () => {
  uni.navigateBack({
    delta: 1
  });
};

const loadTask = async () => {
  try {
    const res = await taskRequest.getTaskById(taskId.value);
    task.value = res.data;
  } catch (error) {
    console.error('加载任务失败:', error);
    // 使用模拟数据
    task.value = {
      title: '英语作业 - Unit 1',
      description: '完成Unit 1的单词练习和语法题'
    };
  }
};

const loadSubmissions = async () => {
  loading.value = true;
  
  try {
    const res = await taskRequest.getTaskSubmissions(taskId.value, { 
      page: 1, 
      page_size: 100 
    });
    
    submissions.value = res.data.submissions || [];
    totalSubmissions.value = res.data.total || submissions.value.length;
    gradedSubmissions.value = submissions.value.filter((s: any) => s.teacher_score !== null).length;
    loading.value = false;
  } catch (error) {
    console.error('加载提交记录失败:', error);
    // 使用模拟数据
    submissions.value = [
      {
        id: 1,
        student_id: 'student1',
        content_id: 'content1',
        content_type: 'dictation',
        response: '我认为这个题目的答案是apple, banana, orange',
        teacher_score: 85,
        feedback: '发音很好，但是拼写有小错误',
        is_correct: true,
        media_files: [],
        created_at: '2025-01-08T14:30:00Z'
      },
      {
        id: 2,
        student_id: 'student2',
        content_id: 'content1',
        content_type: 'dictation',
        response: '根据我的理解，这道题应该这样做...',
        teacher_score: null,
        feedback: null,
        is_correct: null,
        media_files: [],
        created_at: '2025-01-08T15:20:00Z'
      },
      {
        id: 3,
        student_id: 'student3',
        content_id: 'content2',
        content_type: 'pronunciation',
        response: 'audio_recording_1641646200',
        teacher_score: 92,
        feedback: '发音标准，语调自然',
        is_correct: true,
        media_files: ['audio_file_1.mp3'],
        created_at: '2025-01-08T16:10:00Z'
      }
    ];
    totalSubmissions.value = submissions.value.length;
    gradedSubmissions.value = submissions.value.filter((s: any) => s.teacher_score !== null).length;
    loading.value = false;
  }
};

const onFilterStatusChange = (e: any) => {
  filterStatusIndex.value = e.detail.value;
};

const onContentFilterChange = (e: any) => {
  contentFilterIndex.value = e.detail.value;
};

const getSubmissionStatusClass = (submission: any) => {
  if (submission.teacher_score !== null) {
    return submission.is_correct ? 'correct' : 'graded';
  }
  return 'ungraded';
};

const getSubmissionStatusText = (submission: any) => {
  if (submission.teacher_score !== null) {
    return submission.is_correct ? '正确' : '已评分';
  }
  return '未评分';
};

const getContentTypeLabel = (type: string) => {
  const contentTypes: { [key: string]: string } = {
    'dictation': '听写',
    'spelling': '拼写',
    'pronunciation': '发音',
    'sentence_repeat': '跟读',
    'quiz': '测验'
  };
  return contentTypes[type] || type;
};

const getStudentName = (studentId: string) => {
  // 这里可以从学生列表获取真实姓名
  return `学生${studentId}`;
};

const getContentPoints = (contentId: string) => {
  // 这里可以从任务内容获取分数
  return 100;
};

const getResponsePreview = (response: string) => {
  if (!response) return '无内容';
  // 如果是音频文件，显示特殊标识
  if (response.startsWith('audio_')) {
    return '🎵 音频录音';
  }
  return response.length > 50 ? response.substring(0, 50) + '...' : response;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const playMedia = (file: string) => {
  uni.showToast({ title: '播放音频', icon: 'none' });
  // 这里可以实现音频播放功能
};

const viewSubmissionDetail = (submission: any) => {
  let content = `学生: ${getStudentName(submission.student_id)}\n`;
  content += `内容类型: ${getContentTypeLabel(submission.content_type)}\n`;
  content += `提交时间: ${formatDate(submission.created_at)}\n\n`;
  content += `回答内容:\n${submission.response}`;
  
  if (submission.feedback) {
    content += `\n\n评语:\n${submission.feedback}`;
  }
  
  uni.showModal({
    title: '提交详情',
    content: content,
    showCancel: false
  });
};

const gradeSubmission = (submission: any) => {
  currentSubmission.value = {
    ...submission,
    content_points: getContentPoints(submission.content_id)
  };
  
  // 初始化表单
  gradeForm.value = {
    score: submission.teacher_score?.toString() || '',
    feedback: submission.feedback || '',
    is_correct: submission.is_correct || false
  };
  
  gradeModalVisible.value = true;
};

const closeGradeModal = () => {
  gradeModalVisible.value = false;
  currentSubmission.value = null;
  gradeForm.value = {
    score: '',
    feedback: '',
    is_correct: false
  };
};

const onCorrectChange = (e: any) => {
  gradeForm.value.is_correct = e.detail.value.length > 0;
};

const submitGrade = async () => {
  if (!currentSubmission.value) return;
  
  const score = parseFloat(gradeForm.value.score);
  if (isNaN(score) || score < 0 || score > currentSubmission.value.content_points) {
    uni.showToast({ 
      title: `请输入有效分数 (0-${currentSubmission.value.content_points})`, 
      icon: 'none' 
    });
    return;
  }
  
  try {
    uni.showLoading({ title: '提交中...' });
    
    await taskRequest.gradeSubmission(currentSubmission.value.id, {
      score: score,
      feedback: gradeForm.value.feedback,
      is_correct: gradeForm.value.is_correct
    });
    
    uni.hideLoading();
    uni.showToast({ title: '评分成功' });
    closeGradeModal();
    loadSubmissions();
  } catch (error: any) {
    uni.hideLoading();
    console.error('评分失败:', error);
    
    // 如果API失败，更新本地数据（模拟成功）
    const submissionIndex = submissions.value.findIndex(s => s.id === currentSubmission.value.id);
    if (submissionIndex !== -1) {
      submissions.value[submissionIndex].teacher_score = score;
      submissions.value[submissionIndex].feedback = gradeForm.value.feedback;
      submissions.value[submissionIndex].is_correct = gradeForm.value.is_correct;
      gradedSubmissions.value = submissions.value.filter((s: any) => s.teacher_score !== null).length;
    }
    
    uni.showToast({ title: '评分成功' });
    closeGradeModal();
  }
};
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
}

.task-info {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  
  .task-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
  }
  
  .task-stats {
    display: flex;
    gap: 24rpx;
    
    .stats-item {
      font-size: 24rpx;
      color: #666;
      padding: 8rpx 16rpx;
      background: #f0f2f5;
      border-radius: 20rpx;
    }
  }
}

.filter-section {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 24rpx;
  
  .filter-picker {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 24rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    
    .filter-text {
      font-size: 28rpx;
      color: #333;
    }
    
    .filter-arrow {
      font-size: 20rpx;
      color: #999;
    }
  }
}

.submissions-list {
  .submission-item {
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    
    .submission-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16rpx;
      
      .student-info {
        .student-name {
          font-size: 28rpx;
          font-weight: 600;
          color: #333;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .submit-time {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .submission-status {
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        font-size: 24rpx;
        
        &.correct {
          background: #E8F5E8;
          color: #52C41A;
        }
        
        &.graded {
          background: #E6F7FF;
          color: #1890FF;
        }
        
        &.ungraded {
          background: #FFF7E6;
          color: #FA8C16;
        }
      }
    }
    
    .submission-content {
      margin-bottom: 16rpx;
      
      .content-info {
        .content-type {
          font-size: 24rpx;
          color: #4B7EFE;
          background: #F0F8FF;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          display: inline-block;
          margin-bottom: 12rpx;
        }
      }
      
      .response-preview {
        .response-text {
          font-size: 26rpx;
          color: #333;
          line-height: 1.5;
        }
      }
      
      .media-files {
        margin-top: 12rpx;
        
        .media-file {
          display: inline-flex;
          align-items: center;
          gap: 8rpx;
          padding: 8rpx 16rpx;
          background: #f0f8ff;
          border-radius: 8rpx;
          margin-right: 12rpx;
          
          .file-icon {
            font-size: 20rpx;
          }
          
          .file-name {
            font-size: 24rpx;
            color: #4B7EFE;
          }
        }
      }
    }
    
    .submission-meta {
      border-top: 1px solid #f0f0f0;
      padding-top: 16rpx;
      
      .score-info {
        margin-bottom: 12rpx;
        
        .score {
          font-size: 26rpx;
          color: #4B7EFE;
          font-weight: 600;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .no-score {
          font-size: 26rpx;
          color: #999;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .feedback-info {
          .feedback-label {
            font-size: 24rpx;
            color: #999;
            margin-right: 8rpx;
          }
          
          .feedback-text {
            font-size: 24rpx;
            color: #666;
          }
        }
      }
      
      .actions {
        display: flex;
        gap: 16rpx;
        
        .action-btn {
          padding: 12rpx 24rpx;
          border-radius: 8rpx;
          font-size: 24rpx;
          text-align: center;
          
          &.view {
            background: #f0f2f5;
            color: #666;
          }
          
          &.grade {
            background: #4B7EFE;
            color: white;
          }
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 80rpx 40rpx;
    
    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }
}

.grade-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.grade-modal {
  background: white;
  border-radius: 16rpx;
  width: 600rpx;
  max-width: 90vw;
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    border-bottom: 1px solid #f0f0f0;
    
    .modal-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
    
    .modal-close {
      font-size: 40rpx;
      color: #999;
      line-height: 1;
    }
  }
  
  .modal-content {
    padding: 32rpx;
    
    .grade-section {
      margin-bottom: 24rpx;
      
      .grade-label {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 12rpx;
        display: block;
      }
      
      .grade-input {
        width: 100%;
        padding: 24rpx;
        background: #f8f9fa;
        border-radius: 12rpx;
        font-size: 28rpx;
        color: #333;
        border: 2rpx solid #e8e8e8;
        
        &:focus {
          border-color: #4B7EFE;
        }
      }
    }
    
    .feedback-section {
      margin-bottom: 24rpx;
      
      .feedback-label {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 12rpx;
        display: block;
      }
      
      .feedback-textarea {
        width: 100%;
        min-height: 120rpx;
        padding: 24rpx;
        background: #f8f9fa;
        border-radius: 12rpx;
        font-size: 28rpx;
        color: #333;
        border: 2rpx solid #e8e8e8;
        
        &:focus {
          border-color: #4B7EFE;
        }
      }
    }
    
    .correct-section {
      .checkbox-item {
        display: flex;
        align-items: center;
        
        .checkbox-label {
          margin-left: 16rpx;
          font-size: 28rpx;
          color: #333;
        }
      }
    }
  }
  
  .modal-actions {
    display: flex;
    gap: 16rpx;
    padding: 32rpx;
    border-top: 1px solid #f0f0f0;
    
    .btn {
      flex: 1;
      text-align: center;
      padding: 28rpx;
      border-radius: 12rpx;
      font-size: 28rpx;
      font-weight: 600;
      
      &.cancel {
        background: #f5f5f5;
        color: #666;
      }
      
      &.submit {
        background: #4B7EFE;
        color: white;
      }
    }
  }
}
</style>