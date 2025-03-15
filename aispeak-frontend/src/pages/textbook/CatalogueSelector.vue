<template>
  <view class="catalogue-selector-popup" v-if="isOpen">
    <view class="popup-overlay" @click="closePopup"></view>
    <view class="popup-content">
      <view class="popup-header">
        <text>教材目录</text>
        <image
          class="close-icon"
          src="@/assets/icons/x_del.svg"
          @click="closePopup"
        />
      </view>
     
        <view class="catalogue-info">
          <image class="book-cover" :src="book.icon_url" />
          <view class="book-details">
            <text>{{ book.grade }} {{ book.term }}</text>
            <text class="change-book">{{ book.book_name }}{{ book.publisher }}</text>
          </view>
        </view>
		<view class="catalogue-list">
			<view 
			v-for="(catalogue, index) in chapters"
			:key="index"
			class="catalogue-item"
			@tap="clickcatalogue(index)"
			>
				<text>{{ catalogue.title }}</text>
				<image
				v-if="catalogue.isExpansion==1"
				class="lock-icon"
				src="@/assets/icons/word_dagou.svg"
				/>
			</view>
		</view>
	</view>
  </view>
</template>

<script setup>
import { ref, defineEmits } from "vue"

const props = defineProps({
  book: {
    type: Object,
    default: () => ({}),
  },
  chapters: {
	  type: Array,
	  default: () => ([]),
  }
  
});

const isOpen = ref(false);

const emit = defineEmits(["selectCatalogue", "closePopup"]);

const openPopup = () => {
  isOpen.value = true;
};

const closePopup = () => {
  isOpen.value = false;
  emit("closePopup");
};

const clickcatalogue = (index) => {
  isOpen.value = false;
  emit("selectCatalogue",index);
};



defineExpose({
  openPopup,
});
</script>

<style scoped lang="less">
.catalogue-selector-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.popup-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.popup-content {
  background-color: #fff;
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
  width: 100%;
  height: 80vh;
  padding: 40rpx;
  animation: slideUp 0.3s ease-out;
  z-index: 1001;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  font-size: 36rpx;
  font-weight: bold;
}

.close-icon {
  width: 40rpx;
  height: 40rpx;
  cursor: pointer;
}

.catalogue-list {
  height: calc(100% - 350rpx);
  overflow-y: auto;
  // background-color: red;
}

.catalogue-info {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.book-cover {
  width: 160rpx;
  height: 220rpx;
  margin-right: 40rpx;
}

.book-details {
  display: flex;
  flex-direction: column;
  font-size: 32rpx;
}

.change-book {
  color: #05c160;
  font-size: 28rpx;
  margin-top: 20rpx;
  cursor: pointer;
}

.catalogue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  font-size: 32rpx;
}

.lock-icon {
  width: 40rpx;
  height: 40rpx;
}

.try-listen {
  color: #05c160;
  font-size: 28rpx;
  cursor: pointer;
}
</style>