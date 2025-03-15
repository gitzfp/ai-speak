<template>
    <view>
        <view class="lesson" v-if="lessonData.detail">
            <view class="lesson-header">
                <image :src="lessonData.detail.pic" mode="aspectFit" class="lesson-image" />
                <text class="title">{{ lessonData.detail.title }}</text>
                <text class="subtitle">{{ lessonData.detail.sub_title }}</text>
            </view>

            <view class="lesson-sections">
                <!-- Vocabulary Section -->
                <view class="vocabulary-section">
                    <text class="section-title">核心表达</text>
                    <view class="vocabulary-list">
                        <view v-for="point in lessonData.detail.points" :key="point.word" class="vocabulary-item">
                            <view class="vocabulary-content">
                                <text class="word">{{ point.word }}</text>
                                <text class="meaning">{{ point.meaning }}</text>
                            </view>
                            <button @click="playAudio(point.audio)" class="audio-btn">播放</button>
                        </view>
                    </view>
                </view>

                <!-- Exercises Section -->
                <view class="exercise-section">
                    <view v-if="!isExerciseCompleted">
                        <text class="section-title">练习闯关</text>
                        <view class="exercise-item" v-if="currentExercise">
                            <view class="exercise-question">
                                <text class="question-number">{{ currentIndex + 1 }}.</text>
                                <text class="question-text">{{ currentExercise.title }}</text>
                            </view>
                            <view class="exercise-options">
                                <view v-for="option in currentExercise.options" :key="option.text" 
                                    class="option" 
                                    :class="{
                                        'selected': selectedAnswer === option.text,
                                        'error': feedbackMessage && selectedAnswer === option.text && option.is_correct !== '1'
                                    }"
                                    @click="selectAnswer(option)">
                                    <text class="option-text">{{ option.text }}</text>
                                    <button @click.stop="playAudio(option.audio)" class="audio-btn">播放</button>
                                </view>
                            </view>
                            <button class="submit-btn" @click="submitAnswer" :disabled="!selectedAnswer">
                                提交
                            </button>
                            <text v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</text>
                        </view>
                    </view>
                    
                    <!-- 完成所有练习后显示实战演练按钮 -->
                    <view v-if="isExerciseCompleted" class="practice-section">
                        <view class="completion-message">
                            <text>🎉 恭喜完成所有练习！</text>
                        </view>
                        <button class="practice-btn" @click="goToTopics">
                            开始实战演练
                        </button>
                    </view>
                </view>
            </view>
        </view>
        <view v-else class="loading-state">
            <text v-if="error">{{ error }}</text>
            <text v-else>加载中...</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import textbookRequest from '@/api/textbook'
import topicRequest from "@/api/topic";
const lessonData = ref({
    detail: {
        title: '',
        sub_title: '',
        points: [],
        lesson_id: ''
    },
    exercise_list: []
})
const loading = ref(false)
const error = ref('')
const currentIndex = ref(0)
const selectedAnswer = ref('')
const feedbackMessage = ref('')

const currentExercise = computed(() => {
    console.log('exercise_list:', lessonData.value.exercise_list)
    return lessonData.value.exercise_list?.[currentIndex.value] || null
})

const selectAnswer = (option: any) => {
    selectedAnswer.value = option.text
    console.log('Selected answer:', selectedAnswer.value)
}

const submitAnswer = () => {
    if (!currentExercise.value) {
        console.error('No current exercise available')
        return
    }

    console.log('Current Exercise:', currentExercise.value)
    
    const correctOption = currentExercise.value.options?.find(o => o.is_correct === '1')
    if (!correctOption) {
        console.error('No correct option found')
        return
    }

    if (selectedAnswer.value === correctOption.text) {
        feedbackMessage.value = '回答正确！正在进入下一题...'
        setTimeout(() => {
            feedbackMessage.value = ''
            nextExercise()
        }, 2000)
    } else {
        feedbackMessage.value = '回答错误，请再试一次！'
    }
}

const nextExercise = () => {
    selectedAnswer.value = ''
    feedbackMessage.value = ''
    if (currentIndex.value < lessonData.value.exercise_list.length - 1) {
        currentIndex.value++
    } else {
        // 所有练习完成
        currentIndex.value = lessonData.value.exercise_list.length
        feedbackMessage.value = '🎉 恭喜完成所有练习！'
    }
}

const loadLesson = async (lessonId: string) => {
    loading.value = true
    error.value = ''
    
    try {
        const res = await textbookRequest.getLessonDetail(lessonId)
        console.log('API Response:', res)
        
        if (res.data) {
            lessonData.value = {
                ...res.data,
                exercise_list: res.data.exercise_list || []
            }
            console.log('Loaded lesson data:', lessonData.value)
        } else {
            throw new Error('No data returned from server')
        }
    } catch (e: any) {
        error.value = e.message || '加载失败，请重试'
        console.error('Load lesson error:', e)
    } finally {
        loading.value = false
    }
}

onLoad((options: any) => {
    console.log('Lesson onLoad options:', options)
    if (options.lessonId) {
        loadLesson(options.lessonId)
    } else {
        error.value = '缺少必要参数'
    }
})

const playAudio = (src: string) => {
    const innerAudioContext = uni.createInnerAudioContext()
    innerAudioContext.src = src
    innerAudioContext.autoplay = true
    
    innerAudioContext.onError((res) => {
        console.error('音频播放失败：', res)
        uni.showToast({
            title: '音频播放失败',
            icon: 'none'
        })
    })
}

// 添加练习完成状态
const isExerciseCompleted = computed(() => {
    return currentIndex.value >= lessonData.value.exercise_list.length
})

// 跳转到聊天页面
const goToTopics = async() => {
    // 先尝试获取现有会话
    const lessonId = lessonData.value?.detail?.lesson_id
    const existingSession = await topicRequest.getSessionByLessonId({ lesson_id: lessonId })
    let sessionId = existingSession.data?.id
    if(sessionId){
        uni.navigateTo({
            url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&topicOrLessonId=${lessonId}`
        }); 
        return
    }
    topicRequest.createLessonSession({ lesson_id: lessonData.value?.detail?.lesson_id }).then((res) => {
        console.log(res.data.id)
        uni.navigateTo({
            url: `/pages/chat/index?sessionId=${res.data.id}&type=LESSON&topicOrLessonId=${lessonId}`
        });
    }); 
    
}

</script>

<style lang="scss" scoped>
.lesson {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.lesson-header {
    text-align: center;
    margin-bottom: 30px;
}

.lesson-image {
    width: '100%';
    height: 50px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
    display: block;
}

.subtitle {
    font-size: 16px;
    color: #666;
    display: block;
}

.lesson-sections {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.section-title {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
    display: block;
}

.vocabulary-list,
.exercise-list,
.task-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.vocabulary-item {
    display: flex;
    flex-direction: row;
}
.exercise-item {
    .submit-btn {
        margin-top: 20px;
        background: #007AFF;
        color: white;
        border-radius: 8px;
        border: none;
        height: 40px;
    }
}
.task-item {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
}

.vocabulary-content,
.task-content {
    flex: 1;
}

.word,
.task-info {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 5px;
    display: block;
}

.meaning,
.task-example {
    font-size: 14px;
    color: #666;
    display: block;
}

.exercise-question {
    margin-bottom: 10px;
    width: 100%;
}

.question-number {
    font-weight: bold;
    margin-right: 8px;
}

.exercise-options {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 10px;
    .option {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 10px;
        background: white;
        border-radius: 4px;
        border: 1px solid #eee;
        .option-text{
            flex: 1;
        }
    }
    .option.correct {
        border-color: #4caf50;
        background: #e8f5e9;
    }
}



.audio-btn {
    font-size: 14px;
    background-color: #007AFF;
    color: white;
    border-radius: 4px;
    border: none;
    width: 80px;
    height: 30px;
}

.loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 16px;
    color: #666;
}

.option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15rpx;
    border: 1rpx solid #ccc;
    border-radius: 8rpx;
    margin-bottom: 10rpx;
    background-color: white; /* 默认背景色 */
    transition: background-color 0.3s; /* 添加过渡效果 */
}

.option.selected {
    background-color: rgba(76, 175, 80, 0.2); /* 选中时的浅绿色背景 */
    border-color: #4CAF50; /* 选中时的边框颜色 */
}

.option.error {
    border-color: rgba(244, 67, 54, 0.5); /* 错误时的浅红色边框 */
}

.feedback {
    color: #2CCFBF;
    font-size: 28rpx;
    margin-top: 20rpx;
    text-align: center;
}

.submit-btn {
    background: #2CCFBF;
    color: white;
    border-radius: 10rpx;
    width: 100%;
    text-align: center;
    margin-top: 20rpx;
}

.practice-section {
    padding: 30rpx;
    text-align: center;
}

.completion-message {
    font-size: 32rpx;
    color: #2CCFBF;
    margin-bottom: 30rpx;
}

.practice-btn {
    background: #2CCFBF;
    color: white;
    border-radius: 10rpx;
    padding: 20rpx 40rpx;
    font-size: 32rpx;
    border: none;
    box-shadow: 0 4rpx 12rpx rgba(44, 207, 191, 0.2);
    transition: all 0.3s;
}

.practice-btn:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 6rpx rgba(44, 207, 191, 0.2);
}
</style>
