<template>
  <view class="container">
    <view v-if="loading" class="loading">
      <uni-load-more status="loading" />
    </view>

    <view v-else-if="error" class="error">
      <text>{{ error }}</text>
      <button @tap="retryLoad">重试</button>
    </view>

    <view v-else class="course-list">
      <view
        v-for="course in courses"
        :key="course.id"
        class="course-item"
        @tap="handleCourseSelect(course)"
      >
        <image :src="course.pic" class="course-image" mode="aspectFill" />
        <view class="course-info">
          <view class="course-header">
            <text class="title">{{ course.title }}</text>
            <text class="sub-title">{{ course.sub_title }}</text>
          </view>

          <view class="course-description">
            <text class="desc-cn">{{ course.info_cn }}</text>
            <text class="desc-en">{{ course.info_en }}</text>
          </view>

          <view class="course-footer">
            <view class="steps">
              <text class="step-count">{{ course.steps?.length }} Steps</text>
            </view>
            <view v-if="course.max_score" class="score">
              <text class="score-text">Score: {{ course.max_score }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import textbookRequest from "@/api/textbook";
import topicRequest from "@/api/topic"; // Adjust the import path as necessary

const courses = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
const currentOptions = ref<any>(null);

const loadCourses = async (options: any) => {
  loading.value = true;
  error.value = "";

  try {
    const { textbookId, categoryId } = options;
    if (!textbookId || !categoryId) {
      throw new Error("Missing textbookId or categoryId");
    }

    const res = await textbookRequest.getCourseDetail(textbookId, categoryId);
    console.log("Course detail response:", res.data.courses);
    if (res.data) {
      courses.value = res.data.courses;
    } else {
      throw new Error("No data returned from server");
    }
  } catch (e: any) {
    error.value = e.message || "加载失败，请重试";
    console.error("Load courses error:", e);
  } finally {
    loading.value = false;
  }
};

const retryLoad = () => {
  if (currentOptions.value) {
    loadCourses(currentOptions.value);
  }
};

const handleCourseSelect = async (course: any) => {
    try {
        const lessonId = course.id
        const existingSession = await topicRequest.getSessionByLessonId({ lesson_id: lessonId })
        
        // 检查响应数据是否存在
        if (existingSession?.data) {
          const {id : sessionId, completed, name} = existingSession.data
          // 确保sessionId存在且completed为0
          if (sessionId) {
              uni.navigateTo({
                  url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}&sessionName=${name}`
              }); 
              return
          }
        }
        // 原有的创建新会话逻辑
        topicRequest.createLessonSession({ lesson_id: lessonId }).then((res) => {
            uni.navigateTo({
                url: `/pages/chat/index?sessionId=${res.data.id}&type=LESSON&lessonId=${lessonId}&sessionName=${res.data.name}`
            });
        }); 
    } catch (error) {
        console.error('Error in handleCourseSelect:', error)
        uni.showToast({
            title: '获取课程会话失败',
            icon: 'none'
        })
    }
};

// Register the onLoad lifecycle hook directly
onLoad((options) => {
  console.log("onLoad called with options:", options);
  currentOptions.value = options;
  loadCourses(options);
});
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
  min-height: 100vh;
  background: #f5f5f5;
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;

  button {
    margin-top: 20rpx;
    padding: 10rpx 30rpx;
    background: #6236ff;
    color: #fff;
    border-radius: 8rpx;
  }
}

.course-list {
  .course-item {
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    overflow: hidden;

    .course-image {
      width: 100%;
      height: 320rpx;
    }

    .course-info {
      padding: 20rpx;

      .course-header {
        .title {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }

        .sub-title {
          font-size: 24rpx;
          color: #666;
          margin-left: 16rpx;
        }
      }

      .course-description {
        margin-top: 16rpx;

        .desc-cn {
          font-size: 28rpx;
          color: #333;
        }

        .desc-en {
          font-size: 24rpx;
          color: #666;
          margin-top: 8rpx;
          display: block;
        }
      }

      .course-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16rpx;

        .steps {
          font-size: 24rpx;
          color: #666;
        }

        .score {
          font-size: 24rpx;
          color: #6236ff;
        }
      }
    }
  }
}
</style>
