<template>
	<view class="container">
		<view class="headView" :style="{ paddingTop: statusBarHeight + 'px', height: '44px' }">
			<image @tap="handleBackPage" class="head-icon" src="@/assets/icons/black_back.svg"></image>
			<view class="head-text">单元总报告</view>
		</view>
		<scroll-view v-if="reportData" class="contentView" scroll-y="true">
			<view class="title_view">
				{{book_argument.publisher}}{{book_argument.book_name}}{{book_argument.grade}}{{book_argument.term}}{{book_argument.title}}
			</view>
			<view class="item_view">
				<view class="item_icon">
					<view class="item_icon_one"><text style="font-size: 40rpx;margin-right: 5rpx;">{{reportData.speak_count}}</text>次</view>
					<view class="item_icon_two">开口次数</view>
				</view>
				<view class="item_icon">
					<view class="item_icon_one"><text style="font-size: 40rpx;margin-right: 5rpx;">{{reportData.words_count}}</text>个</view>
					<view class="item_icon_two">练习词汇</view>
				</view>
			</view>
			<view class="item_view">
				<view class="item_icon">
					<view class="item_icon_one"><text style="font-size: 40rpx;margin-right: 5rpx;">{{reportData.points}}</text>次</view>
					<view class="item_icon_two">获得金币</view>
				</view>
				<view class="item_icon">
					<view class="item_icon_one"><text style="font-size: 40rpx;margin-right: 5rpx;">{{reportData.sentences_count}}</text>句</view>
					<view class="item_icon_two">练习句子</view>
				</view>
			</view>
			
			<view class="words_view">
				<view class="words_tit">
					<view class="words_tit_l">单词学习：{{reportData.word_summary.word_count}}个</view>
					<view class="words_tit_r">积分+{{reportData.word_summary.total_points}}</view>
				</view>
				<view v-if="reportData.word_summary.mastered_words.length>0" class="words_grasp">
					<view class="words_grasp_t">已掌握</view>
					<view class="words_grasp_content">
						<view v-for="word in reportData.word_summary.mastered_words"  class="words_grasp_item">
							<view class="grasp_item_one">
								<view class="grasp_item_one_t">{{word.content}}</view>
								<image @tap="playWordclick(word.audio_url)" class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
							</view>
							<view class="grasp_item_two">
								<view class="grasp_item_two_l">掌握情况</view>
								<view class="grasp_item_two_r">
									<view>学</view>
									<view>练</view>
									<view>拼</view>
								</view>
							</view>
						</view>
					
					</view>
				</view>
				
				<view  v-if="reportData.word_summary.words_to_review.length>0" class="words_grasp">
					<view class="words_grasp_t">待巩固</view>
					<view class="words_grasp_content">
						<view v-for="word in reportData.word_summary.words_to_review" class="words_grasp_item">
							<view class="grasp_item_one">
								<view class="grasp_item_one_t">{{word.content}}</view>
								<image @tap="playWordclick(word.audio_url)" class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
							</view>
							<view class="grasp_item_two">
								<view class="grasp_item_two_l">掌握情况</view>
								<view class="grasp_item_two_r">
									<view>学</view>
									<view :class="{ needlearn: word.practice_error_count > 0 }">练</view>
									<view :class="{ needlearn: word.spell_error_count > 0 }">拼</view>
								</view>
							</view>
						</view>
					</view>
				</view>
				
			</view>
			
			<view class="sentence_view">
				<view class="sentence_tit">
					<view class="sentence_tit_l">句子跟读：{{reportData.sentence_summary.sentence_count}}句</view>
					<view class="sentence_tit_r">积分+{{reportData.sentence_summary.total_points}}</view>
				</view>
				<view v-if="reportData.sentence_summary.sentence_records.length>0" class="sentence_grasp">
					<view class="sentence_grasp_content" v-for="sentence in reportData.sentence_summary.sentence_records">
						<view class="s_grasp_content_top">
							<view class="grasp_item_one_t">{{sentence.content}}</view>
							<image @tap="playSentenceclick(sentence.audio_url)" class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
						</view>
						<view class="s_grasp_content_bottom">
							<view class="grasp_item_one_t">{{sentence.chinese}}</view>
							<view @tap="lookpronunciationResult(sentence)" class="grasp_item_one_ins">
								<view>评分:{{JSON.parse(sentence.json_data).pronunciation_score}}</view>
								<view class="rTit">详情</view>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<view class="spell_view"> 
				<view class="spell_tit">
					<view class="spell_tit_l">单词拼写：{{reportData.word_spell_summary.word_count}}个</view>
					<view class="spell_tit_r">积分+{{reportData.word_spell_summary.total_points}}</view>
				</view>
				<view v-if="reportData.word_spell_summary.word_spell_records.length>0" class="spell_grasp">
					<view class="spell_grasp_content" v-for="word in reportData.word_spell_summary.word_spell_records">
						<view class="s_grasp_content_left">
							<view class="grasp_item_one_t">{{word.content}}</view>
							<view class="grasp_item_two_t">{{word.chinese}}</view>
						</view>
						<view class="s_grasp_content_right">
							拼错 <text style="color: red;">{{word.error_count}}</text> 次
						</view>
					</view>
				</view>
			</view>
			
			<view style="height: 200rpx;"></view>
		</scroll-view>
		
		<UnitFollowReadPopVue 
		v-if="optionSentence!=null" 
		@reevaluation="reevaluation" 
		ref="unitFollowReadPopref" 
		:optionSentence="optionSentence" />
		
		
	</view>
</template>

<script setup>
	import { ref,computed,watch,onMounted, onUnmounted, Text,onUpdated,nextTick} from 'vue';
	
	import { onLoad } from '@dcloudio/uni-app'
	import textbook from '@/api/textbook'
	import study from '@/api/study';
	import UnitFollowReadPopVue from './components/UnitFollowReadPop.vue';
	
	const unitFollowReadPopref=ref(null)
	const optionSentence=ref(null)
	// 获取设备的安全区域高度
	const statusBarHeight = ref(0);
	const customBarHeight = ref(0);
	
	const book_argument= ref(null)

	const reportData = ref(null)
	
	const currentAudio = ref(null)

	
	const handleBackPage=()=>{
		uni.navigateBack()
	}
	
	onMounted(() => {
		const systemInfo = uni.getSystemInfoSync();
		statusBarHeight.value = systemInfo.statusBarHeight || 0;
		customBarHeight.value = (systemInfo.statusBarHeight || 0) + 44; // 44 是导航栏的默认高度
		
	});
	
	onUnmounted(() => {
	
	})
	
	const reevaluation=() => {
		optionSentence.value = null
	}
	const lookpronunciationResult =(sentence) => {
		optionSentence.value = sentence;
		setTimeout(() => {
		    if (unitFollowReadPopref.value) {
		      unitFollowReadPopref.value.openModal()
		    }	
		}, 300);
		
	}
	onLoad(async (options) => {
		const { bookargument} = options;
		
		uni.getStorage({
		  key: bookargument, // 存储的键名
		  success: (res) => {
			book_argument.value = res.data
			unitSummaryReport()
		  },
		  fail: (err) => {
		    console.error('获取数据失败:', err);
		  }
		});
		
	
	})
	
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
	
	const playWordclick = (audio_url)=> {
		stopCurrentAudio();
		const audio = uni.createInnerAudioContext();
		currentAudio.value = audio;
		audio.src = audio_url;
		audio.onStop(() => {
		});
		audio.play();
	}
	
	const playSentenceclick = (audio_url)=> {
		stopCurrentAudio();
		// 将 audio_url 根据逗号分割
		const parts = audio_url.split(',');
		// 检查数组长度，确保格式正确
		if (parts.length < 3) {
			console.error("Invalid audio_url format");
			return;
		}
		// 提取真正的 audio_url、audio_start 和 audio_end
		const actualAudioUrl = parts[0]; // 第 0 位是真正的 audio_url
		const audioStart = parseInt(parts[1], 10); // 第 1 位是 audio_start，转换为 int
		const audioEnd = parseInt(parts[2], 10);   // 第 2 位是 audio_end，转换为 int

		
		const audio = uni.createInnerAudioContext();
		currentAudio.value = audio;
		audio.src = actualAudioUrl;
		
		// 设置时间范围
		if (audioStart && audioEnd) {
		  const startTime = audioStart / 1000
		  const endTime = audioEnd / 1000
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
	
	
	const unitSummaryReport = async ()=> {
		
		try {
			console.log("book_argument.value.book_id,book_argument.value.lesson_id")
			console.log(book_argument.value)
			const response = await study.getUnitSummaryReport(book_argument.value.bookId,book_argument.value.lessonId);
			
			if (response.code == 1000) {
				reportData.value = response.data
			}
			console.log("response")
			
			console.log(response)
			
				
		} catch (error) {
		  console.error('获取列表失败:', error);
		  uni.showToast({
		    title: '获取列表失败',
		    icon: 'none',
		  });
		}
	}
	
	
	

	
</script>

<style scoped lang="scss">
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		height: 100vh;
		background-color: #fff;
		// background-color: #f5f5f5;
		// background-color: #D5F0F1;
	}
	.headView {
		width: 100%;
		background-color: #fff;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 96rpx;
		flex-shrink: 0; /* 防止被压缩 */
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
	
	.contentView {
		flex: 1;
		width: 100%;
		overflow-y: auto; /* 允许垂直滚动 */
		.title_view {
			width: calc(100% - 50rpx);
			margin-left: 25rpx;
			background-color: #fff;
			box-sizing: border-box;
			padding: 80rpx 80rpx;
			font-size: 30rpx;
			text-align: center;
			display: flex;
			justify-content: center;
			align-items: center;
			border-bottom-left-radius: 20rpx;
			border-bottom-right-radius: 20rpx;
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
				border: #ECECEC 1rpx solid;
				box-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1);
				border-radius: 30rpx;
				padding: 30rpx;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				margin-bottom: 10rpx;
				.item_icon_one {
					color: orange;
					font-size: 30rpx;
				}
				.item_icon_two {
					margin-top: 20rpx;
				}
			} 
		}
		
		.words_view {
			margin-top: 50rpx;
			width: calc(100% - 50rpx);
			border-radius: 30rpx;
			margin-left: 25rpx;
			box-sizing: border-box;
			border: #ECECEC 1rpx solid;
			box-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1);
			.words_tit {
				padding: 30rpx;
				display: flex;
				justify-content: space-between;
				.words_tit_l {
					font-size: 35rpx;
					font-weight: bold;
				}
				.words_tit_r {
					color: orange;
				}
			}
			
			.words_grasp {
				.words_grasp_t {
					margin-left: 30rpx;
				}
				.words_grasp_content {
					width: calc(100% - 60rpx);
					margin: 20rpx 30rpx 30rpx 30rpx;
					display: flex;
					flex-wrap: wrap;
					justify-content: space-between;
					.words_grasp_item {
						margin-bottom: 10rpx;
						width: calc(50% - 5rpx);
						background-color: #FFFCED;
						border-radius: 20rpx;
						.grasp_item_one {
							// box-sizing: border-box;
							margin: 0 20rpx;
							display: flex;
							justify-content: space-between;
							align-items: center;
							border-bottom: 1px dashed #979389;
							.grasp_item_one_t {
								padding: 20rpx 0;
								font-weight: bold;
								margin-left: 10rpx;
							}
							.left-icon {
								width: 30rpx;
								height: 30rpx;
								margin-right: 10rpx;
							}
						}
						.grasp_item_two {
							margin:20rpx;
							display: flex;
							justify-content: space-between;
							align-items: center;
							.grasp_item_two_l {
								color: #979389;
								font-size: 17rpx;
							}
							.grasp_item_two_r {
								display: flex;
								justify-content: flex-end; /* 子元素靠右排列 */
								view {
									background-color: #F9DBA0;
									color: #CEA353;
									width: 35rpx;
									height: 35rpx;
									margin-left: 5rpx;
									display: flex;
									justify-content: center;
									align-items: center;
									border-radius: 5rpx;
									font-size: 17rpx;
								}
								.needlearn {
									background-color: #FADEDD;
									color: #E37D82;
								}
							}
							
						}
						
						
						
					}
				}
			}
			
			
		}
		
		.sentence_view {
			margin-top: 50rpx;
			width: calc(100% - 50rpx);
			border-radius: 30rpx;
			margin-left: 25rpx;
			box-sizing: border-box;
			border: #ECECEC 1rpx solid;
			box-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1);
			.sentence_tit {
				padding: 30rpx;
				display: flex;
				justify-content: space-between;
				.sentence_tit_l {
					font-size: 35rpx;
					font-weight: bold;
				}
				.sentence_tit_r {
					color: orange;
				}
			}
			.sentence_grasp {
				.sentence_grasp_content {
					width: calc(100% - 60rpx);
					margin: 20rpx 30rpx 30rpx 30rpx;
					border-bottom: 1px dashed #979389;;
					.s_grasp_content_top {
						display: flex;
						justify-content: space-between;
						align-items: center;
						.grasp_item_one_t {
							padding: 20rpx 0;
							font-weight: bold;
							margin-left: 10rpx;
							margin-right: 20rpx;
							max-width: 60%;
							color: #05c160;
							word-wrap: break-word; /* 允许长单词或URL换行 */
							overflow-wrap: break-word; /* 同上，更现代的写法 */
						}
						.left-icon {
							width: 30rpx;
							height: 30rpx;
							margin-right: 10rpx;
						}
					}
					.s_grasp_content_bottom {
						display: flex;
						justify-content: space-between;
						align-items: center;
						.grasp_item_one_t {
							padding: 0rpx 0 20rpx 0;
							font-weight: bold;
							margin-left: 10rpx;
							margin-right: 20rpx;
							max-width: 50%;
							color: #979389;
							word-wrap: break-word; /* 允许长单词或URL换行 */
							overflow-wrap: break-word; /* 同上，更现代的写法 */
						}
						.grasp_item_one_ins {
							margin-right: 10rpx;
							display: flex;
							align-items: center;
							justify-content: flex-end;
							color: #007bff;
							.rTit {
								margin-left: 10rpx;
							}
						}
					}
					
					
					
				}
			}
			
			
		}
		
		
		.spell_view {
			margin-top: 50rpx;
			width: calc(100% - 50rpx);
			border-radius: 30rpx;
			margin-left: 25rpx;
			box-sizing: border-box;
			border: #ECECEC 1rpx solid;
			box-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1);
			.spell_tit {
				padding: 30rpx;
				display: flex;
				justify-content: space-between;
				.spell_tit_l {
					font-size: 35rpx;
					font-weight: bold;
				}
				.spell_tit_r {
					color: orange;
				}
			}

			// color: #979389;
			.spell_grasp {
				.spell_grasp_content {
					width: calc(100% - 60rpx);
					margin: 20rpx 30rpx 30rpx 30rpx;
					border-bottom: 1px dashed #979389;
					display: flex;
					justify-content: space-between;
					align-items: center;
					.s_grasp_content_left {
						max-width: 50%;
						.grasp_item_one_t {
							word-wrap: break-word; /* 允许长单词或URL换行 */
							overflow-wrap: break-word; /* 同上，更现代的写法 */
							
						}
						.grasp_item_two_t {
							word-wrap: break-word; /* 允许长单词或URL换行 */
							overflow-wrap: break-word; /* 同上，更现代的写法 */
							color: #979389;
							// background-color: red;
							padding: 20rpx 0;
						}
					}
					.s_grasp_content_right {
						
					}
					
				}
			}
			
			
		}
		
		
	}
	
</style>