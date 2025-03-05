<template>
  <view class="popup-container" v-if="visible">
    <view class="popup-mask" @tap="close"></view>
    <view class="popup-content">
      <view class="popup-header">
        <text class="popup-title">修改计划</text>
        <view class="close-btn" @tap="close">×</view>
      </view>
	  <view class="popup-Instructions">
		  完成日期：<text style="color: orange;">{{yjcompleteDate}} </text> 预计每天 {{currentPlan}} 分钟
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
			<view @tap="planoptionitemclick(item.num)" :class="item.num==currentPlan?'plan-option-st':'plan-option'"  v-for="(item, index) in picdata" :key="index">
			  <view class="plan-option-item">{{ item.num }} 个</view>
			  <view class="plan-option-right">
				<view class="one">{{ item.date }}天</view>
				<view class="two" v-if="item.num==currentPlan">
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
import { ref,computed } from 'vue';

const props = defineProps({
  visible: {
      type: Boolean,
      default: false, // 默认值为 false
    },
    currentPlan: {
      type: Number,
      default: 0, // 默认值为 0
    },
    unlearnednum: {
      type: Number,
      default: 0, // 默认值为 0
    },
});


const yjcompleteDate = computed(() => {
	// 获取当前日期
	const today = new Date();
	var daysToAdd = 0;
	if (props.currentPlan>0) {
		const jihua = picdata.value.find(item => item.num === props.currentPlan);
		console.log("jihua")
		console.log(jihua)
		daysToAdd = jihua.date-1
	}
	// 在当前日期上加指定天数
	today.setDate(today.getDate() + daysToAdd);
	
	// 格式化年月日
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要 +1
	const day = String(today.getDate()).padStart(2, '0');
	
	// 输出结果
	const formattedDate = `${year}-${month}-${day}`;
	return formattedDate
})

const picdata = computed(() => {
	if (props.unlearnednum>0) {
		var xzarr = []
		var num = 1;
		while(num<=50) {
			
			let datenum = Math.ceil(props.unlearnednum / num);
			xzarr.push({num:num,date:datenum})
			if (num<5) {
				num++;
			} else {
				num+=5;
			}
		}
		return xzarr
	}
	return [
	{num:1,date:0},
	{num:2,date:0},
	{num:3,date:0},
	{num:4,date:0},
	{num:5,date:0},
	{num:10,date:0},
	{num:15,date:0},
	{num:20,date:0},
	{ num: 30, date:0},
	{ num: 35, date:0},
	{ num: 40, date:0},
	{ num: 45, date:0},
	{ num: 50, date:0}]
})
const emit = defineEmits(['update:visible', 'updatePlan']);



const close = () => {
  emit('update:visible', false);
};

const planoptionitemclick = (num) => {
	if (props.currentPlan != num) {
		emit('updatePlan', num)
	}
	close();
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