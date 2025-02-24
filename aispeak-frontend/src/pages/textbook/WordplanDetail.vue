<template>
  <view v-if="planWordsList.length > 0">
    <view class="main-content" :animation="animationData">
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
        :word="planWordsList[planWordindext]"
        :planWordmode="planWordmode"
        :optionWords="optionAreaWords"
        @item-click="optionitemclick"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import WordDisplay from './WordDisplay.vue';
import textbook from '@/api/textbook';
import OptionAreaPicture from './OptionAreaPicture.vue';

const wordDisplayref = ref(null);

const book_id = ref('');
const planWordsList = ref([]);
const planWordindext = ref(0);
const planWordmode = ref(0); // 总共三种模式
const isSecondModeReading = ref(false);
const animationData = ref(null); // 用于绑定动画数据
const phonetic = ref('美');
const currentAudio = ref(null)

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
	currentAudio.value.destroy()
	currentAudio.value = null;
  }
};

const instance = getCurrentInstance(); // 提前保存实例

const optionitemclick = (optionWord) => {
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
	
  }, 500);
};

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
  } catch (error) {
    console.error('获取单词列表失败:', error);
    uni.showToast({
      title: '获取单词列表失败',
      icon: 'none',
    });
  }
};
</script>

<style scoped lang="scss">
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

</style>