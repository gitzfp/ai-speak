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
		<image @click="switchBook" :src="book.icon_url" class="section-img"></image>
		<view class="section-ct">
			<view class="oneline">
				<text class="oneline-subtitle">义务教育课程标准</text>
				<view @click="switchBook" class="oneline_btn">
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
				<view class="threeline-title"> <text style="color: red;">{{finishLearningNum}}</text>/{{allWords.length}}</view>
				<view class="threeline-title"> 剩余<text style="color: red;">{{remainingdays}}</text>天</view>
			</view>
			
			
		</view>
	  </view>
	  <view class="intermediate-line"></view>

	  <view class="progress-section">
		  <view class="progress-left">
			<text class="progresslf">今日计划</text>
			 <image class="left-icon" src="@/assets/icons/time_round.svg"></image>
			 <text class="progressrt">预计需要<text style="color: red;">{{numofday}}</text>分钟</text> 
		  </view>
		  <view @tap="modifyplan" class="modify-btn">
			<image class="left-icon" src="@/assets/icons/edit_modify.svg"></image>
			<text class="section-title">修改计划</text>
		  </view>
	  </view>

	  <view class="task-section">
		<view class="task-title"><text>需新学</text> <text class="numtit" style="color: #F08833;">{{numofday}}</text> <text>词</text></view>
		<view class="task-title"><text>需复习</text> <text class="numtit" style="color: #ED6C43;">0</text> <text>词</text></view>
	  </view>
	  
	  <view class="contentonebtn">
		  <view class="btn-view">
			  <view @tap="startLearningword" class="learn-btn">再学一组</view>
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
		
		<view class="record-container">
		    <view class="record-header">
		      <text class="record-title">学习记录</text>
		    </view>
		    <view class="record-content">
		      <view class="record-item">
		        <view class="record-labelone"><text>0</text> 词</view>
		        <view class="record-labeltwo">今日学习/复习</view>
		      </view>
		      <view class="record-item">
		        <view class="record-labelone"><text>0</text> 词</view>
		        <view class="record-labeltwo">累计掌握</view>
		      </view>
			</view>
			<view class="record-content record-content-interstice">
				<view class="record-item">
				  <view class="record-labelone"><text>0</text> 分钟</view>
				  <view class="record-labeltwo">今日学习时长</view>
				</view>
				<view class="record-item">
				  <view class="record-labelone"><text>0</text> 分钟</view>
				  <view class="record-labeltwo">累计学习时长</view>
				</view>
		    </view>
		  </view>
		
	</view>
      

    <bookSelector ref="bookSelectors" v-if="isPopupOpen" :books="books" @switchbookSuccess="switchbookSuccess" @closePopup="togglePopup" />

		
	<ModifyPlanPopup :visible="isPlanPopupVisible" :currentPlan="numofday"
		      @update:visible="isPlanPopupVisible = $event" @updatePlan="updatePlan"/>
	  
    
  </view>
</template>

<script setup>
	import { ref,onMounted,watch,nextTick,computed} from 'vue';
	import bookSelector from './bookSelector.vue';
	import textbook from '@/api/textbook';
	import ModifyPlanPopup from './ModifyPlanPopup.vue'

	
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
	// 书籍数据
	const books = ref([])
	const allWords = ref([])
	//学习完单词的个数
	const finishLearningNum = ref(0)
	//学习计划每天 学几个
	const numofday = ref(5)
	const isPlanPopupVisible = ref(false);
	
	//剩余多少天完成
	const remainingdays = computed(() => {
		if (allWords.value.length>0) {
			let rgwords = allWords.value.length - finishLearningNum.value
			//向上取整
			let halfCeil = Math.ceil(rgwords / numofday.value);
			return halfCeil
		} else {
			return 0
		}
	})
	
	
	const progress = computed(() => {
	       if (allWords.value.length>0) {
			   let percentage = (finishLearningNum.value / allWords.value.length) * 100;
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
			fetchWords(newVal)
		}
	});


	// 组件挂载时获取数据
	onMounted(() => {
		let a = 7;
		let b = 7;
		let percentage = (a / b) * 100;
		console.log("percentage"); 
		console.log(percentage.toFixed(2));
		
		fetchBooks(false)
	})
	
	
	const startLearningword = () => {
	
		let firstFive = allWords.value.slice(0, 7);
		
		let planWordsList = [];
		firstFive.forEach(word => {
		    planWordsList.push(String(word.word_id));
		});
		
		
		const planWords = 'planWords';
		uni.setStorage({
		  key: planWords,
		  data: JSON.stringify(planWordsList),
		  success: function () {
			console.log('数据存储成功');
			// 跳转到学习页面
			uni.navigateTo({
			  url: `/pages/textbook/WordplanDetail?planWords=${planWords}&bookId=${book.value.book_id}`, // 将缓存键名传递给学习页面
			});
		  },
		  fail: function (err) {
			console.log('数据存储失败', err);
		  }
		});
		
		
	}
	
	const togglePopup = () => {
	  console.log("删除")
	  isPopupOpen.value = false;
	};
	
	const switchbookSuccess = (newbook) => {
	  console.log("newbook=====")
	    console.log(newbook)
	    book.value = {...newbook}
	    console.log(book.value.term)
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
	
	
	const fetchWords = async (bookId, lessonId = null) => {
	  try {
	    const response = await textbook.getLessonWords(bookId)
	    console.log('API Response:', response)
	    
	    if (response.code === 1000) {
	      // 保存所有单词数据
	      allWords.value = response.data.words
		  
		  //这些是随便先写了
		  if (allWords.value.length>0) {
			  let num = allWords.value.length;
			  //向下取整
			  let half = Math.floor(num / 2);
			  finishLearningNum.value = half
		  } else {
			  finishLearningNum.value = 0
		  }
		  
	      
	    }
	  } catch (error) {
	    console.error('获取单词列表失败:', error)
	    uni.showToast({
	      title: '获取单词列表失败',
	      icon: 'none'
	    })
	  }
	}
	
	// 从接口获取数据
	const fetchBooks = (isSwitch) => {
	  console.log("数据库的边框和")
	  uni.request({
	    url: "https://diandu.mypep.cn/static/textbook/bookList_pep_click_subject_web_1_0_0.json",
	    success: (res) => {
	      // 过滤出英语科目的书籍
	      const englishSubject = res.data.booklist.find(
	        (subject) => subject.subject_name === "英语"
	      )
	      if (englishSubject) {
	        // 将所有版本的书籍合并到一个数组中
	        books.value = englishSubject.versions.flatMap(
	          (version) => version.textbooks
	        )
	
	        if (isSwitch) {
	          isPopupOpen.value = true;
	          console.log("点击切换请求进去")
	        // 使用 nextTick 确保 DOM 已经更新并且子组件已经挂载
	        nextTick(() => {
	              console.log("After DOM update:");
	              console.log(bookSelectors.value); // 这里应该能够获取到子组件实例
	              
	              if (bookSelectors.value && typeof bookSelectors.value.showPopup === 'function') {
	                bookSelectors.value.showPopup(); // 调用子组件的方法
	              }
	        });
	        } else {
	        //  book.value = books.value[0]
	         book.value = { ...books.value[0] };
	          console.log("一开始请求")
	        }
	        
	
	      }
	    },
	    fail: (err) => {
	      console.error("Failed to fetch books:", err)
	    },
	  })
	}
	

	//修改计划
	const modifyplan = () => {
		console.log("修改计划")
		isPlanPopupVisible.value = true;
	}
	
	const updatePlan = (newPlan) => {
	  numofday.value = newPlan;
	};
	const calendarItemclick = (index) =>  {
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
	
	

	
}




.left-icon {
	height: 20rpx;
	width: 20rpx;
}



</style>