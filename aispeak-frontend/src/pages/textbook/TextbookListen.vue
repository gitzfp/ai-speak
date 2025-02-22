<template>
  <view class="textbook-listen">
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="error" class="error">{{ error }}</view>
    <template v-else>
      <!-- 单元导航 -->
      <scroll-view scroll-x class="unit-nav">
        <view 
          v-for="unit in textbookData" 
          :key="unit.id"
          class="unit-tab"
          :class="{ active: unit.id === currentUnitId }"
          @tap="switchUnit(unit)"
        >
          {{ unit.title }}
        </view>
      </scroll-view>

      <!-- 当前单元内容 -->
      <scroll-view 
        class="content-scroll" 
        scroll-y
        :show-scrollbar="false"
      >
        <view v-if="currentUnit">
          <!-- 子课程内容 -->
          <view v-if="currentUnit.sub_lessons && currentUnit.sub_lessons.length > 0">
            <view 
              v-for="lesson in currentUnit.sub_lessons" 
              :key="lesson.id" 
              class="lesson-section"
            >
              <view class="lesson-title">{{ lesson.title }}</view>
              <sentence-list :sentences="lesson.sentences" />
            </view>
          </view>
          <!-- 直接显示句子列表 -->
          <view v-else>
            <sentence-list :sentences="currentUnit.sentences" />
          </view>
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SentenceList from './components/SentenceList.vue'
import textbookApi from '@/api/textbook'
import { onLoad } from "@dcloudio/uni-app"

const textbookData = ref([])
const loading = ref(false)
const error = ref('')
const bookId = ref('')
const currentUnitId = ref('')

// 计算当前显示的单元
const currentUnit = computed(() => 
  textbookData.value.find(unit => unit.id === currentUnitId.value)
)

// 切换单元
const switchUnit = (unit) => {
  currentUnitId.value = unit.id
}

onLoad((options: any) => {
  console.log('TextbookListen onLoad options:', options)
  const { book_id } = options
  bookId.value = book_id
  fetchTextbookData()
})

const fetchTextbookData = async () => {
  if (!bookId.value) {
    error.value = '未找到教材ID'
    return
  }

  loading.value = true
  try {
    const response = await textbookApi.getTextbookLessonsAndSentences(bookId.value)
    if (response.code === 1000) {
      textbookData.value = response.data
      // 默认选中第一个单元
      if (response.data.length > 0) {
        currentUnitId.value = response.data[0].id
      }
    } else {
      error.value = response.message || '获取数据失败'
    }
  } catch (err) {
    error.value = '获取数据失败'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.textbook-listen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.unit-nav {
  white-space: nowrap;
  padding: 20rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
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

.content-scroll {
  flex: 1;
  height: 0;
}

.lesson-section {
  margin-bottom: 30rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.lesson-title {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 20rpx;
  border-left: 8rpx solid #4CAF50;
}

.loading, .error {
  text-align: center;
  padding: 40rpx;
  color: #666;
}

.error {
  color: #ff4444;
}
</style>