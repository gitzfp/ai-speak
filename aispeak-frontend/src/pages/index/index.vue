<template>
  <view class="container">
    <Topics class="topic-component" />
    <view class="content">
      <view class="role-grid">
        <view
          v-for="m in roles"
          :key="m.id"
          class="role-card"
          @tap="handleRoleSelect(m)"
        >
          <view class="role-image-wrapper">
            <image v-if="m.avatar" :src="m.avatar" class="role-image" />
            <image
              v-else-if="m.gender == '2'"
              src="http://qiniu.prejade.com/1597936949107363840/AISPeak/images/en-US_Guy.png"
              class="role-image"
            />
            <image
              v-else
              src="https://qiniu.prejade.com/1597936949107363840/AISPeak/images/en-US_JennyNeural.png"
              class="role-image"
            />
          </view>
          <view class="role-info">
            <text class="role-name">{{ m.local_name }}</text>
            <view class="style-tags">
              <view
                v-for="style in m.styles.slice(0, 2)"
                :key="style.value"
                class="style-tag"
              >
                {{ style.label || "默认" }}
              </view>
              <view v-if="m.styles.length > 2" class="style-tag">
                +{{ m.styles.length - 2 }}
              </view>
            </view>
            <view class="preview-audio">
              <AudioPlayer
                :content="audioPlayerContent"
                :speechRoleName="m.short_name"
                :speechRoleStyle="m.styles[0]?.value"
                class="audio-player"
              />
            </view>
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

const handleRoleSelect = (role: any) => {
  // 设置选中的角色
  selectIndex.value = roles.value.findIndex((m) => m.id === role.id);
  // 直接调用 goChat
  goChat();
};
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
</style>
