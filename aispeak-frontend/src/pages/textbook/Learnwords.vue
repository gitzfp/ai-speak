<template>
    <view class="words-container">
      <CommonHeader
      background-color="#fff"
      :leftIcon="true"
      :back-fn="handleBackPage"
      title="单词列表"
    >
      <template v-slot:content>
        <view v-if="currentBook.grade != ''>0" class="ellipsis">{{ currentBook.grade }} {{ currentBook.term }}</view>
        <view v-else class="ellipsis">单词列表</view>
      </template>
    </CommonHeader>


      <!-- 单元导航 -->
      <scroll-view scroll-x class="unit-nav">
        <view
          v-for="unit in units" 
          :key="unit.lesson_id"
          class="unit-tab"
          :class="{ active: unit.lesson_id == currentLessonId }"
          @tap="switchUnit(unit.lesson_id)"
        >
          Unit {{ unit.lesson_id }}
        </view>
      </scroll-view>
  
     <!-- 单词列表 -->
     <scroll-view 
      scroll-y 
      class="word-list" 
      :scroll-into-view="scrollToUnitId"
      @scroll="handleScroll"
    >
        <view
        v-for="group in groupedWords" 
        :key="group.lesson_id"
        :id="'unit-' + group.lesson_id"
        class="unit-view"
        >
        <!-- 单元标题 -->
        <view class="unit-header">
            <view class="unit-title">
              <view @tap="toggleUnitSelection(group)" class="unit-left">
                <image class="left-icon" :src="group.isUnitSelected ? selectIcon : unselectIcon"></image>
                <view class="unit-left-tit">Unit {{ group.lesson_id }} </view>
              </view>
              <view class="unit-right">
                共{{ group.words.length }}个
              </view>
            </view>
        </view>
        <!-- 单词项 -->
        <view @tap="toggleWordSelection(word,group)" class="word-item" v-for="word in group.words" :key="word.word_id">
          <image class="left-icon" :src="word.isSelected ? selectIcon : unselectIcon"></image>
          <view class="word-content">
              <view class="word-text">{{ word.word }}</view>
              <view class="word-translation">翻译：{{ word.chinese }}</view>
          </view>
            
        </view>
      </view>
      </scroll-view>
          

      <!-- 在template末尾添加按钮容器 -->
      <!-- <view v-if="!showActionBar" class="button-bar">
        <view class="button-item green" @tap="handleButtonClick(1)">
          <image class="button-icon" src="@/assets/icons/brush_words.svg"></image>
          <text>刷词</text>
        </view>
        <view class="button-item orange" @tap="handleButtonClick(2)">
          <image class="button-icon" src="@/assets/icons/ear_grinding.svg"></image>
          <text>磨耳朵</text>
        </view>
        <view class="button-item blue" @tap="handleButtonClick(3)">
          <image class="button-icon" src="@/assets/icons/repeat.svg"></image>
          <text>跟读</text>
        </view>


        <view class="button-item purple" @tap="handleButtonClick(4)">
          <image class="button-icon" src="@/assets/icons/word_dictation.svg"></image>
          <text>听写</text>
        </view>

        <view class="button-item red" @tap="handleButtonClick(5)">
          <image class="button-icon" src="@/assets/icons/abacus_flat.svg"></image>
          <text>消消乐</text>
        </view>
        <view class="button-item pink" @tap="handleButtonClick(6)">
          <image class="button-icon" src="@/assets/icons/verify-code2.svg"></image>
          <text>单词巧记</text>
        </view>
      </view>  -->
    


    <!-- 操作栏（全选/已选词/开始学习） -->
    <view class="action-bar">
      <view class="action-content">
        <view class="action-bar-left" @tap="toggleSelectAll">
          <image class="left-icon" :src="isselectAll ? selectIcon : unselectIcon"></image>
          <view class="actionbar-titcontent">
              <view class="actionbar-text">全选</view>
              <view class="actionbar-translation">已选{{selectedCount}}词</view>
          </view>
        </view>
        <view class="start-learn" @tap="startLearning">{{btntit}}</view>
      </view>
    </view>
    <!-- 独立关闭按钮 -->
    <!-- <view 
      class="close-btn" 
      v-if="showActionBar"
      @tap="closeActionBar"
    >
        <text class="close-icon">×</text>
     </view> -->

     
    </view>
  </template>
  
  <script setup>
  import { ref , onMounted,nextTick,computed} from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import textbook from '@/api/textbook'
  import CommonHeader from "@/components/CommonHeader.vue"

  import selectIcon from '@/assets/icons/select_icon.svg';
  import unselectIcon from '@/assets/icons/unselect_icon.svg';
  
      const groupedWords = ref([])
      const units = ref([])
      const currentLessonId = ref('1')
      const currentBook = ref({
        book_id:'',
        book_name:'',
        grade:'',
        icon_url: '',
        subject_id:0,
        term:'',
        version_type:''
      }
      ) // 添加 currentBook

      const scrollToUnitId = ref('') // 新增响应式变量用于存储要滚动到的单元id
      // 控制显示哪个底部区域
      const showActionBar = ref(false)
      const isselectAll = ref(false)
	  
	  //0：默认  1.磨耳朵  2.发音测评  3.单词听写
	  const wordmodeNum = ref(0)

	  //按钮文字显示
	  const btntit = computed(() => {
		
		if (wordmodeNum.value == 1) {
			return '开始播放'
		} else if (wordmodeNum.value == 2) {
			return '开始测评'
		} else if (wordmodeNum.value == 3) {
			return '在线听写'
		} 
		return '开始学习'
	  })
      // 计算选中的单词数量
      const selectedCount = computed(() => {
        let count = 0
        groupedWords.value.forEach(group => {
          group.words.forEach(word => {
            if (word.isSelected) {
              count++
            }
          })
        })
        return count
      })

      // 切换全选状态
    const toggleSelectAll = () => {
      isselectAll.value = !isselectAll.value;

      // 更新所有单词的选中状态
      groupedWords.value.forEach(group => {
        group.words.forEach(word => {
          word.isSelected = isselectAll.value;
        });

        // 更新单元的选中状态
        group.isUnitSelected = isselectAll.value;
      });
    };
  
      // 开始学习
    const startLearning = () => {
      // 获取所有选中的单词
      const selectedWords = [];
      groupedWords.value.forEach(group => {
        group.words.forEach(word => {
          if (word.isSelected) {
            selectedWords.push(word.word_id);
          }
        });
      });


      // 如果没有选中任何单词，提示用户
      if (selectedWords.length === 0) {
        uni.showToast({
          title: '请至少选择一个单词',
          icon: 'none',
        });
        return;
      }

      // 将选中的单词数据存储到本地缓存中
      const sessionKey = 'selectedWords'; // 缓存键名
      
      const bookId = currentBook.value.book_id

	  const wordmode = wordmodeNum.value

      uni.setStorage({
		  key: sessionKey,
		  data: JSON.stringify(selectedWords),
		  success: function () {
			// console.log('数据存储成功');
			if (wordmodeNum.value == 3) {
				uni.navigateTo({
				  url: `/pages/textbook/WordDictation?sessionKey=${sessionKey}&bookId=${bookId}&wordmode=${wordmode}`, // 将缓存键名传递给学习页面
				});
			} else {
				uni.navigateTo({
				  url: `/pages/textbook/worddetails?sessionKey=${sessionKey}&bookId=${bookId}&wordmode=${wordmode}`, // 将缓存键名传递给学习页面
				});
			}
			
			
			
		  },
		  fail: function (err) {
			console.log('数据存储失败', err);
		  }
	  });

    };

      // 初始化时默认选中第一个单元
      onMounted(() => {
        if (units.value.length > 0) {
          switchUnit(units.value[0].lesson_id)
        }
      })

      // 处理滚动事件，根据滚动位置更新当前选中的单元
      const handleScroll = (e) => {
        
      };


      // 修改switchUnit函数以支持滚动到选中的单元
      const switchUnit = (lessonId) => {
        currentLessonId.value = lessonId
        scrollToUnitId.value = 'unit-' + lessonId
        nextTick(() => {
          // 可能不需要立即重置scrollToUnitId，取决于具体需求
          // scrollToUnitId.value = ''
  })
      }

      /**
       * 回到主页面
       */
      const handleBackPage = () => {
          uni.navigateBack()
      }
  
      const allWords = ref([]) // 存储所有单词数据
  
      const fetchWords = async (bookId, lessonId = null) => {
        try {
          const response = await textbook.getLessonWords(bookId)
          console.log('API Response:', response)
          
          if (response.code === 1000) {
            // 保存所有单词数据
            allWords.value = response.data.words
            
            // 提取所有不重复的 lesson_id
            const uniqueLessonIds = [...new Set(response.data.words.map(word => word.lesson_id))].sort()
            units.value = uniqueLessonIds.map(id => ({ lesson_id: id }))
            
           
            // 按单元分组单词
            groupedWords.value = uniqueLessonIds.map(lessonId => {
                const unitWords = response.data.words.filter(
                    word => String(word.lesson_id) === String(lessonId)
                ).map(word => ({ ...word, isSelected: false }))
                return {
                    lesson_id: lessonId,
                    words: unitWords,
                    isUnitSelected: false // 初始状态根据单词的选中情况确定
                }
            })

          }
        } catch (error) {
          console.error('获取单词列表失败:', error)
          uni.showToast({
            title: '获取单词列表失败',
            icon: 'none'
          })
        }
      }
  
      onLoad(async (options) => {
        const {bookId,wordmode} = options
		
		if (wordmode) {
			wordmodeNum.value = wordmode
		}
		
		
	
        currentBook.value.book_id = bookId
        fetchWords(bookId)
      })
  
      const showDetails = (word,wordmode) => {
        uni.navigateTo({
          url: `/pages/word-details?word=${word}`
        })
      }

      const toggleWordSelection = (word,group) => {
        word.isSelected = !word.isSelected

        if (!word.isSelected) {
          group.isUnitSelected = false
        } else {
          // 遍历单元下的所有单词，将它们的选中状态设置为和单元选中状态一致
          var num=0;
          group.words.forEach(word => {
              if (word.isSelected) {
                num++;
              }
          });
          if (num == group.words.length) {
            group.isUnitSelected = true
          } else {
            group.isUnitSelected = false
          }
        }
          

    }

    const toggleUnitSelection222 =() => {
      console.log("报错的就好办深V创建后第三笔")
    }

    // 切换整个单元的选中状态
      const toggleUnitSelection = (group) => {
          // 取反单元的选中状态
          group.isUnitSelected = !group.isUnitSelected; 
          // 遍历单元下的所有单词，将它们的选中状态设置为和单元选中状态一致
          group.words.forEach(word => {
              word.isSelected = group.isUnitSelected;
          });
      }


      // 在script中添加点击处理
      const handleButtonClick = (index) => {
        console.log(`点击按钮${index}`)
        // uni.showToast({
        //   title: `按钮${index}被点击`,
        //   icon: 'none'
        // })
        console.log(`点击按钮${index}`)
        showActionBar.value = true // 显示 action-bar
      }

      // 点击“X”按钮时关闭 action-bar，恢复六个按钮
      const closeActionBar = () => {
        showActionBar.value = false // 隐藏 action-bar
      }

      
  
  </script>
  
  <style scoped lang="less">
  .words-container {
    background-color: #f5f5f5;
  }
  .unit-view {
    padding-bottom: 20rpx;
    background-color: #f5f5f5;
  }
  
  .unit-header {
    // text-align: center;
    // margin-bottom: 20rpx;
    background-color: #fdfdfd;
    padding: 10rpx;
  }
  
  .unit-title {
    font-size: 36rpx;
    font-weight: bold;
    margin-bottom: 10rpx;
    display: flex;
    justify-content: space-between;
    .unit-left {
      width: 50%;
      text-align: left;
      padding-left: 20rpx;
      display: flex;
      align-items: center;
      // .unit-left-tit {

      // } 
    }
    .unit-right {
      font-size: 25rpx;
      width: 50%;
      text-align: right;
      padding-right: 10px;
      font-weight: 300;
    }
  }
  
  .left-icon {
      width: 40rpx;
      height: 40rpx;
      margin-right: 10rpx;
  }

  .download-tip {
    color: #666;
    font-size: 24rpx;
  }
  /* #ifdef H5 */
  .word-list {
    height: calc(100vh - 350rpx); /* 根据实际布局调整 */
    // overflow-y: auto;
    width: 100%;
  }
  /* #endif */
  
 /* #ifdef MP-WEIXIN */
    .word-list {
      height: calc(100vh - 430rpx); /* 根据实际布局调整 */
      // overflow-y: auto;
	  width: 100%;
    }
	 /* #endif */
  
  .word-item {
    display: flex;
    align-items: center;
    background: #fff;
    // border-radius: 16rpx;
    padding: 20rpx;
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  }
  
  .word-content {
    // display: flex;
    // justify-content: space-between;
    // align-items: center;
    // margin-bottom: 10rpx;
    margin-left: 20rpx;
  }
  
  .word-text {
    font-size: 32rpx;
    font-weight: bold;
  }
  
  .word-audio {
    width: 60rpx;
    height: 60rpx;
    background: #4CAF50;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .audio-icon {
    color: #fff;
    font-size: 32rpx;
  }
  
  .word-translation {
    color: #666;
    margin-bottom: 10rpx;
    font-size: 28rpx;
  }
  
  .word-image {
    width: 100%;
    height: 300rpx;
    overflow: hidden;
    border-radius: 8rpx;
    margin-bottom: 10rpx;
  }
  
  .word-image image {
    width: 100%;
    height: 100%;
  }
  
  .details-link {
    color: #4CAF50;
    font-size: 28rpx;
  }
  .unit-nav {
    white-space: nowrap;
    // padding: 20rpx;
	height: 90rpx;
    background-color: #fff;
    overflow-x: scroll; /* 允许横向滚动 */
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
	
  }
  .unit-nav::-webkit-scrollbar { 
  display: none;  /* Safari and Chrome */
}
  
  .unit-tab {
    display: inline-block;
    padding: 16rpx 40rpx;
    margin-right: 20rpx;
    border-radius: 32rpx;
    font-size: 28rpx;
    background-color: #f5f5f5;
    color: #666;
	margin-top: 9rpx;
  }
  
  .unit-tab.active {
    background-color: #4CAF50;
    color: #fff;
  }


  // 在style中添加样式
  .button-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 180rpx;
    display: flex;
    background: #fff;
    box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.1);
    z-index: 1000;

    .button-item {
      flex: 1;
      display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;
      font-size: 28rpx;
      color: #333;
      transition: all 0.3s;

      &:active {
        opacity: 0.8;
        transform: scale(0.95);
      }

      .button-icon {
        width: 80rpx; /* 根据实际图标的大小调整 */
        height: 80rpx; /* 根据实际图标的大小调整 */
        margin-bottom: 5px;
      }



    }
  }



  /* 操作栏样式调整 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180rpx;  // 与按钮栏高度一致
  background: #fff;
  box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  z-index: 999;    // 确保在关闭按钮下方


  .action-content {
    display: flex;
    align-items: center;
    gap: 40rpx;
    width: 100%;
    justify-content: space-between;

    .action-bar-left {
      display: flex;
      align-items: center;
      .actionbar-titcontent {
        margin-left: 10rpx;
        .actionbar-text {
          font-weight: bold;
          font-size: 40rpx;
        }
        .actionbar-translation {
          color: gray;
          font-size: 30rpx;
        }
      }
      
    }
    .start-learn {
      background: #4CAF50;
      color: #fff;
      padding: 16rpx 48rpx;
      border-radius: 40rpx;
      font-size: 28rpx;
      margin-right: 20rpx; // 与右边保持20rpx的距离
    }
  }
}

/* 关闭按钮定位 */
.close-btn {
  position: fixed;
  right: 30rpx;
  bottom: 180rpx;  // 位于操作栏上方20rpx（120rpx高度+20rpx间距）
  z-index: 1000;   // 确保在最上层
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.2);

  .close-icon {
    color: #fff;
    font-size: 40rpx;
    line-height: 1;
    margin-top: -4rpx; // 视觉居中微调
  }

  &:active {
    transform: scale(0.9);
    opacity: 0.8;
  }
}


  </style>