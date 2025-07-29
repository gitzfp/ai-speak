<template>
  <view class="container">
	<scroll-view class="plan-content"
	scroll-y
	:scroll-into-view="scrollToUnitId"
	>
		<view @tap="ebbinghausclick" class="header">
		  <view class="hedtitle">艾宾浩斯记忆法</view>
		  <view class="subtitle">
			  <text class="subtitlect">高效背词·科学记忆·对抗遗忘</text>
		  </view>
		</view>
		<view class="contentone">
			<view @tap="openResetPopup" class="replacementplan">
				<image class="left-icon" src="@/assets/icons/word_refresh.svg"></image>
				<view class="replacementplan-title">重置计划</view>
			</view>
		  <view class="plan-section">
			<image @click="switchBook" :src="book.icon_url" class="section-img"></image>
			<view class="section-ct">
				<view class="oneline">
					<text class="oneline-subtitle">{{ book.grade }} {{ book.term }}</text>
					<view @click="switchBook" class="oneline_btn">
						<image class="left-icon" src="@/assets/icons/parallel_double_arrow.svg"></image>
						<text class="section-title">切换单词书</text>
					</view>
				</view>
				<view class="twoline">
					{{ book.book_name }}
				</view>
				
				<view class="progress-bar">
					<view 
					  class="progress-ct" 
					  :style="{ width: progress + '%' }"
					></view>
				 </view>
				
				<view class="threeline">
					<view class="threeline-title"> <text style="color: red;">{{finishLearningNum}}</text>/{{wordcountTotal}}</view>
					<view class="threeline-title"> 剩余<text style="color: red;">{{remainingdays}}</text>天</view>
				</view>
				
				
			</view>
		  </view>
		  <view class="intermediate-line"></view>
		
		  <view class="progress-section">
			  <view class="progress-left">
				<text class="progresslf">今日计划</text>
				 <image class="left-icon" src="@/assets/icons/time_round.svg"></image>
				 <text class="progressrt">预计需要<text style="color: red;">{{learnNumtoday}}</text>分钟</text> 
			  </view>
			  <view @tap="modifyplan" class="modify-btn">
				<image class="left-icon" src="@/assets/icons/edit_modify.svg"></image>
				<text class="section-title">修改计划</text>
			  </view>
		  </view>
		
		  <view class="task-section">
			<view class="task-title"><text>需新学</text> <text class="numtit" style="color: #F08833;">{{learnNumtoday}}</text> <text>词</text></view>
			<view class="task-title"><text>需复习</text> <text class="numtit" style="color: #ED6C43;">{{review_words.length}}</text> <text>词</text></view>
		  </view>
		  
		  <view class="contentonebtn">
			  <view class="btn-view">
				  <view @tap="startLearningword" class="learn-btn">再学一组</view>
			  </view>
			  <view class="btn-view">
			  	<view @tap="goovertheword" class="review-btn">复习完成</view>		  
			  </view>
			  
			  
		  </view>
		  
		</view>
		
		<view class="contenttwo">
			<view v-if="completionRecords.length>0" class="contenttwo-one">
				<view class="calendar-section">
				  <view class="calendar-title">本周完成情况</view>
				</view>
				<view class="calendar-rt">
				  <view v-if="singledayRecord.status==1" class="calendar-subtitle">连续完成<text style="color: #ED6C43;">{{singledayRecord.continuous_days}}</text>天</view>
				  <view v-else class="calendar-subtitle">今日计划未完成</view>
				  <view class="share-btn">晒一晒</view>
				</view>
			</view>
			
			
			
			<view v-if="completionRecords.length>0" class="contenttwo-days">
			  <view @tap="calendarItemclick(index)" class="calendar-item" v-for="(item, index) in weekstitList" :key="index">
				  <view class="item_top">{{item.week}}</view>
				  <view :class="completionRecords[index].status==1?'item_middle_st':'item_middle'"><text>{{item.date}}</text></view>
				  <view :class="completionRecords[index].status==1?'item_bottom_st':'item_bottom'"></view>
			  </view>
			</view>
			
			<view class="record-container">
			    <view class="record-header">
			      <text class="record-title">学习记录</text>
			    </view>
			    <view class="record-content">
			      <view class="record-item">
			        <view class="record-labelone"><text>{{studyRecord.new_words+studyRecord.review_words}}</text> 词</view>
			        <view class="record-labeltwo">今日学习/复习</view>
			      </view>
			      <view class="record-item">
			        <view class="record-labelone"><text>{{studyRecord.total_mastered_words}}</text> 词</view>
			        <view class="record-labeltwo">累计掌握</view>
			      </view>
				</view>
				<view class="record-content record-content-interstice">
					<view class="record-item">
					  <view class="record-labelone"><text>{{studyRecord.duration}}</text> 分钟</view>
					  <view class="record-labeltwo">今日学习时长</view>
					</view>
					<view class="record-item">
					  <view class="record-labelone"><text>{{studyRecord.total_duration}}</text> 分钟</view>
					  <view class="record-labeltwo">累计学习时长</view>
					</view>
			    </view>
			  </view>
			
		</view>
		
		<!-- 添加一个占位符，避免内容被 tabBar 遮挡 -->
		<view class="tabbar-placeholder"></view>
		  
	</scroll-view>
	
    

    <bookSelector ref="bookSelectors" v-if="isPopupOpen" :numType="2" :books="books" @switchbookSuccess="switchbookSuccess" @closePopup="togglePopup" />

		
	<ModifyPlanPopup :visible="isPlanPopupVisible" :unlearnednum="unlearned_words.length" :currentPlan="numofday"
		      @update:visible="isPlanPopupVisible = $event" @updatePlan="updatePlan"/>
	
	<!-- 重置计划弹窗 -->
	 <ResetPlanPopup @confirm="replacementplanClick" ref="resetPlanPopup" />
    
	  <RelearnPlanPop :book=book @confirm="relearnPlanClick" ref="relearnPlanPop" />
	
  </view>
</template>

<script setup>
	import { ref,onMounted,onUnmounted,watch,nextTick,computed} from 'vue';
	import bookSelector from './bookSelector.vue';
	import textbook from '@/api/textbook';
	import ModifyPlanPopup from './ModifyPlanPopup.vue'
	import study from '@/api/study';
	import ResetPlanPopup from './components/ResetPlanPopup'
	import RelearnPlanPop from './components/RelearnPlanPop'
	import useTextbookSelector from "@/hooks/useTextbookSelector";

	const {
	  fetchBooks: fetchTextbooks, // 重命名避免冲突
	  filteredBooks: books,
	} = useTextbookSelector();
	//暂时不点亮
	const weekindext = ref(-1)
	const isPopupOpen = ref(false)
	const bookSelectors = ref(null);
	const book = ref({
		book_id:'',
		book_name:'',
		grade:'',
		icon_url: '',
		subject_id:0,
		term:'',
		version_type:''
	})
	
	//学习计划
	const studyPlan = ref(null)
	//学习记录
	const studyRecord = ref({
		new_words: 0,
		review_words: 0,
		duration:0,
		total_duration: 0,
		total_mastered_words: 0,
	})
	 
	
	//未学习的单词数组
	const unlearned_words = ref([])
	//学习的单词数组
	const learned_words = ref([])
	//需复习的单词数组
	const review_words = ref([])
	
	const isPlanPopupVisible = ref(false);
	// 获取弹窗组件的引用
	const resetPlanPopup = ref(null);

	// 获取重新弹窗组件的引用
	const relearnPlanPop = ref(null);
	
	//完整每日单词的数组
	const completionRecords = ref([])
	
	const singledayRecord = computed(() => {
		if (completionRecords.value.length) {
			const today = new Date();
			const year = today.getFullYear();
			const month = String(today.getMonth() + 1).padStart(2, '0');
			const day = String(today.getDate()).padStart(2, '0');
			const todayFormatted = `${year}-${month}-${day}`;
			
			// 查找 date 为当天的对象
			const todayRecord = completionRecords.value.find(record => record.date === todayFormatted);

			return todayRecord
		}
		return null
	})
	
	const learnNumtoday = computed(() => {
		if (studyPlan.value) {
			if (studyPlan.value.daily_words<studyRecord.value.new_words) {
				return 0
			}
			return studyPlan.value.daily_words-studyRecord.value.new_words
		}
		return 0
	})
	const numofday = computed(() => {
		if (studyPlan.value) {
			return studyPlan.value.daily_words
		}
		return 5
	})
	//学习完单词的个数
	const finishLearningNum = computed(() => {
		return learned_words.value.length
	})
	//总单词的个数
	const wordcountTotal = computed(() => {
		let total = learned_words.value.length+unlearned_words.value.length
		return total
	})
	
	const weekstitList = computed(() => {
	   const today = new Date();
	       const currentDay = today.getDay(); // 获取当前是星期几 (0=周日, 1=周一, ..., 6=周六)
	       const currentDate = today.getDate(); // 获取当前日期
	   
	       // 计算本周的周一日期
	       const monday = new Date(today);
	       monday.setDate(currentDate - (currentDay === 0 ? 6 : currentDay - 1));
	   
	       const weekDates = [];
	       const weekDayMap = {
	           'Sunday': '日',
	           'Monday': '一',
	           'Tuesday': '二',
	           'Wednesday': '三',
	           'Thursday': '四',
	           'Friday': '五',
	           'Saturday': '六'
	       };
	   
			
	       for (let i = 0; i < 7; i++) {
	           const date = new Date(monday);
	           date.setDate(monday.getDate() + i);
	   
	           const weekDay = weekDayMap[date.toLocaleDateString('en-US', { weekday: 'long' })] || '';
			   
			   const year = date.getFullYear(); // 获取年份
			   const month = String(date.getMonth() + 1).padStart(2, '0'); // 获取月份，并补零
	           const monthDate = String(date.getDate()).padStart(2, '0'); // 小于10前面补零
			   
			   const formattedDate = `${year}-${month}-${monthDate}`; // 拼接为年-月-日格式
	
	           weekDates.push({
	               week: weekDay,
	               date: monthDate,
	               isSelect: false,
				   formattedDate:formattedDate
	           });
	       }
		   
		   
	   
	       return weekDates;
	})
	
	//剩余多少天完成
	const remainingdays = computed(() => {
		if (wordcountTotal.value>0) {
			let rgwords = wordcountTotal.value - finishLearningNum.value
			//向上取整
			let halfCeil = Math.ceil(rgwords / numofday.value);
			return halfCeil
		} else {
			return 0
		}
	})
	
	
	const progress = computed(() => {
	       if (wordcountTotal.value>0) {
			   let percentage = (finishLearningNum.value / wordcountTotal.value) * 100;
			   return percentage
		   } else {
			  return 0 
		   }
	});
	
	// 监听 book_id 变化
	watch(() => book.value.book_id, (newVal, oldVal) => {
		console.log(`book_id 从 ${oldVal} 变更为 ${newVal}`);
		// 在这里可以执行其他逻辑
		if (newVal.length>0) {
			studyPlanForbookid(newVal)
			studyRecordForbookid(newVal)
			studyCompletionRecords(newVal)
		}
	});
	
	// 组件挂载时获取数据
	onMounted(() => {
		
		fetchBooks(false)
		uni.$on('refreshwordshomepage', (params) => {
		    console.log('收到全局事件，参数:', params);
		    if (params.action === 'updateData') {
			  fetchWords(book.value.book_id,studyPlan.value.id)
		      studyRecordForbookid(book.value.book_id); // 根据参数执行操作
			  studyCompletionRecords(book.value.book_id)
		    }
		  });
	})
	onUnmounted(() => {
		 uni.$off('refreshwordshomepage'); // 组件卸载时移除监听
		progresscacheObjectdelete()
	})

	const ebbinghausclick = () =>{
		uni.navigateTo({
		  url: `/pages/textbook/Ebbinghaus`, 
		});
	}
	
	// 打开重置计划弹窗
	const openResetPopup = () => {
	  resetPlanPopup.value.openPopup();
	}
	const relearnPlanClick = () => {
		// console.log("重新学习")
		replacementplanClick()
	}
	//重置计划 实现
	const replacementplanClick = async () => {
	  console.log("开始重置计划");
	
	  try {
	    // 发送重置计划的请求
	    const response = await study.createStudyPlan(book.value.book_id,3); 
	    if (response.code === 1000) { // 假设 1000 是成功状态码
		  studyPlan.value = response.data
	      progresscacheObjectdelete(); // 清除缓存
	      // 其他逻辑，例如更新页面状态
	      fetchWords(book.value.book_id,studyPlan.value.id); // 重新获取单词数据
	    } else {
	      console.error("重置计划失败:", response.message);
	      uni.showToast({
	        title: "重置计划失败",
	        icon: "none",
	      });
	    }
	  } catch (error) {
	    console.error("请求失败:", error);
	    uni.showToast({
	      title: "请求失败，请稍后重试",
	      icon: "none",
	    });
	  }
	};
	
	//删除背词里面的缓存
	const progresscacheObjectdelete = () => {

		// 获取所有存储的 key
		  const storageInfo = uni.getStorageInfoSync();
		  const allKeys = storageInfo.keys;
		
		  // 过滤出前缀为 progresscacheObject 的 key
		  const progressCacheKeys = allKeys.filter(key => key.startsWith('progresscacheObject'));

		
		progressCacheKeys.forEach(key => {
			uni.removeStorage({
			  key: key,
			  success: () => {
				console.log(`已删除 key: ${key}`);
			  },
			  fail: (err) => {
				console.error(`删除 key: ${key} 失败`, err);
			  }
			});
		  });
		
		
	}
	
	//数组选取数组的num 个值
	function getRandomElements(szwords, num) {
	    return [...szwords]
	        .sort(() => Math.random() - 0.5) // 随机排序
	        .slice(0, num); // 取前 num 个元素
	}
	
	const startLearningword = () => {
		if (unlearned_words.value.length<=0) {
			// console.log("学完了，是否重新学习的")
			relearnPlanPop.value.openPopup();
			return
		}
		if (studyPlan!=null && !(studyPlan.value.id > 0)) {
			return
		}
		var planId = studyPlan.value.id
		var numvalue = numofday.value
		
		if (unlearned_words.value.length < numvalue) {
			numvalue = unlearned_words.value.length
		}
		let firstFive = unlearned_words.value.slice(0, numvalue);
		
		let planWordsList = [];
		firstFive.forEach(word => {
		    planWordsList.push(word.word_id);
		});
		
		var subsidiaryWordsList = []
		// 如果 firstFive 的长度小于 4，则需要补充单词
		if (firstFive.length < 4) {
			// 从 unlearned_words 中排除 firstFive
			let remainingUnlearned = unlearned_words.value.slice(numvalue);

			// 计算需要补充的单词数量
			let needed = 4 - firstFive.length;

			// 如果 remainingUnlearned 中有单词，则先从中取
			if (remainingUnlearned.length > 0) {
				// 取 remainingUnlearned 中的所有单词（最多取 needed 个）
				let supplementaryWords = remainingUnlearned.slice(0, needed);
				supplementaryWords.forEach(word => {
					subsidiaryWordsList.push(word.word_id);
				});

				// 如果 remainingUnlearned 中的单词不足，再从 learned_words 中取
				if (supplementaryWords.length < needed) {
					let remainingNeeded = needed - supplementaryWords.length;
					let additionalWords = getRandomElements(learned_words.value, remainingNeeded);
					additionalWords.forEach(word => {
						subsidiaryWordsList.push(word.word_id);
					});
				}
			} else {
				// 如果 remainingUnlearned 中没有单词，则直接从 learned_words 中取
				let supplementaryWords = getRandomElements(learned_words.value, needed);
				supplementaryWords.forEach(word => {
					subsidiaryWordsList.push(word.word_id);
				});
			}
		}
		
		if (subsidiaryWordsList.length>0) {
			const subsidiaryWords = 'subsidiaryWords';
			const planWords = 'planWords';
			uni.setStorage({
			  key: subsidiaryWords,
			  data: JSON.stringify(subsidiaryWordsList),
			  success: function () {
				uni.setStorage({
				  key: planWords,
				  data: JSON.stringify(planWordsList),
				  success: function () {
					console.log('数据存储成功');
					// 跳转到学习页面
					uni.navigateTo({
					  url: `/pages/textbook/WordplanDetail?planWords=${planWords}&bookId=${book.value.book_id}&subsidiaryWords=${subsidiaryWords}&planId=${planId}`, // 将缓存键名传递给学习页面
					});
				  },
				  fail: function (err) {
					console.log('数据存储失败', err);
				  }
				});
			  },
			  fail: function (err) {
				console.log('数据存储失败', err);
			  }
			});
			
			
			
			
		} else {
			const planWords = 'planWords';
			uni.setStorage({
			  key: planWords,
			  data: JSON.stringify(planWordsList),
			  success: function () {
				console.log('数据存储成功');
				// 跳转到学习页面
				uni.navigateTo({
				  url: `/pages/textbook/WordplanDetail?planWords=${planWords}&bookId=${book.value.book_id}&planId=${planId}`, // 将缓存键名传递给学习页面
				});
			  },
			  fail: function (err) {
				console.log('数据存储失败', err);
			  }
			});
		}
		
		// console.log("firstFive==="+firstFive)
		// console.log(firstFive)
		
		
		
		
	}
	
	
	const goovertheword = () => {
		if (review_words.value.length<=0) {
			uni.showToast({
			  title: '没有需复习的单词',
			  icon: 'none'
			})
			return
		}
		if (studyPlan!=null && !(studyPlan.value.id > 0)) {
			return
		}
		var planId = studyPlan.value.id
		var numvalue = numofday.value
		
		if (review_words.value.length < numvalue) {
			numvalue = review_words.value.length
		}
		let firstFive = review_words.value.slice(0, numvalue);
		let planWordsList = [];
		firstFive.forEach(word => {
		    planWordsList.push(word.word_id);
		});
		
		// 如果 firstFive 的长度小于 4，则需要补充单词
		  if (firstFive.length < 4) {
		    // 合并 unlearned_words 和 learned_words
		    const combinedWords = [...unlearned_words.value, ...learned_words.value];
		
		    // 过滤掉已经在 firstFive 中的 word_id
		    const filteredWords = combinedWords.filter(word => 
		      !firstFive.some(item => item.word_id === word.word_id)
		    );
		
		    // 计算需要补充的单词数量
		    const needed = 4 - firstFive.length;
		
		    // 从 filteredWords 中随机选取 needed 个单词
		    const supplementaryWords = getRandomElements(filteredWords, needed);
		
		    // 将 supplementaryWords 的 word_id 加入 subsidiaryWordsList
		    let subsidiaryWordsList = [];
		    supplementaryWords.forEach(word => {
		      subsidiaryWordsList.push(word.word_id);
		    });
		
		    // 存储 subsidiaryWordsList 和 planWordsList
		    const subsidiaryWords = 'subsidiaryWords';
		    const planWords = 'planWords';
		
		    uni.setStorage({
		      key: subsidiaryWords,
		      data: JSON.stringify(subsidiaryWordsList),
		      success: function () {
		        uni.setStorage({
		          key: planWords,
		          data: JSON.stringify(planWordsList),
		          success: function () {
		            console.log('数据存储成功');
		            // 跳转到学习页面
		            uni.navigateTo({
		              url: `/pages/textbook/WordplanDetail?planWords=${planWords}&bookId=${book.value.book_id}&subsidiaryWords=${subsidiaryWords}&planId=${planId}&statusNum=1`,
		            });
		          },
		          fail: function (err) {
		            console.log('数据存储失败', err);
		          }
		        });
		      },
		      fail: function (err) {
		        console.log('数据存储失败', err);
		      }
		    });
		  } else {
		    // 如果 firstFive 的长度 >= 4，直接存储 planWordsList
		    const planWords = 'planWords';
		    uni.setStorage({
		      key: planWords,
		      data: JSON.stringify(planWordsList),
		      success: function () {
		        console.log('数据存储成功');
		        // 跳转到学习页面
		        uni.navigateTo({
		          url: `/pages/textbook/WordplanDetail?planWords=${planWords}&bookId=${book.value.book_id}&planId=${planId}&statusNum=1`,
		        });
		      },
		      fail: function (err) {
		        console.log('数据存储失败', err);
		      }
		    });
		  }
		
		
		
	}
	
	const togglePopup = () => {
	  console.log("删除")
	  isPopupOpen.value = false;
	};
	
	const switchbookSuccess = (newbook) => {
	
		if (book.value.book_id !== newbook.book_id) { //说明不是同一本书
			progresscacheObjectdelete()
			book.value = {...newbook}
		}
		
	    
	    
	}
	
	//切换单词书
	const switchBook = () => {
	
	  if (books.value.length) {
	    isPopupOpen.value = true;
	    console.log("isPopupOpen.value")
	    console.log(isPopupOpen.value)
	    // 使用 nextTick 确保 DOM 已经更新并且子组件已经挂载
	    nextTick(() => {
	          console.log("After DOM update:");
	          console.log(bookSelectors.value); // 这里应该能够获取到子组件实例
	          
	          if (bookSelectors.value && typeof bookSelectors.value.showPopup === 'function') {
	            bookSelectors.value.showPopup(); // 调用子组件的方法
	          }
	    });
	  } else {
	    fetchBooks(true)
	  }
	
	};
	
	const studyCompletionRecords = async(bookId) => {
		try {
		  const dates = weekstitList.value.map(item => item.formattedDate);
		  const response = await study.getStudyCompletionRecords(bookId,dates)
		  
		  if (response.code === 1000) {
				completionRecords.value = response.data
				
				
		  }
		} catch (error) {
		  console.error('获取失败:', error)
		}
	}
	
	const fetchWords = async (bookId,planId) => {
	  try {
	    const response = await study.getUserWords(bookId,planId)
	    console.log('API Response:', response)
	    
	    if (response.code === 1000) {
	      // 保存所有单词数据
	      unlearned_words.value = response.data.unlearned_words
		  learned_words.value = response.data.learned_words
		  review_words.value =  response.data.review_words
	    }
	  } catch (error) {
	    console.error('获取单词列表失败:', error)
	    uni.showToast({
	      title: '获取单词列表失败',
	      icon: 'none'
	    })
	  }
	}
	
	const studyPlanForbookid = async (bookId) => {
		
	  try {
	    const response = await study.getStudyPlan(bookId);
	    if (response.code === 1000) {
			studyPlan.value = response.data
			fetchWords(bookId,studyPlan.value.id)
	    } 
	  } catch (error) {
	    console.error('获取计划:', error)
	    uni.showToast({
	      title: '获取计划列表失败',
	      icon: 'none'
	    })
	  }
	}
	
	const studyRecordForbookid = async (bookId) => {
		
	  try {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		const formattedDate = `${year}-${month}-${day}`;
		  
	    const response = await study.getStudyRecords(bookId,formattedDate);
	    if (response.code === 1000) {
			studyRecord.value = response.data
	    }
	  } catch (error) {
	    console.error('获取记录:', error)
	    uni.showToast({
	      title: '获取记录失败',
	      icon: 'none'
	    })
	  }
	}
	
	
	// 从接口获取数据
	const fetchBooks = async (isSwitch) => {
	       try {
	        await fetchTextbooks();
	         console.log(books.value, "书籍数据")
	        // 处理切换教材逻辑
	        if (isSwitch) {
	            isPopupOpen.value = true;
	            nextTick(() => {
	                if (bookSelectors.value?.showPopup) {
	                    bookSelectors.value.showPopup();
	                }
	            });
	        } else {
				
				
	            // 设置默认教材（需要确保 books 是响应式引用）
	            if (books.value.length > 0) {
					
					uni.getStorage({
					  key: 'planSelectionObject', // 存储的键名
					  success: (res) => {
					    // console.log('获取的数据:', res.data);
						var bookSelectionObject = res.data
		
						var  selectedbook_id = bookSelectionObject.book_id
						
					
						book.value = books.value.find(item =>
						  item.book_id === selectedbook_id
						);
						
					  },
					  fail: (err) => {
					    console.error('获取数据失败:', err);
						 book.value = { ...books.value[0] };
					  }
					});
					
					
		
	               
	            }
	        }
	      } catch (err) {
	        console.error("Failed to fetch books:", err);
	        uni.showToast({
	          title: "获取教材列表失败",
	          icon: "error",
	        });
	      }
	}
	
	//修改计划
	const modifyplan = () => {
		console.log("修改计划")
		isPlanPopupVisible.value = true;
	}
	
	const updatePlan = async(newPlan) => {
		console.log("更新计划")
	  //更新计划
	  try {
	  		
	    const response = await study.updateStudyPlan(studyPlan.value.id,newPlan);
	    if (response.code === 1000) {
			progresscacheObjectdelete()
	  		studyPlan.value.daily_words = newPlan
	    } 
	  } catch (error) {
	    console.error('更新失败:', error)
	   
	  }
		
	};
	const calendarItemclick = (index) =>  {
		// weekindext.value = index
	}
</script>

<style scoped lang="scss">
.container {
  background: linear-gradient(to bottom, #8cf588 0%, #f8f9fa 50%, #f8f9fa 50%, #f8f9fa 100%);
  height: 100vh;
  display: flex;
  flex-direction: column;
  /* #ifdef MP-WEIXIN */
  /* 微信小程序不需要额外的 padding-bottom，因为 tabBar 不会遮挡内容 */
  /* #endif */
}

.plan-content {
	flex: 1;
	overflow-y: auto;
	/* #ifdef MP-WEIXIN */
	/* 微信小程序中，scroll-view 需要明确的高度 */
	height: 100%;
	/* #endif */
	/* #ifndef MP-WEIXIN */
	height: calc(100vh - 120px);
	/* #endif */
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
			// background-color: orange;
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
	
	
	.record-container {
		margin: 20rpx;
		.record-header {
		  margin-bottom: 20rpx;
		  .record-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #333;
		  }
		}
		
		.record-content {
			display: flex;
			justify-content: center;
			align-items: center;
			.record-item {
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				.record-labelone {
					text-align: center;
					color: #666;
					font-size: 20rpx;
					text {
						color: red;
						font-size: 35rpx;
						font-weight: bold;
					}
				}
				.record-labeltwo {
					margin-top:10rpx ;
					text-align: center;
					color: #666;
					font-size: 23rpx;
				}
			}
		}
		.record-content-interstice {
			margin-top: 20rpx;
		}
		
	}
	
	// tabBar 占位符
	.tabbar-placeholder {
		/* #ifdef MP-WEIXIN */
		height: 100rpx; // 微信小程序 tabBar 高度
		/* #endif */
		/* #ifndef MP-WEIXIN */
		height: 0;
		/* #endif */
	}
	
	

	
}




.left-icon {
	height: 20rpx;
	width: 20rpx;
}



</style>