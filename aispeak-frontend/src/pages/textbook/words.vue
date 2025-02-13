<template>
  <view class="words-container">
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
    <view class="word-list">
      <view class="word-item" v-for="word in words" :key="word.word_id">
        <view class="word-content">
          <view class="word-text">{{ word.word }}</view>
          <AudioPlayer 
            :file-name="word.sound_path"
            :direction="'left'"
          />
        </view>
        <view class="word-translation">翻译：{{ word.chinese }}</view>
        <view class="word-image">
          <image :src="word.image_path" :alt="word.word" mode="aspectFill"></image>
        </view>
        <view class="word-details">
          <text class="details-link" @tap="showDetails(word)">详情 ></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import textbook from '@/api/textbook'
import AudioPlayer from '@/components/AudioPlayer.vue'

    const words = ref([])
    const units = ref([])
    const currentLessonId = ref('')
    const currentBookId = ref('') // 添加 currentBookId

    const switchUnit = (lessonId) => {
      currentLessonId.value = lessonId
      // 从现有数据中筛选单词，不需要重新请求
      words.value = allWords.value.filter(
        word => String(word.lesson_id) === String(lessonId)
      )
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
          
          // 显示当前单元的单词
          const targetLessonId = lessonId || uniqueLessonIds[0]
          currentLessonId.value = targetLessonId
          words.value = response.data.words.filter(
            word => String(word.lesson_id) === String(targetLessonId)
          )
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
      const { bookId, lessonId } = options
      if (bookId) {
        currentBookId.value = bookId
        currentLessonId.value = lessonId
        fetchWords(bookId, lessonId)
      }
    })

    const showDetails = (word) => {
      uni.navigateTo({
        url: `/pages/word-details?word=${word}`
      })
    }


</script>

<style>
.words-container {
  padding: 20rpx;
}

.unit-header {
  text-align: center;
  margin-bottom: 20rpx;
}

.unit-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.download-tip {
  color: #666;
  font-size: 24rpx;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.word-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.word-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
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
</style>