<template>
  <view class="optionArea">
    <view :style="getDynamicstyle(ctseletnumone)" @tap="handleItemClick(optionWords[0],0)" class="option-item">
      <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[0].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[0].word }}</view>
	  
	  <image
        :src="optionWords[0].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
    <view :style="getDynamicstyle(ctseletnumtwo)" @tap="handleItemClick(optionWords[1],1)" class="option-item">
	  <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[1].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[1].word }}</view>
      <image
        :src="optionWords[1].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
  </view>
  <view class="optionArea">
    <view :style="getDynamicstyle(ctseletnumthree)" @tap="handleItemClick(optionWords[2],2)" class="option-item">
	  <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[2].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[2].word }}</view>
      <image
        :src="optionWords[2].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
    <view :style="getDynamicstyle(ctseletnumfour)" @tap="handleItemClick(optionWords[3],3)" class="option-item">
	  <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[3].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[3].word }}</view>
      <image
        :src="optionWords[3].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
  </view>
</template>

<script setup>
import {onUnmounted,defineProps, defineEmits,onMounted,ref} from 'vue';

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
	} else {
		ctseletnumone.value = 0
		ctseletnumtwo.value = 0
		ctseletnumthree.value = 0
		ctseletnumfour.value = num
	}
	
}

onMounted(() => {
	console.log("props.optionWords")
    console.log(props.optionWords)
  })
  
 onUnmounted(() => {
 	stopCurrentAudio()
  }) 

const getDynamicstyle = (num) =>{
	console.log("num")
	console.log(num)
	console.log(num.value)
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
	var audioStr = 'http://114.116.224.128:8097/static/audio/misanswer.mp3'
	if (props.word.word_id == optionWord.word_id) {
		num = 1 //答对
		audioStr = 'http://114.116.224.128:8097/static/audio/answerright.mp3'
	}
	
	const audio = uni.createInnerAudioContext();
	currentAudio.value = audio;
	audio.src = audioStr;
	// audio.volume = props.volume;
	audio.onEnded(() => {
	  initseletnums(indext,num)
	  if (num == 1) { //答对了
		  setTimeout(() => {
		    emit('item-click', optionWord);
		    // 在这里添加延迟执行的代码
		  }, 300);
	  }
	});
	audio.play();
	
	
  
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