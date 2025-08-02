<template>
	<view class="container">
		<view class="headView" :style="{ paddingTop: statusBarHeight + 'px', height: '44px' }">
			<image @tap="handleBackPage" class="head-icon" src="@/assets/icons/black_back.svg"></image>
			<view class="head-text">单词跟读</view>
		</view>
		
		<view v-if="wordsList.length>0" class="content_view">
			<view class="progressview">
				<view class="progressbar">
					<view :style="{ width: progress + '%' }" class="contentitem"></view>
				</view>
				<view class="progresstext">
					{{progresstext}}
				</view>
			</view>
			<view  class="word-item">
				<view class="points_view">积分：{{totalpoints}}</view>
				<view class="word-top">
					<view class="word-left">
						<view class="english">{{ optionWord.word }}</view>
						<view class="chinese">{{ optionWord.chinese }}</view>
					</view>
					<view class="audio-icon">
						<image @tap="playbuttonclick" class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
					</view>
				</view>
				<view class="word-bottom">
					<Speech 
							:ref-obj="optionWord" 
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
	import { onLoad } from '@dcloudio/uni-app'
	import textbook from '@/api/textbook'
	import study from '@/api/study';
	import taskRequest from '@/api/task';
	
	// 获取设备的安全区域高度
	const statusBarHeight = ref(0);
	const customBarHeight = ref(0);
	
	const lesson_id = ref('')
	const book_id = ref('')
	
	const wordsList = ref([])
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
	const currentAudio = ref(null)
	const uniExitreminderPopPopup = ref(false)
	
	onMounted(() => {
		const systemInfo = uni.getSystemInfoSync();
		statusBarHeight.value = systemInfo.statusBarHeight || 0;
		customBarHeight.value = (systemInfo.statusBarHeight || 0) + 44; // 44 是导航栏的默认高度
		
		uni.$on('start_recording', (params) => {
		    console.log('收到全局事件，参数:', params);
		    if (params.action === 'recording') {
				stopCurrentAudio()
		    }
		  });
		
	});
	
	onUnmounted(() => {
		stopWatch(); // 确保无论如何都会清理
		stopCurrentAudio()
		uni.$off('start_recording'); // 组件卸载时移除监听
		
	})
	
	// 监听 currentIndext 的变化
	watch(currentIndext, (newValue, oldValue) => {
	    // 在这里执行你的逻辑
	    if (newValue !== oldValue) {
	        // 例如：调用某个方法
	        isShowmark.value = (optionWord.value.progress_data && optionWord.value.progress_data.length > 20)
	    }
	});
	
	// 封装提交进度的方法
	const submitProgressWithMode = async (reports, statusNum) => {
		if (isTaskMode.value && taskId.value) {
			console.log('任务模式提交进度:', {
				taskId: taskId.value,
				reports: reports,
				statusNum: statusNum
			});
			return await study.submitStudyProgressReport(undefined, undefined, reports, statusNum, taskId.value);
		} else {
			console.log('教材模式提交进度:', {
				book_id: book_id.value,
				lesson_id: lesson_id.value,
				statusNum: statusNum,
				reports_count: reports.length,
				first_report: reports[0] ? {
					word: reports[0].word,
					content_id: reports[0].content_id,
					content_type: reports[0].content_type,
					has_content_id: 'content_id' in reports[0]
				} : null
			});
			return await study.submitStudyProgressReport(book_id.value, lesson_id.value, reports, statusNum);
		}
	}
	
	const submitreslutStudyProgressReport = async(reports, isDone = true)=> {
		try {
			// 始终先保存进度，无论是否为任务模式
			let statusNum = isDone==true?1:0
			
			console.log('提交进度报告:', {
				reports: reports,
				statusNum: statusNum,
				isTaskMode: isTaskMode.value,
				taskId: taskId.value,
				book_id: book_id.value,
				lesson_id: lesson_id.value
			});
			
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
				  data: JSON.stringify(wordsList.value),
				  success: function () {
					console.log('数据存储成功');
					// 跳转到学习页面
					uni.navigateTo({
					  url: `/pages/textbook/UnitWordreport?unitreportWords=${unitreportWords}&totalpoints=${totalpoints.value}&backPage=2&type=6`, // type=6 单词跟读
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
			 stopCurrentAudio()
			if (currentIndext.value==(wordsList.value.length-1)) {
				progressIndext.value = wordsList.value.length
				
				const haveratedWords = wordsList.value.filter(
				  (word) => word.isHaverated === 1
				).map(word => {
					console.log('处理单词:', {
						word: word.word,
						id: word.id,
						content_id: word.content_id,
						has_content_id: 'content_id' in word,
						has_id: 'id' in word
					});
					return {
						...word,
						word: word.word || word.english, // 确保有word字段
						content_id: word.content_id || word.id // 确保有content_id字段
					};
				});
				if (haveratedWords.length>0) {
					//这边是全部完成的
					submitreslutStudyProgressReport(haveratedWords, true)
				} else {
					uni.showToast({
					  title: '当前没有可提交的数据，是否返回上一页',
					  icon: 'none',
					});
				}
				
				
			} else {
				currentIndext.value++;
				progressIndext.value = currentIndext.value
				
				
				if (!(optionWord.value.progress_data && optionWord.value.progress_data.length > 20)) {
					// followReadingref.value.resetRefresh()
				}
				
				setTimeout(() => {
				    playbuttonclick()
				}, 500);
			}
		}
		
	}
	
	const reevaluation = () => {
		optionWord.value.isHaverated = 0
		optionWord.value.progress_data=""
		isShowmark.value = false
	}
	
	const handleEvaluationResult = (pronunciationResult) => {
		console.log(pronunciationResult, "单词测评结果", pronunciationResult)
		optionWord.value.json_data = pronunciationResult
		optionWord.value.voice_file = pronunciationResult.voice_file
		optionWord.value.isHaverated = 1
		isShowmark.value = true
		optionWord.value.speak_count = (optionWord.value.speak_count || 0) + 1
		
		// 添加调试日志，查看当前单词的数据结构
		console.log('handleEvaluationResult - 当前单词数据结构:', {
			id: optionWord.value.id,
			word: optionWord.value.word,
			content_id: optionWord.value.content_id,
			content_type: optionWord.value.content_type,
			chinese: optionWord.value.chinese,
			audio_url: optionWord.value.audio_url,
			has_content_id: 'content_id' in optionWord.value
		});
		if (pronunciationResult.pronunciation_score < 60) {
			if (optionWord.value.points === 0) {
				optionWord.value.points += 1; // 积分加1
				totalpoints.value += 1; // 总积分加1
			}
		} else {
			if (optionWord.value.points !== 2) {
				 const previousPoints = optionWord.value.points; // 保存原有积分
				 optionWord.value.points = 2; // 积分更新为2
				 totalpoints.value += (2 - previousPoints); // 更新总积分
			}
		}
		
		// 如果是任务模式，记录结果
		if (isTaskMode.value) {
		  const wordResult = {
		    content_id: optionWord.value.content_id || optionWord.value.id,
		    response: 'word_pronunciation',
		    is_correct: pronunciationResult.pronunciation_score >= 60,
		    auto_score: pronunciationResult.pronunciation_score,
		    attempt_count: optionWord.value.speak_count || 1
		  }
		  
		  // 查找是否已有该单词的结果，如果有则更新
		  const existingIndex = taskResults.value.findIndex(r => r.content_id === (optionWord.value.content_id || optionWord.value.id))
		  if (existingIndex >= 0) {
		    taskResults.value[existingIndex] = wordResult
		  } else {
		    taskResults.value.push(wordResult)
		  }
		}
	}
	
	const progress = computed(() => {
		   if (wordsList.value.length>0) {
			   let percentage =  (progressIndext.value / wordsList.value.length) * 100;
			   return percentage
		   } else {
			  return 0 
		   }
	});
	const progresstext = computed(() => {
		   if (wordsList.value.length>0) {
			   var jdnum = progressIndext.value
			   var totalnum = wordsList.value.length
			   return jdnum+"/"+totalnum
		   } else {
			  return "" 
		   }
	});
	
	
	const optionWord = computed(() => {
		return wordsList.value[currentIndext.value]
	});
	
	// 监听 optionWord 变化（推荐）
	  const stopWatch = watch(
	    () => optionWord.value,
	    (newVal) => {
	      if (newVal) {
	        nextTick(() => {
	          playbuttonclick();
	          isShowmark.value = Boolean(
	            newVal.progress_data?.length > 20
	          );
	          stopWatch(); // 执行后停止监听
	        });
	      }
	    },
	    { immediate: true } // 立即检查初始值
	  );

	
	const playbuttonclick = () => {
		if(!optionWord?.value?.audio_url)return
		stopCurrentAudio();
		const audio = uni.createInnerAudioContext();
		currentAudio.value = audio;
		audio.src = optionWord?.value?.audio_url;
		
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
		stopCurrentAudio()
		uniExitreminderPopPopup.value = true
	}
	
	const keepdoing = () => {
		uniExitreminderPopPopup.value = false
	}
	
	const gonavback = async () => {
		uniExitreminderPopPopup.value = false
		
		console.log("单词====>>>sss", wordsList.value)
		if (progressIndext.value != wordsList.value.length) {
			// 筛选已评分的单词的数组
			const haveratedWords = wordsList.value.filter(
			  (word) => word.isHaverated === 1
			).map(word => {
				console.log('处理单词(退出时):', {
					word: word.word,
					id: word.id,
					content_id: word.content_id,
					has_content_id: 'content_id' in word,
					has_id: 'id' in word
				});
				return {
					...word,
					word: word.word || word.english, // 确保有word字段
					content_id: word.content_id || word.id // 确保有content_id字段
				};
			});
			console.log(haveratedWords, "单词====>>>", wordsList.value)
			if (haveratedWords.length>0) {
				// 直接调用，函数内部会处理任务模式
				await submitreslutStudyProgressReport(haveratedWords, false)
			} 	
		} 
		
		if (isTaskMode.value) {
			uni.navigateBack()
		} else {
			uni.switchTab({
				url: `/pages/textbook/index3`,
			})
		}
	}
	

	onLoad(async (options) => { 
		const { bookId,lessonId, taskId: tid} = options;
		console.log('UnitWordRead onLoad - 接收到的参数:', {
			bookId,
			lessonId,
			taskId: tid,
			lessonIdType: typeof lessonId
		});
		
		book_id.value = bookId || null
		lesson_id.value = lessonId ? parseInt(lessonId) : null
		
		console.log('UnitWordRead onLoad - 设置后的值:', {
			book_id: book_id.value,
			lesson_id: lesson_id.value,
			lesson_idType: typeof lesson_id.value
		});
		
		// 检查是否为任务模式
		if (tid) {
			isTaskMode.value = true
			taskId.value = tid
			await loadTaskInfo()
		}
		gethistoryWords()
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
	
	const gethistoryWords = async() => {
		try {
			let response;
			
			// 如果是任务模式，使用taskId获取进度报告
			if (isTaskMode.value && taskId.value) {
				console.log("任务模式：使用taskId获取进度报告", taskId.value);
				response = await study.getStudyProgressReports(undefined, undefined, 3, taskId.value); // type=3 对应单词发音
			} else if (book_id.value && lesson_id.value !== null && lesson_id.value !== undefined) {
				// 传统模式
				console.log("教材模式：使用book_id和lesson_id获取进度报告", {
					book_id: book_id.value,
					lesson_id: lesson_id.value,
					lesson_id_type: typeof lesson_id.value,
					content_type: 3
				});
				response = await study.getStudyProgressReports(book_id.value, lesson_id.value, 3); // type=3 对应单词发音
			} else {
				// 如果都没有，返回空数据
				console.log("缺少参数，跳过进度报告获取");
				lessonWords([]);
				return;
			}
			
		    const completeList = response.data
			console.log('获取到的历史进度数据:', completeList);
			console.log('历史进度数据详情:', {
				count: completeList.length,
				items: completeList.map(item => ({
					content_id: item.content_id,
					word: item.word,
					points: item.points,
					error_count: item.error_count,
					json_data: item.json_data ? 'has data' : 'no data'
				}))
			});
			
			lessonWords(completeList)
			
		} catch (error) {
			console.error('获取列表失败:', error);
			uni.showToast({
			  title: '获取列表失败',
			  icon: 'none',
			});
	  }
		
	}
	
	
	const lessonWords = async (completeList) => {
	  try {
		  console.log("开始请求")
		  let response;
		  
		  // 如果是任务模式且有taskId，使用任务API获取单词
		  if (isTaskMode.value && taskId.value) {
			  console.log("任务模式：使用taskId获取单词", taskId.value);
			  response = await textbook.getTaskWords(taskId.value);
		  } else if (book_id.value && lesson_id.value !== null && lesson_id.value !== undefined) {
			  // 否则使用传统方式
			  console.log("教材模式：使用book_id和lesson_id获取单词", {
				  book_id: book_id.value,
				  lesson_id: lesson_id.value,
				  lesson_id_type: typeof lesson_id.value
			  });
			  response = await textbook.getLessonWords(book_id.value, lesson_id.value);
		  } else {
			  // 如果都没有，抛出错误
			  throw new Error("缺少必要参数：需要taskId或者book_id和lesson_id");
		  }
		
		// 创建新数组，并添加 error_count 和 points 字段，默认值为 0
		console.log('开始匹配单词进度，单词列表:', response.data.words.map(w => ({ 
			id: w.id, 
			word_id: w.word_id,
			word: w.word 
		})));
		const words = response.data.words.map(word => {
			// 检查是否在历史记录中有这个单词的进度
			const historyItem = completeList.find(item => {
				// 添加调试日志
				// 优先通过content_id匹配（支持word_id和id两种情况）
				if (item.content_id && (item.content_id === word.word_id || item.content_id === word.id)) {
					console.log(`匹配成功 - content_id: ${item.content_id} === ${word.word_id || word.id}`);
					return true;
				}
				// 后端返回的是content字段，不是word字段
				if (item.content && item.content === word.word) {
					console.log(`匹配成功 - content: ${item.content} === ${word.word}`);
					return true;
				}
				if (item.word && item.word === word.word) {
					console.log(`匹配成功 - word: ${item.word} === ${word.word}`);
					return true;
				}
				return false;
			});
			
			const wordObj = {
				...word,
				id: word.word_id || word.id, // 确保有id字段
				english: word.word, // 为了兼容Speech组件
				content_id: word.word_id || word.id, // 使用word_id作为content_id
				content_type: 3, // 3表示单词发音
				error_count: historyItem ? historyItem.error_count : 0,
				points: historyItem ? historyItem.points : 0,
				speak_count: historyItem ? (historyItem.speak_count || 0) : 0,
				isHaverated: historyItem ? 1 : 0,  // 如果有历史记录，标记为已评分
				// 保存历史进度数据
				progress_data: historyItem ? historyItem.json_data : null
			};
			
			console.log('构建单词对象:', {
				original_id: word.id,
				original_word_id: word.word_id,
				final_id: wordObj.id,
				final_content_id: wordObj.content_id,
				word: word.word,
				content_type: wordObj.content_type,
				hasHistory: !!historyItem,
				points: wordObj.points,
				isHaverated: wordObj.isHaverated
			});
			
			return wordObj;
		});
		
		// 根据已完成的单词数量设置当前索引
		const completedCount = words.filter(w => w.isHaverated === 1).length;
		if (completedCount > 0 && completedCount < words.length) {
			currentIndext.value = completedCount;
			progressIndext.value = currentIndext.value;
		}
		
		// 计算已完成单词的总积分
		const completedPoints = words.filter(w => w.isHaverated === 1).reduce((sum, w) => sum + (w.points || 0), 0);
		totalpoints.value = completedPoints;
		
		wordsList.value = words;
		
		console.log('单词列表已更新，已完成单词数:', completedCount);
		console.log('当前索引:', currentIndext.value);
		console.log('已完成单词总积分:', completedPoints);
		
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
  try {
    uni.showLoading({ title: '提交中...' })
    
    // 计算总体成绩
    const totalWords = wordsList.value.length
    const completedWords = taskResults.value.length
    const averageScore = taskResults.value.reduce((sum, r) => sum + r.auto_score, 0) / completedWords
    
    // 获取第一个content（单词跟读任务通常只有一个content）
    const content = taskInfo.value.contents[0]
    
    if (content) {
      // 构建提交数据，包含所有单词的结果
      const submissionData = {
        content_id: content.id,
        response: JSON.stringify({
          student_name: uni.getStorageSync('nickname') || uni.getStorageSync('userName') || '未知学生',
          task_type: 'word_pronunciation',
          task_title: taskInfo.value.title,
          results: taskResults.value.map(r => {
            const word = wordsList.value.find(w => (w.content_id || w.id) === r.content_id)
            return {
              word_id: r.content_id,
              word: word?.word || '',
              chinese: word?.chinese || '',
              pronunciation_score: r.auto_score,
              is_correct: r.is_correct,
              attempts: r.attempt_count
            }
          }),
          summary: {
            total: totalWords,
            completed: completedWords,
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
    
    // 跳转到任务结果页面
    uni.redirectTo({
      url: `/pages/task/result?taskId=${taskId.value}&score=${averageScore.toFixed(0)}&correct=${taskResults.value.filter(r => r.is_correct).length}&total=${totalWords}`,
      success: () => {
        console.log('跳转成功')
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
    uni.showToast({
      title: '提交失败',
      icon: 'none'
    })
  }
}


// 保存任务进度
const saveTaskProgress = async () => {
  console.log('保存任务进度:', taskProgress.value)
  
  // 筛选已评分的单词
  const haveratedWords = wordsList.value.filter(
    (word) => word.isHaverated === 1
  ).map(word => {
	  console.log('处理单词(任务进度):', {
		  word: word.word,
		  id: word.id,
		  content_id: word.content_id,
		  has_content_id: 'content_id' in word,
		  has_id: 'id' in word
	  });
	  return {
		  ...word,
		  word: word.word || word.english, // 确保有word字段
		  content_id: word.content_id || word.id // 确保有content_id字段
	  };
  });
  
  if (haveratedWords.length > 0) {
    // 调用进度保存方法，传入false表示未完成
    await submitreslutStudyProgressReport(haveratedWords, false)
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
		.word-item {
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
			.word-top {
				margin-top: 50rpx;
				margin-bottom: 0rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				.word-left {
					// width: 70%;
					margin-left: 20rpx;
					margin-right: 30rpx;
					.english {
						color: #05c160;
						font-size: 60rpx;
						font-weight: bold;
					}
					.chinese {
						font-size: 40rpx;
						margin-top: 30rpx;
						text-align: center;
					}
				}
				.audio-icon {
					margin-right: 30rpx;
				}
			}
			.word-bottom {
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