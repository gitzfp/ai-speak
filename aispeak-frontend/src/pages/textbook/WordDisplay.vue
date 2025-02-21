<template>
  <view class="word-display">
    <!-- 单词核心区 -->
    <view class="word-section">
      <text @tap="phonicsbegins" class="word">{{ word.word }}</text>
      <view @tap="wordsectionclick" class="phonetic">
        <image class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
        <view>[<text class="phonetic-text">{{ phonetic_content }}</text>]</view>
      </view>
    </view>

    <!-- 音标分解模块 -->
    <view class="phonetic-breakdown">
      <view 
        @tap="phoneticClick(item)"
        v-for="(item, index) in filteredSyllables" 
        :key="index" 
        class="phonetic-item"
      >
        <text class="letter"
          :class="{ playing: (currentPlayingPhonetic === item.letter && currentPlayingPosition === item.position) || (currentTrackIndex != - 1 && sound_pathLists[currentTrackIndex].position === item.position) }">
          {{ item.letter }}
        </text>
        <text class="symbol"
          :class="{ playing: (currentPlayingPhonetic === item.letter && currentPlayingPosition === item.position || (currentTrackIndex != - 1 && sound_pathLists[currentTrackIndex].position === item.position)) }">
          /{{ item.phonetic }}/
        </text>
      </view>
    </view>

    <!-- 发音类型 -->
    <view class="pronunciation-type">
      <view class="pronunciation-text">
        <view @tap="pronunciationSelect" class="leftTit">{{ phonetic }} ⇌ |</view>
        <view class="rightTit" @tap="phonicsbegins">
          <view class="type-text"> 自然拼读</view>
          <image v-if="isPhonicsReading" class="left-icon" src="http://114.116.224.128:8097/static/voice_playing.gif"></image>
          <image v-else class="left-icon" src="http://114.116.224.128:8097/static/voice_play.png"></image>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, defineEmits, defineProps } from 'vue';

const emit = defineEmits();
const props = defineProps({
  word: {
    type: Object,
    default: () => ({}),
  },

  volume: {
    type: Number
  }
});

const currentPlayingPhonetic = ref(null);
const currentPlayingPosition = ref(null);
const currentTrackIndex = ref(-1);
const isPhonicsReading = ref(false);
const phonetic = ref('美');
const isPlaying = ref(false);
const currentAudio = ref(null);

const phonetic_soundpath = computed(() => {
  return phonetic.value === "美" ? props.word.us_sound_path : props.word.uk_sound_path;
});

const phonetic_content = computed(() => {
  return phonetic.value === "美" ? props.word.us_phonetic.replace(/\//g, "") : props.word.uk_phonetic.replace(/\//g, "");
});

const filteredSyllables = computed(() => {
  if (!props.word || !props.word.syllables) return [];
  const result = [];
  for (let i = 0; i < props.word.syllables.length - 1; i++) {
    if (i == 0) {
      result.push(props.word.syllables[i]);
    } else {
      const letter = props.word.syllables[i - 1];
      if (letter.phonetic.length > 0) {
        result.push(props.word.syllables[i]);
      }
    }
  }
  return result;
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

const wordsectionclick = () => {
	emit("redefineSettingsParentC");
	if (phonetic_soundpath.value.length <= 0) return;
	stopCurrentAudio();
	const audio = uni.createInnerAudioContext();
	currentAudio.value = audio;
	audio.src = phonetic_soundpath.value;
	audio.volume = props.volume;
	audio.onEnded(() => {
	  
	});
	audio.play();
}

const phonicsbegins = () => {
  emit("redefineSettingsParentC");
  if (!sound_pathLists.value || sound_pathLists.value.length <= 0) return;
  stopCurrentAudio();
  currentTrackIndex.value = 0;
  isPlaying.value = true;

  const playNext = () => {
    if (!isPlaying.value) return;
    if (currentTrackIndex.value < sound_pathLists.value.length) {
      const track = sound_pathLists.value[currentTrackIndex.value];
      if (track.phonetic.length <= 0) {
        currentTrackIndex.value++;
        playNext();
      } else {
        const audio = uni.createInnerAudioContext();
        currentAudio.value = audio;
        audio.src = track.sound_path;
        audio.volume = props.volume;
        audio.onEnded(() => {
          currentTrackIndex.value++;
          playNext();
        });
        audio.play();
      }
    } else {
      isPlaying.value = false;
      currentTrackIndex.value = -1;
    }
  };
  playNext();
};

const stopCurrentAudio = () => {
  if (currentAudio.value) {
	  currentPlayingPhonetic.value = null;
	  currentPlayingPosition.value = null;
	  currentTrackIndex.value = -1;
    currentAudio.value.pause();
    isPlaying.value = false;
    try {
      currentAudio.value.stop();
      currentAudio.value.destroy();
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
    currentAudio.value = null;
  }
};

const phoneticClick = async (item) => {
  emit("redefineSettingsParentC");
  if (item.phonetic.length <= 0) return;
  stopCurrentAudio();
  currentPlayingPhonetic.value = item.letter;
  currentPlayingPosition.value = item.position;
  const audio = uni.createInnerAudioContext();
  currentAudio.value = audio;
  audio.src = item.sound_path;
  audio.volume = props.volume;
  audio.onEnded(() => {
    currentPlayingPhonetic.value = null;
    currentPlayingPosition.value = null;
  });
  audio.play();
};

const redefineSettings = () => {
  stopCurrentAudio();
  currentTrackIndex.value = 0;
  isPlaying.value = true;
};

defineExpose({
  redefineSettings
});
</script>

<style scoped lang="scss">
    .word-section {
    text-align: center; // 内容居中
    margin-bottom: 30rpx; // 与下方内容的间距

    /* 单词样式 */
    .word {
        font-size: 50rpx; // 大字号突出单词
        font-weight: 700; // 加粗
        color: #1a1a1a; // 深黑色
        line-height: 1.2; // 行高优化
        display: block; // 独占一行
        // margin-bottom: 16rpx; // 与音标的间距
    }

    /* 音标样式 */
    .phonetic {
		margin-top: 10rpx;
        font-size: 30rpx; // 适中字号
        color: #9a9a9a; // 灰色音标
        display: block; // 独占一行
        letter-spacing: 0.5rpx; // 字母间距微调
        //  font-style: italic; // 斜体（可选）
        display: flex;
        align-items: center;
        justify-content: center;
        .phonetic-text {
           color:#05c160;
        }
    }
  }
  .phonetic-breakdown {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 24rpx;
    justify-content: center;

    /* 紧凑间距 */
    margin: -8rpx -12rpx; // 外层负边距补偿
    > .phonetic-item {
        margin: 8rpx 12rpx; // 实际间距
    }

    .phonetic-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 60rpx; // 更窄的宽度
        
        // border-radius: 8rpx; // 圆角

        /* 字母样式 */
        .letter {
            padding: 6rpx 0;
            width: 100%;
            font-size: 30rpx;
            background-color: #e1ffef;
            color: #05c160; // 绿色字母
            font-weight: 500;
            // margin-bottom: 4rpx; // 更小的间距
            line-height: 1.2;
            text-align: center;
            border-top-left-radius: 10rpx;
            border-top-right-radius: 10rpx;
        }

        /* 音标样式 */
        .symbol {
            padding: 6rpx 0;
            width: 100%;
            background-color: #BAFCD3;
            font-size: 23rpx;
            color: #05c160; // 灰色音标
            letter-spacing: 0.5rpx;
            text-align: center;
            border-bottom-left-radius: 10rpx;
            border-bottom-right-radius: 10rpx;
        }

        .playing {
          color: #ff0000; // 播放时的颜色
        }
    }
  }

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
            align-content: center;
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

  .definition {
    display: flex;
    // background: #f8f9fa;
    padding: 24rpx;
    border-radius: 12rpx;
    margin-bottom: 32rpx;
    // height: 200rpx;
    
    .label {
      font-size: 28rpx;
      color: #666;
      flex-shrink: 0;
    }
    
    .value {
      font-size: 28rpx;
      color: #1a1a1a;
    }
  }

  .definition_xs {
    color: #707070;
    // height: 200rpx;
    // line-height: 200rpx;
    text-align: center;
    font-size: 22rpx;
    padding: 24rpx;
    margin-bottom: 32rpx;
  }

  .showWordView {
    height: 600rpx;
    // background-color: red;
    text-align: center;
    line-height: 600rpx;
    color: #707070;
  }
  

</style>