<template>
  <view class="popup-container">
    <view class="popup-content">
      <view class="popup-header">
        <text>背单词完成一组</text>
      </view>
      <view class="popup-body">
        <text>恭喜你完成本组单词的学习，是否进行单词拼写增强记忆？</text>
      </view>
      <view class="popup-footer">
        <view class="btnleft" @click="handleCancel">放弃拼写</view>
        <view class="btnright" @click="handleStart">开始拼写</view>
      </view>
    </view>
  </view>
</template>

<script setup>
	import { ref, defineEmits } from "vue";
	
	const emit = defineEmits();
	
const handleCancel = () => {
  // 处理放弃拼写的逻辑
  // console.log('放弃拼写');
  emit("giveupspelling")
};

const handleStart = () => {
  // 处理开始拼写的逻辑
  // console.log('开始拼写');
  emit("startSpelling")
};
</script>

<style scoped>
.popup-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
   z-index: 1000;
}

.popup-content {
  background-color: white;
  padding: 40rpx;
  border-radius: 20rpx;
  width: 600rpx;
  max-width: 80%;
  text-align: center;
}

.popup-header {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.popup-body {
  font-size: 32rpx;
  margin-bottom: 40rpx;
  color: #3B3B3B;
}

.popup-footer {
  display: flex;
  justify-content: space-around;
}

.btnleft {
  padding: 0 60rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background-color: #f5f5f5;
  color: #A7A7A7;
  font-size: 32rpx;
}

.btnright {
  padding: 0 60rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background-color: #4CAF50;
  color: white;
  font-size: 32rpx;
}

button:hover {
  background-color: #45a049;
}
</style>