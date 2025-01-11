<template>
  <view class="container">
    <!-- 教材信息 -->
    <view class="textbook-info">
      <image :src="textbook.pic" class="textbook-image" mode="aspectFill" />
      <view class="textbook-detail">
        <text class="title">{{ textbook.title }}</text>
      </view>
    </view>

    <!-- 分类列表 -->
    <view class="category-list">
      <view
        v-for="category in textbook.category"
        :key="category.category_id"
        class="category-item"
        @tap="handleCategorySelect(category.sub_list?.length > 0 ? category.sub_list[0] : {})"
      >
        <text class="category-title">{{ category.title }}</text>
        <view class="sub-categories">
          <view
            v-for="sub in category.sub_list"
            :key="sub.category_id"
            class="sub-category"
            @tap.stop="handleSubCategorySelect(sub)"
          >
            {{ sub.title }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import textbookRequest from "@/api/textbook";

const textbook = ref<any>({});

onMounted(async () => {
  const res = await textbookRequest.getTextbookDetail("2");
  textbook.value = res.data;
});

const handleCategorySelect = (category: any) => {
  const url = `/pages/textbook/courses?textbookId=${category.textbook_id}&categoryId=${category.category_id}`;
  console.log("Navigating to:", url);
  uni.navigateTo({
    url,
  });
};

const handleSubCategorySelect = (subCategory: any) => {
  const url = `/pages/textbook/courses?textbookId=${subCategory.textbook_id}&categoryId=${subCategory.category_id}`;
  console.log("Navigating to:", url);
  uni.navigateTo({
    url,
  });
};
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
}

.textbook-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;

  .textbook-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    margin-right: 20rpx;
  }

  .textbook-detail {
    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .sub-title {
      font-size: 24rpx;
      color: #666;
      margin-top: 8rpx;
    }
  }
}

.category-list {
  .category-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;

    .category-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
    }

    .sub-categories {
      display: flex;
      flex-wrap: wrap;
      margin-top: 16rpx;
      gap: 16rpx;

      .sub-category {
        font-size: 24rpx;
        color: #666;
        padding: 8rpx 20rpx;
        background: #f5f5f5;
        border-radius: 20rpx;
      }
    }
  }
}
</style>
