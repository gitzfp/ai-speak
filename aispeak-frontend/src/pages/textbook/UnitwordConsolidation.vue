<template>
	<view>
		<view class="headView" :style="{ paddingTop: statusBarHeight + 'px', height: '44px' }">
			<image @tap="handleBackPage" class="head-icon" src="@/assets/icons/black_back.svg"></image>
			<view class="head-text">单词单元测试</view>
		</view>
		<view class="progressbarscore">
			<view class="topview">
				<view class="progressbar">
					<view :style="{ width: progress + '%' }" class="contentitem"></view>
					<view class="desitemone">学</view>
					<view class="desitemtwo">练</view>
					<view class="desitemthree">拼</view>
				</view>
				<view class="score">
					积：{{totalpoints}}
				</view>
			</view>
			<view class="progresstextview">
				{{progresstext}}
			</view>
		</view>
		<view v-if="planWordsList.length>0" class="contentMiddle">
			<template v-if="planWordmode==0">
				<view class="topcontent">
					<WordDisplay ref="wordDisplayref" @redefineSettingsParentC="redefineSettingsParentC" :word="optionWord" />
					<!-- 单词图片 -->
					<view  class="phonics-image">
						<image 
							:src="optionWord.image_path"
							 mode="widthFix"
							class="phonics-img"
						/>
					</view>
					<view v-if="isShowmark" class="result-header">
					    <view class="result-score">{{ pronunciation_score }}</view>
					    <view class="result-label">测评分数</view>
					</view>
				</view>
				<view class="btnview">
					<view @tap="showEvaluationModal" class="action-buttons">
					    <view class="pronunciation-btn">
					    <uni-icons class="uniIcon" type="mic" size="20" color="#fff" />
					    <text class="btn-text">发音测评</text>
					    </view>
					</view>
					<view v-if="isShowmark" @tap="clicknext" class="tab-btn">下一个</view>
				</view>
				<!--测评 弹窗 -->
				<wordassessPop @evaluationResult="evaluationResult" ref="wordassessPops" :isUnit="true" :currentWord="optionWord"></wordassessPop>
				
			</template>
			<template v-if="planWordmode==1">
				<view class="topcontent">
					<WordDisplay ref="wordDisplayref" @redefineSettingsParentC="redefineSettingsParentC" :word="optionWord" />
					
					<OptionAreaPicture
					  :word="optionWord"
					  :planWordmode="0"
					  :optionWords="optionAreaWords"
					  @item-click="optionitemclick"
					/>
					
				</view>
			</template>
			<template v-if="planWordmode==2">
				<Unitwordspell ref="unitwordspellref" @inspectionresult="inspectionresult" :word="optionWord" />
			</template>
			
			<template v-if="planWordmode==1 || planWordmode==2">
				<!-- 透明蒙版 -->
				<view v-if="showPopup" class="mask"></view>
				<!-- 弹窗 -->
				<view v-if="showPopup" class="popup" :class="{ 'popup-active': showPopup }">
				  <!-- 弹窗内容 -->
				  <view class="popup-content">
						
					<!-- 文字和反馈图标 -->
					<view class="feedback-section">
					  <text v-if="isRight" class="feedback-text">答对啦，真棒！</text>
					  <text v-else class="feedback-text_error">真可惜，答错了</text>
					</view>	
					<view v-if="!isRight" class="feedback-section">
					  <text class="answer_error">正确答案：{{rightTit}}</text>
					</view>	
					<!-- 继续按钮 -->
					<button :class="isRight?'continue-btn':'continue-btn_error'" @tap="handleContinue">继续</button>
					
					
				  </view>
				</view>	
			</template>	
			
			
		</view>
		
		<UnitExitreminderPop
		v-if="uniExitreminderPopPopup" @keepdoing="keepdoing"
		@gonavback="gonavback"
		/>
		
	</view>
</template>

<script setup>
	import { ref,computed,watch,onMounted, onUnmounted, Text,onUpdated,nextTick} from 'vue';
	import { onLoad } from '@dcloudio/uni-app'
	import textbook from '@/api/textbook'
	import study from '@/api/study';
	import WordDisplay from './WordDisplay.vue';
	import wordassessPop from './wordassessPop.vue';
	import OptionAreaPicture from './OptionAreaPicture.vue';
	import Unitwordspell from './Unitwordspell.vue';
	import UnitExitreminderPop from './components/UnitExitreminderPop.vue'
	
	const wordDisplayref = ref(null);
	const wordassessPops = ref(null)
	const unitwordspellref = ref(null)
		
	//模式1的数组和下标
	const planWordsList = ref([]);
	const planWordindext = ref(0);
	//模式2的数组和下标
	const planWordsTwoList = ref([]);
	const planWordTwoindext = ref(0);
	//模式3的数组和下标
	const planWordsThreeList= ref([]);
	const planWordThreeindext = ref(0);
	
	
	//用于存储错误和正确的次数的数组
	const planWordsWithCounts = ref([]);
	
	//用于计算进度条
	const progressThreeindext = ref(0);
	
	const planWordmode = ref(0); // 总共三种模式
	
	// 获取设备的安全区域高度
	const statusBarHeight = ref(0);
	const customBarHeight = ref(0);
	
	const lesson_id = ref('')
	const book_id = ref('')
	
	const pronunciation_score=ref(0)
	const isShowmark = ref(false)
	
	const totalpoints = ref(0)
	const totalerrornum = ref(0)

	const currentAudio = ref(null)
	// 控制弹窗显示
	const showPopup = ref(false);
	const isRight = ref(false)
	
	const uniExitreminderPopPopup = ref(false)
	
	// 组件挂载
	onMounted(() => {
		const systemInfo = uni.getSystemInfoSync();
		statusBarHeight.value = systemInfo.statusBarHeight || 0;
		customBarHeight.value = (systemInfo.statusBarHeight || 0) + 44; // 44 是导航栏的默认高度
		
		setTimeout(() => {
		      if (wordDisplayref.value) {
		        wordDisplayref.value.phonicsbegins();
		      }		
		}, 500); // 延迟 100ms
	});
	
	onUnmounted(() => {
		stopCurrentAudio()
	})
	
	const rightTit = computed(() => {
		return planWordmode.value == 1?optionWord.value.chinese:optionWord.value.word
	})
	const progress = computed(() => {
		   if (planWordsList.value.length>0) {
			   var jdnum = planWordindext.value+planWordTwoindext.value+progressThreeindext.value
			   var totalnum = planWordsList.value.length*3
			   let percentage =  (jdnum / totalnum) * 100;
			   return percentage
		   } else {
			  return 0 
		   }
	});
	const progresstext = computed(() => {
		   if (planWordsList.value.length>0) {
			   var jdnum = planWordindext.value+planWordTwoindext.value+progressThreeindext.value
			   var totalnum = planWordsList.value.length*3
			   return jdnum+"/"+totalnum
		   } else {
			  return "" 
		   }
	});
	
	const optionWord = computed(() => {
		if (planWordmode.value == 0) {
			return planWordsList.value[planWordindext.value]
		} else if (planWordmode.value == 1) {
			return planWordsTwoList.value[planWordTwoindext.value]
		} else {
			return planWordsThreeList.value[planWordThreeindext.value]
		}
	});
	
	const redefineSettingsParentC =() => {
		// console.log("暂时没用")
	}
	
	
	
	const getoptionAreaWords = (fixedNum, rangeStart, rangeEnd, numToSelect) => {
	  // 创建指定范围的数组
	  let numbersPool = [];
	  for (let i = rangeStart; i <= rangeEnd; i++) {
	    if (i !== fixedNum) numbersPool.push(i); // 排除固定数字
	  }
	
	  // 随机选取不重复的数字
	  let selectedNumbers = [];
	  let result = [];
	  
	  var huoquList = planWordsTwoList.value
		
	  while (selectedNumbers.length < numToSelect) {
	    let randomIndex = Math.floor(Math.random() * numbersPool.length);
	    let chosenNumber = numbersPool[randomIndex];
	
	    // 如果这个数字还没有被选中，则添加到结果数组中
	    if (!selectedNumbers.includes(chosenNumber)) {
	      selectedNumbers.push(chosenNumber);
	      result.push(huoquList[chosenNumber]);
	    }
	  }
	
	  // 在随机位置插入固定数字
	  let insertPosition = Math.floor(Math.random() * (result.length + 1));
	  result.splice(insertPosition, 0, huoquList[fixedNum]);
	
	  return result;
	};
	
	
	const optionAreaWords = computed(() => {
		var num = planWordsTwoList.value.length>=4?3:(planWordsTwoList.value.length - 1)
		let result = getoptionAreaWords(planWordTwoindext.value, 0, planWordsTwoList.value.length - 1, num);
		return result;
		
	});
	
	
	const optionitemclick = (num) => {
	  if (num==1) { //答对了
		isRight.value = true
		optionWord.value.points = 1;
		totalpoints.value += 1; 
	  } else {
		  
		  const targetWord = planWordsWithCounts.value.find(word => word.word_id === optionWord.value.word_id);
		  targetWord.error_count += 1;
		totalerrornum.value += 1
		optionWord.value.error_count += 1
		isRight.value = false	
	  }
	  showPopup.value = true
	};
	
	const inspectionresult = (num) => {
	  if (num==1) { //答对了
		isRight.value = true
		optionWord.value.points = 1;
		totalpoints.value += 1; 
	  } else {
		  const targetWord = planWordsWithCounts.value.find(word => word.word_id === optionWord.value.word_id);
		  targetWord.error_count += 1;
		  
		  totalerrornum.value += 1
		optionWord.value.error_count += 1
		isRight.value = false	
	  }
	  showPopup.value = true
	};
	
	
	//模式1和2 的继续按钮
	const handleContinue = () => {
		if (isRight.value) { //正确
			if (planWordmode.value == 1) {
				wordDisplayref.value.redefineSettings()
				if (planWordTwoindext.value==(planWordsTwoList.value.length-1)) {
					planWordmode.value = 2
					
					setTimeout(() => {
					    if (unitwordspellref.value) {
					      unitwordspellref.value.phonicsbegins(0);
					    }	
					}, 500);
				} else {
					setTimeout(() => {
					      if (wordDisplayref.value) {
					        wordDisplayref.value.phonicsbegins();
					      }		
					}, 500);
					
				}
				planWordTwoindext.value++;
			} else { //模式=2  相当于模式3
				unitwordspellref.value.stopCurrentAudio()
				if (planWordThreeindext.value==(planWordsThreeList.value.length-1)) {
					progressThreeindext.value = planWordsThreeList.value.length
					
					// 创建一个新数组，包含三个数组的所有数据
					const combinedWordsList = planWordsList.value.concat(planWordsTwoList.value, planWordsThreeList.value);

					//这边全部结束了要直接其他操作
					if (totalerrornum.value == 0) {
						combinedWordsList.forEach(word => word.points *= 2);
						totalpoints.value = totalpoints.value*2	
					}
					
					submitreslutStudyProgressReport(book_id.value,lesson_id.value,combinedWordsList)
					
					
				} else {
					
					planWordThreeindext.value++;
					progressThreeindext.value = planWordThreeindext.value
					setTimeout(() => {
					    if (unitwordspellref.value) {
					      unitwordspellref.value.phonicsbegins(0);
					    }	
					}, 500);
				}
			}
		} else {  //答错了
			if (planWordmode.value == 1) {
				// 将当前对象移到数组最后一位
				const currentWord = planWordsTwoList.value.splice(planWordTwoindext.value, 1)[0];
				planWordsTwoList.value.push(currentWord);
			} else if (planWordmode.value == 2) {
				if (planWordThreeindext.value ==(planWordsThreeList.value.length-1)) {
					unitwordspellref.value.initiativerefreshData()
				} else {
					// 将当前对象移到数组最后一位
					const currentWord = planWordsThreeList.value.splice(planWordThreeindext.value, 1)[0];
					planWordsThreeList.value.push(currentWord);
				}
			}
		}
		showPopup.value = false
	}
	const clicknext = () => {
		 wordDisplayref.value.redefineSettings()
		if (planWordindext.value==(planWordsList.value.length-1)) {
			planWordmode.value = 1
		}
		planWordindext.value++;
		
		setTimeout(() => {
		    if (wordDisplayref.value) {
		      wordDisplayref.value.phonicsbegins();
		    }	
		}, 500);
		
	}
	const evaluationResult = (pronunciationScore) => {
		pronunciation_score.value = pronunciationScore
		isShowmark.value = true
		// 获取当前单词对象
		const obj = planWordsList.value[planWordindext.value];
		obj.speak_count +=1
		//对
		var audioStr = 'http://114.116.224.128:8097/static/audio/answerright.mp3'
		//错
		// var audioStr = 'http://114.116.224.128:8097/static/audio/misanswer.mp3'
		playAudiourl(audioStr)
		if (pronunciationScore < 60) {
		 // 如果积分不为0，则跳过
		 if (obj.points === 0) {
			 obj.points += 1; // 积分加1
			 totalpoints.value += 1; // 总积分加1
		 }
		} else if (pronunciationScore >= 60) {
		 // 如果积分不为2，则更新为2，并更新总积分
		 if (obj.points !== 2) {
			 const previousPoints = obj.points; // 保存原有积分
			 obj.points = 2; // 积分更新为2
			 totalpoints.value += (2 - previousPoints); // 更新总积分
		 }
		}
	}
	
	// 监听 planWordindext 的变化
	watch(planWordindext, (newValue, oldValue) => {
		pronunciation_score.value = 0
		isShowmark.value = false
		// 例如，重新加载单词显示组件
		// if (wordDisplayref.value) {
		// 	wordDisplayref.value.phonicsbegins();
		// }
	});
	
	// 这里可以定义一些响应式数据或逻辑
	const handleBackPage = () => {
		uniExitreminderPopPopup.value = true
	}
	const keepdoing = () => {
		uniExitreminderPopPopup.value = false
	}
	const gonavback = () => {
		uniExitreminderPopPopup.value = false
		uni.navigateBack()
	}
	
	
	
	const showEvaluationModal = () => {
		
			wordDisplayref.value.redefineSettings()
		
	      if (wordassessPops.value && typeof wordassessPops.value.showPopup === 'function') {
	        wordassessPops.value.showPopup(); // 调用子组件的方法
	      }
	};
		
	onLoad(async (options) => {
		const { bookId, sessionKey,lessonId} = options;
		book_id.value = bookId
		lesson_id.value = lessonId
		// 获取数据
		uni.getStorage({
		key: sessionKey,
		success: function (res) {
		    const words = JSON.parse(res.data);
		    console.log('获取到的数据:', words);
		    detailWords(bookId,words)
		
		},
		fail: function (err) {
		    console.log('获取数据失败', err);
		}
		});
	})
	const detailWords = async (bookId, words) => {
	  try {
	    const response = await textbook.getWordsDetail(bookId, words);
		
		// 创建新数组，并添加 error_count 和 points 字段，默认值为 0
		planWordsList.value = response.data.words.map(word => ({
		...word,
		content_type:0,
		error_count: 0,
		points: 0,
		speak_count:0,
		}));

		planWordsTwoList.value = response.data.words.map(word => ({
		...word,
		content_type:1,
		error_count: 0,
		points: 0,
		speak_count:0,
		}));

		planWordsThreeList.value = response.data.words.map(word => ({
		...word,
		content_type:2,
		error_count: 0,
		points: 0,
		speak_count:0,
		}));
		
		planWordsWithCounts.value = response.data.words.map(word => ({
		  ...word,
		  error_count: 0,
		}));
		
	  } catch (error) {
	    console.error('获取单词列表失败:', error);
	    uni.showToast({
	      title: '获取单词列表失败',
	      icon: 'none',
	    });
	  }
	};
	
	const submitreslutStudyProgressReport = async(bookId, lessonId, reports)=> {
		try {
		
			// 显示加载中状态
			uni.showLoading({
			title: '报告生成中...',
			mask: true, // 防止用户点击
			});
			const response = await study.submitStudyProgressReport(bookId, lessonId,reports);
				
			uni.hideLoading();
			
			const unitreportWords = 'unitreportWords';
			
			uni.setStorage({
			  key: unitreportWords,
			  data: JSON.stringify(planWordsWithCounts.value),
			  success: function () {
				console.log('数据存储成功');
				// 跳转到学习页面
				uni.navigateTo({
				  url: `/pages/textbook/UnitWordreport?unitreportWords=${unitreportWords}&totalpoints=${totalpoints.value}&backPage=2`, // 将缓存键名传递给学习页面
				});
			  },
			  fail: function (err) {
				console.log('数据存储失败', err);
			  }
			});
				
		} catch (error) {
		  
		  // 隐藏加载中状态
			uni.hideLoading();

			// 请求失败后的逻辑
			console.error('提交学习进度报告失败:', error);
			uni.showToast({
			title: '提交失败，请重试',
			icon: 'none',
			});
		  
		}
	}
	
	const stopCurrentAudio =() => {
	    if (currentAudio.value) {
	      currentAudio.value.pause()
	      // ispagePlaying.value = false
	      try {
	        currentAudio.value.stop()
			// currentAudio.value?.destroy()
			currentAudio.value = null
	      } catch (error) {
	        console.error("Error stopping audio:", error)
	      }
	      // currentAudio.value = null
	    }
	}
	const playAudiourl = (audioStr) =>{
		stopCurrentAudio()
		const audio = uni.createInnerAudioContext()
		currentAudio.value = audio
		audio.src = audioStr
		audio.onEnded(() => {
		})
		 audio.play()
	}
	
</script>

<style  scoped lang="scss">
	
	.container {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  justify-content: space-between;
	  height: 100vh;
	  /* background-color: #ffffff; */
	  background-color: #f5f5f5;
	  // background-color: red;
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
	.progressbarscore {
		// background-color: blue;
		height: 120rpx;
		
		.topview {
			display: flex;
			justify-content: space-between;
			// align-items: center;
			align-items: center;
			height: 60%;
			// background-color: red;
			.progressbar {
				width: 60%;
				height: 60rpx;
				// background-color: cadetblue;
				margin-left: 80rpx;
				border: #f0f0f0 1rpx solid;
				box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
				border-radius: 30rpx;
				position: relative;
				.desitemone {
					position: absolute;
					top: 0;
					left: calc(33.333% - 60rpx);
					// bottom: 0;
					height: 60rpx;
					width: 60rpx;
					border-radius: 30rpx;
					background-color: #2b9939;
					text-align: center;
					line-height: 60rpx;
					color: #fff;
				}
				.desitemtwo {
					position: absolute;
					top: 0;
					left: calc(66.666% - 60rpx);;
					// bottom: 0;
					height: 60rpx;
					width: 60rpx;
					border-radius: 30rpx;
					background-color: #2b9939;
					text-align: center;
					line-height: 60rpx;
					color: #fff;
				}
				.desitemthree {
					position: absolute;
					top: 0;
					right: 0;
					// bottom: 0;
					height: 60rpx;
					width: 60rpx;
					border-radius: 30rpx;
					background-color: #2b9939;
					text-align: center;
					line-height: 60rpx;
					color: #fff;
				}
			
				.contentitem {
					height: 60rpx;
					background-color: orange;
					border-radius: 30rpx;
				}
			}
			.score {
				width: 20%;
				height: 100%;
				// background-color: #05c160;
				border-radius: 36rpx;
				margin-right: 30rpx;
				border: #f0f0f0 1rpx solid;
				box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
				color: orange;
				
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
		.progresstextview {
			color: #666;
			width: 60%;
			margin-left: 90rpx;
			margin-top: 10rpx;
		}
	}
	.contentMiddle {
		// flex: 1;
		height: calc(100vh - 60px - 120rpx) ;
		// background-color: red;
		// position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		
		.topcontent {
			margin-top: 30rpx;
			height: calc(100% - 330rpx);
			// background-color: red;
		}
		.phonics-image {
		  margin: 32rpx 0;
		  border-radius: 16rpx;
		  overflow: hidden;
		  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
		  width: 50%;
		  margin-left: 25%; 
		  .phonics-img {
		      width: 100%;
		      display: block;
		      background: #f8f9fa;
		  }
		  
		}
		
		
		.result-header {
		  text-align: center;
		  margin-bottom: 20px;
		  .result-score {
		    font-size: 48px;
		    font-weight: bold;
		    color: #007bff;
		  }
		  
		  .result-label {
		    font-size: 16px;
		    color: #666;
		  }
		  
		  .result-tips {
		    font-size: 12px;
		    color: #999;
		    margin-top: 8px;
		  }
		}
		
		
		
		
		.btnview {
			
			width: 100%;
			height: 300rpx;
			// background-color: blue;
			.action-buttons {
			  // position: absolute;
			  // bottom: 30rpx;
			  width: 80%;
			  margin-left: 9%;
			  display: flex;
			  justify-content: center;
			  align-items: center;
			  .pronunciation-btn {
			    padding: 20rpx 40rpx;
			    border-radius: 48rpx;
			    display: flex;
			    flex-direction: column; /* 竖向排列 */
			    align-items: center;
			    .uniIcon {
			      display: flex;
			      align-items: center;
			      justify-content: center;
			      background: #2b9939;
			      width: 70rpx;
			      height: 70rpx;
			      border-radius: 35rpx;
			    }
			    .btn-text {
			      margin-top: 10rpx;
			      color:#666;
			      font-size: 28rpx;
			      margin-left: 12rpx;
			    }
			  }
			
			  .display-toggle {
			    display: flex;
			    align-items: center;
			    
			    .toggle-text {
			      font-size: 28rpx;
			      color: #666;
			      margin-right: 8rpx;
			    }
			    
			    .page-indicator {
			      font-size: 28rpx;
			      color: #1a1a1a;
			      margin-left: 16rpx;
			    }
			  }
			}
		
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
		
	}
	
	
	
	
	/* 透明蒙版 */
	.mask {
	  position: fixed;
	  top: 0;
	  left: 0;
	  width: 100%;
	  height: 100%;
	  background-color: rgba(0, 0, 0, 0.5); /* 半透明黑色 */
	  z-index: 999; /* 确保蒙版在弹窗下方 */
	}
	
	.popup {
	  position: fixed;
	  bottom: -100%; /* 初始位置在屏幕外 */
	  left: 0;
	  width: 100%;
	  background-color: #fff;
	  border-top-left-radius: 20rpx;
	  border-top-right-radius: 20rpx;
	  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
	  transition: bottom 0.5s ease-in-out;
	  padding: 40rpx 0;
	  z-index: 1000; /* 确保弹窗在蒙版上方 */
	}
	
	.popup-active {
	  bottom: 0; /* 弹窗滑入屏幕 */
	}
	
	.popup-content {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	}

	
	.feedback-section {
	  display: flex;
	  align-items: center;
	  margin-bottom: 40rpx;
	}
	
	.feedback-text {
	  font-size: 40rpx;
	  font-weight: bold;
	  color: #2b9939;
	  margin-right: 20rpx;
	}
	
	.feedback-text_error {
	  font-size: 40rpx;
	  font-weight: bold;
	  color: #EC5B52;
	  margin-right: 20rpx;
	}
	.answer_error {
		font-size: 30rpx;
		font-weight: bold;
		color: #EC5B52;
		margin-right: 20rpx;
	}

	
	.continue-btn {
	  width: 80%;
	  background-color: #05c160;
	  color: #fff;
	  font-size: 32rpx;
	  border-radius: 20rpx;
	  padding: 20rpx;
	  text-align: center;
	  border: none;
	}
	.continue-btn_error {
	  width: 80%;
	  background-color: #EC5B52;
	  color: #fff;
	  font-size: 32rpx;
	  border-radius: 20rpx;
	  padding: 20rpx;
	  text-align: center;
	  border: none;
	}
	
</style>