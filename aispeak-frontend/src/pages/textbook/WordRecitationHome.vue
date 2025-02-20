<template>
  <view class="container">
    <view class="header">
      <view class="hedtitle">艾宾浩斯记忆法</view>
      <view class="subtitle">
		  <text class="subtitlect">高效背词·科学记忆·对抗遗忘</text>
	  </view>
    </view>

    <view class="contentone">
		<view class="replacementplan">
			<image class="left-icon" src="@/assets/icons/word_refresh.svg"></image>
			<view class="replacementplan-title">重置计划</view>
		</view>
	  <view class="plan-section">
		<image class="section-img"></image>
		<view class="section-ct">
			<view class="oneline">
				<text class="oneline-subtitle">义务教育课程标准</text>
				<view class="oneline_btn">
					<image class="left-icon" src="@/assets/icons/parallel_double_arrow.svg"></image>
					<text class="section-title">切换单词书</text>
				</view>
			</view>
			<view class="twoline">
				小学热门单词书
			</view>
			
			<view class="progress-bar">
				<view 
				  class="progress-ct" 
				  :style="{ width: progress + '%' }"
				></view>
			 </view>
			
			<view class="threeline">
				<view class="threeline-title"> <text style="color: red;">5</text>/505</view>
				<view class="threeline-title"> 剩余<text style="color: red;">5</text>天</view>
			</view>
			
			
		</view>
	  </view>
	  <view class="intermediate-line"></view>

	  <view class="progress-section">
		  <view class="progress-left">
			<text class="progresslf">今日计划</text>
			 <image class="left-icon" src="@/assets/icons/time_round.svg"></image>
			 <text class="progressrt">预计需要<text style="color: red;">0</text>分钟</text> 
		  </view>
		  <view class="modify-btn">
			<image class="left-icon" src="@/assets/icons/edit_modify.svg"></image>
			<text class="section-title">修改计划</text>
		  </view>
	  </view>

	  <view class="task-section">
		<view class="task-title"><text>需新学</text> <text class="numtit" style="color: #F08833;">0</text> <text>词</text></view>
		<view class="task-title"><text>需复习</text> <text class="numtit" style="color: #ED6C43;">0</text> <text>词</text></view>
	  </view>
	  
	  <view class="contentonebtn">
		  <view class="btn-view">
			  <view class="learn-btn">再学一组</view>
		  </view>
		  <view class="btn-view">
		  	<view class="review-btn">复习完成</view>		  
		  </view>
		  
		  
	  </view>
	  
	</view>

	<view class="contenttwo">
		<view class="contenttwo-one">
			<view class="calendar-section">
			  <view class="calendar-title">本周打卡</view>
			</view>
			<view class="calendar-rt">
			  <view class="calendar-subtitle">已连续打卡<text style="color: #ED6C43;">1</text>天</view>
			  <view class="share-btn">晒一晒</view>
			</view>
		</view>
		
		
		
		<view class="contenttwo-days">
		  <view @tap="calendarItemclick(index)" class="calendar-item" v-for="(item, index) in weekstitList" :key="index">
			  <view class="item_top">{{item.week}}</view>
			  <view :class="weekindext==index?'item_middle_st':'item_middle'"><text>{{item.date}}</text></view>
			  <view :class="weekindext==index?'item_bottom_st':'item_bottom'"></view>
		  </view>
		</view>
	</view>
      

		
     <view class="record-section">
        <text class="record-title">学习记录</text>
        <view class="record-details">
          <text class="detail">5 今日学习/复习</text>
          <text class="detail">0 累计掌握</text>
          <text class="detail">2 分钟</text>
          <text class="detail">2 分钟</text>
        </view>
      </view>
	  
	  <view class="record-section">
	     <text class="record-title">学习记录</text>
	     <view class="record-details">
	       <text class="detail">5 今日学习/复习</text>
	       <text class="detail">0 累计掌握</text>
	       <text class="detail">2 分钟</text>
	       <text class="detail">2 分钟</text>
	     </view>
	   </view>
	   
	
		
		
	
	  
	  
    
  </view>
</template>

<script setup>
	import { ref } from 'vue';
	const progress = ref(20)
	const weekstitList = ref([
		{week:"周一",date:'17',isSelet:false},
		{week:"周二",date:'18',isSelet:false},
		{week:"周三",date:'19',isSelet:false},
		{week:"周四",date:'20',isSelet:false},
		{week:"周五",date:'21',isSelet:false},
		{week:"周六",date:'22',isSelet:false},
		{week:"周日",date:'23',isSelet:false},
	])
	const weekindext = ref(0)
// 你可以在这里添加一些逻辑代码

	function calendarItemclick(index) {
		weekindext.value = index
	}
</script>

<style scoped lang="scss">
.container {
  padding: 20rpx;
    /* background-color: #f0f0f0; /* 设置背景颜色 */ 
  background: linear-gradient(to bottom, #8cf588 0%, #f8f9fa 50%, #f8f9fa 50%, #f8f9fa 100%);

  // min-height: 90vh; /* 确保容器覆盖整个视口高度 */
  height: calc(100vh - 110rpx);
   overflow-y: auto;
  
}

.header {
  margin-bottom: 20rpx;
}

.title {
  /* font-size: 24rpx; */
  font-weight: bold;
}
.hedtitle {
	font-size: 70rpx;
	color: #245317;
	margin: 30rpx;
	text-align: center;
}
.subtitle {
  font-size: 32rpx;
  /* color: #666; */
  color: #245317;
  text-align: center;
}
.subtitlect {
	display: inline-block;
	height: 80rpx;
	line-height: 80rpx;
	padding: 0 20rpx;
	border: 2rpx solid #245317;
	border-radius: 40rpx;
}

.contentone {
	margin: 20rpx;
	border-radius: 24rpx;
	background-color: #fff;
	padding-bottom: 30rpx;
	.replacementplan {
		padding: 30rpx;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		// background-color: red;
		.replacementplan-title {
			margin-left: 10rpx;
			color: #666;
			font-size: 23rpx;
		}
		
	}
	.plan-section {
		display: flex;
		height: 200rpx;
		.section-img {
			margin: 20rpx;
			margin-top: 0;
			width: 130rpx;
			height: 200rpx;
			background-color: orange;
			border-radius: 24rpx;
		}
		.section-ct {
			flex: 1;
			.oneline {
				display: flex;
				justify-content: space-between;
				align-items: center;
				.oneline-subtitle {
					font-size: 30rpx;
					font-weight: bold;
				}
				.oneline_btn {
					height: 50rpx;
					margin-right: 20rpx;
					padding: 0 20rpx;
					display: flex;
					justify-content: center;
					align-items: center;
					border: 1rpx solid #05c160;
					border-radius: 25rpx;
					.section-title {
						color: #05c160;
						font-size: 23rpx;
						margin-left: 10rpx;
					}
					
				}
				
			}
		
			.twoline {
				font-size: 23rpx;
				color: #666;
			}
			.progress-bar {
				margin: 20rpx;
				margin-left: 0;
				height: 10rpx;
				background-color: #EFFEE8;
				.progress-ct {
					background-color: #05c160;
					height: 100%;
				}
			}
			.threeline {
				margin: 20rpx;
				margin-left: 0;
				display: flex;
				justify-content: space-between;
				align-items: center;
				.threeline-title {
					color: #666;
					font-size: 23rpx;
					margin-left: 10rpx;
				
				}
			}
		
		}
	}

	.intermediate-line {
		margin: 20rpx;
		height: 0.5rpx;
		background-color:#EBEEEC;
	}
	
	.progress-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		.progress-left {
			display: flex;
			justify-content: center;
			align-items: center;
			.progresslf {
				margin-left: 20rpx;
				margin-right: 10rpx;
				font-size: 30rpx;
				font-weight: bold;
			}
			.progressrt {
				margin-left: 10rpx;
				color: #666;
				font-size: 23rpx;
			}
		}
		.modify-btn {
			height: 50rpx;
			margin-right: 20rpx;
			padding: 0 20rpx;
			display: flex;
			justify-content: center;
			align-items: center;
			border: 1rpx solid #05c160;
			border-radius: 25rpx;
			.section-title {
				color: #05c160;
				font-size: 23rpx;
				margin-left: 10rpx;
			}
		}
	}
	
	
	.task-section {
		display: flex;
		justify-content: center;
		align-items: center;
		color: #666;
		margin:20rpx 0;
		.task-title {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 30rpx;
			// font-weight: 300;
			.numtit {
				margin: 0 5rpx;
				font-size: 50rpx;
				// font-weight: bold;
			}
		}
	}
	
	.contentonebtn {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: #fff;
		.btn-view {
			width: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
		}
		.learn-btn {
			background-color: #F08833;
			width: calc(100% - 66rpx);
			height: 66rpx;
			line-height: 66rpx;
			border-radius: 33rpx;
			text-align: center;
		}
		.review-btn {
			background-color: #ED6C43;
			width: calc(100% - 66rpx);
			height: 66rpx;
			line-height: 66rpx;
			border-radius: 33rpx;
			text-align: center;
		}
	}

}


.contenttwo {
	margin:0 20rpx;
	border-radius: 24rpx;
	background-color: #fff;
	padding: 30rpx 0;
	
	.contenttwo-one {
		display: flex;
		align-items: center;
		justify-content: space-between;
		.calendar-section {
			margin-left: 20rpx;
			margin-right: 10rpx;
			font-size: 30rpx;
			font-weight: bold;
		}
		.calendar-rt {
			display: flex;
			align-items: center;
			justify-content: flex-end;
			font-size: 23rpx;
			color: #666;
			.share-btn {
				color: #fff;
				background-color:#ED6C43;
				border-radius: 8rpx;
				margin: 0 20rpx;
				padding: 5rpx 15rpx;
			}
			
		}
	}
	
	.contenttwo-days {
		margin: 30rpx;
		display: flex;
		justify-content: space-between;
		// background-color: blue;
		gap: 30rpx; /* 设置间隙的宽度 */
		.calendar-item {
			flex: 1; /* 让每个元素均匀分配空间 */
			text-align: center;
			.item_top {
				text-align: center;
				color: #666;
				font-size: 23rpx;
			}
			.item_middle {
				margin-top: 10rpx;
				width: 100%;
				padding-top: 100%; /* 高度等于宽度 */
				position: relative; /* 为内部内容定位做准备 */
				border-radius: 50%;
				background-color: #EBEEEC;
				color: #666;
				border: 1rpx solid #666;
				font-size: 21rpx;
				text {
				    position: absolute;
				    top: 50%;
				    left: 50%;
				    transform: translate(-50%, -50%); /* 居中 */
				    font-size: 21rpx;
				}
				
			}
			.item_middle_st{
				margin-top: 10rpx;
				width: 100%;
				padding-top: 100%; /* 高度等于宽度 */
				position: relative; /* 为内部内容定位做准备 */
				border-radius: 50%;
				background-color: #DCFDED;
				color: #5AC568;
				border: 1rpx solid #5AC568;
				font-size: 21rpx;
				text {
				    position: absolute;
				    top: 50%;
				    left: 50%;
				    transform: translate(-50%, -50%); /* 居中 */
				    font-size: 21rpx;
				}
				
			}
			
			.item_bottom {
				margin-top: 10rpx;
				height: 10rpx;
				border-radius: 5rpx;
				background-color: #EBEEEC;
			}
			.item_bottom_st {
				margin-top: 10rpx;
				height: 10rpx;
				border-radius: 5rpx;
				background-color: #5AC568;
			}
		}
	}
	
	
}

.left-icon {
	height: 20rpx;
	width: 20rpx;
}



</style>