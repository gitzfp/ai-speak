<template>
    <view class="main-v">
		<WordDisplay ref="wordDisplayref" :fulldisplayNum="fulldisplayNum" :word="word"
		        :volume="volume" @showWordViewclick="showWordViewclick"
				 @redefineSettingsParentC="redefineSettingsParentC" />

        <!-- 单词图片 -->
        <view v-if="fulldisplayNum != 1" class="phonics-image">
        <image 
            :src="word.image_path"
			 mode="widthFix"
            class="phonics-img"
        />
        </view>
   
        

        <!-- 释义区域 -->
        <view  v-if="fulldisplayNum != 2" class="definition">
            <text class="label">释义：</text>
            <text class="value">{{word.chinese}}</text>
        </view>
        <view v-else @tap="showWordViewclick" class="definition_xs">点击显示注释</view>

    </view>
</template>

<script setup>
  
  import { ref,computed,defineEmits} from 'vue';
  import WordDisplay from './WordDisplay.vue'; // 引入新组件

	const wordDisplayref = ref(null)
	const emit = defineEmits();
	
const props = defineProps({
    word: {
        type: Object, // 将 type 改为 Object
        default: () => ({}), // 默认值改为返回一个空对象
    },
    fulldisplayNum: {
      type: Number
    },
	volume: {
	   type: Number
	}
})
const currentPlayingPhonetic = ref(null);
const currentPlayingPosition = ref(null);
const currentTrackIndex = ref(-1)

const isPhonicsReading = ref(false)
const phonetic = ref('美')
// 递归函数，用于逐个播放音频
const isPlaying = ref(false); // 标志位
const currentAudio = ref(null)


// 只读计算属性
const phonetic_soundpath = computed(() => {
        if (phonetic.value == "美") {
           return props.word.us_sound_path
        } else {
            return props.word.uk_sound_path
        }
});

const phonetic_content = computed(() => {
        if (phonetic.value == "美") {
           return props.word.us_phonetic.replace(/\//g, "");
        } else {
            return props.word.uk_phonetic.replace(/\//g, "");
        }
});

    // 计算属性：过滤 syllables 数组
    const filteredSyllables = computed(() => {
      if (!props.word || !props.word.syllables) {
        return []; // 如果 word 或 syllables 不存在，返回空数组
      }
        // 构建目标数组
        const result = [];
        for (let i = 0; i < props.word.syllables.length-1; i++) {
            
            if (i==0) {
                result.push(props.word.syllables[i])
            } else {
                const letter = props.word.syllables[i-1];
                if (letter.phonetic.length>0) {
                    result.push(props.word.syllables[i]) 
                }
            }

        }

        return result

    });



    const sound_pathLists = computed(() => {
        const result = [];
        // 根据 phonetic.value 来选择正确的发音路径
        const selectedSoundPath = phonetic.value === '美' ? props.word.us_sound_path : props.word.uk_sound_path;
        
        // 创建带有选定发音路径的对象
        const soundoj = {position: -1, letter: "", content: "", sound_path: selectedSoundPath, phonetic: phonetic.value};
        result.push(soundoj);
        // 添加原始的音节列表
        result.push(...props.word.syllables);
		
	
		
        return result;
    })

  const pronunciationSelect = () => {
    phonetic.value = phonetic.value=='美'?'英':'美';
   }






function   showWordViewclick() {
  emit("fullDisplayRecovery")
}
   // 连续播放当前页面的所有音频
function redefineSettingsParentC() {

  emit("redefineSettingsParentC")
}


   const redefineSettings =() => {
	   if (wordDisplayref.value) {
		   wordDisplayref.value.redefineSettings()
	   }
		
   }

   // 将方法暴露给父组件
    defineExpose({
      redefineSettings
    });
  
</script>

<style scoped lang="scss">
    .word-section {
    text-align: center; // 内容居中
    margin-bottom: 20rpx; // 与下方内容的间距

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