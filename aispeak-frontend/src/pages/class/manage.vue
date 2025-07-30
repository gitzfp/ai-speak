<template>
  <view class="container">
    <CommonHeader>
      <template v-slot:content>
        <text>班级管理</text>
      </template>
      <template v-slot:left>
        <view class="back-btn" @click="goBack">
          <text class="back-icon">‹</text>
        </view>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 创建班级按钮 -->
      <view class="create-section">
        <view class="create-btn" @click="createClass">
          <text class="create-icon">➕</text>
          <text class="create-text">创建新班级</text>
        </view>
      </view>
      
      <!-- 我的班级列表 -->
      <view class="classes-section">
        <text class="section-title">我的班级</text>
        
        <LoadingRound v-if="loading" />
        
        <view v-else class="classes-list">
          <view 
            v-for="classItem in classes" 
            :key="classItem.id"
            class="class-card"
            @click="enterClass(classItem)"
          >
            <view class="class-header">
              <view class="class-info">
                <text class="class-name">{{ classItem.name }}</text>
                <text class="class-desc">{{ classItem.description || '暂无描述' }}</text>
              </view>
              <view class="class-stats">
                <text class="stat-item">{{ classItem.student_count || 0 }}人</text>
              </view>
            </view>
            
            <view class="class-meta">
              <view class="meta-item">
                <text class="meta-label">年级:</text>
                <text class="meta-value">{{ classItem.grade_level }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-label">学科:</text>
                <text class="meta-value">{{ classItem.subject }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-label">班级码:</text>
                <text class="meta-value code">{{ classItem.class_code }}</text>
              </view>
            </view>
            
            <view class="class-actions">
              <view class="action-btn" @click.stop="manageStudents(classItem)">
                <text>管理学生</text>
              </view>
              <view class="action-btn" @click.stop="createTask(classItem)">
                <text>发布任务</text>
              </view>
              <view class="action-btn secondary" @click.stop="shareClass(classItem)">
                <text>分享班级</text>
              </view>
              <view class="action-btn danger" @click.stop="deleteClassConfirm(classItem)">
                <text>删除班级</text>
              </view>
            </view>
          </view>
          
          <!-- 空状态 -->
          <view v-if="classes.length === 0 && !loading" class="empty-state">
            <view class="empty-content">
              <text class="empty-icon">📚</text>
              <text class="empty-text">还没有创建班级</text>
              <text class="empty-desc">创建班级后就可以发布任务给学生了</text>
              <view class="empty-action" @click="createClass">
                <text class="action-text">立即创建班级</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import LoadingRound from "@/components/LoadingRound.vue";
import taskRequest from "@/api/task";

const classes = ref<any[]>([]);
const loading = ref(false);

onShow(() => {
  loadClasses();
});

const goBack = () => {
  uni.navigateBack();
};

const loadClasses = () => {
  loading.value = true;
  
  // 从本地存储获取用户信息
  const teacherId = uni.getStorageSync('user_id');
  
  if (!teacherId) {
    console.error('用户未登录或缺少ID');
    classes.value = [];
    loading.value = false;
    return;
  }
  
  console.log('正在获取教师班级列表, teacherId:', teacherId);
  
  // 调用获取教师班级的API
  taskRequest.getTeacherClasses(teacherId).then(res => {
    console.log('获取班级列表成功:', res);
    classes.value = res.data || [];
    loading.value = false;
  }).catch((error) => {
    // 如果API失败，显示空状态让用户创建班级
    console.error('获取班级列表失败:', error);
    classes.value = [];
    loading.value = false;
  });
};

const createClass = () => {
  uni.navigateTo({ url: '/pages/class/create' });
};

const enterClass = (classItem: any) => {
  uni.navigateTo({ url: `/pages/class/detail?classId=${classItem.id}` });
};

const manageStudents = (classItem: any) => {
  uni.navigateTo({ url: `/pages/class/students?classId=${classItem.id}` });
};

const createTask = (classItem: any) => {
  uni.navigateTo({ url: `/pages/task/create?classId=${classItem.id}` });
};

const shareClass = (classItem: any) => {
  uni.showModal({
    title: '分享班级',
    content: `班级码: ${classItem.class_code}\n学生可使用此班级码加入班级`,
    showCancel: false,
    confirmText: '复制班级码',
    success: () => {
      uni.setClipboardData({
        data: classItem.class_code,
        success: () => {
          uni.showToast({ title: '班级码已复制' });
        }
      });
    }
  });
};

const deleteClassConfirm = (classItem: any) => {
  uni.showModal({
    title: '删除班级',
    content: `确定要删除班级"${classItem.name}"吗？\n删除后该班级的所有数据将无法恢复。`,
    confirmText: '删除',
    confirmColor: '#ff4444',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        deleteClass(classItem);
      }
    }
  });
};

const deleteClass = async (classItem: any) => {
  uni.showLoading({ title: '删除中...' });
  
  try {
    await taskRequest.deleteClass(classItem.id);
    uni.hideLoading();
    uni.showToast({ 
      title: '删除成功',
      icon: 'success'
    });
    
    // 重新加载班级列表
    loadClasses();
  } catch (error) {
    uni.hideLoading();
    console.error('删除班级失败:', error);
    uni.showToast({ 
      title: '删除失败',
      icon: 'none'
    });
  }
};
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  
  .back-icon {
    font-size: 40rpx;
    color: #333;
    font-weight: 600;
  }
}

.create-section {
  margin-bottom: 32rpx;
  
  .create-btn {
    background: linear-gradient(135deg, #4B7EFE, #6A93FF);
    color: white;
    border-radius: 20rpx;
    padding: 40rpx;
    text-align: center;
    box-shadow: 0 4rpx 20rpx rgba(75, 126, 254, 0.3);
    
    .create-icon {
      font-size: 48rpx;
      display: block;
      margin-bottom: 12rpx;
    }
    
    .create-text {
      font-size: 32rpx;
      font-weight: 600;
    }
  }
}

.classes-section {
  .section-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
  }
}

.classes-list {
  .class-card {
    background: white;
    border-radius: 20rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
    }
    
    .class-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24rpx;
      
      .class-info {
        flex: 1;
        
        .class-name {
          font-size: 36rpx;
          font-weight: 700;
          color: #1a202c;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .class-desc {
          font-size: 26rpx;
          color: #718096;
          line-height: 1.5;
        }
      }
      
      .class-stats {
        .stat-item {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10rpx 20rpx;
          border-radius: 24rpx;
          font-size: 26rpx;
          font-weight: 600;
          box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
        }
      }
    }
    
    .class-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16rpx;
      margin-bottom: 28rpx;
      padding: 20rpx;
      background: #f7fafc;
      border-radius: 16rpx;
      
      .meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        
        .meta-label {
          font-size: 22rpx;
          color: #a0aec0;
          margin-bottom: 4rpx;
        }
        
        .meta-value {
          font-size: 26rpx;
          color: #2d3748;
          font-weight: 600;
          
          &.code {
            background: white;
            padding: 8rpx 16rpx;
            border-radius: 8rpx;
            font-family: 'Courier New', monospace;
            letter-spacing: 1rpx;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
    
    .class-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16rpx;
      
      .action-btn {
        text-align: center;
        padding: 24rpx 16rpx;
        border-radius: 12rpx;
        font-size: 26rpx;
        font-weight: 500;
        transition: all 0.2s;
        
        &:not(.secondary):not(.danger) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
          
          &:active {
            transform: translateY(2rpx);
            box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
          }
        }
        
        &.secondary {
          background: #e2e8f0;
          color: #4a5568;
          
          &:active {
            background: #cbd5e0;
          }
        }
        
        &.danger {
          background: #fed7d7;
          color: #c53030;
          
          &:active {
            background: #feb2b2;
          }
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  
  .empty-content {
    .empty-icon {
      font-size: 120rpx;
      display: block;
      margin-bottom: 24rpx;
    }
    
    .empty-text {
      font-size: 32rpx;
      color: #333;
      font-weight: 600;
      display: block;
      margin-bottom: 12rpx;
    }
    
    .empty-desc {
      font-size: 26rpx;
      color: #666;
      line-height: 1.4;
      margin-bottom: 32rpx;
    }
    
    .empty-action {
      background: linear-gradient(135deg, #4B7EFE, #6A93FF);
      color: white;
      padding: 24rpx 48rpx;
      border-radius: 12rpx;
      display: inline-block;
      
      .action-text {
        font-size: 28rpx;
        font-weight: 600;
      }
    }
  }
}
</style>