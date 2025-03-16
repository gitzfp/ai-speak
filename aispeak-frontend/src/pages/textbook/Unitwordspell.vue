<template>
	<view class="word-display">
		<view class="pronunciation-type">
		  <view class="pronunciation-text">
		    <view @tap="pronunciationSelect" class="leftTit">{{ phonetic }} ⇌ |</view>
		    <view class="rightTit" @tap="phonicsbegins(0)">
		     <view class="type-text"> 自然拼读</view>
		      <image v-if="isPhonicsReading" class="left-icon" src="https://dingguagua.fun/static/voice_playing.gif"></image>
		      <image v-else class="left-icon" src="https://dingguagua.fun/static/voice_play.png"></image>
		    </view>
		  </view>
		</view>
		<!-- 单词图片 -->
		<view  class="phonics-image">
			<image 
				:src="word.image_path"
				 mode="widthFix"
				class="phonics-img"
			/>
		</view>
		
		<!-- 3个文本框 -->
		<view class="input-boxes">
			<template :key="index" v-for="(box, index) in inputBoxes">
			 <view class="input-box"
			   :class="{ active: activeIndex === index }"
				@click="setActiveIndex(index)"
			 >
			   <text>{{ box }}</text>
			   <view v-if="activeIndex === index" class="cursor"></view>
			 </view>
			  <view v-if="nonLetterChars.some(char => char.position === index + 1)"
				  class="input-box-ot"
				>
				  {{ nonLetterChars.find(char => char.position === index + 1)?.value }}
				</view>
			</template>
			<view @tap="handleDelete" class="delbtn">X</view>
		</view>
		
		<!-- 拼音键盘 -->
		<view class="keyboard">
			<view class="row">
			  <view v-for="key in letterkeys"
				:key="key.index"
				class="key"
				:style="key.isSelet?'background-color: #f0f0f0':''"
				@click="handleKeyPress(key)">
				{{ key.letter }}
			  </view>
			  <view class="clear-button" @click="handleClear">清空</view>
			</view>
		</view>
		
		<view class="bottomcontent">
		    <view @click="inspectclick" :style="isInspect?'background: #4CAF50;':'background: gray;'" class="inspect-btn">检查</view>
		</view>	
		
	</view>
</template>

<script setup>
import { ref,watch,computed, defineEmits, defineProps,onUnmounted ,onMounted} from 'vue';
import { processZm } from '@/utils/stringUtils'
const emit = defineEmits();
const currentTrackIndex = ref(-1);
const isPhonicsReading = ref(false);
const phonetic = ref('美');
const isPlaying = ref(false);
const currentAudio = ref(null);

const inputBoxes = ref([]);

const nonLetterChars = ref([])
const lettercheckList = ref([])
const originalwordletters = ref([])
const letterkeys = ref([])
// 当前激活的文本框索引
const activeIndex = ref(0);

const isInspect = ref(false)

const props = defineProps({
  word: {
    type: Object,
    default: () => ({}),
  },
  volume: {
    type: Number,
  	default: 1
  }
});

const setActiveIndex = (index) => {

	//这个功能先注释了
  // activeIndex.value = index;
};

//检查有没有对
const inspectclick =()=> {
	if (isInspect.value) {
		isInspect.value = false
		// 检查 inputBoxes 和 originalwordletters 是否完全相等
		 const isEqual = inputBoxes.value.every((value, index) => value === originalwordletters.value[index]);
		
		var answernum = isEqual?1:2
		phonicsbegins(answernum)
		
		emit("inspectionresult",answernum)
		
	}
	
		
	
}


// 处理删除按钮点击
const handleDelete = () => {
  if (activeIndex.value > 0) {
    inputBoxes.value[activeIndex.value-1] = '';
    var sckey = lettercheckList.value.pop()
	sckey.isSelet = false;
	letterkeys.value[sckey.index] = sckey
    moveCursorBackward();
  }
};
// 处理清空按钮点击
const handleClear = () => {
  // inputBoxes.value = ['', '', ''];
  inputBoxes.value.fill("");
  while (lettercheckList.value.length) {
    var sckey = lettercheckList.value.pop()
    sckey.isSelet = false;
    letterkeys.value[sckey.index] = sckey
  }
  activeIndex.value = 0;
};
// 处理按键点击
const handleKeyPress = (key) => {
	if (key.isSelet) return
  if (activeIndex.value < inputBoxes.value.length) {
    inputBoxes.value[activeIndex.value] = key.letter;
	key.isSelet = true;
	lettercheckList.value.push(key)
	
    moveCursorForward();
  }
};
// 光标向前移动
const moveCursorForward = () => {
  if (activeIndex.value < inputBoxes.value.length - 1) {
    activeIndex.value++;
  } else {
    // activeIndex.value = -1; // 光标消失
	activeIndex.value = inputBoxes.value.length; // 光标消失
	isInspect.value = true
  }
  
};

// 光标向后移动
const moveCursorBackward = () => {
  if (activeIndex.value > 0) {
    activeIndex.value--;
  } else {
    activeIndex.value = 0;
  }
  isInspect.value = false
};

// 更新 inputBoxes 和 letterkeys 的函数
const updateInputBoxesAndLetterKeys = (word) => {
	
	console.log("activeIndex.value")
	console.log(activeIndex.value)
	lettercheckList.value = []
	
	// 去除首尾空格
	  const trimmedWord = word.trim();
	  
	  // 初始化 originalwordletters 和 nonLetterChars 数组
	    originalwordletters.value = [];
	    nonLetterChars.value = [];
		
		
		// 遍历 trimmedWord 的每个字符
		  for (let i = 0; i < trimmedWord.length; i++) {
		    const char = trimmedWord[i];
		
		    // 如果是字母（A-Z 或 a-z），添加到 originalwordletters
		    if (/^[A-Za-z]$/.test(char)) {
		      originalwordletters.value.push(char);
		    } else {
				var psnum = i;
				if (nonLetterChars.value.length) {
					psnum = i-nonLetterChars.value.length
				}
		      // 否则，添加到 nonLetterChars 数组，并记录其位置和字符
		      nonLetterChars.value.push({
		        position: psnum,
		        value: char
		      });
		    }
		  }
		
	  
	  // 更新 inputBoxes，初始化为空字符串
	  inputBoxes.value = Array(originalwordletters.value.length).fill('');
	  
	
	  letterkeys.value = processZm(trimmedWord,true)
	
  
};

// 监听文本框内容变化，自动调整光标位置
watch(inputBoxes, (newValue) => {
  if (newValue.every((box) => box === '')) {
    activeIndex.value = 0;
  }
}, { deep: true });
// 监听 props.word 的变化
watch(() => props.word, (newWord) => {
  if (newWord) {
	  console.log("newWord")
	  console.log(newWord)
    updateInputBoxesAndLetterKeys(newWord.word);
  }
}, { immediate: true });

onMounted(() => {
  // if (props.word) {
  //   updateInputBoxesAndLetterKeys(props.word.word);
  // }
});


const sound_pathLists = computed(() => {
	
  const result = [];
  const selectedSoundPath = phonetic.value === '美' ? props.word.us_sound_path : props.word.uk_sound_path;
  const soundoj = { position: -1, letter: "", content: "", sound_path: selectedSoundPath, phonetic: phonetic.value };
  result.push(soundoj);
  result.push(...props.word.syllables);
  

  return result;
});

const pronunciationSelect = () => {
  phonetic.value = phonetic.value === '美' ? '英' : '美';
};


const phonicsbegins = (num = 0) => {
  // emit("redefineSettingspell");
  stopCurrentAudio();
  isPhonicsReading.value = true
  currentTrackIndex.value = 0;
  isPlaying.value = true;

  
  var playList = []
  if (num ==0) {
	  if (!sound_pathLists.value || sound_pathLists.value.length <= 0) return;
  	    playList.push(...sound_pathLists.value)
  } else if (num ==1) { //对
  		var audioStr = 'https://dingguagua.fun/static/audio/answerright.mp3'
		const soundoj = { position: -1, letter: "", content: "", sound_path: audioStr, phonetic: "audioStr" };
  		playList.push(soundoj)
  } else { //2 错
  		var audioStr = 'https://dingguagua.fun/static/audio/misanswer.mp3'
		const soundoj = { position: -1, letter: "", content: "", sound_path: audioStr, phonetic: "audioStr" };
  		playList.push(soundoj)
  }
  

  const playNext = () => {
    if (!isPlaying.value) return;
    if (currentTrackIndex.value < playList.length) {
      const track = playList[currentTrackIndex.value];
      if (track.phonetic.length <= 0) {
        currentTrackIndex.value++;
        playNext();
      } else {
        const audio = uni.createInnerAudioContext();
        currentAudio.value = audio;
        audio.src = track.sound_path;
        audio.volume = props.volume;
        audio.onEnded(() => {
			console.log("播放成功")
          currentTrackIndex.value++;
          playNext();
        });
		// 监听播放错误事件
		audio.onError((err) => {
		  // console.error('音频播放失败:', err);
		  // console.log("currentTrackIndex.value")
		  // console.log(currentTrackIndex.value)
		  currentTrackIndex.value++;
		  playNext();
		  // 在这里执行错误处理逻辑，例如提示用户、重试播放等
		  // 例如：
		  // uni.showToast({
		  //   title: '音频播放失败，请稍后重试',
		  //   icon: 'none'
		  // });
		});
		
        audio.play();
      }
    } else {
	  isPhonicsReading.value = false;
      isPlaying.value = false;
      currentTrackIndex.value = -1;
    }
  };
  playNext();
};
const stopCurrentAudio = () => {
  if (currentAudio.value) {
	  currentTrackIndex.value = -1;
    currentAudio.value.pause();
    isPlaying.value = false;
	isPhonicsReading.value = false;
    try {
      currentAudio.value.stop();
      // currentAudio.value?.destroy();
	  currentAudio.value = null;
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
    currentAudio.value = null;
  }
};

const initiativerefreshData =() => {
	updateInputBoxesAndLetterKeys(props.word.word);
}

defineExpose({
  stopCurrentAudio,
  initiativerefreshData,
  phonicsbegins
});
	
</script>

<style scoped lang="scss">
	.pronunciation-type {
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  margin-bottom: 32rpx;
	  margin-top: 20rpx;
	  
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
	}
	
	
	.left-icon {
	    width: 30rpx;
	    height: 30rpx;
	    margin-right: 10rpx;
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
	
	
	.input-boxes {
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  /* margin-bottom: 20rpx; */
	  flex-wrap: wrap;
	  padding: 20rpx;
	  .input-box {
	    /* width: 200rpx; */
	    width: 50rpx;
	    height: 80rpx;
	    margin: 10rpx 10rpx;
	    border-bottom: 1rpx solid #cccccc;
	    /* border-radius: 10rpx; */
	    display: flex;
	    align-items: center;
	    justify-content: center;
	    font-size: 32rpx;
	    color: #333333;
	    position: relative;
	  }
	  .input-box-ot {
	    /* width: 200rpx; */
	    width: 50rpx;
	    height: 80rpx;
	    margin: 10rpx 10rpx;
	    /* border-radius: 10rpx; */
	    display: flex;
	    align-items: center;
	    justify-content: center;
	    font-size: 32rpx;
	    color: #333333;
	    position: relative;
	  }
	  
	  .input-box.active {
	    border-color: #ffa500;
	  }
	  .delbtn {
	  	width: 80rpx;
	  	height: 60rpx;
	  	background-color: #f0f0f0;
	  	color: #666;
	  	line-height: 60rpx;
	  	border-radius: 10rpx;
	  	margin-left: 20rpx;
	  	text-align: center;
	  }
	}
	.cursor {
	  width: 2rpx;
	  height: 40rpx;
	  background-color: #333333;
	  animation: blink 1s infinite;
	}
	
	@keyframes blink {
	  0%, 100% {
	    opacity: 1;
	  }
	  50% {
	    opacity: 0;
	  }
	}
	
	.keyboard {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	}
	
	.row {
	  display: flex;
	  flex-wrap: wrap;
	  justify-content: center;
	  margin-bottom: 20rpx;
	}
	
	.key {
	  // width: 120rpx;
	  // height: 120rpx;
	  width: 90rpx;
	  height: 90rpx;
	  margin: 10rpx;
	  font-size: 32rpx;
	  // background-color: #f0f0f0;
	  background-color: #fff;
	  // border: #f0f0f0 1rpx solid;
	  border: #f5f5f5 1rpx solid;
	  // border:none;
	  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
	
	  border-radius: 16rpx;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	}
	
	.key:disabled {
	  background-color: #d3d3d3;
	  color: #a9a9a9;
	}
	
	.action-buttons {
	  display: flex;
	  justify-content: center;
	  gap: 20rpx;
	}
	
	.clear-button {
	  width: 90rpx;
	  height: 90rpx;
	  margin: 10rpx;
	  font-size: 26rpx;
	  // background-color: #f0f0f0;
	  background-color: #fff;
	  border: #f0f0f0 1rpx solid;
	  // border:none;
	  color: #666;
	  border-radius: 16rpx;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	}
	
	
	.bottomcontent {
		margin: 20rpx;
		height: 300rpx;
		width: 100%;
		background-color: #fff;
		position: relative;
	}
	.inspect-btn {
		position: absolute;
		left: 25%;
		top: 30rpx;
		color: #fff;
		height: 80rpx;
		width: 50%;
		line-height: 80rpx;
		text-align: center;
		border-radius: 40rpx;
		font-size: 28rpx;
		margin-right: 20rpx; 
	}
	
</style>