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
						<SimpleAudioButton
							v-if="optionSentence.audio_url"
							:key="`audio-${currentIndext}`"
							:audio-url="optionSentence.audio_url"
							:start-time="optionSentence.audio_start ? optionSentence.audio_start / 1000 : undefined"
							:end-time="optionSentence.audio_end ? optionSentence.audio_end / 1000 : undefined"
							:auto-play="true"
							size="large"
							@play-start="onAudioPlayStart"
						/>
					</view>
				</view>
				<view class="sentence-bottom">
					<Speech 
							:ref-obj="optionSentence" 
							@success="handleEvaluationResult"
						/>
				</view>
			</view>
			
		</view>
		
		<view v-if="isShowmark" class="btnview">
			<view @tap="clicknext" class="tab-btn">下一个</view>
		</view>
		
		<UnitExitreminderPop
			v-if="uniExitreminderPopPopup" 
			@keepdoing="keepdoing"
			@gonavback="gonavback"
		/>

	</view>
</template>

<script setup>
	import { ref,computed,watch,onMounted, onUnmounted,nextTick} from 'vue';
	import Speech from "./components/PronuciationSpeech.vue"
	import UnitExitreminderPop from './components/UnitExitreminderPop.vue'
	import SimpleAudioButton from '@/components/SimpleAudioButton.vue'
	import { onLoad } from '@dcloudio/uni-app'
	import textbook from '@/api/textbook'
	import study from '@/api/study';
	import taskRequest from '@/api/task';
	
	// 获取设备的安全区域高度
	const statusBarHeight = ref(0);
	const customBarHeight = ref(0);
	
	const lesson_id = ref('')
	const book_id = ref('')
	
	const sentencesList = ref([])
	const currentIndext = ref(0);
	const progressIndext = ref(0)
	
	const totalpoints = ref(0)
	
	// 任务模式相关
	const isTaskMode = ref(false)
	const taskId = ref('')
	const taskInfo = ref(null)
	const taskProgress = ref({
	  startTime: null,
	  endTime: null,
	  completedItems: 0,
	  totalItems: 0,
	  status: 'in_progress'
	})
	const taskResults = ref([])
	
	const isShowmark = ref(false)
	const uniExitreminderPopPopup = ref(false)
	
	// 通用的开始时间（用于非任务模式）
	const pageStartTime = ref(null)
	
	onMounted(() => {
		const systemInfo = uni.getSystemInfoSync();
		statusBarHeight.value = systemInfo.statusBarHeight || 0;
		customBarHeight.value = (systemInfo.statusBarHeight || 0) + 44; // 44 是导航栏的默认高度
			
		// setTimeout(() => {
		//     playbuttonclick()
		// 	console.log('当前进度:', optionSentence.value);
		// 	isShowmark.value = (optionSentence?.value?.progress_data && optionSentence?.value?.progress_data.length > 20)
		// }, 500);
		
		uni.$on('start_recording', (params) => {
		    console.log('收到全局事件，参数:', params);
		    if (params.action === 'recording') {
				uni.$emit('stopAllAudio')
		    }
		  });
		
	});
	
	onUnmounted(() => {
		stopWatch(); // 确保无论如何都会清理
		uni.$emit('stopAllAudio')
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
	
	// 封装提交进度的方法
	const submitProgressWithMode = async (reports, statusNum) => {
		if (isTaskMode.value && taskId.value) {
			return await study.submitStudyProgressReport(undefined, undefined, reports, statusNum, taskId.value);
		} else {
			return await study.submitStudyProgressReport(book_id.value, lesson_id.value, reports, statusNum);
		}
	}
	
	const submitreslutStudyProgressReport = async(reports, isDone = true)=> {
		try {
			// 始终先保存进度，无论是否为任务模式
			let statusNum = isDone==true?1:0
			
			// 使用封装的方法提交进度
			await submitProgressWithMode(reports, statusNum);
			
			// 如果是任务模式且完成，额外提交任务结果
			if (isTaskMode.value && isDone) {
			  await submitTaskResults()
			  return
			}
			
			if (isDone) {
				// 显示加载中状态
				uni.showLoading({
				title: '报告生成中...',
				mask: true, // 防止用户点击
				});
			}
			
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
				uni.switchTab({
					url: `/pages/textbook/index3`,
				})
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
			 uni.$emit('stopAllAudio')
			if (currentIndext.value==(sentencesList.value.length-1)) {
				progressIndext.value = sentencesList.value.length
				
				const haveratedSentences = sentencesList.value.filter(
				  (sentence) => sentence.isHaverated === 1
				);
				if (haveratedSentences.length>0) {
					//这边是全部完成的
					submitreslutStudyProgressReport(haveratedSentences, true)
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
					// followReadingref.value.resetRefresh()
				}
			}
		}
		
	}
	
	const reevaluation = () => {
		optionSentence.value.isHaverated = 0
		optionSentence.value.progress_data=""
		isShowmark.value = false
	}
	
	const handleEvaluationResult = (pronunciationResult) => {
		console.log(pronunciationResult, "句子测评结果", pronunciationResult)
		optionSentence.value.json_data = pronunciationResult
		optionSentence.value.voice_file = pronunciationResult.voice_file
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
		
		// 如果是任务模式，记录结果
		if (isTaskMode.value) {
		  const sentenceResult = {
		    content_id: optionSentence.value.content_id || optionSentence.value.id,
		    response: 'sentence_reading',
		    is_correct: pronunciationResult.pronunciation_score >= 60,
		    auto_score: pronunciationResult.pronunciation_score,
		    attempt_count: optionSentence.value.speak_count || 1
		  }
		  
		  // 查找是否已有该句子的结果，如果有则更新
		  const existingIndex = taskResults.value.findIndex(r => r.content_id === (optionSentence.value.content_id || optionSentence.value.id))
		  if (existingIndex >= 0) {
		    taskResults.value[existingIndex] = sentenceResult
		  } else {
		    taskResults.value.push(sentenceResult)
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
	
	// 监听 optionSentence 变化（推荐）
	  const stopWatch = watch(
	    () => optionSentence.value,
	    (newVal) => {
	      if (newVal) {
	        nextTick(() => {
	          // 音频会自动播放（如果设置了 autoPlay）
	          isShowmark.value = Boolean(
	            newVal.progress_data?.length > 20
	          );
	          stopWatch(); // 执行后停止监听
	        });
	      }
	    },
	    { immediate: true } // 立即检查初始值
	  );

	
	const onAudioPlayStart = () => {
		// 音频开始播放时的处理
		console.log('音频开始播放');
	}

	// 这里可以定义一些响应式数据或逻辑
	const handleBackPage = () => {
		uni.$emit('stopAllAudio')
		uniExitreminderPopPopup.value = true
	}
	
	const keepdoing = () => {
		uniExitreminderPopPopup.value = false
	}
	
	const gonavback = async () => {
		uniExitreminderPopPopup.value = false
		
		console.log("句子====>>>sss", sentencesList.value)
		if (progressIndext.value != sentencesList.value.length) {
			// 筛选已评分的句子的数组
			const haveratedSentences = sentencesList.value.filter(
			  (sentence) => sentence.isHaverated === 1
			);
			console.log(haveratedSentences, "句子====>>>", sentencesList.value)
			if (haveratedSentences.length>0) {
				// 直接调用，函数内部会处理任务模式
				await submitreslutStudyProgressReport(haveratedSentences, false)
			} 	
		} 
		
		if (isTaskMode.value) {
			// 任务模式下返回到任务列表（需要返回两层）
			uni.navigateBack({ delta: 2 })
		} else {
			uni.switchTab({
				url: `/pages/textbook/index3`,
			})
		}
	}
	

	onLoad(async (options) => { 
		const { bookId,lessonId, taskId: tid} = options;
		book_id.value = bookId
		lesson_id.value = lessonId
		
		// 检查是否为任务模式
		if (tid) {
			isTaskMode.value = true
			taskId.value = tid
			await loadTaskInfo()
			// 任务模式：检查是否已有保存的开始时间
			const savedStartTime = uni.getStorageSync(`task_start_time_${tid}`)
			if (!savedStartTime) {
				// 首次进入，保存开始时间
				uni.setStorageSync(`task_start_time_${tid}`, taskProgress.value.startTime.toISOString())
			} else {
				// 恢复之前的开始时间
				taskProgress.value.startTime = new Date(savedStartTime)
			}
		} else {
			// 非任务模式：使用课程ID作为key
			const storageKey = `lesson_start_time_${book_id.value}_${lesson_id.value}`
			const savedStartTime = uni.getStorageSync(storageKey)
			if (!savedStartTime) {
				// 首次进入，保存开始时间
				pageStartTime.value = new Date()
				uni.setStorageSync(storageKey, pageStartTime.value.toISOString())
			} else {
				// 恢复之前的开始时间
				pageStartTime.value = new Date(savedStartTime)
			}
		}
		gethistorySentences()
	})
	
	// 加载任务信息
	const loadTaskInfo = async () => {
	  try {
	    const res = await taskRequest.getTaskById(taskId.value)
	    taskInfo.value = res.data
	    console.log('任务信息:', taskInfo.value)
	    
	    // 初始化任务进度
	    taskProgress.value.startTime = new Date()
	  } catch (error) {
	    console.error('加载任务信息失败:', error)
	    uni.showToast({
	      title: '加载任务失败',
	      icon: 'none'
	    })
	  }
	}
	
	const gethistorySentences = async() => {
		try {
			let response;
			
			// 如果是任务模式，使用taskId获取进度报告
			if (isTaskMode.value && taskId.value) {
				console.log("任务模式：使用taskId获取进度报告", taskId.value);
				response = await study.getStudyProgressReports(undefined, undefined, 1, taskId.value); // type=1 对应句子
			} else if (book_id.value && lesson_id.value) {
				// 传统模式
				console.log("教材模式：使用book_id和lesson_id获取进度报告");
				response = await study.getStudyProgressReports(book_id.value, lesson_id.value, 1); // type=1 对应句子
			} else {
				// 如果都没有，返回空数据
				console.log("缺少参数，跳过进度报告获取");
				lessonSentences([]);
				return;
			}
			
		    const completeList = response.data
			console.log('获取到的历史进度数据:', completeList);
			
			lessonSentences(completeList)
			
		} catch (error) {
			console.error('获取列表失败:', error);
			uni.showToast({
			  title: '获取列表失败',
			  icon: 'none',
			});
	  }
		
	}
	
	
	const lessonSentences = async (completeList) => {
	  try {
		  console.log("开始请求")
		  let response;
		  
		  // 如果是任务模式且有taskId，使用任务API获取句子
		  if (isTaskMode.value && taskId.value) {
			  console.log("任务模式：使用taskId获取句子", taskId.value);
			  response = await textbook.getTaskSentences(taskId.value);
		  } else if (book_id.value && lesson_id.value) {
			  // 否则使用传统方式
			  console.log("教材模式：使用book_id和lesson_id获取句子", book_id.value, lesson_id.value);
			  response = await textbook.getLessonSentences(book_id.value, lesson_id.value);
		  } else {
			  // 如果都没有，抛出错误
			  throw new Error("缺少必要参数：需要taskId或者book_id和lesson_id");
		  }
		
		// 创建新数组，并添加 error_count 和 points 字段，默认值为 0
		const sentences = response.data.sentences.map(sentence => {
			// 检查是否在历史记录中有这个句子的进度
			const historyItem = completeList.find(item => {
				// 添加调试日志
				if (item.content_id === sentence.id) {
					console.log(`匹配成功 - content_id: ${item.content_id} === ${sentence.id}`);
					return true;
				}
				// 后端返回的是content字段，不是word字段
				if (item.word && item.word === sentence.english) {
					console.log(`匹配成功 - word: ${item.word} === ${sentence.english}`);
					return true;
				}
				if (item.content && item.content === sentence.english) {
					console.log(`匹配成功 - content: ${item.content} === ${sentence.english}`);
					return true;
				}
				return false;
			});
			
			return {
				...sentence,
				word: sentence.english,
				content_id: sentence.id,
				content_type: 4,
				error_count: historyItem ? historyItem.error_count : 0,
				points: historyItem ? historyItem.points : 0,
				speak_count: historyItem ? (historyItem.speak_count || 0) : 0,
				isHaverated: historyItem ? 1 : 0,  // 如果有历史记录，标记为已评分
				// 保存历史进度数据
				progress_data: historyItem ? historyItem.json_data : null
			};
		});
		
		// 根据已完成的句子数量设置当前索引
		const completedCount = sentences.filter(s => s.isHaverated === 1).length;
		if (completedCount > 0 && completedCount < sentences.length) {
			currentIndext.value = completedCount;
			progressIndext.value = currentIndext.value;
		}
		
		sentencesList.value = sentences;
		
		console.log('句子列表已更新，已完成句子数:', completedCount);
		console.log('当前索引:', currentIndext.value);
		
	  } catch (error) {
	    console.error('获取列表失败:', error);
	    uni.showToast({
	      title: '获取列表失败',
	      icon: 'none',
	    });
	  }
	};
	
// 提交任务结果
const submitTaskResults = async () => {
  // 将这些变量声明在try块外，以便catch块也能访问
  let totalSentences = 0
  let completedSentences = 0
  let averageScore = 0
  
  try {
    uni.showLoading({ title: '提交中...' })
    
    // 计算总体成绩
    totalSentences = sentencesList.value.length
    completedSentences = taskResults.value.length
    averageScore = completedSentences > 0 
      ? taskResults.value.reduce((sum, r) => sum + r.auto_score, 0) / completedSentences
      : 0
    
    // 获取第一个content（句子跟读任务通常只有一个content）
    const content = taskInfo.value.contents[0]
    
    if (content) {
      // 构建提交数据，包含所有句子的结果
      const submissionData = {
        content_id: content.id,
        response: JSON.stringify({
          student_name: uni.getStorageSync('nickname') || uni.getStorageSync('userName') || '未知学生',
          task_type: 'sentence_repeat',
          task_title: taskInfo.value.title,
          results: taskResults.value.map(r => {
            const sentence = sentencesList.value.find(s => (s.content_id || s.id) === r.content_id)
            return {
              sentence_id: r.content_id,
              sentence: sentence?.english || '',
              chinese: sentence?.chinese || '',
              pronunciation_score: r.auto_score,
              is_correct: r.is_correct,
              attempts: r.attempt_count
            }
          }),
          summary: {
            total: totalSentences,
            completed: completedSentences,
            averageScore: averageScore,
            completedAt: new Date().toISOString()
          }
        }),
        is_correct: averageScore >= 60, // 60分及格
        auto_score: averageScore,
        attempt_count: 1
      }
      
      await taskRequest.createSubmission(taskId.value, submissionData)
    }
    
    uni.hideLoading()
    
    // 计算用时（任务模式使用taskProgress，否则使用pageStartTime）
    const startTime = isTaskMode.value ? taskProgress.value.startTime : pageStartTime.value
    const startTimeStr = startTime ? startTime.toISOString() : new Date().toISOString()
    
    // 跳转到任务结果页面
    uni.redirectTo({
      url: `/pages/task/result?taskId=${taskId.value}&score=${averageScore.toFixed(0)}&correct=${taskResults.value.filter(r => r.is_correct).length}&total=${totalSentences}&startTime=${encodeURIComponent(startTimeStr)}`,
      success: () => {
        console.log('跳转成功')
        // 清除保存的开始时间
        if (isTaskMode.value) {
          uni.removeStorageSync(`task_start_time_${taskId.value}`)
        } else {
          uni.removeStorageSync(`lesson_start_time_${book_id.value}_${lesson_id.value}`)
        }
      },
      fail: (err) => {
        console.error('跳转失败:', err)
        // 如果跳转失败，返回任务列表
        uni.navigateBack({ delta: 2 })
      }
    })
  } catch (error) {
    uni.hideLoading()
    console.error('提交任务结果失败:', error)
    
    // 计算用时（用于过期任务的本地展示）
    const startTime = isTaskMode.value ? taskProgress.value.startTime : pageStartTime.value
    const startTimeStr = startTime ? startTime.toISOString() : new Date().toISOString()
    
    // 检查是否是任务过期错误
    if (error.detail && error.detail.includes('截止时间')) {
      uni.showModal({
        title: '任务已过期',
        content: '该任务已过截止时间，无法提交。练习记录已保存，但不计入成绩。',
        showCancel: true,
        confirmText: '查看练习',
        cancelText: '返回列表',
        success: (res) => {
          if (res.confirm) {
            // 查看练习结果（本地展示）
            uni.redirectTo({
              url: `/pages/task/result?taskId=${taskId.value}&score=${averageScore.toFixed(0)}&correct=${taskResults.value.filter(r => r.is_correct).length}&total=${totalSentences}&startTime=${encodeURIComponent(startTimeStr)}&expired=true`,
              fail: () => {
                uni.navigateBack({ delta: 2 })
              }
            })
          } else {
            // 返回任务列表
            uni.navigateBack({ delta: 2 })
          }
        }
      })
    } else {
      // 其他错误
      uni.showToast({
        title: error.message || '提交失败',
        icon: 'none',
        duration: 2000
      })
    }
  }
}


// 保存任务进度
const saveTaskProgress = async () => {
  console.log('保存任务进度:', taskProgress.value)
  
  // 筛选已评分的句子
  const haveratedSentences = sentencesList.value.filter(
    (sentence) => sentence.isHaverated === 1
  );
  
  if (haveratedSentences.length > 0) {
    // 调用进度保存方法，传入false表示未完成
    await submitreslutStudyProgressReport(haveratedSentences, false)
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
			display: flex;
			flex-direction: column;
			.sentence-top {
				margin-top: 50rpx;
				margin-bottom: 0rpx;
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
			.sentence-bottom {
				margin-top: 80rpx;
				position: relative;
			}
			
		}
	}
	
	.left-icon {
		height: 50rpx;
		width: 50rpx;
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