<template>
  <view class="beian-footer">
    <text @click="openBeianLink">闽ICP备2025092232号</text>
  </view>
</template>

<script setup lang="ts">
const openBeianLink = () => {
  // For browser environment
  // #ifdef H5
  window.open('https://beian.miit.gov.cn/', '_blank');
  // #endif
  
  // For mini-program environment
  // #ifdef MP
  uni.setClipboardData({
    data: '闽ICP备2025092232号',
    success: () => {
      uni.showToast({
        title: '备案号已复制',
        icon: 'none'
      });
    }
  });
  // #endif
}
</script>

<style scoped>
.beian-footer {
  width: 100%;
  z-index: 9999;
  text-align: center;
  padding: 10px 0;
  background-color: #f5f5f7;
  font-size: 12px;
  color: #666;
}
</style>