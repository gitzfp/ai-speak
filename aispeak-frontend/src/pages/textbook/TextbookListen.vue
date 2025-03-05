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
              v-for="subLesson in currentUnit.sub_lessons"
              :key="subLesson.id"
              class="lesson-section">
              <view class="lesson-title" @tap="toggleSubLesson(subLesson.id)">
                {{ subLesson.title }}
                <span class="toggle-button">{{ expandedSubLessons[subLesson.id] ? '收起' : '展开' }}</span>
              </view>
              <view v-if="expandedSubLessons[subLesson.id]">
                <sentence-list 
                    ref="sentenceListRef"
                    :sentences="subLesson.sentences" 
                    :repeat-after="isRepeatAfter === 'true'"
                    :on-list-end="handleListEnd"
                />
              </view>
            </view>
          </view>
          <!-- 直接显示句子列表 -->
          <view v-else>
            <sentence-list :sentences="currentUnit.sentences" :repeat-after="isRepeatAfter === 'true'"/>
          </view>
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import SentenceList from './components/SentenceList.vue'
import textbookApi from '@/api/textbook'
import { onLoad } from "@dcloudio/uni-app"

const textbookData = ref([])
const loading = ref(false)
const error = ref('')
const bookId = ref('')
const isRepeatAfter = ref('false')
const currentUnitId = ref('')

// 用于存储每个子单元的展开状态
const expandedSubLessons = ref({})

// 计算当前显示的单元
const currentUnit = computed(() => 
  textbookData.value.find(unit => unit.id === currentUnitId.value)
)

// 监听 currentUnit 的变化，默认展开第一个子单元
watch(currentUnit, (newUnit) => {
  if (newUnit && newUnit.sub_lessons && newUnit.sub_lessons.length > 0) {
    expandedSubLessons.value = { [newUnit.sub_lessons[0].id]: true }
  }
})


const sentenceListRef = ref(null)

// Define the handleListEnd function
const handleListEnd = async () => {
  const currentUnit = textbookData.value.find(unit => unit.id === currentUnitId.value)
  if (!currentUnit) return
  // 获取当前展开的子课程索引
  const currentSubLessonIndex = currentUnit.sub_lessons.findIndex(
    sub => expandedSubLessons.value[sub.id]
  )
  // 情况1: 当前单元还有下一个子课程
  if (currentSubLessonIndex < currentUnit.sub_lessons.length - 1) {
    const nextSubLesson = currentUnit.sub_lessons[currentSubLessonIndex + 1]
    toggleSubLesson(nextSubLesson.id)
    await nextTick() // 等待DOM更新
    // 新子课程在数组中的索引 = 原索引 + 1
    const newSubLessonIndex = currentSubLessonIndex + 1
    console.log('newSubLessonIndex:', newSubLessonIndex, sentenceListRef.value)
    if (sentenceListRef.value?.[sentenceListRef.value.length - 1]) {
      sentenceListRef.value[sentenceListRef.value.length - 1].playFirstSentence()
    }
  } else { 
    // 情况2: 切换到下一个单元
    // const currentUnitIndex = textbookData.value.findIndex(unit => unit.id === currentUnitId.value)
    // if (currentUnitIndex < textbookData.value.length - 1) {
    //   const nextUnit = textbookData.value[currentUnitIndex + 1]
    //   switchUnit(nextUnit)
    //   await nextTick() // 等待单元切换渲染完成
    //   // 新单元的第一个子课程
    //   const firstSubLesson = nextUnit.sub_lessons?.[0]
    //   if (firstSubLesson) {
    //     toggleSubLesson(firstSubLesson.id)
    //     await nextTick() // 等待子课程展开
    //     console.log('report firstSubLesson:', sentenceListRef.value[0])
    //     // 新单元的第一个SentenceList实例索引为0
    //     if (sentenceListRef.value?.[0]) {
    //       sentenceListRef.value[0].playFirstSentence()
    //     }
    //   }
    // }
  }
}
// 切换单元
const switchUnit = (unit) => {
  currentUnitId.value = unit.id
}

// 切换子单元的展开状态
const toggleSubLesson = (subLessonId) => {
  // 如果当前子单元已经展开，则收起
  if (expandedSubLessons.value[subLessonId]) {
    expandedSubLessons.value[subLessonId] = false
  } else {
    // 否则，展开当前选择的子单元，并收起其他子单元
    for (const key in expandedSubLessons.value) {
      expandedSubLessons.value[key] = false
    }
    expandedSubLessons.value[subLessonId] = true
  }
}

onLoad((options: any) => {
  console.log('TextbookListen onLoad options:', options)
  const { book_id, repeat_after } = options
  bookId.value = book_id
  isRepeatAfter.value = repeat_after
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
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-button {
  font-size: 28rpx;
  color: #4CAF50;
  background-color: #e0f7fa;
  padding: 5rpx 10rpx;
  border-radius: 12rpx;
  transition: background-color 0.3s;
}

.toggle-button:hover {
  background-color: #b2ebf2;
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