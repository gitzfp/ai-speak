<template>
  <view class="container">
    <CommonHeader :leftIcon="true">
      <template v-slot:content>
        <text>{{ classInfo.name || '班级详情' }}</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 班级信息卡片 -->
      <view class="class-info-card">
        <view class="class-header">
          <view class="class-basic">
            <text class="class-name">{{ classInfo.name }}</text>
            <text class="class-desc">{{ classInfo.description || '暂无描述' }}</text>
          </view>
          <view class="class-code">
            <text class="code-label">班级码</text>
            <text class="code-value">{{ classInfo.class_code }}</text>
          </view>
        </view>
        
        <view class="class-meta">
          <view class="meta-item">
            <text class="meta-icon">👨‍🏫</text>
            <text class="meta-text">{{ classInfo.teacher_name }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-icon">📚</text>
            <text class="meta-text">{{ classInfo.subject }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-icon">🎓</text>
            <text class="meta-text">{{ classInfo.grade_level }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-icon">👥</text>
            <text class="meta-text">{{ classInfo.student_count || 0 }}人</text>
          </view>
        </view>
      </view>
      
      <!-- 功能菜单 -->
      <view class="function-menu">
        <view class="menu-row">
          <view class="menu-item" @click="viewTasks">
            <text class="menu-icon">📝</text>
            <text class="menu-text">班级任务</text>
            <text class="menu-badge" v-if="taskCount > 0">{{ taskCount }}</text>
          </view>
          <view class="menu-item" @click="viewStudents">
            <text class="menu-icon">👥</text>
            <text class="menu-text">班级成员</text>
          </view>
          <!-- <view class="menu-item" @click="viewAnnouncements">
            <text class="menu-icon">📢</text>
            <text class="menu-text">班级公告</text>
          </view> -->
        </view>
        
        <view class="menu-row" v-if="isTeacher">
          <view class="menu-item" @click="createTask">
            <text class="menu-icon">➕</text>
            <text class="menu-text">发布任务</text>
          </view>
          <!-- <view class="menu-item" @click="manageClass">
            <text class="menu-icon">⚙️</text>
            <text class="menu-text">班级设置</text>
          </view>
          <view class="menu-item" @click="viewStatistics">
            <text class="menu-icon">📊</text>
            <text class="menu-text">数据统计</text>
          </view> -->
        </view>
      </view>
      
      <!-- 班级任务 -->
      <view class="recent-tasks">
        <view class="section-header">
          <text class="section-title">班级任务</text>
        </view>
        
        <LoadingRound v-if="loading" />
        
        <view v-else-if="recentTasks.length > 0" class="tasks-list">
          <view 
            v-for="task in recentTasks" 
            :key="task.id"
            class="task-item"
            @click="viewTask(task)"
          >
            <view class="task-info">
              <text class="task-title">{{ task.title }}</text>
              <text class="task-desc">{{ task.description }}</text>
              <view class="task-meta">
                <text class="task-deadline">截止: {{ formatDate(task.deadline) }}</text>
                <text class="task-points">{{ task.total_points }}分</text>
              </view>
            </view>
            <view class="task-status" :class="getTaskStatusClass(task)">
              {{ getTaskStatusText(task) }}
            </view>
          </view>
        </view>
        
        <view v-else class="empty-tasks">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无任务</text>
          <text class="empty-desc" v-if="isTeacher">点击上方按钮发布第一个任务</text>
          <text class="empty-desc" v-else>老师还没有发布任务</text>
        </view>
      </view>
      
      <!-- 班级动态 -->
      <!-- <view class="class-activities">
        <text class="section-title">班级动态</text>
        
        <view class="activities-list">
          <view 
            v-for="activity in activities" 
            :key="activity.id"
            class="activity-item"
          >
            <view class="activity-avatar">
              <text class="avatar-text">{{ activity.user_name.charAt(0) }}</text>
            </view>
            <view class="activity-content">
              <text class="activity-text">{{ activity.content }}</text>
              <text class="activity-time">{{ formatTime(activity.created_at) }}</text>
            </view>
          </view>
        </view>
      </view> -->
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import LoadingRound from "@/components/LoadingRound.vue";
import taskRequest from "@/api/task";
import accountRequest from "@/api/account";
import { useUserStore } from '@/stores/user';

// 定义类型
interface ClassInfo {
  id?: string;
  name?: string;
  description?: string;
  class_code?: string;
  teacher_name?: string;
  subject?: string;
  grade_level?: string;
  student_count?: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  total_points: number;
  deadline: string;
  status: string;
}

interface Activity {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
}

const userStore = useUserStore();
const classId = ref('');
const classInfo = ref<ClassInfo>({});
const recentTasks = ref<Task[]>([]);
const activities = ref<Activity[]>([]);
const loading = ref(false);
const userRole = ref('student');

const isTeacher = computed(() => userRole.value === 'teacher');
const taskCount = computed(() => recentTasks.value.length);

onLoad((options: any) => {
  classId.value = options.classId;
  loadClassInfo();
  loadRecentTasks();
  loadActivities();
  getUserRole();
});

const getUserRole = () => {
  // 优先从 store 获取角色
  if (userStore.userRole) {
    userRole.value = userStore.userRole;
  } else {
    accountRequest.getRole().then((res) => {
      userRole.value = res.data.role || 'student';
      userStore.updateUserRole(userRole.value);
    }).catch(() => {
      userRole.value = 'student';
    });
  }
};

const loadClassInfo = () => {
  taskRequest.getClassById(classId.value).then(res => {
    classInfo.value = res.data;
  }).catch(() => {
    // 模拟班级信息
    classInfo.value = {
      id: classId.value,
      name: '三年级1班',
      description: '三年级英语课程班级',
      class_code: 'ABC123',
      teacher_name: '张老师',
      subject: '英语',
      grade_level: '三年级',
      student_count: 25
    };
  });
};

const loadRecentTasks = () => {
  loading.value = true;
  
  taskRequest.listTasks({
    class_id: classId.value,
    page: 1,
    page_size: 20  // 增加显示数量
  }).then(res => {
    recentTasks.value = res.data.tasks || [];
    loading.value = false;
  }).catch(() => {
    // 模拟任务数据
    recentTasks.value = [
      {
        id: 1,
        title: '英语作业 - Unit 1',
        description: '完成Unit 1的单词练习',
        total_points: 100,
        deadline: '2025-01-10T18:00:00Z',
        status: 'active'
      },
      {
        id: 2,
        title: '口语练习',
        description: '录制英语自我介绍',
        total_points: 50,
        deadline: '2025-01-12T20:00:00Z',
        status: 'active'
      }
    ];
    loading.value = false;
  });
};

const loadActivities = () => {
  // 模拟班级动态
  activities.value = [
    {
      id: 1,
      user_name: '张老师',
      content: '发布了新任务：英语作业 - Unit 1',
      created_at: '2025-01-08T10:30:00Z'
    },
    {
      id: 2,
      user_name: '小明',
      content: '提交了口语练习作业',
      created_at: '2025-01-08T09:15:00Z'
    },
    {
      id: 3,
      user_name: '小红',
      content: '加入了班级',
      created_at: '2025-01-07T16:20:00Z'
    }
  ];
};

const viewTasks = () => {
  uni.navigateTo({ 
    url: `/pages/task/index?classId=${classId.value}` 
  });
};

const viewStudents = () => {
  uni.navigateTo({ 
    url: `/pages/class/students?classId=${classId.value}` 
  });
};

const viewAnnouncements = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' });
};

const createTask = () => {
  uni.navigateTo({ 
    url: `/pages/task/create?classId=${classId.value}` 
  });
};

const manageClass = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' });
};

const viewStatistics = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' });
};

const viewTask = (task: any) => {
  uni.navigateTo({
    url: `/pages/task/detail?taskId=${task.id}&mode=${userRole.value}`
  });
};

const getTaskStatusClass = (task: any) => {
  if (new Date(task.deadline) < new Date()) {
    return 'overdue';
  }
  return 'active';
};

const getTaskStatusText = (task: any) => {
  if (new Date(task.deadline) < new Date()) {
    return '已过期';
  }
  return '进行中';
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) {
    return '刚刚';
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  }
};
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
}

.class-info-card {
  background: linear-gradient(135deg, #4B7EFE, #6A93FF);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  color: white;
  
  .class-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24rpx;
    
    .class-basic {
      flex: 1;
      
      .class-name {
        font-size: 36rpx;
        font-weight: 600;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .class-desc {
        font-size: 26rpx;
        opacity: 0.8;
        line-height: 1.4;
      }
    }
    
    .class-code {
      text-align: center;
      
      .code-label {
        font-size: 22rpx;
        opacity: 0.8;
        display: block;
        margin-bottom: 4rpx;
      }
      
      .code-value {
        font-size: 28rpx;
        font-weight: 600;
        font-family: monospace;
        background: rgba(255, 255, 255, 0.2);
        padding: 8rpx 16rpx;
        border-radius: 8rpx;
      }
    }
  }
  
  .class-meta {
    display: flex;
    justify-content: space-between;
    
    .meta-item {
      display: flex;
      align-items: center;
      
      .meta-icon {
        margin-right: 8rpx;
        font-size: 24rpx;
      }
      
      .meta-text {
        font-size: 24rpx;
      }
    }
  }
}

.function-menu {
  background: white;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  
  .menu-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .menu-item {
      flex: 1;
      text-align: center;
      padding: 32rpx 16rpx;
      background: #f8f9fa;
      border-radius: 16rpx;
      margin: 0 8rpx;
      position: relative;
      
      &:first-child {
        margin-left: 0;
      }
      
      &:last-child {
        margin-right: 0;
      }
      
      .menu-icon {
        font-size: 40rpx;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .menu-text {
        font-size: 24rpx;
        color: #333;
      }
      
      .menu-badge {
        position: absolute;
        top: 16rpx;
        right: 16rpx;
        background: #ff4d4f;
        color: white;
        font-size: 20rpx;
        padding: 4rpx 8rpx;
        border-radius: 12rpx;
        min-width: 24rpx;
        text-align: center;
      }
    }
  }
}

.recent-tasks, .class-activities {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .view-all {
      font-size: 26rpx;
      color: #4B7EFE;
    }
  }
  
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
  }
}

.tasks-list {
  .task-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    border: 1px solid #f0f0f0;
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    
    .task-info {
      flex: 1;
      
      .task-title {
        font-size: 28rpx;
        font-weight: 600;
        color: #333;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .task-desc {
        font-size: 24rpx;
        color: #666;
        margin-bottom: 12rpx;
      }
      
      .task-meta {
        display: flex;
        gap: 16rpx;
        
        .task-deadline, .task-points {
          font-size: 22rpx;
          color: #999;
        }
        
        .task-points {
          color: #4B7EFE;
          font-weight: 600;
        }
      }
    }
    
    .task-status {
      padding: 8rpx 16rpx;
      border-radius: 16rpx;
      font-size: 22rpx;
      
      &.active {
        background: #E8F5E8;
        color: #52C41A;
      }
      
      &.overdue {
        background: #FFF2F0;
        color: #FF4D4F;
      }
    }
  }
}

.empty-tasks {
  text-align: center;
  padding: 60rpx 20rpx;
  
  .empty-icon {
    font-size: 80rpx;
    display: block;
    margin-bottom: 16rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #333;
    font-weight: 600;
    display: block;
    margin-bottom: 8rpx;
  }
  
  .empty-desc {
    font-size: 24rpx;
    color: #666;
    line-height: 1.4;
  }
}

.activities-list {
  .activity-item {
    display: flex;
    margin-bottom: 24rpx;
    
    .activity-avatar {
      width: 60rpx;
      height: 60rpx;
      background: #4B7EFE;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
      
      .avatar-text {
        color: white;
        font-size: 24rpx;
        font-weight: 600;
      }
    }
    
    .activity-content {
      flex: 1;
      
      .activity-text {
        font-size: 26rpx;
        color: #333;
        line-height: 1.4;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .activity-time {
        font-size: 22rpx;
        color: #999;
      }
    }
  }
}
</style>