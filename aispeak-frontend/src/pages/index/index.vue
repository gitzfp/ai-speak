<template>
  <view class="container">
    <!-- 移除原有 Topics 组件 -->
    <CommonHeader>
      <template v-slot:content>
        <text>场景</text>
      </template>
    </CommonHeader>
    <view class="content">
      <!-- 新增分类导航 -->
      <scroll-view class="category-scroll" scroll-x>
        <view 
          v-for="group in groupList" 
          :key="group.id"
          class="category-item"
          :class="{ active: currentGroup?.id === group.id }"
          @click="switchGroup(group)"
        >
          {{ group.name }}
        </view>
      </scroll-view>

      <!-- 修改为主题列表 -->
      <LoadingRound v-if="loading" />
      <view v-if="currentGroup" class="topic-list">
        <view 
          v-for="topic in currentGroup.topics" 
          :key="topic.id"
          class="topic-item"
          @click="selectTopic(topic)"
        >
          <image class="topic-image" :src="topic.image_url" mode="aspectFill" />
          <view class="topic-info">
            <text class="topic-name">{{ topic.name }}</text>
            <text class="topic-desc">{{ topic.description }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import Topics from "./components/Topics.vue";
import { ref, nextTick } from "vue";
import chatRequest from "@/api/chat";
import accountRequest from "@/api/account";
import sysRequest from "@/api/sys";
import { onLoad, onShow } from "@dcloudio/uni-app";
import topicRequest from "@/api/topic"

const roles = ref<any[]>([]);
const selectIndex = ref<number>(0);
const audioPlayerContent = ref<string>("");
const language = ref<string>("");
// 如果为init，则不能显示返回按钮
const redirectType = ref(null);
const swiperCurrent = ref<number>(0);

onLoad((options: any) => {
  uni.setNavigationBarTitle({
    title: "AISPeak",
  });
  if (options.redirectType) {
    redirectType.value = options.redirectType;
  }
});

onShow(() => {
  // 获取用户设置的语言，之后加载相应数据
  accountRequest.getSettings().then((data) => {
    language.value = data.data.target_language || "en-US";
    initAudioPlayerContent();
    initRoles();
  });
});

const initAudioPlayerContent = () => {
  chatRequest
    .languageExampleGet({
      language: language.value,
    })
    .then((data) => {
      audioPlayerContent.value = data.data;
    });
};
const initRoles = () => {
  sysRequest
    .getRoles({
      locale: language.value,
    })
    .then((data) => {
      roles.value = data.data;
      // 获取用户设置的speech_role_name，如果有，则设置为当前选中的角色
      accountRequest.getSettings().then((data) => {
        let speechRoleName = data.data.speech_role_name;
        if (speechRoleName) {
          let index = roles.value.findIndex(
            (m) => m.short_name == speechRoleName
          );
          if (index > -1) {
            selectIndex.value = index;
          }
        }
        nextTick(() => {
          swiperCurrent.value = selectIndex.value;
        });
      });
    });
};

const goChat = () => {
  uni.navigateTo({
    url: "/pages/textbook/index",
  });
  return;
};


const groupList = ref<any[]>([])
const currentGroup = ref<any>(null)
const loading = ref(false)

onShow(() => {
  accountRequest.getSettings().then((data) => {
    language.value = data.data.target_language || "en-US";
    loadGroupData();  // 改为加载分组数据
  });
});

const loadGroupData = () => {
  loading.value = true
  topicRequest.getTopicData({}).then(res => {
    groupList.value = res.data
    if (groupList.value.length > 0) {
      currentGroup.value = groupList.value[0]
    }
    loading.value = false
  })
}

const switchGroup = (group: any) => {
  currentGroup.value = group
}

const selectTopic = (topic: any) => {
  uni.navigateTo({
    url: `/pages/topic/index?topicId=${topic.id}`
  })
}
</script>

<style scoped lang="less">
@import url("@/less/global.less");

.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 20rpx;
}

.role-card {
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.role-image-wrapper {
  width: 100%;
  padding-top: 100%;
  position: relative;
  overflow: hidden;
  background: #f0f2f5;
}

.role-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.role-info {
  padding: 20rpx;
}

.role-name {
  font-size: 32rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.style-tag {
  background: #f0f2f5;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666666;
}

.preview-audio {
  margin-top: 16rpx;
}

.audio-player {
  width: 100%;
}

.topic-component {
  margin-bottom: 20rpx;
}

// 修改分类导航样式
.category-scroll {
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;  // Firefox
  -ms-overflow-style: none;  // IE/Edge
  -webkit-overflow-scrolling: touch;
  padding: 45rpx 32rpx 45rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.03);
  margin-bottom: 24rpx;
  white-space: nowrap;  // 确保内容不换行
  
  .category-item {
    display: inline-block;
    padding: 16rpx 36rpx;
    margin-right: 32rpx;
    border-radius: 40rpx;
    background: #f5f5f5;
    color: #666;
    font-size: 28rpx;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:last-child {
      margin-right: 20rpx;  // 最后一项保留一些右边距
    }
    
    &:active {
      transform: scale(0.95);
    }
    
    &.active {
      background: linear-gradient(135deg, #4B7EFE, #6A93FF);
      color: white;
      box-shadow: 0 4rpx 12rpx rgba(75, 126, 254, 0.3);
    }
  }
}

// 优化主题列表样式
.topic-list {
  padding: 0 20rpx;
  
  .topic-item {
    display: flex;
    padding: 32rpx;
    margin-bottom: 32rpx;
    background: white;
    border-radius: 24rpx;
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);
    }
    
    .topic-image {
      width: 220rpx;
      height: 220rpx;
      border-radius: 16rpx;
      margin-right: 32rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
    }
    
    .topic-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      
      .topic-name {
        font-size: 34rpx;
        font-weight: bold;
        margin-bottom: 16rpx;
        color: #333;
      }
      
      .topic-desc {
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

// 全局隐藏滚动条
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

// 添加加载状态样式
.loading-round {
  margin: 60rpx auto;
}
</style>
