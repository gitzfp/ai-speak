<template>
  <view class="container">
<!-- 	white_back.svg -->
	<view class="headView" :style="{ paddingTop: statusBarHeight + 'px', height: '44px' }">
		<image @tap="handleBackPage" class="head-icon" src="@/assets/icons/black_back.svg"></image>
		<view v-if="report_type==0" class="head-text">单元学习单词报告</view>
		<view v-else-if="report_type==3" class="head-text">单元拼写单词报告</view>
		<view v-else class="head-text">单元句子跟读报告</view>
	</view>
    <!-- 顶部区域 -->
    <view class="top-section">
		<view class="top-section-p">积分+{{total_points}}</view>
		<template v-if="report_type!=4">
			<view class="top-section-ins" v-if="errorCountGreaterThanZero==0">全部正确<text style="color: red;">积分翻倍</text></view>
			<view class="top-section-ins" v-else>错误{{errorCountGreaterThanZero}}个</view>
		</template>
    </view>

    <!-- 背单词记录 -->
    <view class="word-section">
		
		<view class="item_view">
			<template v-if="report_type!=4">
				<view style="background-color: #FEF4B9;" class="item_icon">
					<view class="item_icon_two">本次学习词汇</view>
					<view class="item_icon_one"><text style="font-size: 40rpx;margin-right: 5rpx;">{{allWords.length}}</text>词</view>
				</view>
				<view style="background-color: #DFFDC7" class="item_icon">
					<view class="item_icon_two">本次正确率</view>
					<view class="item_icon_one"><text style="font-size: 40rpx;margin-right: 5rpx;">{{errorPercentage}}</text>%</view>
				</view>
			</template>
			<template v-else>
				<view style="background-color: #FEF4B9;" class="item_icon">
					<view class="item_icon_two">本次学习句子</view>
					<view class="item_icon_one"><text style="font-size: 40rpx;margin-right: 5rpx;">{{allWords.length}}</text>句</view>
				</view>
				<view style="background-color: #DFFDC7" class="item_icon">
					<view class="item_icon_two">本次开口总次数</view>
					<view class="item_icon_one"><text style="font-size: 40rpx;margin-right: 5rpx;">{{totalSpeakCount}}</text>次</view>
				</view>
			</template>
			
		</view>
		
      
      <view class="word-list">
		<template v-if="report_type!=4">
			<view v-for="(word, index) in allWords" :key="word.word_id" class="word-item">
			  <text class="word-text">{{ word.word }}</text>
			  <text v-if="report_type==3" class="word-text">拼错<text style="color: red;">{{ word.error_count }}</text>次</text>
			  <text v-else class="word-text">答错<text style="color: red;">{{ word.error_count }}</text>次</text>
			</view>
		</template>
		<template v-else>
			<view v-for="(word, index) in allWords" :key="word.word_id" class="word-item">
			  <view class="word-text">
				<view>{{ word.english }}</view>
				<view style="margin-top: 10rpx;">{{ word.chinese }}</view>
			  </view>
			  <view class="word-text">开口次数<text style="color: red;">{{ word.speak_count }}</text>次</view>
			</view>
		</template>
        
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-section">
      <view @tap="handleBackPage" class="action-button">返回</view>
      <view class="action-button">去分享！</view>
    </view>
  </view>
</template>

<script setup>
	import { ref, watch,onMounted,computed,nextTick,onUnmounted} from 'vue';
	import CommonHeader from "@/components/CommonHeader.vue"
	import { onLoad } from '@dcloudio/uni-app'
	import study from '@/api/study';
	
	const allWords = ref([])
	const total_points = ref(0)
	const currentAudio = ref(null);
	const backPageNum = ref(1)
	
	const report_type = ref(0)
	
	const statusBarHeight = ref(0);
	const customBarHeight = ref(0);
	//学习记录
	const studyRecord = ref({
		new_words: 0,
		review_words: 0,
		duration:0,
		total_duration: 0,
		total_mastered_words: 0,
		total_learned_words:0,
		
	})
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
	      delta: backPageNum.value, // 返回几层
	      success: () => {
	        console.log('返回成功');
			uni.$emit('refrespoints', { action: 'updatepoints' }); // 传递参数
	      },
	      fail: (err) => {
	        console.error('返回失败', err);
	      },
	    });
	}
	
	const errorCountGreaterThanZero = computed(() => {
	  return allWords.value.filter(word => word.error_count > 0).length;
	});
	
	const errorPercentage = computed(() => {
	  const totalWords = allWords.value.length;
	  if (totalWords === 0) return 0; // 避免除以零
	  var correctCountGreaterThanZero = allWords.value.filter(word => word.error_count <= 0).length;
	  return (correctCountGreaterThanZero / totalWords) * 100;
	});
	
	const totalSpeakCount = computed(() => {
	  return allWords.value.reduce((sum, word) => sum + (word.speak_count || 0), 0);
	});
	
	
	onLoad(async (options) => {
	     const {totalpoints,unitreportWords,backPage,type} = options
			total_points.value = totalpoints
			backPageNum.value = backPage
			report_type.value = type
			// 获取数据
			uni.getStorage({
			key: unitreportWords,
			success: function (res) {
				console.log('获取到的数据:');
				const data = JSON.parse(res.data);
				
				if (report_type.value == 4) {
					// 过滤出 isHaverated == 1 的数据
					allWords.value = data.filter(item => item.isHaverated == 1);
				} else {
					allWords.value = data;
				}
				
			   
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
			// scolor: #fff;
			color: #333;
			font-size: 36rpx;
		}
	}

.container {
  // display: flex;
  // flex-direction: column;
  // padding: 20rpx;
  background-color: #fff;
  // background-color:  #C9FACA;
  height: 100vh;
}

.top-section {
  background-color: #fff;
  margin: 100rpx;
  // border-radius: 10rpx;
  // text-align: center;
  display: flex;
  justify-content: space-between;
}
.top-section-p {
	color: orange;
	font-size: 30rpx;
}
.top-section-ins {
	color: #333;
	font-size: 30rpx;
}

.item_view {
	width: calc(100% - 50rpx);
	margin-left: 25rpx;
	box-sizing: border-box;
	display: flex;
	justify-content: space-between;
	.item_icon {
		width: calc(50% - 10rpx);
		box-sizing: border-box;
		// border: #f0f0f0 1rpx solid;
		// border: #ECECEC 1rpx solid;
		// box-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1);
		border-radius: 30rpx;
		padding: 30rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin-bottom: 10rpx;
		.item_icon_one {
			// color: orange;
			font-size: 30rpx;
		}
		.item_icon_two {
			margin-top: 20rpx;
		}
	} 
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
  // background-color: #6AD670;
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
  margin-top: 50rpx;
}

.word-item {
  // border-bottom:0.5rpx solid #7F8583;
  border-bottom:1rpx dashed #979389;
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
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 150rpx;
  display: flex;
  justify-content: space-between;
  // margin: 30rpx;
}

.action-button {
  flex: 1;
  margin: 0 20rpx;
  // background-color: #F08D35;
  background-color: #6AD670;
  height: 88rpx;
  color: white;
  border-radius: 15rpx;
  line-height: 88rpx;
  text-align: center;
}
</style>