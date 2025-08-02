<template>
  <view class="optionArea">
    <view v-if="optionWords.length>0" :style="getDynamicstyle(ctseletnumone)" @tap="handleItemClick(optionWords[0],0)" class="option-item">
      <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[0].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[0].word }}</view>
	  
	  <image
        :src="optionWords[0].image_path"
        mode="widthFix"
        class="phonics-img"
      />
	</view>
    <view v-if="optionWords.length>1" :style="getDynamicstyle(ctseletnumtwo)" @tap="handleItemClick(optionWords[1],1)" class="option-item">
	  <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[1].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[1].word }}</view>
      <image
        :src="optionWords[1].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
	<view v-else class="option-item" style="border: none;"></view>
	
  </view>
  <view class="optionArea">
    <view v-if="optionWords.length>2" :style="getDynamicstyle(ctseletnumthree)" @tap="handleItemClick(optionWords[2],2)" class="option-item">
	  <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[2].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[2].word }}</view>
      <image
        :src="optionWords[2].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
	<view v-else class="option-item" style="border: none;"></view>
    <view v-if="optionWords.length>3" :style="getDynamicstyle(ctseletnumfour)" @tap="handleItemClick(optionWords[3],3)" class="option-item">
	  <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[3].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[3].word }}</view>
      <image
        :src="optionWords[3].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
	<view v-else class="option-item" style="border: none;"></view>
  </view>
</template>

<script setup>
import {onUnmounted,defineProps, defineEmits,onMounted,ref,watch} from 'vue';

// 定义 props
const props = defineProps({
  optionWords: {
    type: Array,
    required: true,
  },
  word: {
    type: Object,
    default: () => ({}),
  },
  planWordmode: {
	  type:Number
  }
});

const ctseletnumone = ref(0)
const ctseletnumtwo = ref(0)
const ctseletnumthree = ref(0)
const ctseletnumfour = ref(0)
const currentAudio = ref(null);

// 定义 emits
const emit = defineEmits(['item-click']);

const initseletnums =(indext,num) => {
	if (indext ==0) {
		ctseletnumone.value = num
		ctseletnumtwo.value = 0
		ctseletnumthree.value = 0
		ctseletnumfour.value = 0
	} else if (indext ==1) {
		ctseletnumone.value = 0
		ctseletnumtwo.value = num
		ctseletnumthree.value = 0
		ctseletnumfour.value = 0
	} else if (indext == 2) {
		ctseletnumone.value = 0
		ctseletnumtwo.value = 0
		ctseletnumthree.value = num
		ctseletnumfour.value = 0
	}  else if (indext == 3) {
		ctseletnumone.value = 0
		ctseletnumtwo.value = 0
		ctseletnumthree.value = 0
		ctseletnumfour.value = num
	} else {
		ctseletnumone.value = 0
		ctseletnumtwo.value = 0
		ctseletnumthree.value = 0
		ctseletnumfour.value = 0
	}
	
}

onMounted(() => {
	// Initialize with no selection
	initseletnums(4, 0);
  })
  
 onUnmounted(() => {
 	stopCurrentAudio()
  })

// Watch for word changes and reset selection states
watch(() => props.word, (newWord, oldWord) => {
  if (newWord && oldWord && newWord.word_id !== oldWord.word_id) {
    // Reset all selection states when word changes
    initseletnums(4, 0);
  }
}, { deep: true }) 

const getDynamicstyle = (num) =>{
	if (num==1) {
		return 'border-color:#5AC568;color:#5AC568;'  
	} else if (num==2) {
		return 'border-color:red;color:red;'
	}
	return ''
}

// 处理选项点击事件
const handleItemClick = (optionWord,indext) => {
	
	stopCurrentAudio();
	var num = 2 //答错
	var audioStr = 'https://dingguagua.fun/static/audio/misanswer.mp3'
	if (props.word.word_id == optionWord.word_id) {
		num = 1 //答对		
		audioStr = 'https://dingguagua.fun/static/audio/answerright.mp3'
	}
	
	const audio = uni.createInnerAudioContext();
	currentAudio.value = audio;
	audio.src = audioStr;
	// audio.volume = props.volume;
	initseletnums(indext,num)
	
	// 音频播放结束时的回调
	audio.onEnded(() => {
	  setTimeout(() => {
		initseletnums(4,num)
		emit('item-click', num);
		// 在这里添加延迟执行的代码
	  }, 300);
	});
	
	// 音频播放错误时的回调
	audio.onError((err) => {
		console.error('音频播放失败:', err, audioStr);
		// 即使音频播放失败，也要继续流程
		setTimeout(() => {
			initseletnums(4,num)
			emit('item-click', num);
		}, 300);
	});
	
	// 尝试播放音频
	try {
		audio.play();
	} catch (error) {
		console.error('播放音频时出错:', error);
		// 如果播放失败，直接触发后续流程
		setTimeout(() => {
			initseletnums(4,num)
			emit('item-click', num);
		}, 300);
	}
	
	
  
};

const stopCurrentAudio = () => {
  if (currentAudio.value) {
	currentAudio.value.pause();
	currentAudio.value = null;
  }
};

</script>

<style scoped lang="scss">
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
	color: #333;
    .option-item-tit {
      font-size: 26rpx;
      // color: #333;
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
</style>