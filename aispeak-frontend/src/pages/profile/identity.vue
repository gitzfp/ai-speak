<template>
  <view class="container">
    <CommonHeader :left-icon="true" :back-fn="handleBack">
      <template v-slot:content>
        <text>身份设置</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 当前身份显示 -->
      <view class="current-identity">
        <view class="identity-card">
          <view class="identity-icon">
            <text class="icon">{{ currentRole === 'teacher' ? '👨‍🏫' : '👨‍🎓' }}</text>
          </view>
          <view class="identity-info">
            <text class="identity-title">当前身份</text>
            <text class="identity-role">{{ getRoleLabel(currentRole) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 身份选择 -->
      <view class="identity-selection">
        <text class="section-title">选择身份</text>
        
        <view class="role-options">
          <view 
            class="role-option" 
            :class="{ active: selectedRole === 'student' }"
            @click="selectRole('student')"
          >
            <view class="role-icon">
              <text class="icon">👨‍🎓</text>
            </view>
            <view class="role-info">
              <text class="role-name">学生</text>
              <text class="role-desc">查看和完成老师布置的任务</text>
            </view>
            <view class="role-check">
              <text v-if="selectedRole === 'student'" class="check">✓</text>
            </view>
          </view>
          
          <view 
            class="role-option" 
            :class="{ active: selectedRole === 'teacher' }"
            @click="selectRole('teacher')"
          >
            <view class="role-icon">
              <text class="icon">👨‍🏫</text>
            </view>
            <view class="role-info">
              <text class="role-name">教师</text>
              <text class="role-desc">创建班级，发布和管理任务</text>
            </view>
            <view class="role-check">
              <text v-if="selectedRole === 'teacher'" class="check">✓</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 身份信息表单 -->
      <view class="identity-form">
        <text class="section-title">完善信息</text>
        
        <view class="form-item">
          <text class="label">姓名</text>
          <input 
            v-model="userInfo.name" 
            class="input" 
            placeholder="请输入真实姓名"
            @blur="saveUserName"
          />
        </view>
        
        <view v-if="selectedRole" class="info-tip">
          <text class="tip-icon">💡</text>
          <text class="tip-text">加入班级后会自动获取学校和年级信息</text>
        </view>
      </view>
      
      <!-- 快捷操作 -->
      <view v-if="selectedRole === 'student'" class="quick-actions">
        <view class="quick-btn" @click="joinClass">
          <text class="quick-icon">🏫</text>
          <text class="quick-text">加入班级</text>
        </view>
      </view>
      
      <view v-if="selectedRole === 'teacher'" class="quick-actions">
        <view class="quick-btn" @click="createClass">
          <text class="quick-icon">➕</text>
          <text class="quick-text">创建班级</text>
        </view>
        <view class="quick-btn" @click="manageClasses">
          <text class="quick-icon">📚</text>
          <text class="quick-text">管理班级</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import accountRequest from "@/api/account";
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const currentRole = ref('');
const selectedRole = ref('');
const userInfo = ref({
  name: ''
});

// 添加防抖定时器引用
let saveNameTimer: any = null;

// 保存角色
const saveRole = () => {
  if (!selectedRole.value) return;
  
  accountRequest.setRole({ role: selectedRole.value }).then(() => {
    currentRole.value = selectedRole.value;
    // 更新 store 中的角色
    userStore.updateUserRole(selectedRole.value);
    // 保留 localStorage 作为备份
    uni.setStorageSync('userRole', selectedRole.value)
    uni.showToast({ title: '身份已更新', icon: 'success', duration: 1500 });
  }).catch((error) => {
    console.log('保存角色失败', error);
    uni.showToast({ title: '保存失败，请重试', icon: 'none' });
    // 恢复到之前的角色
    selectedRole.value = currentRole.value;
    uni.setStorageSync('userRole', selectedRole.value)
  });
};

// 保存用户姓名
const saveUserName = () => {
  if (!userInfo.value.name || userInfo.value.name.trim() === '') return;
  
  // 清除之前的定时器
  if (saveNameTimer) {
    clearTimeout(saveNameTimer);
  }
  
  // 延迟保存，避免频繁调用
  saveNameTimer = setTimeout(() => {
    const updateData = {
      user_name: userInfo.value.name.trim()
    };
    
    accountRequest.setSettings(updateData).then(() => {
      // 更新 store 中的用户名
      userStore.updateUserName(userInfo.value.name.trim());
      uni.showToast({ title: '姓名已保存', icon: 'success', duration: 1500 });
    }).catch((error) => {
      console.log('保存姓名失败', error);
      uni.showToast({ title: '保存失败', icon: 'none' });
    });
  }, 500);
};

onLoad((options: any) => {
  // 优先从 store 获取数据
  if (userStore.userInfo) {
    currentRole.value = userStore.userRole;
    selectedRole.value = userStore.userRole;
    userInfo.value.name = userStore.userInfo.user_name || '';
  } else {
    // 如果 store 中没有数据，调用 API
    loadCurrentRole();
  }
});

const handleBack = () => {
  uni.navigateBack({
    delta: 1
  });
};

const loadCurrentRole = () => {
  // 调用 API 获取用户信息
  accountRequest.accountInfoGet().then((res) => {
    const info = res.data;
    
    // 更新 store
    userStore.setUserInfo(info);
    
    // 设置角色信息
    if (info.user_role) {
      currentRole.value = info.user_role;
      selectedRole.value = info.user_role;
    }
    
    // 设置用户信息
    userInfo.value = {
      name: info.user_name || ''
    };
  }).catch((error) => {
    console.log('获取用户信息失败:', error);
  });
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'teacher':
      return '教师';
    case 'student':
      return '学生';
    default:
      return '未设置';
  }
};

const selectRole = (role: string) => {
  if (selectedRole.value === role) return; // 如果选择相同的角色，不做处理
  
  selectedRole.value = role;
  
  // 立即保存角色
  saveRole();
};


const joinClass = () => {
  uni.navigateTo({ url: '/pages/class/join' });
};

const createClass = () => {
  uni.navigateTo({ url: '/pages/class/create' });
};

const manageClasses = () => {
  uni.navigateTo({ url: '/pages/class/manage' });
};
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
}

.current-identity {
  margin-bottom: 32rpx;
  
  .identity-card {
    background: linear-gradient(135deg, #4B7EFE, #6A93FF);
    border-radius: 20rpx;
    padding: 40rpx;
    display: flex;
    align-items: center;
    color: white;
    
    .identity-icon {
      .icon {
        font-size: 60rpx;
        margin-right: 24rpx;
      }
    }
    
    .identity-info {
      .identity-title {
        font-size: 24rpx;
        opacity: 0.8;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .identity-role {
        font-size: 36rpx;
        font-weight: 600;
      }
    }
  }
}

.identity-selection, .identity-form {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
  }
}

.role-options {
  .role-option {
    display: flex;
    align-items: center;
    padding: 32rpx;
    border: 2rpx solid #f0f0f0;
    border-radius: 16rpx;
    margin-bottom: 16rpx;
    transition: all 0.3s;
    
    &.active {
      border-color: #4B7EFE;
      background: #f6f8ff;
    }
    
    .role-icon {
      .icon {
        font-size: 48rpx;
        margin-right: 24rpx;
      }
    }
    
    .role-info {
      flex: 1;
      
      .role-name {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .role-desc {
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
      }
    }
    
    .role-check {
      .check {
        font-size: 32rpx;
        color: #4B7EFE;
        font-weight: 600;
      }
    }
  }
}

.form-item {
  margin-bottom: 24rpx;
  
  .label {
    display: block;
    font-size: 28rpx;
    color: #333;
    margin-bottom: 12rpx;
    font-weight: 500;
  }
  
  .input, .picker {
    width: 100%;
    padding: 24rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #333;
    border: 1px solid #e8e8e8;
  }
  
  .picker {
    color: #666;
  }
}

.info-tip {
  background: #f6f8ff;
  border: 1px solid #e5e8ff;
  border-radius: 12rpx;
  padding: 24rpx;
  display: flex;
  align-items: flex-start;
  margin-top: 24rpx;
  
  .tip-icon {
    margin-right: 12rpx;
    font-size: 32rpx;
  }
  
  .tip-text {
    flex: 1;
    font-size: 26rpx;
    color: #666;
    line-height: 1.5;
  }
}

.quick-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
  
  .quick-btn {
    flex: 1;
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    text-align: center;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .quick-icon {
      font-size: 32rpx;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .quick-text {
      font-size: 26rpx;
      color: #333;
    }
  }
}
</style>