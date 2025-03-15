<template>
	<view class="container">
		<view class="headView" :style="{ paddingTop: statusBarHeight + 'px', height: '44px' }">
			<image @tap="handleBackPage" class="head-icon" src="@/assets/icons/black_back.svg"></image>
			<view class="head-text">句子单元跟读</view>
		</view>
		
		<view v-if="sentencesList.length>0" class="content_view">
			<view class="progressview">
				<view class="progressbar">
					<view :style="{ width: progress + '%' }" class="contentitem"></view>
				</view>
				<view class="progresstext">
					{{progresstext}}
				</view>
			</view>
			<view  class="sentence-item">
				<view class="points_view">积分：{{totalpoints}}</view>
				<view class="sentence-top">
					<view class="sentence-left">
						<view class="english">{{ optionSentence.english }}</view>
						<view class="chinese">{{ optionSentence.chinese }}</view>
					</view>
					<view class="audio-icon">
						<image @tap="playbuttonclick" class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
					</view>
				</view>
				<FollowReading
					ref="followReadingref"
					:isUnit="true"
				    :sentence="optionSentence.english"
					:optionSentence="optionSentence"
					@evaluationResult="evaluationResult"
					@reevaluation="reevaluation"
				/>
				
			</view>
			
		</view>
		
		<view v-if="isShowmark" class="btnview">
			<view @tap="clicknext" class="tab-btn">下一个</view>
		</view>
		

	</view>
</template>

<script setup>
	import { ref,computed,watch,onMounted, onUnmounted, Text,onUpdated,nextTick} from 'vue';
	
	import { onLoad } from '@dcloudio/uni-app'
	import textbook from '@/api/textbook'
	import study from '@/api/study';
	import FollowReading from './components/FollowReading.vue'
	
	// 获取设备的安全区域高度
	const statusBarHeight = ref(0);
	const customBarHeight = ref(0);
	
	const lesson_id = ref('')
	const book_id = ref('')
	
	const sentencesList = ref([])
	const currentIndext = ref(0);
	const progressIndext = ref(0)
	
	const totalpoints = ref(0)
	
	
	const isShowmark = ref(false)
	const currentAudio = ref(null)
	
	const followReadingref = ref(null)
	
	onMounted(() => {
		const systemInfo = uni.getSystemInfoSync();
		statusBarHeight.value = systemInfo.statusBarHeight || 0;
		customBarHeight.value = (systemInfo.statusBarHeight || 0) + 44; // 44 是导航栏的默认高度
		
		setTimeout(() => {
		    playbuttonclick()
			isShowmark.value = (optionSentence.value.progress_data && optionSentence.value.progress_data.length > 20)
		}, 500);
		
		uni.$on('start_recording', (params) => {
		    console.log('收到全局事件，参数:', params);
		    if (params.action === 'recording') {
				stopCurrentAudio()
		    }
		  });
		
	});
	
	onUnmounted(() => {
		stopCurrentAudio()
		uni.$off('start_recording'); // 组件卸载时移除监听
		
	})
	
	// 监听 currentIndext 的变化
	watch(currentIndext, (newValue, oldValue) => {
	    // 在这里执行你的逻辑
	    if (newValue !== oldValue) {
	        // 例如：调用某个方法
	        isShowmark.value = (optionSentence.value.progress_data && optionSentence.value.progress_data.length > 20)
	    }
	});
	
	const submitreslutStudyProgressReport = async(bookId, lessonId, reports,isDone = true)=> {
		try {
		
			if (isDone) {
				// 显示加载中状态
				uni.showLoading({
				title: '报告生成中...',
				mask: true, // 防止用户点击
				});
			}
			let statusNum = isDone==true?1:0
			
			
			const response = await study.submitStudyProgressReport(bookId, lessonId,reports,statusNum);
			
			
			if (isDone)  { //全部完成才会跳转了
				uni.hideLoading();
				const unitreportWords = 'unitreportWords';
				
				uni.setStorage({
				  key: unitreportWords,
				  data: JSON.stringify(sentencesList.value),
				  success: function () {
					console.log('数据存储成功');
					// 跳转到学习页面
					uni.navigateTo({
					  url: `/pages/textbook/UnitWordreport?unitreportWords=${unitreportWords}&totalpoints=${totalpoints.value}&backPage=2&type=4`, // 将缓存键名传递给学习页面
					});
				  },
				  fail: function (err) {
					console.log('数据存储失败', err);
				  }
				});
			} else { //直接返回了
				//发消息更新首页积分
				uni.$emit('refrespoints', { action: 'updatepoints' });
				uni.navigateBack()
			}	
			
			
			
				
		} catch (error) {
		  
		  if (isDone)  {
		  	// 隐藏加载中状态
			uni.hideLoading();
	
			// 请求失败后的逻辑
			console.error('提交学习进度报告失败:', error);
			uni.showToast({
			title: '提交失败，请重试',
			icon: 'none',
			});
		  } else { //直接返回了
			uni.navigateBack()
		  }	
		  
		}
	}
	
	
	
	const clicknext = () => {
		if (isShowmark.value) {
			isShowmark.value = false
			 stopCurrentAudio()
			if (currentIndext.value==(sentencesList.value.length-1)) {
				progressIndext.value = sentencesList.value.length
				
				const haveratedSentences = sentencesList.value.filter(
				  (sentence) => sentence.isHaverated === 1
				);
				if (haveratedSentences.length>0) {
					//这边是全部完成的
					submitreslutStudyProgressReport(book_id.value,lesson_id.value,sentencesList.value,true)
				} else {
					uni.showToast({
					  title: '当前没有可提交的数据，是否返回上一页',
					  icon: 'none',
					});
				}
				
				
			} else {
				currentIndext.value++;
				progressIndext.value = currentIndext.value
				
				
				if (!(optionSentence.value.progress_data && optionSentence.value.progress_data.length > 20)) {
					followReadingref.value.resetRefresh()
				}
				
				setTimeout(() => {
				    playbuttonclick()
				}, 500);
			}
		}
		
	}
	
	const reevaluation = () => {
		optionSentence.value.isHaverated = 0
		optionSentence.value.progress_data=""
		isShowmark.value = false
	}
	
	const evaluationResult = (pronunciationResult,voiceFile) => {
		optionSentence.value.json_data = pronunciationResult
		optionSentence.value.voice_file = voiceFile
		optionSentence.value.isHaverated = 1
		isShowmark.value = true
		optionSentence.value.speak_count +=1
		if (pronunciationResult.pronunciation_score < 60) {
			if (optionSentence.value.points === 0) {
				optionSentence.value.points += 1; // 积分加1
				totalpoints.value += 1; // 总积分加1
			}
		} else {
			if (optionSentence.value.points !== 2) {
				 const previousPoints = optionSentence.value.points; // 保存原有积分
				 optionSentence.value.points = 2; // 积分更新为2
				 totalpoints.value += (2 - previousPoints); // 更新总积分
			}
		}
	}
	
	const progress = computed(() => {
		   if (sentencesList.value.length>0) {
			   let percentage =  (progressIndext.value / sentencesList.value.length) * 100;
			   return percentage
		   } else {
			  return 0 
		   }
	});
	const progresstext = computed(() => {
		   if (sentencesList.value.length>0) {
			   var jdnum = progressIndext.value
			   var totalnum = sentencesList.value.length
			   return jdnum+"/"+totalnum
		   } else {
			  return "" 
		   }
	});
	
	
	const optionSentence = computed(() => {
		return sentencesList.value[currentIndext.value]
	});

	
	const playbuttonclick = () => {
		stopCurrentAudio();
		const audio = uni.createInnerAudioContext();
		currentAudio.value = audio;
		audio.src = optionSentence.value.audio_url;
		
		// 设置时间范围
		if (optionSentence.value.audio_start && optionSentence.value.audio_end) {
		  const startTime = optionSentence.value.audio_start / 1000
		  const endTime = optionSentence.value.audio_end / 1000
		  audio.startTime = startTime
		  // 监听播放进度
		  audio.onTimeUpdate(() => {
		    if (audio.currentTime >= endTime - 0.1) { // 防止浮点误差
		      stopCurrentAudio()  // 处理播放结束
		    }
		  })
		}
		
		audio.play();
	}
	const stopCurrentAudio = () => {
		if (currentAudio.value) {
		  currentAudio.value.pause();
		  try {
		    currentAudio.value.stop();
			  currentAudio.value = null;
		  } catch (error) {
		    console.error("Error stopping audio:", error);
		  }
		  currentAudio.value = null;
		}
	}

	// 这里可以定义一些响应式数据或逻辑
	const handleBackPage = () => {
		if (progressIndext.value != sentencesList.value.length) {
			// 筛选已评分的句子的数组
			const haveratedSentences = sentencesList.value.filter(
			  (sentence) => sentence.isHaverated === 1
			);
			if (haveratedSentences.length>0) {
				submitreslutStudyProgressReport(book_id.value,lesson_id.value,haveratedSentences,false)
			} else {
				uni.navigateBack()
			}	
		} else {
			uni.navigateBack()
		}
	}
	

	onLoad(async (options) => { 
		const { bookId,lessonId} = options;
		book_id.value = bookId
		lesson_id.value = lessonId
		lessonSentences(bookId,lessonId)
	})
	
	const lessonSentences = async (bookId, lessonId) => {
	  try {
		  console.log("开始请求")
	    const response = await textbook.getLessonSentences(bookId, lessonId);
		
		// 创建新数组，并添加 error_count 和 points 字段，默认值为 0
		const sentences = response.data.sentences.map(sentence => ({
		...sentence,
		word:sentence.english,
		content_id:sentence.id,
		content_type:4,
		error_count: 0,
		points: 0,
		speak_count:0,
		isHaverated:0,
		}));
		
		
		
		// 排序逻辑：progress_data 有值且长度大于 20 的排在前面
		sentences.sort((a, b) => {
		  const aHasProgress = a.progress_data && a.progress_data.length > 20;
		  const bHasProgress = b.progress_data && b.progress_data.length > 20;
	
		  if (aHasProgress && !bHasProgress) return -1; // a 排在 b 前面
		  if (!aHasProgress && bHasProgress) return 1; // b 排在 a 前面
		  return 0; // 保持原有顺序
		});
	
		// 在排序后的数组中，找到第一个不满足条件的下标
		const firstInvalidIndex = sentences.findIndex(
		  (sentence) => !(sentence.progress_data && sentence.progress_data.length > 20)
		);
		
		if (firstInvalidIndex != -1) {
			console.log("跑进去了")
			currentIndext.value = firstInvalidIndex;
			progressIndext.value = currentIndext.value
		}
		sentencesList.value = sentences;
		
	  } catch (error) {
	    console.error('获取列表失败:', error);
	    uni.showToast({
	      title: '获取列表失败',
	      icon: 'none',
	    });
	  }
	};
	
	
</script>

<style scoped lang="scss">
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		height: 100vh;
		/* background-color: #ffffff; */
		background-color: #f5f5f5;
	}
	.headView {
		width: 100%;
		background-color: #fff;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 96rpx;
		.head-icon {
			margin-left: 20rpx;
			height: 40rpx;
			width: 40rpx;
		}
		.head-text {
			flex: 1;
			text-align: center;
			font-size: 36rpx;
		}
	}
	.content_view {
		flex: 1;
		width: 100%;
		// background-color: #fff;
		
		.progressview {
			height: 50rpx;
			width: 100%;
			background-color: #fff;
			display: flex;
			justify-content: space-between;
			align-items: center;
			.progressbar {
				width: calc(100% - 150rpx);
				height: 20rpx;
				margin-left: 20rpx;
				border-radius: 10rpx;
				background-color: #f5f5f5;
				// position: relative;
				.contentitem {
					height: 20rpx;
					background-color: orange;
					border-radius: 10rpx;
				}
			}
			.progresstext {
				margin-right: 20rpx;
			}
		}
	
		.points_view {
			color: orange;
			margin: 20rpx;
			text-align: center;
		} 
		.sentence-item {
			width: calc(100% - 40rpx);
			margin-left: 20rpx;
			margin-top: 50rpx;
			background-color: #fff;
			border-radius: 20rpx;
			padding: 20rpx 0;
			overflow-y: auto;
			height: calc(100% - 180rpx);
			.sentence-top {
				 margin-top: 50rpx;
				 margin-bottom: 100rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				.sentence-left {
					// width: 70%;
					margin-left: 20rpx;
					margin-right: 30rpx;
					.english {
						color: #05c160;
						font-size: 45rpx;
					}
					.chinese {
						font-size: 40rpx;
						margin-top: 30rpx;
					}
				}
				.audio-icon {
					margin-right: 30rpx;
				}
			}
			
		}
	}
	
	.left-icon {
		height: 100rpx;
		width: 100rpx;
	}
	.btnview {
		position: fixed;
		left: 0;
		bottom: 0;
		width: 100%;
		height: 230rpx;
		.tab-btn {
			height: 100rpx;
			width: 80%;
			color: #fff;
			font-size: 36rpx;
			display: flex;
			justify-content: center; /* 水平居中 */
			align-items: center; /* 垂直居中 */
			background-color: #05c160;
			 border-radius: 50rpx; /* 高度的一半 */
			 margin-left: 10%;
		}
	}
</style>