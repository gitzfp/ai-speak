<template>
  <view v-if="visible" class="reset-plan-popup">
    <view class="popup-overlay" @tap="closePopup"></view>
    <view class="popup-content">
      <view class="popup-message">
        恭喜你完成了{{ book.grade }} {{ book.term }}的单词学习，是否重新学习？
      </view>
      <view class="popup-buttons">
		  <view class="popup-button cancel" @tap="closePopup">取消</view>
		  <view class="popup-button confirm" @tap="confirmReset">重新学习</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, defineEmits,defineProps } from "vue"
const emit = defineEmits()
// 定义 props
const props = defineProps({
  book: {
    type: Object,
    default: () => ({}),
  }
});


// 控制弹窗显示/隐藏
const visible = ref(false);

// 打开弹窗
const openPopup = () => {
  visible.value = true;
};

// 关闭弹窗
const closePopup = () => {
  visible.value = false;
};

// 确认重置
const confirmReset = () => {
  // 这里可以添加重置计划的逻辑
  // console.log('重置计划');
  closePopup();
  emit('confirm');
};

// 暴露方法给父组件调用
defineExpose({
  openPopup,
  closePopup,
});
</script>

<style scoped lang="scss">
.reset-plan-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.popup-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.popup-content {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 45rpx;
  width: 70%;
  max-width: 600rpx;
  z-index: 1000;
}

.popup-title {
  font-size: 32rpx;
  // font-weight: bold;
  text-align: center;
  margin-bottom: 20rpx;
}

.popup-message {
  font-size: 28rpx;
  // color: #666;
  color: #141414;
  text-align: center;
  margin-bottom: 30rpx;
}

.popup-buttons {
  display: flex;
  justify-content: space-between;
  gap:40rpx
}

.popup-button {
  flex: 1;
  text-align: center;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
  font-size: 28rpx;
  cursor: pointer;
  
}

.confirm {
  background-color: #f5f5f5;
  color: #333;
  // border: 1rpx solid #5ac467;
  color:#666;
  // margin-right: 20rpx;
}

.cancel {
  background-color: #5ac467;
  color: #fff;
}
</style>