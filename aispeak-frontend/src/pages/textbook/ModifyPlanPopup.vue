<template>
  <view class="popup-container" v-if="visible">
    <view class="popup-mask" @tap="close"></view>
    <view class="popup-content">
      <view class="popup-header">
        <text class="popup-title">修改计划</text>
        <view class="close-btn" @tap="close">×</view>
      </view>
	  <view class="popup-Instructions">
		  完成日期：2025年03月09日预计每天5分钟
	  </view>
      <view class="popup-tit">
        <view class="plan-titItem">
          每天学习单词数
        </view>
		<view class="plan-titItem">
		  完成天数
		</view>
      </view>
      <view class="popup-body">
		  <scroll-view class="picview" scroll-y>
			<view @tap="planoptionitemclick(item.num)" :class="item.num==wordgivendaynum?'plan-option-st':'plan-option'"  v-for="(item, index) in picdata" :key="index">
			  <view class="plan-option-item">{{ item.num }} 个</view>
			  <view class="plan-option-right">
				<view class="one">{{ item.date }}</view>
				<view class="two" v-if="item.num==wordgivendaynum">
					<image class="left-icon" src="@/assets/icons/word_dagou.svg"></image>
				</view>
				<view class="one" v-else></view>
			  </view>
			</view>
		  </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  visible: Boolean,
  currentPlan: Number
});

const picdata = ref([
	{num:5,date:"10天"},
	{num:10,date:"5天"},
	{num:15,date:"4天"},
	{num:20,date:"3天"},
	{ num: 30, date: "1天" }
])
const wordgivendaynum = ref(5)

const emit = defineEmits(['update:visible', 'updatePlan']);

const newPlan = ref(props.currentPlan);

const close = () => {
  emit('update:visible', false);
};

const confirm = () => {
  emit('updatePlan', newPlan.value);
  close();
};
const planoptionitemclick = (num) => {
	wordgivendaynum.value = num
}
</script>

<style scoped lang="scss">
.popup-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.popup-content {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  padding: 20rpx;
  box-sizing: border-box;
  animation: slide-up 0.3s ease;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  // padding-bottom: 20rpx;
  // border-bottom: 1rpx solid #eee;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
   flex-grow: 1; /* 让标题占据剩余空间 */
   text-align: center; /* 文字居中 */
}

.close-btn {
  font-size: 40rpx;
  color: #666;
}
.popup-Instructions {
	margin: 10rpx 30rpx;
	background-color: #FDF6F1;
	height: 70rpx;
	border-radius: 35rpx;
	line-height: 70rpx;
	text-align: center;
	font-size: 26rpx;
	color: #666;
}
.popup-tit {
	margin: 20rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
}
.plan-titItem {
	flex: 1;
	text-align: center;
	font-size: 30rpx;
}

.popup-body {
  height: 180rpx; /* 设置固定高度，确保滑动区域可见 */
  padding: 20rpx 0;
}

.picview {
  height: 100%; /* 让 scroll-view 占满父容器高度 */
}

.plan-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60rpx;
  border-bottom: 1rpx solid #eee;
  font-size: 28rpx;
  color: #666;
}
.plan-option-st {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60rpx;
  border-bottom: 1rpx solid #eee;
  font-size: 35rpx;
  color: #333;
  background-color: #E8FEF2;
}
.plan-option-item {
	flex: 1;
  text-align: center;
  
}
.plan-option-right {
	flex: 1;
	display: flex;
	justify-content: space-between;
	align-items: center;
	.one {
		flex: 1;
		text-align: right;
		// background-color: #05c160;
	}
	.two {
		flex: 1;
		text-align: left;
	}
}

.popup-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}

.popup-btn {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border-radius: 10rpx;
  margin: 0 10rpx;
}

.cancel-btn {
  background-color: #eee;
  color: #333;
}

.confirm-btn {
  background-color: #05c160;
  color: #fff;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
.left-icon {
	  width: 30rpx;
	  height: 30rpx;
	  margin-left: 10rpx;
  }
</style>