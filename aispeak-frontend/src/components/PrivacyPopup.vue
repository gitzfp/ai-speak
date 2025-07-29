<template>
  <uni-popup ref="privacyPopup" type="center" :mask-click="false">
    <view class="privacy-popup">
      <view class="popup-header">
        <text class="popup-title">用户隐私保护指引</text>
      </view>
      
      <scroll-view class="popup-content" scroll-y>
        <view class="content-text">
          <text>欢迎使用AISpeak！</text>
          <text class="highlight">在您使用我们的服务前，请您充分阅读并理解我们的《用户隐私保护指引》。</text>
          
          <text class="summary-title">我们将收集和使用以下信息：</text>
          <view class="summary-item">• 账号信息（手机号、昵称）</view>
          <view class="summary-item">• 学习记录和语音数据</view>
          <view class="summary-item">• 设备信息和使用日志</view>
          
          <text class="summary-title">我们承诺：</text>
          <view class="summary-item">• 严格保护您的个人信息安全</view>
          <view class="summary-item">• 不会向第三方共享您的信息</view>
          <view class="summary-item">• 您可以随时查询、更正或删除您的信息</view>
          
          <text class="link-text" @click="goToPrivacyPage">查看完整版《用户隐私保护指引》</text>
        </view>
      </scroll-view>
      
      <view class="popup-footer">
        <button class="btn-disagree" @click="handleDisagree">不同意</button>
        <button class="btn-agree" @click="handleAgree">同意并继续</button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const privacyPopup = ref()

// 存储键名
const PRIVACY_AGREED_KEY = 'privacy_agreed'
const PRIVACY_AGREED_TIME_KEY = 'privacy_agreed_time'

// 暴露方法供外部调用
const show = () => {
  privacyPopup.value?.open()
}

const hide = () => {
  privacyPopup.value?.close()
}

// 检查是否已同意隐私协议
const checkPrivacyAgreed = () => {
  const agreed = uni.getStorageSync(PRIVACY_AGREED_KEY)
  const agreedTime = uni.getStorageSync(PRIVACY_AGREED_TIME_KEY)
  
  // 可以根据需要设置过期时间，比如一年后需要重新同意
  if (agreed && agreedTime) {
    const oneYear = 365 * 24 * 60 * 60 * 1000
    const now = Date.now()
    if (now - agreedTime < oneYear) {
      return true
    }
  }
  return false
}

// 处理同意
const handleAgree = () => {
  uni.setStorageSync(PRIVACY_AGREED_KEY, true)
  uni.setStorageSync(PRIVACY_AGREED_TIME_KEY, Date.now())
  hide()
  // 触发同意事件
  emit('agree')
}

// 处理不同意
const handleDisagree = () => {
  uni.showModal({
    title: '提示',
    content: '您需要同意隐私协议才能使用我们的服务',
    showCancel: false,
    confirmText: '我知道了',
    success: () => {
      // 可以选择退出小程序或返回
      // #ifdef MP-WEIXIN
      wx.exitMiniProgram()
      // #endif
      // #ifndef MP-WEIXIN
      uni.navigateBack({
        delta: 999
      })
      // #endif
    }
  })
}

// 跳转到隐私协议页面
const goToPrivacyPage = () => {
  uni.navigateTo({
    url: '/pages/privacy/index'
  })
}

// 定义事件
const emit = defineEmits(['agree', 'disagree'])

// 暴露给父组件的方法
defineExpose({
  show,
  hide,
  checkPrivacyAgreed
})
</script>

<style lang="scss" scoped>
.privacy-popup {
  width: 600rpx;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.popup-header {
  padding: 30rpx;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.popup-content {
  height: 500rpx;
  padding: 30rpx;
}

.content-text {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  
  text {
    font-size: 28rpx;
    color: #666;
    line-height: 40rpx;
  }
  
  .highlight {
    color: #333;
    font-weight: 500;
  }
  
  .summary-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    margin-top: 20rpx;
  }
  
  .summary-item {
    font-size: 26rpx;
    color: #666;
    padding-left: 20rpx;
    line-height: 36rpx;
  }
  
  .link-text {
    color: #5C9EFF;
    text-decoration: underline;
    margin-top: 20rpx;
    text-align: center;
  }
}

.popup-footer {
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
  border-top: 1px solid #f0f0f0;
  
  button {
    flex: 1;
    height: 80rpx;
    font-size: 30rpx;
    border-radius: 40rpx;
    border: none;
    
    &.btn-disagree {
      background-color: #f5f5f5;
      color: #666;
    }
    
    &.btn-agree {
      background-color: #5C9EFF;
      color: #fff;
    }
  }
}
</style>