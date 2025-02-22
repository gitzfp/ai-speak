<template>
  <view v-if="planWordsList.length>0">
    <view class="main-content">
      <WordDisplay v-if="planWordmode==0" ref="wordDisplayref" :word="planWordsList[planWordindext]"/>
	  <view v-else-if="planWordmode==1" class="secondMode">
		<image v-if="isSecondModeReading" class="secondMode-icon" src="http://114.116.224.128:8097/static/voice_playing.gif"></image>
		<image v-else class="secondMode-icon" src="http://114.116.224.128:8097/static/voice_play.png"></image>
	  </view>
	  <view class="thirdMode" v-else>
		  {{planWordsList[planWordindext].paraphrase}}山东科技发大水发不了尽快胜多负少的
	  </view>
      
      <OptionAreaPicture :planWordmode="planWordmode" :optionWords="optionAreaWords" @item-click="optionitemclick" />
	  
    </view>
  </view>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue';
  import { onLoad } from '@dcloudio/uni-app'
  import WordDisplay from './WordDisplay.vue'; // 引入新组件
  import textbook from '@/api/textbook'
  import OptionAreaPicture from './OptionAreaPicture.vue'; // 引入新组件
  
  const wordDisplayref = ref(null)
  
  const book_id = ref('')
  const planWordsList = ref([])
  const planWordindext = ref(0)
  const planWordmode = ref(0) // 总共三种模式
   const isSecondModeReading = ref(false)

  onMounted(() => {
    console.log("onMounted")
  })
  
  const optionitemclick = (optionWord) => {
    const mainContent = document.querySelector('.main-content');
    
    // 添加动画类
    mainContent.classList.add('slide-out-left');
    
    // 动画结束后执行的操作
    mainContent.addEventListener('animationend', () => {
      // 移除动画类
      mainContent.classList.remove('slide-out-left');
      
	  if (planWordmode.value==0 || planWordmode.value==1) {
		  if (planWordindext.value%5 == 4) {
				  planWordindext.value = planWordindext.value-4
				  planWordmode.value = planWordmode.value+1
		  } else {
		  if (planWordindext.value==(planWordsList.value.length - 1)) {
			 planWordindext.value = planWordindext.value - ((planWordsList.value.length-1)%5)
			 planWordmode.value = planWordmode.value+1
		  } else {
			  planWordindext.value = planWordindext.value+1
		  }
		  }
	  } else { //2
		  if (planWordindext.value%5 == 4) {
			  if (planWordindext.value < (planWordsList.value.length - 1)) {
				  planWordindext.value = planWordindext.value+1
				  planWordmode.value = 0
			  }
		  } else {
			  if (planWordindext.value < (planWordsList.value.length - 1)) {
			  	planWordindext.value = planWordindext.value+1
			  }
		  }
	  }
      // 更新 planWordindext 的值
      // planWordindext.value = (planWordindext.value + 1) % planWordsList.value.length;
	  
	  console.log("下标=="+planWordindext.value)
	  console.log("第几部分=="+planWordmode.value)
      
      // 重新显示内容
      mainContent.style.opacity = '1';
      mainContent.style.transform = 'translateX(0)';
    }, { once: true });
  };
  
  const getoptionAreaWords = (fixedNum, rangeStart, rangeEnd, numToSelect) => {
    // 创建指定范围的数组
    let numbersPool = [];
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i !== fixedNum) numbersPool.push(i); // 排除固定数字
    }
  
    // 随机选取不重复的数字  我们改成word对象
    let selectedNumbers = [];
    let result = [];
    
    while (selectedNumbers.length < numToSelect) {
      let randomIndex = Math.floor(Math.random() * numbersPool.length);
      let chosenNumber = numbersPool[randomIndex];
      
      // 如果这个数字还没有被选中，则添加到结果数组中
      if (!selectedNumbers.includes(chosenNumber)) {
        selectedNumbers.push(chosenNumber);
        result.push(planWordsList.value[chosenNumber])
      }
    }
  
    // 在随机位置插入固定数字
    let insertPosition = Math.floor(Math.random() * (result.length + 1));
    result.splice(insertPosition, 0, planWordsList.value[fixedNum]);
    
    return result;
  }
  
  const optionAreaWords = computed(() => {
    console.log("uiiuuiiu")
    let result = getoptionAreaWords(planWordindext.value, 0, planWordsList.value.length - 1, 3)
    return result
  });
  
  onLoad(async (options) => {
    const { bookId, planWords } = options
    book_id.value = bookId
  
    // 获取数据
    uni.getStorage({
      key: planWords,
      success: function(res) {
        const words = JSON.parse(res.data);
        detailWords(bookId, words)
      },
      fail: function(err) {
        console.log('获取数据失败', err);
      }
    });
  })
  
  const detailWords = async (bookId, words) => {
    try {
      const response = await textbook.getWordsDetail(bookId, words);
      planWordsList.value = response.data.words
    } catch (error) {
      console.error('获取单词列表失败:', error);
      uni.showToast({
        title: '获取单词列表失败',
        icon: 'none'
      });
    }
  };
</script>

<style scoped lang="scss">
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
	  height: 60rpx;
	  width: 60rpx;
  }
  .thirdMode {
	  margin: 50rpx;
	  // display: flex;
	  // justify-content: center;
	  // align-items: center; 
	  font-size: 32rpx;
	  text-align: center;
	  border: 1rpx solid #e5e5e5;
	  padding: 30rpx 20rpx;
	  border-radius: 10rpx;
  }
  
</style>