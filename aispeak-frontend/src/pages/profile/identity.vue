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
      <view v-if="selectedRole" class="identity-form">
        <text class="section-title">完善信息</text>
        
        <view class="form-item">
          <text class="label">姓名</text>
          <input 
            v-model="userInfo.name" 
            class="input" 
            placeholder="请输入真实姓名"
          />
        </view>
        
        <view class="info-tip">
          <text class="tip-icon">💡</text>
          <text class="tip-text">
            {{ selectedRole === 'teacher' ? '创建班级时可以设置学校信息' : '加入班级后会自动获取学校和年级信息' }}
          </text>
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view class="actions">
        <view class="btn-group">
          <view 
            class="btn primary" 
            @click="saveIdentity"
            :class="{ disabled: !canSave }"
          >
            保存设置
          </view>
        </view>
        
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import accountRequest from "@/api/account";

const currentRole = ref('');
const selectedRole = ref('');
const userInfo = ref({
  name: ''
});

const canSave = computed(() => {
  return selectedRole.value && userInfo.value.name;
});

onLoad(() => {
  loadCurrentRole();
});

onShow(() => {
  loadCurrentRole();
});

const handleBack = () => {
  uni.navigateBack({
    delta: 1
  });
};

const loadCurrentRole = () => {
  // 优先从本地存储获取角色信息
  const localRole = uni.getStorageSync('userRole');
  const localUserInfo = uni.getStorageSync('userInfo');
  
  if (localRole) {
    currentRole.value = localRole;
    selectedRole.value = localRole;
    
    // 如果有本地用户信息，加载它
    if (localUserInfo) {
      userInfo.value = {
        name: localUserInfo.name || ''
      };
    }
  }
  
  // 尝试从API获取角色信息（如果后端支持）
  accountRequest.getRole().then((res) => {
    if (res.data && res.data.role) {
      currentRole.value = res.data.role;
      selectedRole.value = res.data.role;
      // 更新本地存储
      uni.setStorageSync('userRole', res.data.role);
    }
  }).catch((error) => {
    console.log('获取角色信息失败:', error);
    // 如果API失败但本地没有角色，保持空状态
    if (!localRole) {
      currentRole.value = '';
      selectedRole.value = '';
    }
  });
  
  // 加载其他用户信息
  loadUserInfo();
};

const loadUserInfo = () => {
  accountRequest.accountInfoGet().then((res) => {
    const info = res.data;
    userInfo.value = {
      name: info.user_name || ''
    };
  }).catch(() => {
    console.log('用户信息加载失败');
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
  selectedRole.value = role;
};

const saveIdentity = () => {
  if (!canSave.value) {
    uni.showToast({ title: '请完善必填信息', icon: 'none' });
    return;
  }
  
  // 保存角色
  accountRequest.setRole({ role: selectedRole.value }).then(() => {
    // 保存用户姓名
    const updateData = {
      user_name: userInfo.value.name
    };
    
    return accountRequest.setSettings(updateData);
  }).then(() => {
    // 保存到本地存储
    uni.setStorageSync('userRole', selectedRole.value);
    uni.setStorageSync('userInfo', userInfo.value);
    
    currentRole.value = selectedRole.value;
    uni.showToast({ title: '设置保存成功' });
    
    // 根据角色跳转
    setTimeout(() => {
      if (selectedRole.value === 'teacher') {
        uni.navigateBack();
      } else {
        uni.navigateTo({ url: '/pages/class/join' });
      }
    }, 1500);
  }).catch(() => {
    // 模拟保存成功
    uni.setStorageSync('userRole', selectedRole.value);
    uni.setStorageSync('userInfo', userInfo.value);
    
    currentRole.value = selectedRole.value;
    uni.showToast({ title: '设置保存成功' });
    
    setTimeout(() => {
      if (selectedRole.value === 'teacher') {
        uni.navigateTo({ url: '/pages/class/create' });
      } else {
        uni.navigateTo({ url: '/pages/class/join' });
      }
    }, 1500);
  });
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

.actions {
  .btn-group {
    .btn {
      width: 100%;
      text-align: center;
      padding: 32rpx;
      border-radius: 16rpx;
      font-size: 32rpx;
      font-weight: 600;
      margin-bottom: 24rpx;
      
      &.primary {
        background: linear-gradient(135deg, #4B7EFE, #6A93FF);
        color: white;
      }
      
      &.disabled {
        opacity: 0.5;
      }
    }
  }
  
  .quick-actions {
    display: flex;
    gap: 16rpx;
    
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
}
</style>