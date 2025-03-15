<template>
  <view class="container">

    <!-- 可滚动内容区域 -->
    <scroll-view 
      class="scroll-content"
      scroll-y
      :show-scrollbar="false"
    >
      <view 
        v-for="(group, index) in notebookList"
        :key="index"
        class="word-group"
      >
	  
	  
        <!-- 日期组头 -->
        <view class="group-header">
		  <view class="unit-title">
		    <view @tap="toggleUnitSelection(group)" class="unit-left">
		      <image class="left-icon" :src="group.selected ? selectIcon : unselectIcon"></image>
		      <view class="unit-left-tit">{{ group.date }} </view>
		    </view>
		    <view class="unit-right">
		      共{{ group.list.length }}个
		    </view>
		  </view>
        </view>
		
		

        <!-- 单词列表 -->
        <view @tap="toggleWordSelection(word,group)"
          v-for="(word, itemIndex) in group.list"
          :key="itemIndex"
          class="word-item"
        >
			
			<image class="left-icon" :src="word.selected ? selectIcon : unselectIcon"></image>
			<view class="word-content">
			    <view class="word-text">{{ word.content }}</view>
			    <view class="word-translation">翻译：{{ word.translation }}</view>
			</view>
			
			
        </view>
		
		
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref ,onMounted} from 'vue';

import accountRequest from "@/api/account"
import selectIcon from '@/assets/icons/select_icon.svg';
  import unselectIcon from '@/assets/icons/unselect_icon.svg';
  
//生词本 数租
	const notebookList = ref([])


// 初始化时
      onMounted(() => {
        collectsGetnotebook()
      })

const collectsGetnotebook = async () => {

	try {
		let requestParams = {
			page: 1,
			page_size: 1000,
			type:"NEW_WORD",
		}
		accountRequest.collectsGet(requestParams).then((data) => {
			notebookList.value = data.data.list.reduce((acc, item) => {
				const date = item.create_time.split(' ')[0]; // 提取年月日部分
				if (!acc[date]) {
					acc[date] = {
						date: date,
						selected: false, // 分组是否选中
						list: []
					};
				}
				item.selected = false; // 每个对象是否选中
				acc[date].list.push(item);
				return acc;
				}, {});
		});
		} catch (error) {
			console.error('获取生词本失败:', error);
			uni.showToast({
				title: '获取生词本列表失败',
				icon: 'none'
			});
		}
}



// 切换整个单元的选中状态
  const toggleUnitSelection = (group) => {
	  // 取反单元的选中状态
	  group.selected = !group.selected; 
	  // 遍历单元下的所有单词，将它们的选中状态设置为和单元选中状态一致
	  group.list.forEach(word => {
		  word.selected = group.selected;
	  });
  }
  
 //单个点击
 const toggleWordSelection = (word,group) => {
	 word.selected = !word.selected

	 if (!word.selected) {
	   group.selected = false
	 } else {
	   // 遍历单元下的所有单词，将它们的选中状态设置为和单元选中状态一致
	   var num=0;
	   group.list.forEach(word => {
		   if (word.selected) {
			 num++;
		   }
	   });
	   if (num == group.list.length) {
		 group.selected = true
	   } else {
		 group.selected = false
	   }
	 }
           
 
 }


</script>

<style lang="scss">
page {
  height: 100%;
  background-color: #f5f5f5;
}

 /* #ifdef H5 */
.container {
  display: flex;
  flex-direction: column;
  // height: 100vh;
   height: calc(100vh - 180rpx);
  // background-color: red;
}
  /* #endif */
   /* #ifdef MP-WEIXIN */
   
   .container {
     display: flex;
     flex-direction: column;
     height: 100vh;
     // background-color: red;
   }
  
  /* #endif */
  
// .nav-bar {
//   height: 88rpx;
//   background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
//   color: #2c3e50;
//   font-size: 36rpx;
//   font-weight: 600;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   flex-shrink: 0;
// }

.scroll-content {
  flex: 1;
  // padding: 20rpx;
}

.word-group {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.05);
}

.group-header {
  padding-top: 24rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #f9f9f9;
  border-bottom: 2rpx solid #eee;
  border-radius: 16rpx 16rpx 0 0;
}

.word-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 2rpx solid #eee;

  &:last-child {
    border-bottom: none;
  }
}

.checkbox {
  margin-right: 24rpx;
  .iconfont {
    font-size: 40rpx;
    &.icon-unchecked {
      color: #ccc;
    }
    &.icon-checked {
      color: #4CAF50;
    }
  }
}

.word-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.word {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.translation {
  font-size: 28rpx;
  color: #666;
}


.unit-title {
    font-size: 36rpx;
    font-weight: bold;
    margin-bottom: 20rpx;
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
      font-size: 35rpx;
      width: 50%;
      text-align: right;
      padding-right: 20rpx;
      font-weight: 300;
    }
  }

.left-icon {
      width: 60rpx;
      height: 60rpx;
      margin-right: 20rpx;
  }
  
  .word-content {
    // display: flex;
    // justify-content: space-between;
    // align-items: center;
    // margin-bottom: 20rpx;
    margin-left: 40rpx;
  }
  
  .word-text {
    font-size: 32rpx;
    font-weight: bold;
  }
  
.word-translation {
    color: #666;
    margin-bottom: 20rpx;
    font-size: 28rpx;
  }
  
</style>