<template>
  <view class="page-container" v-if="planWordsList.length > 0">
    <view class="main-content" :animation="animationData">
		
		<!-- 学习 进度 -->
		<view class="progress-bar">
		<view 
		  class="progress-ct" 
		  :style="{ width: progress + '%' }"
		></view>
		</view>
	
		<template v-if="ismisanswer">
			<WordDisplay ref="wordDisplayref" :word="optionWord" />
		</template>
		<template v-else>
			<WordDisplay v-if="planWordmode == 0" ref="wordDisplayref" :word="planWordsList[planWordindext]" />
			<view v-else-if="planWordmode == 1" class="secondMode">
					  <view class="pronunciation-text">
						<view @tap="pronunciationSelect" class="leftTit">{{ phonetic }} ⇌ |</view>
						 <view class="rightTit" @tap="phonicsbegins">
							 <view class="type-text"> 点击发音</view>
							 <image v-if="isSecondModeReading" class="secondMode-icon" src="https://dingguagua.fun/static/voice_playing.gif"></image>
							 <image v-else class="secondMode-icon" src="https://dingguagua.fun/static/voice_play.png"></image>
						</view>  
					 </view>
			  
			</view>
			<view class="thirdMode" v-else>
			  {{ planWordsThreeList[planWordThreeindext].paraphrase }}
			</view>
		</template>
      

      <OptionAreaPicture
		v-if="isPicturedisplay"
        :word="optionWord"
        :planWordmode="planWordmode"
        :optionWords="optionAreaWords"
        @item-click="optionitemclick"
      />
	  <template v-else >
		<view class="definition">
			<view class="label">释义：</view>
			<view class="value">{{optionWord.chinese}}</view>
		</view>
	  </template>
	  
	  
    </view>
	<view v-if="ismisanswer" class="tab-bar">
		<view class="tab-item" @tap="wordsNotebookclick(optionWord)">
			<template v-if="isUnfamiliarWord(optionWord)">
				<image class="tab-icon" src="@/assets/icons/five-pointedstar-selet.svg"></image>
				<text class="tab-text">已加入生词本</text>
			</template>
			<template v-else>
				<image class="tab-icon" src="@/assets/icons/five-pointedstar.svg"></image>
				<text class="tab-text">加入生词本</text>
			</template>
		  
		</view>
		<view class="tab-item-rt" @tap="continuebtnclick">
		  <view class="tab-btn">继续</view>
		</view>
	</view>
	<FinishWordPop 
	v-if="finishiWordshowPopup" @startSpelling="startSpelling"
	@giveupspelling="giveupspelling"
	/>
  </view>
</template>

<script setup>
import { ref, computed, onMounted,onUnmounted, getCurrentInstance, nextTick,watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WordDisplay from './WordDisplay.vue';
import textbook from '@/api/textbook';
import OptionAreaPicture from './OptionAreaPicture.vue';
import accountRequest from "@/api/account"

import FinishWordPop from './FinishWordPop.vue'
import study from '@/api/study';
import { onShow, onHide } from '@dcloudio/uni-app';

const wordDisplayref = ref(null);

const book_id = ref('');

//模式1的数组和下标
const planWordsList = ref([]);
const planWordindext = ref(0);
//模式2的数组和下标
const planWordsTwoList = ref([]);
const planWordTwoindext = ref(0);
//模式3的数组和下标
const planWordsThreeList= ref([]);
const planWordThreeindext = ref(0);
const progressindext = ref(0);

//用于存储错误和正确的次数的数组
const planWordsWithCounts = ref([]);

const planWordmode = ref(0); // 总共三种模式
const isSecondModeReading = ref(false);
const animationData = ref(null); // 用于绑定动画数据
const phonetic = ref('美');
const currentAudio = ref(null)
const ismisanswer = ref(false)

const finishiWordshowPopup = ref(false)

const subsidiaryList = ref([])

const enterTime = ref(null); // 记录用户进入页面的时间戳

const plan_id = ref(0)

//生词本 数租
const notebookList = ref([])

const subsidiaryWordsStr = ref('')

//0是新学了，1 是复习进来了
const status_num = ref(0)

onMounted(() => {
	enterTime.value = new Date(); // 记录用户进入页面的时间
	
  // setTimeout(() => {
  //       console.log('wordDisplayref----.value:', wordDisplayref.value);
  //       if (wordDisplayref.value) {
  //         wordDisplayref.value.phonicsbegins();
  //       } else {
		// 	phonicsbegins()
		// }
  // }, 500); // 延迟 100ms
  
  
});


// 页面显示时触发 这个只要显示就执行
onShow(() => {
});

// 页面隐藏时触发 这个页面销毁不会触发，只有页面导航带下一个才触发
onHide(() => {
	
});

// 监听 wordDisplayref 和 planWordmode 变化
	  const stopWatch = watch(
	    [() => wordDisplayref.value, () => planWordmode.value],
	    ([displayRef, mode]) => {
	      if (mode === 0 && displayRef) {
	        nextTick(() => {
	          displayRef.phonicsbegins();
	          stopWatch();
	        });
	      } else if (mode === 1) {
	        nextTick(() => phonicsbegins());
	        stopWatch();
	      }
	    },
	    { immediate: true }
	  );

onUnmounted(() => {
	stopWatch();
	
	let storageKey = 'progresscacheObject'+book_id.value
	if (progressindext.value == (planWordsWithCounts.value.length*3)) {
		
	} else {  
		//学习一半的上报
		const filteredArray = planWordsWithCounts.value.filter(item => item.correct_count > 0 || item.incorrect_count > 0);
		const updatedPlanWordsWithCounts = planWordsWithCounts.value.map(item => ({
		  ...item,
		  correct_count: 0,
		  incorrect_count: 0
		}));
		var progresscacheObject = {
			planWordmode:planWordmode.value,
			planWordindext:planWordindext.value,
			planWordTwoindext:planWordTwoindext.value,
			planWordThreeindext:planWordThreeindext.value,
			progressindext:progressindext.value,
			planWordsList:planWordsList.value,
			planWordsTwoList:planWordsTwoList.value,
			planWordsThreeList:planWordsThreeList.value,
			planWordsWithCounts:updatedPlanWordsWithCounts
		}
		uni.setStorage({
		  key: storageKey,
		  data: JSON.stringify(progresscacheObject),
		  success: () => {
			console.log('数据已存储');
		  },
		  fail: (err) => {
			console.error('存储失败:', err);
		  }
		});
		
		if (filteredArray.length>0) { //说明有学一些
			reportStudyWordProgress(filteredArray,0)
		}
	}
	
	
})

//上报学习完成记录表
const updateStudyCompletionRecord = async () => {
	study.createOrUpdateStudyCompletionRecord(book_id.value)
}

//全部完成 上报到学习记录
const reportStudyRecord = async (stayMinutes,studyDate,newWords) => {
	if (status_num.value == 1) {
		study.updateOrCreateStudyRecord(book_id.value,studyDate,0,newWords,stayMinutes)
	} else {
		study.updateOrCreateStudyRecord(book_id.value,studyDate,newWords,0,stayMinutes)	
	}
}

//上报到学习进度中
const reportStudyWordProgress = async (filteredArray,typeNum) => {
	if (status_num.value == 1) {
		study.upsertReviewWordProgress(book_id.value,typeNum,plan_id.value,filteredArray)
	} else {
		study.upsertStudyWordProgress(book_id.value,typeNum,plan_id.value,filteredArray)
	}
}

const isPicturedisplay = computed(() => {
	if (!ismisanswer.value) {
		if (subsidiaryWordsStr.value.length>0) {
			if (subsidiaryList.value.length>0) {
				return true;
			}
			return false
		} else {
			if (planWordsWithCounts.value.length>0) {
				return true
			}
			return false
		}
	}
	return false
})
const progress = computed(() => {
	   if (planWordsWithCounts.value.length>0) {
		   let percentage =  ((progressindext.value) / (planWordsWithCounts.value.length*3)) * 100;
		   return percentage
	   } else {
		  return 0 
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
const sound_path = computed(() => {
  var wdd =	planWordsTwoList.value[planWordTwoindext.value]
  const selectedSoundPath = phonetic.value === '美' ? wdd.us_sound_path : wdd.uk_sound_path;
  return selectedSoundPath;
});

const pronunciationSelect = () => {
  phonetic.value = phonetic.value === '美' ? '英' : '美';
};

const phonicsbegins = () => {
	stopCurrentAudio();
	const audio = uni.createInnerAudioContext();
	currentAudio.value = audio;
	audio.src = sound_path.value;
	// audio.volume = props.volume;
	audio.onEnded(() => {
		stopCurrentAudio();
	});
	audio.play();
}
const stopCurrentAudio = () => {
  if (currentAudio.value) {
	currentAudio.value.pause();
	// currentAudio.value?.destroy()
	currentAudio.value = null;
  }
};

const instance = getCurrentInstance(); // 提前保存实例

const giveupspelling = (num) =>  {
	console.log("放弃拼读")
	finishiWordshowPopup.value = false
	const learningreportWords = 'learningreportWords';
	
	uni.setStorage({
	  key: learningreportWords,
	  data: JSON.stringify(planWordsWithCounts.value),
	  success: function () {
		console.log('数据存储成功');
		// 跳转到学习页面
		uni.navigateTo({
		  url: `/pages/textbook/Learningreport?learningreportWords=${learningreportWords}&bookId=${book_id.value}&backPage=2`, // 将缓存键名传递给学习页面
		});
	  },
	  fail: function (err) {
		console.log('数据存储失败', err);
	  }
	});
	
	
}
const startSpelling = (num) =>  {
	console.log("开始拼读")
	finishiWordshowPopup.value = false
	const learningreportWords = 'learningreportWords';
	
	uni.setStorage({
	  key: learningreportWords,
	  data: JSON.stringify(planWordsWithCounts.value),
	  success: function () {
		console.log('数据存储成功');
		// 跳转到学习页面
		uni.navigateTo({
		  url: `/pages/textbook/WordDictation?learningreportWords=${learningreportWords}&bookId=${book_id.value}`, // 将缓存键名传递给学习页面
		});
	  },
	  fail: function (err) {
		console.log('数据存储失败', err);
	  }
	});
	
	
}

const optionitemclick = (num) => {
	// 找到与 optionWord.word_id 匹配的单词
	const targetWord = planWordsWithCounts.value.find(word => word.word_id === optionWord.value.word_id);
	if (targetWord) {
	    if (num == 1) { // 答对了
	      targetWord.correct_count += 1; // 更新 correct_count
	    } else { // 答错了
	      targetWord.incorrect_count += 1; // 更新 incorrect_count
	    }
	  }

  if (num==1) { //答对了
		if (planWordmode.value == 2 && planWordThreeindext.value == (planWordsThreeList.value.length-1)) {
		  // console.log("不进来吗")
		  progressindext.value = planWordsWithCounts.value.length*3
		  finishiWordshowPopup.value = true
		  //完成的去上报 和提交
		  finishToreport()
		} else {
		  // console.log("跑这边")
		  animatedPageturn()
		}
  } else {
		// console.log("答错----")
		ismisanswer.value = true
			
  }
};

const finishToreport = () => {
	let storageKey = 'progresscacheObject'+book_id.value
	uni.removeStorage({
	    key: storageKey, // 要删除的键名
	    success: () => {
	        console.log('删除成功');
	    },
	    fail: (err) => {
	        console.error('删除失败:', err);
	    }
	});
	//说明有全部学完的上报  就把整个数据传过去
	const leaveTime = new Date(); // 记录用户离开页面的时间
	  // 计算停留时间（单位：毫秒）
	  const stayDuration = leaveTime - enterTime.value;
	  // 转换为分钟数
	  const stayMinutes = Math.floor(stayDuration / (1000 * 60));
	const studyDate = leaveTime.toISOString().split('T')[0] // 学习日期（格式：YYYY-MM-DD）
	
	reportStudyRecord(stayMinutes,studyDate,planWordsWithCounts.value.length)
	reportStudyWordProgress(planWordsWithCounts.value,1)
	updateStudyCompletionRecord()
}

//继续按钮
const continuebtnclick = () => {
	animatedPageturn(true)
}

const animatedPageturn = (isError = false) => {
	if (!instance) {
	  console.error('当前组件实例未初始化');
	  return;
	}
	
	const animation = uni.createAnimation({
	  duration: 500,
	  timingFunction: 'ease-in-out',
	});
	
	// 第一步动画：向左滑出并消失
	  animation.translateX('-100%').opacity(0).step();
	  animationData.value = animation.export();
		
		if (isError) {
			ismisanswer.value = false
		}
	
	  setTimeout(() => {
		  if (planWordmode.value == 0) {
			  if (!isError) {
				  if (planWordindext.value % 5 == 4) {
						planWordmode.value = planWordmode.value + 1;
				  } else {
					  if (planWordindext.value == planWordsList.value.length - 1) {
						  planWordmode.value = planWordmode.value + 1;
					  } 
				  }
				  planWordindext.value = planWordindext.value + 1;
			  } else {
				let chajw = 4-(planWordindext.value % 5)
				let crindext = planWordindext.value+chajw
				let element = planWordsList.value.splice(planWordindext.value,1)[0]
				planWordsList.value.splice(crindext, 0, element);
			  }
			  
		  } else if (planWordmode.value == 1) {
			  if (!isError) {
				  if (planWordTwoindext.value % 5 == 4) {
				  	planWordmode.value = planWordmode.value + 1;
				  } else {
				  				  if (planWordTwoindext.value == planWordsTwoList.value.length - 1) {
				  					  planWordmode.value = planWordmode.value + 1;
				  				  } 
				  }
				  planWordTwoindext.value = planWordTwoindext.value + 1;
			  } else {
				  let chajw = 4-(planWordTwoindext.value % 5)
				  let crindext = planWordTwoindext.value+chajw
				  let element = planWordsTwoList.value.splice(planWordTwoindext.value,1)[0]
				  planWordsTwoList.value.splice(crindext, 0, element);
			  }
			  
		  } else {
			  if (!isError) {
				 if (planWordThreeindext.value % 5 == 4) {
				   if (planWordThreeindext.value < planWordsThreeList.value.length - 1) {
				     planWordThreeindext.value = planWordThreeindext.value + 1;
				     planWordmode.value = 0;
				   }
				 } else {
				   if (planWordThreeindext.value < planWordsThreeList.value.length - 1) {
				     planWordThreeindext.value = planWordThreeindext.value + 1;
				   }
				 } 
			  } else {
				  let chajw = 4-(planWordThreeindext.value % 5)
				  let crindext = planWordThreeindext.value+chajw
				  let element = planWordsThreeList.value.splice(planWordThreeindext.value,1)[0]
				  planWordsThreeList.value.splice(crindext, 0, element);
			  }
		  }
		  
		  progressindext.value = planWordindext.value+planWordTwoindext.value+planWordThreeindext.value
		  
	    // 更新逻辑
	    // if (planWordmode.value == 0 || planWordmode.value == 1) {
	    //   if (planWordindext.value % 5 == 4) {
	    //     planWordindext.value = planWordindext.value - 4;
	    //     planWordmode.value = planWordmode.value + 1;
	    //   } else {
	    //     if (planWordindext.value == planWordsList.value.length - 1) {
	    //       planWordindext.value = planWordindext.value - ((planWordsList.value.length - 1) % 5);
	    //       planWordmode.value = planWordmode.value + 1;
	    //     } else {
	    //       planWordindext.value = planWordindext.value + 1;
	    //     }
	    //   }
	    // } else {
	    //   // mode == 2
	    //   if (planWordindext.value % 5 == 4) {
	    //     if (planWordindext.value < planWordsList.value.length - 1) {
	    //       planWordindext.value = planWordindext.value + 1;
	    //       planWordmode.value = 0;
	    //     }
	    //   } else {
	    //     if (planWordindext.value < planWordsList.value.length - 1) {
	    //       planWordindext.value = planWordindext.value + 1;
	    //     }
	    //   }
	    // }
	
	// 重置动画状态，但不触发动画
	    animation.translateX('0%').opacity(1).step({ duration: 0 }); // 设置 duration 为 0，不触发动画
	    animationData.value = animation.export(); // 立即更新视图
	    // 直接重置动画状态，不添加滑入动画
	 //     animation.translateX('0%').opacity(1).step();
		// animationData.value = animation.export();
		
		// 使用 nextTick 确保 DOM 更新完成
		nextTick(() => {
		  if (planWordmode.value == 0) {
		  	wordDisplayref.value.phonicsbegins()
		  } else if (planWordmode.value == 1) {
		  	phonicsbegins()
		  }
		});
		
		
	  }, 500);
	
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
  
  var huoquList =[];
  
  if (subsidiaryWordsStr.value.length>0) {
	  if (planWordmode.value == 0) {
	  	  huoquList = [...planWordsList.value, ...subsidiaryList.value]
	  } else if (planWordmode.value ==1) {
	  	  huoquList = [...planWordsTwoList.value, ...subsidiaryList.value]
	  } else {
	  	  huoquList = [...planWordsThreeList.value, ...subsidiaryList.value]
	  }
  } else {
	  if (planWordmode.value == 0) {
	  	  huoquList = planWordsList.value
	  } else if (planWordmode.value ==1) {
	  	  huoquList = planWordsTwoList.value
	  } else {
	  	  huoquList = planWordsThreeList.value
	  }
  }
  
  
  

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
	
	if (subsidiaryWordsStr.value.length>0) {
		if (planWordmode.value == 0) {
			  let result = getoptionAreaWords(planWordindext.value, 0, 3, 3);
			  return result;
		} else if (planWordmode.value ==1) {
			  let result = getoptionAreaWords(planWordTwoindext.value, 0, 3, 3);
			  return result;
		} else {
			  let result = getoptionAreaWords(planWordThreeindext.value, 0, 3, 3);
			  return result;
		}
	} else {
		if (planWordmode.value == 0) {
			  let result = getoptionAreaWords(planWordindext.value, 0, planWordsList.value.length - 1, 3);
			  return result;
		} else if (planWordmode.value ==1) {
			  let result = getoptionAreaWords(planWordTwoindext.value, 0, planWordsTwoList.value.length - 1, 3);
			  return result;
		} else {
			  let result = getoptionAreaWords(planWordThreeindext.value, 0, planWordsThreeList.value.length - 1, 3);
			  return result;
		}
	}
	
  
  
});

onLoad(async (options) => {
  const { bookId, planWords,subsidiaryWords,planId,statusNum} = options;
  book_id.value = bookId;
  plan_id.value = planId
  if (statusNum) {
	  status_num.value = statusNum
  }
  
  if (subsidiaryWords) {
	  subsidiaryWordsStr.value = subsidiaryWords
	  console.log("subsidiaryWords")
	  uni.getStorage({
	    key: subsidiaryWords,
	    success: function (res) {
	      const words = JSON.parse(res.data);
		  console.log("99999")
	  	   detailWords(bookId, words,true);
	  	  
	    },
	    fail: function (err) {
	      console.log('获取数据失败', err);
	    },
	  });
	  
  }
  
  let storageKey = 'progresscacheObject'+bookId

  var ishuncun = false

 uni.getStorage({
   key: storageKey,
   success: function (res) {
	   console.log("res999请求请求------"+res)
     const progresscacheObject = JSON.parse(res.data);
	  console.log(progresscacheObject)
	 
	 
		planWordmode.value = progresscacheObject.planWordmode
		planWordindext.value = progresscacheObject.planWordindext
		planWordTwoindext.value = progresscacheObject.planWordTwoindext
		planWordThreeindext.value = progresscacheObject.planWordThreeindext
		progressindext.value = progresscacheObject.progressindext
		planWordsList.value = progresscacheObject.planWordsList
		planWordsTwoList.value = progresscacheObject.planWordsTwoList
		planWordsThreeList.value = progresscacheObject.planWordsThreeList
		planWordsWithCounts.value = progresscacheObject.planWordsWithCounts
		ishuncun = true
		collectsGetnotebook()
   },
   fail: function (err) {
     console.log('获取数据失败', err);
	 uni.getStorage({
	   key: planWords,
	   success: function (res) {
	     const words = JSON.parse(res.data);
	 	  
	 	   detailWords(bookId, words);
	 	  
	 	  // //获取生词本数组
	 	  collectsGetnotebook()
	   },
	   fail: function (err) {
	     console.log('获取数据失败', err);
	   },
	 });
   },
 });
 
 
 
 
 
  
});

const detailWords = async (bookId, words ,issubsidiary = false) => {
  try {
	  console.log("开始请求")
    const response = await textbook.getWordsDetail(bookId, words);
	if (issubsidiary) { //选项补充的数组
		subsidiaryList.value = [...response.data.words];
	} else {
		planWordsList.value = [...response.data.words]; // 创建新数组
		planWordsTwoList.value = [...response.data.words]; // 创建新数组
		planWordsThreeList.value = [...response.data.words]; // 创建新数组
		// 单独创建 planWordsWithCounts 数组，添加 correct_count 和 incorrect_count 字段
		planWordsWithCounts.value = response.data.words.map(word => ({
		  ...word,
		  correct_count: 0,
		  incorrect_count: 0,
		}));
	}
	
	
	
	// 使用 nextTick 确保 DOM 更新完成
	// nextTick(() => {

	//  console.log('wordDisplayref.value:', wordDisplayref.value);
	//  if (planWordmode.value == 0 && wordDisplayref.value) {
	//    wordDisplayref.value.phonicsbegins();
	//   } 
	// });
	
	
  } catch (error) {
    console.error('获取单词列表失败:', error);
    uni.showToast({
      title: '获取单词列表失败',
      icon: 'none',
    });
  }
};


const collectsGetnotebook = async () => {
		

		
		try {
			let requestParams = {
				page: 1,
				page_size: 1000,
				type:"NEW_WORD",
			}
			accountRequest.collectsGet(requestParams).then((data) => {
				notebookList.value = data.data.list;
			});
		} catch (error) {
		    console.error('获取生词本失败:', error);
		    uni.showToast({
		        title: '获取生词本列表失败',
		        icon: 'none'
		    });
		}
	}
	
	
	const isUnfamiliarWord =(word)=> {
		
		if (notebookList.value.length>0) {
			const exists = notebookList.value.some(item => item.word_id === word.word_id);
			return exists
		}
		
		return false
	}
	
	  const wordsNotebookclick =(word) => {
		  
		  console.log("word")
		  console.log(word)
		  
		
		let requestParams = {
			content: word.word,
			word_id: word.word_id,
			type:"NEW_WORD",
			book_id:book_id.value
		}
		
		if (!isUnfamiliarWord(word)) {
			accountRequest.collect(requestParams).then(() => {
				uni.showToast({
				        title: '成功加入生词本',
				      });
				collectsGetnotebook()
			})
		} else {
			accountRequest.cancelCollect(requestParams).then(() => {
				uni.showToast({
				        title: '移除生词本',
				      });
			})
			notebookList.value = notebookList.value.filter(item => item.word_id !== word.word_id);
		}
	
		
		
	  }

</script>

<style scoped lang="scss">
page {
  background-color: white; // 设置页面背景为白色
  height: 100%; // 确保页面高度为 100%
}

.page-container {
  background-color: white; // 设置页面背景为白色
  height: 100%; // 确保容器高度为 100%
}

.main-content {
  transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
}

@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

.slide-out-left {
  animation: slideOutLeft 0.5s ease-in-out forwards;
}

.optionArea {
  margin: 30rpx;
  display: flex;
  justify-content: space-between;
  gap: 30rpx; /* 设置间隙的宽度 */
  .option-item {
    flex: 1;
    border: 1rpx solid #e5e5e5;
    padding: 30rpx;
    border-radius: 10rpx;
    .option-item-tit {
      font-size: 26rpx;
      color: #333;
    }
    .phonics-img {
      margin-top: 30rpx;
      width: 100%;
      display: block;
      background: #f8f9fa;
      border-radius: 15rpx;
    }
  }
}

.secondMode {
  margin: 50rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}
.secondMode-icon {
  height: 30rpx;
  width: 30rpx;
}
.thirdMode {
  margin: 50rpx;
  font-size: 32rpx;
  text-align: center;
  border: 1rpx solid #e5e5e5;
  padding: 30rpx 20rpx;
  border-radius: 10rpx;
}

.pronunciation-text {
	padding: 10rpx 20rpx;
	display: flex;
	align-items: center;
	background-color: #FCF1E3;
	border-radius: 30rpx;
	color: #5A42F6;
	.leftTit {
		font-size: 28rpx;
		margin-right: 12rpx; 
	}
	.rightTit {
		display: flex;
		align-items: center;
	}
	.type-text {
		font-size: 25rpx;
		margin-right: 12rpx;
		
	}
}

.definition {
    // display: flex;
    background: #f5f5f5;
    padding: 24rpx;
    border-radius: 10rpx;
    margin: 32rpx;
    // height: 200rpx;
    
    .label {
      font-size: 28rpx;
      color: #666;
      flex-shrink: 0;
    }
    
    .value {
		margin-top: 20rpx;
      font-size: 28rpx;
      color: #1a1a1a;
    }
  }
  
  .tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200rpx;
	border-top-left-radius: 30rpx;
	border-top-right-radius: 30rpx;
    background-color: #ffffff;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
  
  .tab-item {
	  display: flex;
	  flex-direction:column;
	  align-items: center;
	  width: 35%;
  }
  .tab-text {
	  margin-top: 10rpx;  
  }
  .tab-item-rt {
	  flex: 1;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  height: 100%;
	  .tab-btn {
		  height: 50%;
		  width: 80%;
		  color: #fff;
		  font-size: 36rpx;
		  display: flex;
		  justify-content: center; /* 水平居中 */
		  align-items: center; /* 垂直居中 */
		  background-color: #05c160;
		   border-radius: 50rpx; /* 高度的一半 */
	  }
  }
  
  .tab-icon {
	  height: 40rpx;
	  width: 40rpx;
  }
  .pagination {
    margin: 20rpx;
    font-size: 28rpx;
    color: #999;
    display: flex;
    justify-content: space-between;
    
    .page-current {
      color: #2b9939;
      font-weight: 500;
    }
    .wordsNotebook {
      display: flex;
      align-items: center;
      color: #2b9939;
    }
  }
  
  .progress-bar {
  	margin: 20rpx 30rpx 10rpx 30rpx;
  	// margin-left: 0;
  	height: 30rpx;
	border-radius: 10rpx;
  	background-color: #EFFEE8;
  	.progress-ct {
  		background-color: #05c160;
		border-radius: 10rpx;
  		height: 100%;
  	}
  }
  .threeline {
  	margin: 10rpx 50rpx 20rpx 50rpx;
  	display: flex;
  	justify-content: flex-start;
  	align-items: center;
  	.threeline-title {
		width: 50%;
  		color: #666;
  		font-size: 23rpx;
  		margin-left: 10rpx;
  	
  	}
  }
 

</style>