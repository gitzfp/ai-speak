<template>
  <view class="container">
    <CommonHeader :leftIcon="true" :title="`${className} - 学生管理`" />
    
    <view class="content">
      <!-- 班级信息卡片 -->
      <view class="class-info-card">
        <view class="info-header">
          <text class="info-title">班级信息</text>
        </view>
        <view class="info-content">
          <view class="info-item">
            <text class="info-label">班级名称</text>
            <text class="info-value">{{ className }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">班级码</text>
            <text class="info-value code">{{ classCode }}</text>
            <view class="copy-btn" @click="copyClassCode">
              <text>复制</text>
            </view>
          </view>
          <view class="info-item">
            <text class="info-label">学生人数</text>
            <text class="info-value">{{ students.length }}人</text>
          </view>
        </view>
      </view>

      <!-- 学生列表 -->
      <view class="students-section">
        <view class="section-header">
          <text class="section-title">学生列表</text>
          <view class="add-btn" @click="showAddStudent">
            <text>+ 添加学生</text>
          </view>
        </view>

        <LoadingRound v-if="loading" />
        
        <view v-else-if="students.length > 0" class="student-list">
          <view 
            v-for="(student, index) in students" 
            :key="student.id"
            class="student-item"
          >
            <view class="student-info">
              <view class="student-avatar">
                <text>{{ (student.name || student.username || '?').charAt(0).toUpperCase() }}</text>
              </view>
              <view class="student-details">
                <text class="student-name">{{ student.name || student.username || '未知' }}</text>
                <text class="student-id">学号: {{ student.student_id || student.user_id || '未设置' }}</text>
              </view>
            </view>
            <view class="student-actions">
              <view class="action-btn remove" @click="removeStudentConfirm(student)">
                <text>移除</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <text class="empty-icon">👥</text>
          <text class="empty-text">班级暂无学生</text>
          <text class="empty-desc">分享班级码让学生加入班级</text>
          <view class="empty-action" @click="shareClass">
            <text>分享班级码</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import LoadingRound from "@/components/LoadingRound.vue";
import taskRequest from "@/api/task";

const classId = ref('');
const className = ref('');
const classCode = ref('');
const students = ref<any[]>([]);
const loading = ref(false);

onLoad((options) => {
  if (options.classId) {
    classId.value = options.classId;
    loadClassInfo(); // 班级信息和学生列表都会在这里加载
  }
});

const loadClassInfo = async () => {
  loading.value = true;
  try {
    const res = await taskRequest.getClassById(classId.value);
    console.log('班级详情响应:', res);
    const classInfo = res.data;
    className.value = classInfo.name;
    classCode.value = classInfo.class_code;
    
    // 班级详情中现在包含学生信息
    if (classInfo.students && Array.isArray(classInfo.students)) {
      students.value = classInfo.students;
    } else {
      students.value = [];
    }
  } catch (error) {
    console.error('加载班级信息失败:', error);
    uni.showToast({ title: '加载班级信息失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

// 移除学生成功后刷新班级信息
const refreshStudents = () => {
  loadClassInfo();
};

const copyClassCode = () => {
  uni.setClipboardData({
    data: classCode.value,
    success: () => {
      uni.showToast({ title: '班级码已复制' });
    }
  });
};

const shareClass = () => {
  uni.showModal({
    title: '分享班级',
    content: `班级码: ${classCode.value}\n学生可使用此班级码加入班级`,
    showCancel: false,
    confirmText: '复制班级码',
    success: () => {
      copyClassCode();
    }
  });
};

const showAddStudent = () => {
  uni.showToast({ 
    title: '学生需通过班级码自行加入', 
    icon: 'none',
    duration: 2000
  });
};

const removeStudentConfirm = (student: any) => {
  uni.showModal({
    title: '移除学生',
    content: `确定要将学生"${student.name}"移出班级吗？`,
    confirmText: '移除',
    confirmColor: '#ff4444',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        removeStudent(student);
      }
    }
  });
};

const removeStudent = async (student: any) => {
  uni.showLoading({ title: '移除中...' });
  
  try {
    // 使用 student.id 或 student.user_id
    const studentId = student.id || student.user_id;
    await taskRequest.removeStudentFromClass(classId.value, studentId);
    uni.hideLoading();
    uni.showToast({ 
      title: '移除成功',
      icon: 'success'
    });
    
    // 重新加载班级信息（包含学生列表）
    refreshStudents();
  } catch (error) {
    uni.hideLoading();
    console.error('移除学生失败:', error);
    uni.showToast({ 
      title: '移除失败',
      icon: 'none'
    });
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f5f7fa;
}

.content {
  padding: 20rpx;
}

/* 班级信息卡片 */
.class-info-card {
  background: white;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.info-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24rpx 32rpx;
}

.info-title {
  color: white;
  font-size: 32rpx;
  font-weight: 600;
}

.info-content {
  padding: 32rpx;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 26rpx;
  color: #718096;
  width: 150rpx;
}

.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #2d3748;
  font-weight: 500;
}

.info-value.code {
  font-family: 'Courier New', monospace;
  background: #f7fafc;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  border: 1rpx solid #e2e8f0;
  display: inline-block;
  flex: initial;
  margin-right: 16rpx;
}

.copy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8rpx 24rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.copy-btn:active {
  opacity: 0.8;
}

/* 学生列表部分 */
.students-section {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2d3748;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.add-btn:active {
  opacity: 0.8;
}

/* 学生列表 */
.student-list {
  margin-top: 24rpx;
}

.student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #e2e8f0;
}

.student-item:last-child {
  border-bottom: none;
}

.student-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.student-avatar {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.student-avatar text {
  color: white;
  font-size: 32rpx;
  font-weight: 600;
}

.student-details {
  flex: 1;
}

.student-name {
  display: block;
  font-size: 30rpx;
  color: #2d3748;
  font-weight: 500;
  margin-bottom: 4rpx;
}

.student-id {
  display: block;
  font-size: 24rpx;
  color: #718096;
}

.student-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.action-btn.remove {
  background: #fed7d7;
  color: #c53030;
}

.action-btn.remove:active {
  background: #feb2b2;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  display: block;
  margin-bottom: 24rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: #2d3748;
  font-weight: 600;
  display: block;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #718096;
  line-height: 1.5;
  margin-bottom: 32rpx;
  display: block;
}

.empty-action {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24rpx 48rpx;
  border-radius: 12rpx;
  display: inline-block;
  font-size: 28rpx;
  font-weight: 500;
}

.empty-action:active {
  opacity: 0.8;
}
</style>