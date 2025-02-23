<template>
    <view class="container">
      <!-- 头部标题 -->
      <view class="header">
        <!-- <text class="main-title">英语朗读宝-单词学习</text> -->
        <view class="sub-header" @tap="showPlaySettingsModal">
          <text class="subtitle">重复读{{playsettingobject.repeatnum}}次 · {{playsettingobject.multiple}}x倍速 · {{playsettingobject.interval}}秒换词</text>
          <uni-icons type="arrowright" size="16" color="#666" />
        </view>
      </view>
  
      <!-- 主体内容 -->
      <view class="main-content" :class="{pronassessment:wordmodeNum==2}">
        <swiper :circular="circular" :duration="duration" class="swiper" :current="currentPage - 1" @change="onSwiperChange">
            <swiper-item v-for="(word, index) in allWords" :key="index">
                <scroll-view scroll-y class="scroll-view">
                  <view class="card">
                    <!-- 分页指示 -->
                    <view class="pagination">
                      <view>
                        <text class="page-current">{{ currentPage }}</text>
                        <text class="page-divider">/</text>
                        <text class="page-total">{{ allWords.length }}</text>
                      </view>
                       <view @tap="wordsNotebookclick" class="wordsNotebook">
                        <image class="left-icon" :src="isUnfamiliarWord?jiahao:dagou"></image>
                        <text>生词本</text>
                      </view>
                    </view>
                    <wordcard ref="wordcardRef" @redefineSettingsParentC="redefineSettingsParentControl" :volume=volume :fulldisplayNum="fulldisplayNum" @fullDisplayRecovery="fullDisplayRecovery" :word="word" />
                    <!-- 功能按钮 -->
                    <view v-if="wordmodeNum !=1" @tap="showEvaluationModal" class="action-buttons">
                        <view class="pronunciation-btn">
                        <uni-icons class="uniIcon" type="mic" size="20" color="#fff" />
                        <text class="btn-text">发音测评</text>
                        </view>
                    </view>
                    
                  </view>
                </scroll-view>
            </swiper-item>
			<swiper-item v-if="wordmodeNum==0">
				<wordsharepageVue :allWords=allWords v-if="allWords.length" class="card"></wordsharepageVue>
			</swiper-item>
        </swiper>
        
      </view>
      
      <!-- 播放按钮 -->
      <view v-if="wordmodeNum !=2" class="play-button-fixed">
        <!-- 左侧：完整展示 -->
        <view class="left-section">
          <view @tap="fulldisplayclick" class="left-ct">
            <text class="complete-text">完整展示</text>
            <image class="left-icon" src="@/assets/icons/down_arrow.svg"></image>
          </view>
        </view>

        <!-- 中间：播放按钮 -->
        <view @tap="playbuttonclick" class="middle-section">
          <view>
            <template v-if="!ispagePlaying">
              <image src="@/assets/icons/play_word.svg" alt="Play Button" class="play-button-image" />
            </template>
            <template v-else>
              <image src="@/assets/icons/pause_word.svg" alt="Play Button" class="play-button-image" />
            </template>
          </view>
            
        </view>

        <!-- 右侧：两个按钮 -->
        <view class="right-section">
            <view @tap="sequenceclick" class="right-section-button">
              <template v-if="issequence">
                <image class="left-icon" src="@/assets/icons/sequence.svg"></image>
              </template>
              <template v-else>
                <image class="left-icon" src="@/assets/icons/outoforder.svg"></image>
              </template>
            </view>
            <view @tap="phonicclick" class="right-section-button">
              <template v-if="isphonic">
                <image class="left-icon" src="@/assets/icons/phonic.svg"></image>
              </template>
              <template v-else>
                <image class="left-icon" src="@/assets/icons/silence.svg"></image>
              </template>
            </view>
        </view>
      </view>

    
      <view class="fullmodal" v-if="isfulldisplay" @tap="closefullModal">
        <view class="fullmodal-content" :class="{ 'fullmodal-content-active': isfulldisplay }" @tap.stop>
        <view class="fullmodal-title">显示内容设置</view>
          <view class="fullmodal-body">
            <view class="fullsetting-item">
              <text>隐藏释义</text>
              <view @tap="fulldisplayclicknum(2)" class="fullsetting-itemright">
                <image class="left-icon" :src="fulldisplayNum==2 ? selectIcon : unselectIcon"></image>
              </view>
            </view>
            <view class="fullsetting-item">
              <text>隐藏单词</text>
              <view @tap="fulldisplayclicknum(1)" class="fullsetting-itemright">
                <image class="left-icon" :src="fulldisplayNum==1 ? selectIcon : unselectIcon"></image>
              </view>
            </view>
            <view class="fullsetting-item">
              <text>完整展示</text>
              <view @tap="fulldisplayclicknum(0)" class="fullsetting-itemright">
                <image class="left-icon" :src="fulldisplayNum==0 ? selectIcon : unselectIcon"></image>
              </view>
            </view>
          </view>
          <view class="fullmodal-footer">
            <button @tap="closefullModal">关闭</button>
          </view>
        </view>
      </view>

       <!--测评 弹窗 -->
       <wordassessPop ref="wordassessPops" :currentWord="currentWord"></wordassessPop>

       <!-- 播放设置弹窗 -->
        <PlaySettingsModal :currentPage="currentPage" :playsettingobject="playsettingobject" @playsettingSuccess="playsettingSuccess" ref="playSettingsModal" />

    </view>
  </template>
  
  <script setup>
  import { ref,computed,onMounted, onUnmounted, Text,onUpdated,nextTick} from 'vue';
    import { onLoad } from '@dcloudio/uni-app'
   import textbook from '@/api/textbook'
   import wordcard from './wordcard.vue';

   import PlaySettingsModal from './PlaySettingsModal.vue';
   import wordassessPop from './wordassessPop.vue';

   import selectIcon from '@/assets/icons/select_icon.svg';
   import unselectIcon from '@/assets/icons/unselect_icon.svg';

   import jiahao from '@/assets/icons/word_jiahao.svg';
   import dagou from '@/assets/icons/word_dagou.svg';

	import wordsharepageVue from './wordsharepage.vue';
	

const circular = ref(false);
const duration = 500; // 滑动动画时长
  

    const playSettingsModal = ref(null)
    const wordassessPops = ref(null)

   const allWords = ref([])
   // 在 script 中添加 originalOrder 的 ref
    const originalOrder = ref([]);
   const currentPage = ref(1) // 当前显示的页面

   const issequence = ref(true)
   const isphonic = ref(true)
   const ispagePlaying = ref(false)
   const isfulldisplay = ref(false)
   const fulldisplayNum = ref(0)
   const currentTrackIndex = ref(-1)
   const currentAudio = ref(null)
   const wordcardRef = ref(null)

   const isUnfamiliarWord = ref(false)

   let autoSwipeInterval = null; // 定时器

   const playsettingobject = ref({
      repeatnum:1,
      interval:2,
      multiple:1,
      phonicsState:true,
      annotationSate:true
   })
   const volume = ref(1)


	//0：默认  1.磨耳朵  2.发音测评 
	const wordmodeNum = ref(0)

   // 自动滑动函数
  const startAutoSwipe = () => {

    var miaonum = playsettingobject.value.interval*1000
    console.log("miaonum")
    console.log(miaonum)

    autoSwipeInterval = setInterval(() => {
      if (currentPage.value <= allWords.value.length) {
        currentPage.value += 1; // 向右滑动
      } else {
        // currentPage.value = 1; // 回到第一页
      }
      stopAutoSwipe()
    }, miaonum); // 3秒滑动一次
  };

  // 停止自动滑动
  const stopAutoSwipe = () => {
    if (autoSwipeInterval) {
      clearInterval(autoSwipeInterval);
      autoSwipeInterval = null;
    }
  };

  // 组件挂载时启动自动滑动
	onMounted(() => {
	  // startAutoSwipe();
	   
	});

	// 组件卸载时停止自动滑动
	onUnmounted(() => {
	  stopAutoSwipe();
	});


  function wordsNotebookclick() {
    isUnfamiliarWord.value = !isUnfamiliarWord.value
  }

   function fullDisplayRecovery() {
    fulldisplayNum.value = 0
   }

   function fulldisplayclicknum(num) {
    fulldisplayNum.value = num
    isfulldisplay.value = false
   }


   function closefullModal() {
    isfulldisplay.value = false
   }

   function fulldisplayclick() {
    isfulldisplay.value = true
   }
   function playbuttonclick() {
    ispagePlaying.value = !ispagePlaying.value
    stopCurrentAudio()
    currentTrackIndex.value = 0

    playNext()
    
   }
   

   const playNext = (isone = false) => {

		if (!isone) {
			wordcardRef.value[currentPage.value - 1].redefineSettings();
		}
	
	
      if (!ispagePlaying.value) {
        stopAutoSwipe()
        return
      }

      var playList = []

      for (let i = 0; i < playsettingobject.value.repeatnum; i++) {
        playList.push(...currentAudioList.value)
      }


      originalOrder.value = [...allWords.value];

      if (currentTrackIndex.value < playList.length) {
        const track = playList[currentTrackIndex.value]
        if (track.length<=0) {
          currentTrackIndex.value++
          playNext()
        } else {
          const audio = uni.createInnerAudioContext()
          currentAudio.value = audio
      
          //设置播放倍速 没作用
          audio.playbackRate = playsettingobject.value.multiple
		  //设置是否声音
		  audio.volume = volume.value
      
          audio.src = track
          audio.onEnded(() => {
            currentTrackIndex.value++
            playNext()
          })

          // audio.onCanplay(() => {
          //    audio.playbackRate = 2.0
          //   console.log('当前播放速度:', audio.playbackRate); // 打印当前倍速
          //   audio.play();
          // });
        

           audio.play()
        }
        
      } else {

        if (currentPage.value <= allWords.value.length) {
          // ispagePlaying.value = false
          currentTrackIndex.value = -1
	
		  if (wordmodeNum.value !=2) {
			  if (wordmodeNum.value == 1 && currentPage.value==allWords.value.length) {
				 ispagePlaying.value = false
				 currentTrackIndex.value = -1
				 stopAutoSwipe()  
			  } else {
				  startAutoSwipe() 
			  }
			 
		  } else {
			  ispagePlaying.value = false
			  currentTrackIndex.value = -1
			  stopAutoSwipe()
		  }
        } else {
          ispagePlaying.value = false
          currentTrackIndex.value = -1
          stopAutoSwipe()
        }
 
      }
    }


    function redefineSettingsParentControl() {
      ispagePlaying.value = false
      currentTrackIndex.value = -1
      stopAutoSwipe()
      stopCurrentAudio()
    }

   function stopCurrentAudio() {
    if (currentAudio.value) {
      currentAudio.value.pause()
      // ispagePlaying.value = false
      try {
        currentAudio.value.stop()
		currentAudio.value.destroy()
      } catch (error) {
        console.error("Error stopping audio:", error)
      }
      currentAudio.value = null
    }
  }

	
	const isdaluan = ref(false)

   function sequenceclick() {
	   
	   if (!isdaluan.value) {
		   isdaluan.value = true
		  issequence.value = !issequence.value
		  if (!issequence.value) {
		  	uni.showToast({
		  	        title: '数据已打乱',
		  	      });
		  // 如果是顺序播放，打乱顺序;
		    allWords.value = [...shuffleArray(originalOrder.value)];
		    
		  } else {
		  	uni.showToast({
		  	        title: '数据还原',
		  	      });
		    // 如果是随机播放，恢复原始顺序
		    allWords.value = [...originalOrder.value];
		  }
		  
		  
		      wordcardRef.value.forEach((item) => {
		            item.redefineSettings()
		        });
		  
		      stopAutoSwipe()
		      stopCurrentAudio()
		  
		      setTimeout(() => {
				  isdaluan.value = false
		        currentTrackIndex.value = 0
		        playNext()
		        // 在这里添加延迟执行的代码
		      }, 1000); 
	   }

	
   }

   // 打乱数组顺序的函数
  function shuffleArray(array) {
    // for (let i = array.length - 1; i > 0; i--) {
    //   const j = Math.floor(Math.random() * (i + 1));
    //   [array[i], array[j]] = [array[j], array[i]];
    // }
	const shuffledArray = [...array]; // 复制数组以避免修改原始数组
	  for (let i = shuffledArray.length - 1; i > 0; i--) {
	    const j = Math.floor(Math.random() * (i + 1));
	    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
	  }
	  return shuffledArray;
  }


   function phonicclick() {
    isphonic.value = !isphonic.value
	
	volume.value = isphonic.value?1:0
	var tstit = isphonic.value?"设置有声了":"设置无声了"
	
	uni.showToast({
	        title: tstit,
	      });
	
	
   }

   function playsettingSuccess(newSettings) {
    playsettingobject.value = newSettings
   }

   const showPlaySettingsModal = () => {
        playSettingsModal.value.showModal();
    };

   const currentWord = computed(() => {
        return allWords.value[currentPage.value - 1];
    });

    const currentAudioList = computed(() => {
      const audioList = []
      audioList.push(currentWord.value.us_sound_path)
      audioList.push(currentWord.value.uk_sound_path)
        return audioList;
    });

    const showEvaluationModal = () => {
		
			stopCurrentAudio()
			ispagePlaying.value = false
			

			wordcardRef.value[currentPage.value-1].redefineSettings()
			
			
		
          if (wordassessPops.value && typeof wordassessPops.value.showPopup === 'function') {
            wordassessPops.value.showPopup(); // 调用子组件的方法
          }
    };

    
  
  onLoad(async (options) => {
        const {bookId,sessionKey,wordmode} = options

        if (wordmode) {
        	wordmodeNum.value = wordmode
        }

        // console.log("currentAudioList.value")
        // console.log(currentAudioList.value)

        // 获取数据
        uni.getStorage({
        key: sessionKey,
        success: function (res) {
            const words = JSON.parse(res.data);
            // console.log('获取到的数据:', words);
            detailWords(bookId,words)
        },
        fail: function (err) {
            console.log('获取数据失败', err);
        }
        });
    
   })

   const detailWords = async (bookId, words) => {
        try {
            const response = await textbook.getWordsDetail(bookId, words);
            console.log("Response:", response);
            allWords.value = response.data.words

            originalOrder.value = [...allWords.value]; // 保存原始顺序
			
			// 使用 nextTick 确保 DOM 更新完成
			nextTick(() => {
			  if (allWords.value.length > 0) {
				//让它一进来就播放
				console.log("第一次进来")
				ispagePlaying.value = true
				currentTrackIndex.value = 0
				playNext(true)
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

  // swiper 切换时触发
    const onSwiperChange = (event) => {
        currentPage.value = event.detail.current + 1
		
		if (currentPage.value<=allWords.value.length) {
			wordcardRef.value.forEach((item) => {
				item.redefineSettings()
			});
		} else {
			ispagePlaying.value = false
		}
		
		// 如果滑动到最后一页，允许循环滑动
		if (wordmodeNum.value ==2 || wordmodeNum.value ==1) {
			if (currentPage.value === allWords.value.length) {
						
			  circular.value = true;
			}
		} else {
			if (currentPage.value === (allWords.value.length+1)) {
			  circular.value = true;
			}
		}
		  

        stopAutoSwipe()
        stopCurrentAudio()

		if (currentPage.value<=allWords.value.length) {
			setTimeout(() => {
			  currentTrackIndex.value = 0
			  if (wordmodeNum.value ==2 && !ispagePlaying.value) { //是测评
			  
				  ispagePlaying.value = true
			  }
			  playNext()
			  // 在这里添加延迟执行的代码
			}, 1000);
		}
        

        
    }
  </script>
  
  <style scoped lang="scss">
 
 /* #ifdef H5 */
  
  .container {
    position: fixed; // 使用 fixed 布局
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #f8f9fa;
    overflow: hidden; // 确保内容不会溢出
  }
  
  .header {
    // margin-bottom: 32rpx;
    position: fixed;
    top: 90rpx;
    left: 0;
    right: 0;
    padding: 24rpx;
    z-index: 10; /* 确保头部在最上层 */
    
    .main-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.5;
    }
  
    .sub-header {
      display: flex;
      align-items: center;
      margin-top: 12rpx;
      
      .subtitle {
        font-size: 26rpx;
        color: #666;
        margin-right: 8rpx;
      }
    }
  }

  .main-content {
    // height: 75vh;
    position: fixed;
    top: 220rpx; /* 根据头部高度调整 */
    bottom: 120rpx; /* 根据底部播放按钮高度调整 */
    left: 0;
    right: 0;
    overflow: hidden;
  }
  
  .pronassessment {
	  bottom:30rpx
  }
  
  
  .swiper {
    height: 100%;
  }
  .scroll-view {
    height: 100%; /* 设置滚动区域的高度 */
   }

  .card {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    // margin: 0 20;
    position: absolute;
    left: 20rpx;
    top: 0;
    right: 20rpx;
    bottom: 50rpx;
    overflow: scroll;
	
	
	/* 隐藏滚动条 */
	  &::-webkit-scrollbar {
	    display: none; /* 隐藏滚动条 */
	  }
	  /* 兼容 Firefox */
	  scrollbar-width: none; /* Firefox */
	  -ms-overflow-style: none; /* IE 和 Edge */
    

    // box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
    // border: 2rpx solid #E8E8E8;
    // box-shadow: 0rpx -2rpx 4rpx 0rpx #c4c4c4;
    // min-height: 80vh; /* 确保 card 有足够的高度 */
  }
  
  .pagination {
    margin-bottom: 20rpx;
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

  
  .action-buttons {
    position: absolute;
    bottom: 30rpx;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    .pronunciation-btn {
      padding: 20rpx 40rpx;
      border-radius: 48rpx;
      display: flex;
      flex-direction: column; /* 竖向排列 */
      align-items: center;
      .uniIcon {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #2b9939;
        width: 70rpx;
        height: 70rpx;
        border-radius: 35rpx;
      }
      .btn-text {
        margin-top: 10rpx;
        color:#666;
        font-size: 28rpx;
        margin-left: 12rpx;
      }
    }
  
    .display-toggle {
      display: flex;
      align-items: center;
      
      .toggle-text {
        font-size: 28rpx;
        color: #666;
        margin-right: 8rpx;
      }
      
      .page-indicator {
        font-size: 28rpx;
        color: #1a1a1a;
        margin-left: 16rpx;
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

  .play-button-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between; /* 使左右两侧和中间部分均匀分布 */
  align-items: center;
  padding: 20rpx;
  // background-color: #2b9939;
  // box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.05);
  z-index: 1000; /* 确保按钮在最上层 */
    }

    .left-section {
      width: 33.33%;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      .left-ct {
        padding: 0rpx 30rpx;
        background-color: #fff;
        height: 80rpx;
        border-radius: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    .complete-text {
        font-size: 28rpx;
        color: #707070;
        margin-right: 10rpx;
    }
    .page-indicator {
        font-size: 28rpx;
        color: #fff;
        font-weight: bold;
    }
    }

    .middle-section {
      display: flex;
      align-items: center;
      width: 30%;
      padding:0 20rpx;
      view {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        background-color: #2b9939;
        height: 80rpx;
        border-radius: 40rpx;
      }
      .play-button-image {
        width: 40rpx;
        height: 40rpx;
    }
    }

    .right-section {
      display: flex;
      align-items: center;
      flex: 1;
    .right-section-button {
        background-color: #fff;
        border: none;
        height: 80rpx;
        width: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10rpx;
        border-radius: 40rpx;
    }
    }

    .left-icon {
      width: 30rpx;
      height: 30rpx;
      margin-left: 10rpx;
  }



  .fullmodal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1000;
    transition: opacity 0.3s ease;
  }
  
  .fullmodal-content {
    background-color: white;
    width: 100%;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    padding: 32rpx 0 32rpx 32rpx;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  
  .fullmodal-content-active {
    transform: translateY(0);
  }
  
  .fullmodal-title {
    font-size: 32rpx;
    // font-weight: bold;
    margin-bottom: 20rpx;
    padding: 10rpx 0;
    text-align: center;
  }
  
  .fullmodal-body {
    margin-bottom: 20rpx;
  }
  
  .fullsetting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25rpx 0;
    // border-bottom: 1rpx solid #e8e8e8;
  }
  .fullsetting-itemright {
    display: flex;
    width: 100rpx;
    height: 50rpx;
    // background-color: red;
    // justify-content: flex-end; /* 水平对齐：右对齐 */
    justify-content:center;
    align-items: center;       /* 垂直对齐：居中 */
  }
  .fullsetting-right {
    display: flex;
    align-items: center;
  }
  .fullControlsItem {
    width: 50rpx;
    height: 50rpx;
    border-radius: 25rpx;
    font-size: 35rpx;
    background-color: #999;
    color: #fff;
    display: flex;
    line-height: 40rpx;
    justify-content: center;
    // align-items: center;
  }
  .fullmiddlenum {
    margin: 0 15rpx;
  }
  
  .fullmodal-footer {
    text-align: right;
  }
  /* #endif */


 /* #ifdef MP-WEIXIN */
  
  .container {
    position: absolute; // 使用 fixed 布局
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #f8f9fa;
    overflow: hidden; // 确保内容不会溢出
  }
  
  .header {
    // margin-bottom: 32rpx;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 24rpx;
    z-index: 10; /* 确保头部在最上层 */
    
    .main-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.5;
    }
  
    .sub-header {
      display: flex;
      align-items: center;
      margin-top: 12rpx;
      
      .subtitle {
        font-size: 26rpx;
        color: #666;
        margin-right: 8rpx;
      }
    }
  }

  .main-content {
    // height: 75vh;
    position: absolute;
    top: 130rpx; /* 根据头部高度调整 */
    bottom: 120rpx; /* 根据底部播放按钮高度调整 */
    left: 0;
    right: 0;
    overflow: hidden;
  }
  
  .pronassessment {
	  bottom:30rpx
  }
  
  
  .swiper {
    height: 100%;
  }
  .scroll-view {
    height: 100%; /* 设置滚动区域的高度 */
   }

  .card {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    // margin: 0 20;
    position: absolute;
    left: 20rpx;
    top: 0;
    right: 20rpx;
    bottom: 50rpx;
    overflow: scroll;
	
	
	/* 隐藏滚动条 */
	  &::-webkit-scrollbar {
	    display: none; /* 隐藏滚动条 */
	  }
	  /* 兼容 Firefox */
	  scrollbar-width: none; /* Firefox */
	  -ms-overflow-style: none; /* IE 和 Edge */
    

    // box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
    // border: 2rpx solid #E8E8E8;
    // box-shadow: 0rpx -2rpx 4rpx 0rpx #c4c4c4;
    // min-height: 80vh; /* 确保 card 有足够的高度 */
  }
  
  .pagination {
    margin-bottom: 20rpx;
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

  
  .action-buttons {
    position: absolute;
    bottom: 30rpx;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    .pronunciation-btn {
      padding: 20rpx 40rpx;
      border-radius: 48rpx;
      display: flex;
      flex-direction: column; /* 竖向排列 */
      align-items: center;
      .uniIcon {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #2b9939;
        width: 70rpx;
        height: 70rpx;
        border-radius: 35rpx;
      }
      .btn-text {
        margin-top: 10rpx;
        color:#666;
        font-size: 28rpx;
        margin-left: 12rpx;
      }
    }
  
    .display-toggle {
      display: flex;
      align-items: center;
      
      .toggle-text {
        font-size: 28rpx;
        color: #666;
        margin-right: 8rpx;
      }
      
      .page-indicator {
        font-size: 28rpx;
        color: #1a1a1a;
        margin-left: 16rpx;
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

  .play-button-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between; /* 使左右两侧和中间部分均匀分布 */
  align-items: center;
  padding: 20rpx;
  // background-color: #2b9939;
  // box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.05);
  z-index: 1000; /* 确保按钮在最上层 */
    }

    .left-section {
      width: 33.33%;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      .left-ct {
        padding: 0rpx 30rpx;
        background-color: #fff;
        height: 80rpx;
        border-radius: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    .complete-text {
        font-size: 28rpx;
        color: #707070;
        margin-right: 10rpx;
    }
    .page-indicator {
        font-size: 28rpx;
        color: #fff;
        font-weight: bold;
    }
    }

    .middle-section {
      display: flex;
      align-items: center;
      width: 30%;
      padding:0 20rpx;
      view {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        background-color: #2b9939;
        height: 80rpx;
        border-radius: 40rpx;
      }
      .play-button-image {
        width: 40rpx;
        height: 40rpx;
    }
    }

    .right-section {
      display: flex;
      align-items: center;
      flex: 1;
    .right-section-button {
        background-color: #fff;
        border: none;
        height: 80rpx;
        width: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10rpx;
        border-radius: 40rpx;
    }
    }

    .left-icon {
      width: 30rpx;
      height: 30rpx;
      margin-left: 10rpx;
  }



  .fullmodal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1000;
    transition: opacity 0.3s ease;
  }
  
  .fullmodal-content {
    background-color: white;
    width: 100%;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    padding: 32rpx 0 32rpx 32rpx;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  
  .fullmodal-content-active {
    transform: translateY(0);
  }
  
  .fullmodal-title {
    font-size: 32rpx;
    // font-weight: bold;
    margin-bottom: 20rpx;
    padding: 10rpx 0;
    text-align: center;
  }
  
  .fullmodal-body {
    margin-bottom: 20rpx;
  }
  
  .fullsetting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25rpx 0;
    // border-bottom: 1rpx solid #e8e8e8;
  }
  .fullsetting-itemright {
    display: flex;
    width: 100rpx;
    height: 50rpx;
    // background-color: red;
    // justify-content: flex-end; /* 水平对齐：右对齐 */
    justify-content:center;
    align-items: center;       /* 垂直对齐：居中 */
  }
  .fullsetting-right {
    display: flex;
    align-items: center;
  }
  .fullControlsItem {
    width: 50rpx;
    height: 50rpx;
    border-radius: 25rpx;
    font-size: 35rpx;
    background-color: #999;
    color: #fff;
    display: flex;
    line-height: 40rpx;
    justify-content: center;
    // align-items: center;
  }
  .fullmiddlenum {
    margin: 0 15rpx;
  }
  
  .fullmodal-footer {
    text-align: right;
  }
  /* #endif */

  </style>