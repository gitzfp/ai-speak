<template>
  <view class="page-container" v-if="planWordsList.length > 0">
    <view class="main-content" :animation="animationData">
		
		<!-- 分页指示 -->
		<view class="pagination">
		  <view>
		    <text class="page-current">{{ planWordindext+1 }}</text>
		    <text class="page-divider">/</text>
		    <text class="page-total">{{ planWordsList.length }}</text>
		  </view>
		</view>
		
      <WordDisplay v-if="planWordmode == 0" ref="wordDisplayref" :word="planWordsList[planWordindext]" />
      <view v-else-if="planWordmode == 1" class="secondMode">
		  <view class="pronunciation-text">
			<view @tap="pronunciationSelect" class="leftTit">{{ phonetic }} ⇌ |</view>
			 <view class="rightTit" @tap="phonicsbegins">
				 <view class="type-text"> 点击发音</view>
				 <image v-if="isSecondModeReading" class="secondMode-icon" src="http://114.116.224.128:8097/static/voice_playing.gif"></image>
				 <image v-else class="secondMode-icon" src="http://114.116.224.128:8097/static/voice_play.png"></image>
			</view>  
		 </view>
        
      </view>
      <view class="thirdMode" v-else>
        {{ planWordsList[planWordindext].paraphrase }}
      </view>

      <OptionAreaPicture
		v-if="!ismisanswer"
        :word="planWordsList[planWordindext]"
        :planWordmode="planWordmode"
        :optionWords="optionAreaWords"
        @item-click="optionitemclick"
      />
	  <template v-else >
		<view class="definition">
			<view class="label">释义：</view>
			<view class="value">{{planWordsList[planWordindext].chinese}}</view>
		</view>
	  </template>
	  
	  
    </view>
	<view v-if="ismisanswer" class="tab-bar">
		<view class="tab-item" @tap="wordsNotebookclick(planWordsList[planWordindext])">
			<template v-if="isUnfamiliarWord(planWordsList[planWordindext])">
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
  </view>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WordDisplay from './WordDisplay.vue';
import textbook from '@/api/textbook';
import OptionAreaPicture from './OptionAreaPicture.vue';
import accountRequest from "@/api/account"


const wordDisplayref = ref(null);

const book_id = ref('');
const planWordsList = ref([]);
const planWordindext = ref(0);
const planWordmode = ref(0); // 总共三种模式
const isSecondModeReading = ref(false);
const animationData = ref(null); // 用于绑定动画数据
const phonetic = ref('美');
const currentAudio = ref(null)
const ismisanswer = ref(false)


//生词本 数租
	const notebookList = ref([])

onMounted(() => {
  console.log('onMounted');
  
});

const sound_path = computed(() => {
  var wdd =	planWordsList.value[planWordindext.value]
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
	currentAudio.value?.destroy()
	currentAudio.value = null;
  }
};

const instance = getCurrentInstance(); // 提前保存实例

const optionitemclick = (num) => {
  if (num==1) { //答对了
	  animatedPageturn()
  } else {
	  ismisanswer.value = true
  }
};

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
	    // 更新逻辑
	    if (planWordmode.value == 0 || planWordmode.value == 1) {
	      if (planWordindext.value % 5 == 4) {
	        planWordindext.value = planWordindext.value - 4;
	        planWordmode.value = planWordmode.value + 1;
	      } else {
	        if (planWordindext.value == planWordsList.value.length - 1) {
	          planWordindext.value = planWordindext.value - ((planWordsList.value.length - 1) % 5);
	          planWordmode.value = planWordmode.value + 1;
	        } else {
	          planWordindext.value = planWordindext.value + 1;
	        }
	      }
	    } else {
	      // mode == 2
	      if (planWordindext.value % 5 == 4) {
	        if (planWordindext.value < planWordsList.value.length - 1) {
	          planWordindext.value = planWordindext.value + 1;
	          planWordmode.value = 0;
	        }
	      } else {
	        if (planWordindext.value < planWordsList.value.length - 1) {
	          planWordindext.value = planWordindext.value + 1;
	        }
	      }
	    }
	
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

  while (selectedNumbers.length < numToSelect) {
    let randomIndex = Math.floor(Math.random() * numbersPool.length);
    let chosenNumber = numbersPool[randomIndex];

    // 如果这个数字还没有被选中，则添加到结果数组中
    if (!selectedNumbers.includes(chosenNumber)) {
      selectedNumbers.push(chosenNumber);
      result.push(planWordsList.value[chosenNumber]);
    }
  }

  // 在随机位置插入固定数字
  let insertPosition = Math.floor(Math.random() * (result.length + 1));
  result.splice(insertPosition, 0, planWordsList.value[fixedNum]);

  return result;
};

const optionAreaWords = computed(() => {
  console.log('uiiuuiiu');
  let result = getoptionAreaWords(planWordindext.value, 0, planWordsList.value.length - 1, 3);
  return result;
});

onLoad(async (options) => {
  const { bookId, planWords } = options;
  book_id.value = bookId;

  // 获取数据
  uni.getStorage({
    key: planWords,
    success: function (res) {
      const words = JSON.parse(res.data);
      detailWords(bookId, words);
	  
	  //获取生词本数组
	  collectsGetnotebook()
    },
    fail: function (err) {
      console.log('获取数据失败', err);
    },
  });
});

const detailWords = async (bookId, words) => {
  try {
    const response = await textbook.getWordsDetail(bookId, words);
    planWordsList.value = response.data.words;
	
	// 使用 nextTick 确保 DOM 更新完成
	nextTick(() => {
	  console.log('wordDisplayref.value:', wordDisplayref.value);
	  if (planWordmode.value == 0 && wordDisplayref.value) {
	    wordDisplayref.value.phonicsbegins();
	  }
	});
	
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

</style>