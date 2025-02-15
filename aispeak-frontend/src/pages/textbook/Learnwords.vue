<template>
    <view class="words-container">
      <CommonHeader
      background-color="#fff"
      :leftIcon="true"
      :back-fn="handleBackPage"
      title="单词列表"
    >
      <template v-slot:content>
        <view class="ellipsis">{{ currentBook.grade }} {{ currentBook.term }}</view>
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
      style="height: calc(100vh - 200px); overflow-y: auto;"
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
              <view @click="toggleUnitSelection(group)" class="unit-left">
                <image class="left-icon" :src="group.isUnitSelected ? selectIcon : unselectIcon"></image>
                <view class="unit-left-tit">Unit {{ group.lesson_id }} </view>
              </view>
              <view class="unit-right">
                共{{ group.words.length }}个
              </view>
            </view>
        </view>
        <!-- 单词项 -->
        <view @click="toggleWordSelection(word,group)" class="word-item" v-for="word in group.words" :key="word.word_id">
          <image class="left-icon" :src="word.isSelected ? selectIcon : unselectIcon"></image>
          <view class="word-content">
              <view class="word-text">{{ word.word }}</view>
              <view class="word-translation">翻译：{{ word.chinese }}</view>
          </view>
            
        </view>
      </view>
      </scroll-view>
          

      <!-- 在template末尾添加按钮容器 -->
      <view class="button-bar">
        <!-- 按钮1 -->
        <view class="button-item green" @tap="handleButtonClick(1)">
          <image class="button-icon" src="@/assets/icons/brush_words.svg"></image>
          <text>刷词</text>
        </view>

        <!-- 按钮2 -->
        <view class="button-item orange" @tap="handleButtonClick(2)">
          <image class="button-icon" src="@/assets/icons/ear_grinding.svg"></image>
          <text>磨耳朵</text>
        </view>

        <!-- 按钮3 -->
        <view class="button-item blue" @tap="handleButtonClick(3)">
          <image class="button-icon" src="@/assets/icons/repeat.svg"></image>
          <text>跟读</text>
        </view>

        <!-- 按钮4 -->
        <view class="button-item purple" @tap="handleButtonClick(4)">
          <image class="button-icon" src="@/assets/icons/word_dictation.svg"></image>
          <text>听写</text>
        </view>

        <!-- 按钮5 -->
        <view class="button-item red" @tap="handleButtonClick(5)">
          <image class="button-icon" src="@/assets/icons/abacus_flat.svg"></image>
          <text>消消乐</text>
        </view>

        <!-- 新增按钮6 -->
        <view class="button-item pink" @tap="handleButtonClick(6)">
          <image class="button-icon" src="@/assets/icons/verify-code2.svg"></image>
          <text>单词巧记</text>
        </view>
      </view>



     
    </view>
  </template>
  
  <script setup>
  import { ref , onMounted,nextTick} from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import textbook from '@/api/textbook'
  import CommonHeader from "@/components/CommonHeader.vue"

  import selectIcon from '@/assets/icons/select_icon.svg';
  import unselectIcon from '@/assets/icons/unselect_icon.svg';
  
      const groupedWords = ref([])
      const units = ref([])
      const currentLessonId = ref('')
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


      // 初始化时默认选中第一个单元
      onMounted(() => {
        if (units.value.length > 0) {
          switchUnit(units.value[0].lesson_id)
        }
      })

      // 处理滚动事件，根据滚动位置更新当前选中的单元
      const handleScroll = (e) => {        
        // 遍历所有单元，找到最接近顶部的那个单元
        for (let i = 0; i < groupedWords.value.length; i++) {
          const groupId = groupedWords.value[i].lesson_id;
          uni.createSelectorQuery().in(this).select(`#unit-${groupId} .unit-header`).boundingClientRect((rect) => {
            if (rect) {
              // 当单元标题刚好进入可视区域顶部或非常接近顶部时
              if (Math.abs(rect.top) <= 5 && Math.abs(rect.top) >= 0) { // 允许一定的误差范围
                if (currentLessonId.value !== groupId) {
                  currentLessonId.value = groupId
                }
              }
            }
          }).exec()
        }
      }


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
  
      onLoad((options) => {
        const { objId } = options
        const objStr = sessionStorage.getItem(objId)
        const obj = JSON.parse(objStr);
        currentBook.value = { ...obj}
        fetchWords(currentBook.value.book_id)
        
      })
  
      const showDetails = (word) => {
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
        uni.showToast({
          title: `按钮${index}被点击`,
          icon: 'none'
        })
      }


      
  
  </script>
  
  <style scoped lang="less">
  .words-container {
    background-color: #f5f5f5;
  }
  .unit-view {
    padding-bottom: 10px;
    background-color: #f5f5f5;
  }
  
  .unit-header {
    // text-align: center;
    // margin-bottom: 20rpx;
    background-color: #fdfdfd;
    padding: 5px;
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
      padding-left: 10px;
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
      width: 20px;
      height: 20px;
      margin-right: 5px;
  }

  .download-tip {
    color: #666;
    font-size: 24rpx;
  }
  
  // .word-list {
  //   display: flex;
  //   flex-direction: column;
  //   //  gap: 20rpx;
  // }
    .word-list {
      height: calc(100vh - 300px); /* 根据实际布局调整 */
      // overflow-y: auto;
    }
  
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
    margin-left: 10px;
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
    padding: 20rpx;
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
    height: 100px;
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
        width: 40px; /* 根据实际图标的大小调整 */
        height: 40px; /* 根据实际图标的大小调整 */
        margin-bottom: 5px;
      }



    }
  }




  </style>