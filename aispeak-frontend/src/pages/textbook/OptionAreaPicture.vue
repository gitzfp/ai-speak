<template>
  <view class="optionArea">
    <view @tap="handleItemClick(optionWords[0])" class="option-item">
      <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[0].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[0].word }}</view>
	  
	  <image
        :src="optionWords[0].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
    <view @tap="handleItemClick(optionWords[1])" class="option-item">
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
    <view @tap="handleItemClick(optionWords[2])" class="option-item">
	  <view v-if="planWordmode==0" class="option-item-tit">{{ optionWords[2].paraphrase }}</view>
	  <view v-else class="option-item-tit">{{ optionWords[2].word }}</view>
      <image
        :src="optionWords[2].image_path"
        mode="widthFix"
        class="phonics-img"
      />
    </view>
    <view @tap="handleItemClick(optionWords[3])" class="option-item">
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
import { defineProps, defineEmits,onMounted} from 'vue';

// 定义 props
const props = defineProps({
  optionWords: {
    type: Array,
    required: true,
  },
  planWordmode: {
	  type:Number
  }
});

// 定义 emits
const emit = defineEmits(['item-click']);

onMounted(() => {
	console.log("props.optionWords")
    console.log(props.optionWords)
  })

// 处理选项点击事件
const handleItemClick = (optionWord) => {
  emit('item-click', optionWord);
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
</style>