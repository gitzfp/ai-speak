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
  const userInfo = uni.getStorageSync('userInfo');
  const teacherId = userInfo?.teacherId || 'teacher001'; // 如果没有则使用默认值
  
  // 调用获取教师班级的API
  taskRequest.getTeacherClasses(teacherId).then(res => {
    classes.value = res.data || [];
    loading.value = false;
  }).catch(() => {
    // 如果API失败，显示空状态让用户创建班级
    console.error('获取班级列表失败');
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
    box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.05);
    
    .class-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20rpx;
      
      .class-info {
        flex: 1;
        
        .class-name {
          font-size: 32rpx;
          font-weight: 600;
          color: #333;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .class-desc {
          font-size: 26rpx;
          color: #666;
          line-height: 1.4;
        }
      }
      
      .class-stats {
        .stat-item {
          background: #f0f8ff;
          color: #4B7EFE;
          padding: 8rpx 16rpx;
          border-radius: 20rpx;
          font-size: 24rpx;
          font-weight: 600;
        }
      }
    }
    
    .class-meta {
      display: flex;
      gap: 24rpx;
      margin-bottom: 24rpx;
      flex-wrap: wrap;
      
      .meta-item {
        display: flex;
        align-items: center;
        
        .meta-label {
          font-size: 24rpx;
          color: #999;
          margin-right: 8rpx;
        }
        
        .meta-value {
          font-size: 24rpx;
          color: #333;
          
          &.code {
            background: #f5f5f5;
            padding: 4rpx 12rpx;
            border-radius: 8rpx;
            font-family: monospace;
            font-weight: 600;
          }
        }
      }
    }
    
    .class-actions {
      display: flex;
      gap: 12rpx;
      
      .action-btn {
        flex: 1;
        text-align: center;
        padding: 20rpx;
        background: #4B7EFE;
        color: white;
        border-radius: 12rpx;
        font-size: 24rpx;
        
        &.secondary {
          background: #f0f2f5;
          color: #666;
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