<template>
  <view class="container">
	<view>
		<view class="headView" :style="{ paddingTop: statusBarHeight + 'px', height: '44px' }">
			<image @tap="handleBackPage" class="head-icon" src="@/assets/icons/black_back.svg"></image>
			<view class="head-text">单词听写</view>
			<view v-if="word_mode == 4" class="head-points">积分:{{totalpoints}}</view>
		</view>
		<template v-if="allWords.length>0" >
			<view class="topcontent" :animation="animationData">
				  <view class="pagination">
					<view>
					  <text class="page-current">{{ currentPage+1 }}</text>
					  <text class="page-divider">/</text>
					  <text class="page-total">{{ allWords.length }}</text>
					</view>
					 <view @tap="wordsNotebookclick" class="wordsNotebook">
					  <image class="left-iconone" :src="isUnfamiliarWord()?dagou:jiahao"></image>
					  <text>生词本</text>
					</view>
				  </view>
				  <!-- 3个文本框 -->
				  <view class="input-boxes">
					  <template v-if="iswordReveal">
						  <template :key="index" v-for="(box, index) in inputBoxes">
							 <view class="input-box"
								:class="{ active: activeIndex === index }"
								:style="originalwordletters[index]==box?'color: #5AC568;':'color: red;'"
								 @click="setActiveIndex(index)"
							>
								<text>{{ box }}</text>
								<view v-if="activeIndex === index" class="cursor"></view>
							 </view> 
							 <view v-if="nonLetterChars.some(char => char.position === index + 1)"
							     :style="originalwordletters[index] == box ? 'color: #5AC568;' : 'color: red;'"
							     class="input-box-ot"
							   >
							     {{ nonLetterChars.find(char => char.position === index + 1)?.value }}
							   </view>
						  </template>
						  	
					  </template>
					  <template v-else>
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
							  
					  </template>
					<view @tap="handleDelete" class="delbtn">X</view>
				  </view>
				  
				  <view class="correctWord">
					  <text v-if="iswordReveal" class="correctContent">{{currentWord.word}}</text>
				  </view>
				  <view class="audio-icon"> 
					  <image @tap="playbuttonclick" class="left-icon" src="@/assets/icons/played_broadcast.svg"></image>
				  </view>
				  <!-- 释义区域 -->
				  <view class="definition">
					  <text class="label">释义：</text>
					  <text class="value">{{currentWord.chinese}}</text>
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
			</view>
		
		 </template>  
	</view>
	<view class="bottomcontent">
		<view @click="reportclick" v-if="isReportbtnreveal" style="background: #4CAF50" class="inspect-btn">生成报告</view>
	    <view v-else @click="inspectclick" :style="isInspect?'background: #4CAF50;':'background: gray;'" class="inspect-btn">检查</view>
	</view>		
  </view>
</template>

<script setup>
import { ref, watch,onMounted,computed,nextTick,onUnmounted,getCurrentInstance} from 'vue';
import { onLoad } from '@dcloudio/uni-app'
import { processZm } from '@/utils/stringUtils'
import textbook from '@/api/textbook'
import jiahao from '@/assets/icons/word_jiahao.svg';
import dagou from '@/assets/icons/word_dagou.svg';
import accountRequest from "@/api/account"
import study from '@/api/study';
// 获取设备的安全区域高度
const statusBarHeight = ref(0);
const customBarHeight = ref(0);


// 动画数据
const animationData = ref(null);

// 创建动画实例
const createAnimation = () => {
  const animation = uni.createAnimation({
    duration: 500,
    timingFunction: 'ease-in-out',
  });
  return animation;
};

// 这里可以定义一些响应式数据或逻辑
	const handleBackPage = () => {
		if (isreport.value) {
			uni.navigateBack({
			    delta: 2, // 返回两层
			    success: () => {
			      console.log('返回成功');
			    },
			    fail: (err) => {
			      console.error('返回失败', err);
			    },
			  });
		} else {
			uni.navigateBack()
		}
		
	  
	}

// 键盘字母
const letterkeys = ref([]);

// 3个文本框的内容
const inputBoxes = ref([]);
//选中字母对象
const lettercheckList = ref([])

// 当前激活的文本框索引
const activeIndex = ref(0);

const allWords = ref([])

const currentPage = ref(0)

const currentAudio = ref(null)

const ispagePlaying = ref(false)
const currentTrackIndex = ref(-1)

const isInspect = ref(false)

const iswordReveal = ref(false)

const originalwordletters = ref([])

const book_id = ref('')

const lesson_id = ref('')

const isreport = ref(false)

//生词本 数租
const notebookList = ref([])

const nonLetterChars = ref([])

const totalpoints = ref(0)
const totalerrornum = ref(0)

//等于4 是单元首页进来了
const word_mode = ref(0)


	
// 组件挂载
	onMounted(() => {
		const systemInfo = uni.getSystemInfoSync();
		  statusBarHeight.value = systemInfo.statusBarHeight || 0;
		  customBarHeight.value = (systemInfo.statusBarHeight || 0) + 44; // 44 是导航栏的默认高度
	});
	onUnmounted(() => {
		stopCurrentAudio()
	})

	onLoad(async (options) => {
        const {bookId,sessionKey,learningreportWords,wordmode,lessonId} = options
		book_id.value = bookId
		
		if (wordmode) { 
			word_mode.value = wordmode
			lesson_id.value = lessonId
		}
		
		if (learningreportWords) { //说明说从 被单词那边进来 就是艾比记忆法 
			isreport.value = true
			// 获取数据
			uni.getStorage({
			key: learningreportWords,
			success: function (res) {
				console.log('获取到的数据:');				
				allWords.value = JSON.parse(res.data).map(word => ({
					...word,
					content_id: word.word_id,
					content_type: 3,
					error_count: 0,
					points: 0,
					speak_count: 0,
					audio_url: word.sound_path,
				}));
			   
				//获取生词本数组
				collectsGetnotebook()
			},
			fail: function (err) {
			    console.log('获取数据失败', err);
			}
			});
		} else {
			// 获取数据
			uni.getStorage({
			key: sessionKey,
			success: function (res) {
			    const words = JSON.parse(res.data);
			    console.log('获取到的数据:', words);
			    detailWords(bookId,words)
				
				//获取生词本数组
				collectsGetnotebook()
			},
			fail: function (err) {
			    console.log('获取数据失败', err);
			}
			});
		}

		
        
    
   })

const detailWords = async (bookId, words) => {
        try {
            const response = await textbook.getWordsDetail(bookId, words);
            console.log("Response:", response);
			
			//allWords 数组，添加 正确:correct_count  和 错误:incorrect_count 字段
			allWords.value = response.data.words.map(word => ({
			  ...word,
			  content_id:word.word_id,
			  content_type:3,
			  error_count: 0,
			  points: 0,
			  speak_count:0,
			  voice_file:word.sound_path,
			}));

			// 使用 nextTick 确保 DOM 更新完成
			nextTick(() => {
			  if (allWords.value.length > 0) {
				  console.log("第一次")
				//让它一进来就播放
				ispagePlaying.value = true
				currentTrackIndex.value = 0
				playNext()
			  }
			});
			

        } catch (error) {
            console.error('获取单词列表失败:', error);
            uni.showToast({
                title: '获取单词列表失败',
                icon: 'none'
            });
        }
    };
	
	
	const isReportbtnreveal = computed(() => {
		const isEqual = inputBoxes.value.every((value, index) => value === originalwordletters.value[index]);
		if (isEqual && currentPage.value == (allWords.value.length-1) && isInspect.value==false) {
			return true
		}
		return false
	 });
	
	
	const currentWord = computed(() => {
		if (!allWords.value || allWords.value.length === 0) {
		    return null; // 或者返回一个默认值，如 ''
		  }
		return allWords.value[currentPage.value ];
	 });
	
	 const currentAudioList = computed(() => {
	   const audioList = []
	   audioList.push(currentWord.value.us_sound_path)
	   audioList.push(currentWord.value.uk_sound_path)
	     return audioList;
	 });
	
	
	function playbuttonclick() {
		// console.log("iiiii")
	 ispagePlaying.value = !ispagePlaying.value
	 stopCurrentAudio()
	 currentTrackIndex.value = 0
	
	 playNext()
	 
	}
	
	const playNext = (num = 0) => {
	
	   if (!ispagePlaying.value) {
	     stopCurrentAudio()
	     return
	   }
	   var playList = []
	   if (num ==0) {
		   playList.push(...currentAudioList.value)
	   } else if (num ==1) { //对
			var audioStr = 'https://dingguagua.fun/static/audio/answerright.mp3'
		   playList.push(audioStr)
	   } else { //2 错
		   var audioStr = 'https://dingguagua.fun/static/audio/misanswer.mp3'
		   playList.push(audioStr)
	   }
	
	   if (currentTrackIndex.value < playList.length) {
	     const track = playList[currentTrackIndex.value]
	     if (track.length<=0) {
	       currentTrackIndex.value++
	       playNext(num)
	     } else {
	       const audio = uni.createInnerAudioContext()
	       currentAudio.value = audio
	   
	       //设置播放倍速 没作用
	       // audio.playbackRate = playsettingobject.value.multiple
			  //设置是否声音
			  // audio.volume = volume.value
	       audio.src = track
	       audio.onEnded(() => {
	         currentTrackIndex.value++
	         playNext(num)
	       })
	        audio.play()
	     }
	     
	   } else {
	       ispagePlaying.value = false
	       currentTrackIndex.value = -1
	       stopCurrentAudio()
	   }
	 }
	


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


function stopCurrentAudio() {
    if (currentAudio.value) {
      currentAudio.value.pause()
      // ispagePlaying.value = false
      try {
        currentAudio.value.stop()
		// currentAudio.value?.destroy()
		currentAudio.value = null
      } catch (error) {
        console.error("Error stopping audio:", error)
      }
      // currentAudio.value = null
    }
  }


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
  iswordReveal.value = false
};

// 设置当前激活的文本框索引  相当于点击那个光标在那个 
const setActiveIndex = (index) => {

	//这个功能先注释了
  // activeIndex.value = index;
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
  iswordReveal.value = false
};

// 判断键盘按钮是否禁用
const isKeyDisabled = (key) => {
   return key.isSelet
};

// 监听文本框内容变化，自动调整光标位置
watch(inputBoxes, (newValue) => {
  if (newValue.every((box) => box === '')) {
    activeIndex.value = 0;
  }
}, { deep: true });

// 监听 currentWord 值的变化
watch(currentWord, (newWord, oldWord) => {
  if (newWord) {
    // 更新 inputBoxes 和 letterkeys
    updateInputBoxesAndLetterKeys(newWord.word);
  }
});

// 更新 inputBoxes 和 letterkeys 的函数
const updateInputBoxesAndLetterKeys = (word) => {
	
	// console.log("activeIndex.value")
	// console.log(activeIndex.value)
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
	  
	
	  letterkeys.value = processZm(trimmedWord)
	
  
};

const inspectclick =()=> {
	if (isInspect.value) {
		isInspect.value = false
		iswordReveal.value = true
		
		
		// 检查 inputBoxes 和 originalwordletters 是否完全相等
		 const isEqual = inputBoxes.value.every((value, index) => value === originalwordletters.value[index]);

		var answernum = isEqual?1:2
		ispagePlaying.value = true
		stopCurrentAudio()
		currentTrackIndex.value = 0
		playNext(answernum)
		
		
		// 更新 error_count 和points 还有总totalpoints和totalerrornum
		if (isEqual) { //正确
		  allWords.value[currentPage.value].points += 1;
		  totalpoints.value += 1
		} else {
		  allWords.value[currentPage.value].error_count += 1;
		  totalerrornum.value += 1
		}
		

		if (isEqual && currentPage.value<(allWords.value.length-1)) {
			const animation = createAnimation();
			    // 第一步动画：向左滑出并消失
			animation.translateX('-100%').opacity(0).step();
			animationData.value = animation.export();
				currentPage.value = currentPage.value+1
				iswordReveal.value = false
			setTimeout(() => {
			  // 重置动画状态，但不触发动画
			  animation.translateX('0%').opacity(1).step({ duration: 0 });
			  animationData.value = animation.export();
				
				ispagePlaying.value = true
				stopCurrentAudio()
				currentTrackIndex.value = 0
				playNext()
			}, 1000);
		}
		
		
		
	}
}


const reportclick =()=> {	
	var backPage = isreport.value?3:2
	if (word_mode.value == 4) { //单元进去	
		//判断错误为0 积分翻倍
		if (totalerrornum.value == 0) {
			allWords.value.forEach(word => word.points *= 2);
			totalpoints.value = totalpoints.value*2	
		}
		submitreslutStudyProgressReport(allWords.value)
		
		
	} else {
		let learningreportWords = 'learningreportWords'
		uni.setStorage({
		  key: learningreportWords,
		  data: JSON.stringify(allWords.value),
		  success: function () {
			console.log('数据存储成功');
			// 跳转到学习页面
			uni.navigateTo({
			  url: `/pages/textbook/Learningreport?learningreportWords=${learningreportWords}&bookId=${book_id.value}&backPage=${backPage}`, // 将缓存键名传递给学习页面
			});
		  },
		  fail: function (err) {
			console.log('数据存储失败', err);
		  }
		});
	}	
}

const submitreslutStudyProgressReport = async(reports)=> {
		try {
		
			// 显示加载中状态
			uni.showLoading({
			title: '报告生成中...',
			mask: true, // 防止用户点击
			});
			const response = await study.submitStudyProgressReport(book_id.value,lesson_id.value,reports);
				
			uni.hideLoading();
					
			let unitreportWords = 'unitreportWords'
			uni.setStorage({
			  key: unitreportWords,
			  data: JSON.stringify(allWords.value),
			  success: function () {
				console.log('数据存储成功');
				// 跳转到学习页面
				uni.navigateTo({
				  url: `/pages/textbook/UnitWordreport?unitreportWords=${unitreportWords}&totalpoints=${totalpoints.value}&backPage=2&type=3`, // 将缓存键名传递给学习页面
				});
			  },
			  fail: function (err) {
				console.log('数据存储失败', err);
			  }
			});
				
		} catch (error) {
		  
		  // 隐藏加载中状态
			uni.hideLoading();

			// 请求失败后的逻辑
			console.error('提交学习进度报告失败:', error);
			uni.showToast({
			title: '提交失败，请重试',
			icon: 'none',
			});
		  
		}
	}
	

const isUnfamiliarWord =()=> {
	if (notebookList.value.length>0 && currentWord.value) {
		const exists = notebookList.value.some(item => item.word_id === currentWord.value.word_id);
		return exists
	}
	
	return false
}

const wordsNotebookclick =()=> {
    if (currentWord.value) {
		var word = currentWord.value
		let requestParams = {
			content: word.word,
			word_id: word.word_id,
			type:"NEW_WORD",
			book_id:book_id.value
		}
		
		if (!isUnfamiliarWord()) {
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
  }
  
  

</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100vh;
  /* background-color: #ffffff; */
  background-color: #f5f5f5;
}

.headView {
	width: 100%;
	background-color: #fff;
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 96rpx;
	.head-icon {
		margin-left: 20rpx;
		height: 40rpx;
		width: 40rpx;
	}
	.head-text {
		flex: 1;
		text-align: center;
		font-size: 36rpx;
	}
	.head-points {
		color: orange;
		margin-right: 20rpx;
	}
}

.topcontent {
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

.topcontent {
	margin: 20rpx;
	background-color: #fff;
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

.input-boxes {
  display: flex;
  justify-content: center;
  align-items: center;
  /* margin-bottom: 20rpx; */
  flex-wrap: wrap;
  padding: 20rpx;
}
.correctWord {
	height: 60rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}
.correctContent {
	display: inline-block;
	height: 60rpx;
	line-height: 60rpx;
	padding: 0 20rpx;
	background-color: #DCFDED;
	color: #5AC568;
	border-radius: 5rpx;
	font-size: 35rpx;
}
.audio-icon {
	margin-top: 20rpx;
	height: 60rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}
.left-icon {
	height: 50rpx;
	width: 50rpx;
}

.definition {
    display: flex;
    // background: #f8f9fa;
    padding: 24rpx;
    border-radius: 12rpx;
    margin-bottom: 32rpx;
    
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
  border: #f0f0f0 1rpx solid;
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

.pagination {
    margin:20rpx;
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
  .left-iconone {
      width: 30rpx;
      height: 30rpx;
      margin-right: 10rpx;
  }
  
</style>