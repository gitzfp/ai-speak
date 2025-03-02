<template>
  <view class="container">
<!-- 	white_back.svg -->
	<view class="headView" :style="{ paddingTop: statusBarHeight + 'px', height: '44px' }">
		<image @tap="handleBackPage" class="head-icon" src="@/assets/icons/white_back.svg"></image>
		<view class="head-text">单词完成报告</view>
	</view>
    <!-- 顶部区域 -->
    <view class="top-section">
      <view class="user-info">
        <text class="motivation">今日学习已完成，坚持学习你会越来越棒的！</text>
      </view>
      <view class="stats">
        <view class="stat-item">
          <view class="stat-value">10</view>
          <view class="stat-label">今日新学</view>
        </view>
        <view class="stat-item">
          <view class="stat-value">0</view>
          <view class="stat-label">复习</view>
        </view>
        <view class="stat-item">
          <view class="stat-value">2</view>
          <view class="stat-label">学习时长</view>
        </view>
        <view class="stat-item">
          <view class="stat-value">8</view>
          <view class="stat-label">已学习</view>
        </view>
      </view>
    </view>

    <!-- 背单词记录 -->
    <view class="word-section">
		<view class="word-section-tit">
			<view class="section-title">背单词记录</view>
			<view class="word-count">共{{ allWords.length }}个单词</view>
		</view>
      
      <view class="word-list">
        <view v-for="(word, index) in allWords" :key="word.word_id" class="word-item">
          <text class="word-text">{{ word.word }}</text>
		  <image @tap="phoneticClick(word)" class="left-icon" src="@/assets/icons/phonic.svg"></image>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-section">
      <view @tap="handleBackPage" class="action-button">再学一组</view>
      <view class="action-button">去分享！</view>
    </view>
  </view>
</template>

<script setup>
	import { ref, watch,onMounted,computed,nextTick,onUnmounted} from 'vue';
	import CommonHeader from "@/components/CommonHeader.vue"
	import { onLoad } from '@dcloudio/uni-app'
	
	const allWords = ref([])
	const book_id = ref('')
	const currentAudio = ref(null);
	const backPageNum = ref(1)
	
	const statusBarHeight = ref(0);
	const customBarHeight = ref(0);
	
	// 组件挂载
		onMounted(() => {
			const systemInfo = uni.getSystemInfoSync();
			  statusBarHeight.value = systemInfo.statusBarHeight || 0;
			  customBarHeight.value = (systemInfo.statusBarHeight || 0) + 44; // 44 是导航栏的默认高度
		});
	
	const phoneticClick = async (item) => {
	  if (item.sound_path.length <= 0) return;
	  stopCurrentAudio();
	  const audio = uni.createInnerAudioContext();
	  currentAudio.value = audio;
	  audio.src = item.sound_path;
	  audio.onEnded(() => {
	  });
	  audio.play();
	};
	
	const stopCurrentAudio = () => {
	  if (currentAudio.value) {
	    try {
	      currentAudio.value.stop();
	      // currentAudio.value?.destroy();
		  currentAudio.value = null;
	    } catch (error) {
	      console.error("Error stopping audio:", error);
	    }
	  }
	};
	
// 这里可以定义一些响应式数据或逻辑
	const handleBackPage = () => {
	  uni.navigateBack({
	      delta: backPageNum.value, // 返回两层
	      success: () => {
	        console.log('返回成功');
	      },
	      fail: (err) => {
	        console.error('返回失败', err);
	      },
	    });
	}
	
	onLoad(async (options) => {
	     const {bookId,learningreportWords,backPage} = options
			book_id.value = bookId
			backPageNum.value = backPage
			console.log("backPageNum.value")
			console.log(backPageNum.value)
			// 获取数据
			uni.getStorage({
			key: learningreportWords,
			success: function (res) {
				console.log('获取到的数据:');
				allWords.value = JSON.parse(res.data);
			   
			},
			fail: function (err) {
				console.log('获取数据失败', err);
			}
			});
			
	})
	
	

</script>

<style lang="scss" scoped>
	// page {
	//   background-color: #5AC467; /* 设置全局页面背景颜色 */
	// }
	
	.headView {
		display: flex;
		justify-content: space-between;
		align-items: center;
		// height: 96rpx;
		.head-icon {
			margin-left: 20rpx;
			height: 40rpx;
			width: 40rpx;
		}
		.head-text {
			flex: 1;
			text-align: center;
			color: #fff;
			font-size: 36rpx;
		}
	}

.container {
  // display: flex;
  // flex-direction: column;
  // padding: 20rpx;
  // // background-color: #f0f0f0;
  // // background-color: #5AC467; 
  background-color: #5AC467;
  height: 100vh;
}

.top-section {
  background-color: #fff;
  margin: 30rpx;
  border-radius: 10rpx;
  color: white;
}

.user-info {
  // margin: 30rpx;
  padding-top: 30rpx;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.user-id {
  font-size: 32rpx;
  font-weight: bold;
}

.motivation {
	width: 60%;
  font-size: 36rpx;
  color: #5AC467;
}

.stats {
  display: flex;
  justify-content: space-between;
  padding: 30rpx;
}

.stat-item {
  text-align: center;
  
}

.stat-value {
  font-size: 28rpx;
  font-weight: bold;
  color: red;
}

.stat-label {
  font-size: 20rpx;
  color: grey;
}

.ad-section {
  background-color: #ff9800;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-top: 20rpx;
  color: white;
}

.ad-title {
  font-size: 28rpx;
  font-weight: bold;
}

.ad-subtitle {
  font-size: 20rpx;
}

.ad-button {
  background-color: white;
  color: #ff9800;
  margin-top: 10rpx;
}

.word-section {
  background-color: white;
  margin: 30rpx;
  border-radius: 10rpx;
  // margin-top: 20rpx;
  min-height: auto; // 高度自适应内容
  max-height: 50vh; // 最大高度为 60vh
  overflow-y: auto; // 允许垂直滚动
}
.word-section-tit {
	padding: 30rpx;
}
.section-title {
  font-size: 28rpx;
  // font-weight: bold;
}

.word-count {
	margin-top: 10rpx;
  font-size: 20rpx;
  color: #666;
}

.word-list {
  margin-top: 10rpx;
}

.word-item {
	border-top:#979797 0.5rpx solid;;
  font-size: 24rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left-icon {
	height: 40rpx;
	width: 40rpx;
}

.bottom-section {
  display: flex;
  justify-content: space-between;
  margin: 30rpx;
}

.action-button {
  flex: 1;
  margin: 0 20rpx;
  background-color: #F08D35;
  height: 88rpx;
  color: white;
  border-radius: 15rpx;
  line-height: 88rpx;
  text-align: center;
}
</style>