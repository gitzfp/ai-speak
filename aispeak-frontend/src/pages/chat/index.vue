<template>
  <view class="chat-box">
    <CommonHeader
      background-color="#fff"
      :leftIcon="true"
      :back-fn="handleBackPage"
      title="聊天"
    >
      <template v-slot:content>
        <view class="ellipsis">{{ session.name }}</view>
      </template>
    </CommonHeader>

    <!-- 聊天内容 -->
    <view class="chat-container">
      <template v-for="(message, _index) in messages" :key="message.id">
        <view class="message-content-item">
          <message-content
            :auto-hint="messages.auto_text_shadow"
            :auto-play="accountSetting.auto_playing_voice"
            :auto-pronunciation="accountSetting.auto_pronunciation"
            :message="message"
            ref="messageListRef"
          ></message-content>
        </view>
      </template>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="!session.completed" class="chat-bottom-container">
      <!-- 键盘输入 -->
      <view
        v-if="!inputTypeVoice"
        class="input-bottom-container"
        :style="'bottom:' + inputBottom + 'px;'"
      >
        <view @tap="handleSwitchInputType" class="voice-icon-box">
          <image
            class="voice-icon"
            src="https://dingguagua.fun/static/icon_voice_fixed.png"
          ></image>
        </view>
        <view class="input-box">
          <input
            class="textarea"
            @focus="inputFocus"
            confirm-type="send"
            @confirm="handleSendText"
            style="padding-left: 30rpx"
            v-model="inputText"
            @input="handleInput"
            placeholder="在这里输入文字"
          />
        </view>
        <view
          @tap="handleSendText"
          class="send-icon-box"
          :class="{ active: inputHasText }"
        >
          <image
            class="send-icon"
            src="https://dingguagua.fun/static/icon_send.png"
          >
          </image>
        </view>
      </view>

      <view v-if="inputTypeVoice">
        <!-- 提示 -->
        <prompt :sessionId="session.id" v-if="menuSwitchDown"></prompt>

        <!-- 语音输入 -->
        <view class="speech-box">
          <SpeechRecognition
            language="en-US"
            @success="handleSuccess"
          />
        </view>
      </view>
    </view>
    <!-- 显示查看老师点评按钮 -->
    <view class="finish-buttons" v-if="session.completed">
      <button class="practice-again" @tap="handlePracticeAgain">
        再次练习
      </button>
      <button class="feedback-button" @tap="completeTopic">查看评分</button>
    </view>

    <!-- 悬浮按钮 -->
    <view class="floating-button" @tap="handleShowModal">
      <image
        src="https://dingguagua.fun/static/img/note.png"
        mode="aspectFit"
      />
    </view>

    <!-- 模态框 -->
    <uni-popup ref="popup" type="bottom">
      <view class="modal-content">
        <view class="clip"></view>
        <view class="modal-body">
          <view class="section">
            <text class="section-title">请通过口语对话完成以下目标：</text>
            <view class="section-content">
              <view
                v-for="(target, index) in session.task_targets"
                :key="index"
                class="target-item"
              >
                <text class="star">⭐</text>
                <view class="target-text">
                  <text class="text-cn">{{ target.info_cn }}</text>
                  <text class="text-en">{{ target.info_en }}</text>
                  <view class="audio-icon" @tap="playAudio(target.info_en)">
                    <image
                      src="https://dingguagua.fun/static/icon_audio.png"
                      mode="aspectFit"
                    ></image>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-ok" @tap="popup.close()">知道了</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import CommonHeader from "@/components/CommonHeader.vue"
import MessageContent from "./components/MessageContent.vue"
import Prompt from "./components/Prompt.vue"
import SpeechRecognition from '@/components/SpeechRecognition/SpeechRecognition.vue';

import {
  ref,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  getCurrentInstance,
} from "vue"
import { onLoad, onShow } from "@dcloudio/uni-app"
import chatRequest from "@/api/chat"
import accountRequest from "@/api/account"
import topicRequest from "@/api/topic"
import type {
  Message,
  MessagePage,
  Session,
  AccountSettings,
} from "@/models/models"

const session = ref<Session>({
  id: undefined,
  type: undefined,
  messages: { total: 0, list: [] } as MessagePage,
  name: "",
  completed: 0,
})
const topicOrLessonId = ref("")
const messages = ref<Message[]>([])
const inputTypeVoice = ref(true)
const inputText = ref("")
const menuSwitchDown = ref(true)
const inputBottom = ref(0)
const messageListRef = ref([])
const accountSetting = ref<AccountSettings>({
  auto_playing_voice: 0,
  auto_text_shadow: 0,
  auto_pronunciation: 0,
  playing_voice_speed: "1.0",
  speech_role_name_label: "",
  speech_role_name: "",
  target_language: "",
})

const $bus: any = getCurrentInstance()?.appContext.config.globalProperties.$bus
const popup = ref<any>(null)


const handleSuccess = (result: { text: string; audioUrl: string }) => {
  console.log('最终识别结果:', result.text);
  console.log('录音文件地址:', result.audioUrl);
  // 这里可以添加发送消息的逻辑
  sendMessage(result.text, result.audioUrl);
};

const inputFocus = (e: any) => {
  inputBottom.value = e.detail.height
}

// 是否已经输入文本
const inputHasText = computed(() => {
  return !!(inputText.value && inputText.value.trim())
})

const sendMessageHandler = (info: any) => {
  if (!info.text) {
    sendSpeech(info.fileName)
  } else {
    sendMessage(info.text, info.fileName)
  }
}


onLoad(async (option: any) => {
  if (option.type === "LESSON") {
    session.value.type = "LESSON"
  }else{
    session.value.type = "TOPIC"
  }
  topicOrLessonId.value = option.topicOrLessonId
  initData(option.sessionId, option.sessionName)
  uni.setNavigationBarTitle({
    title: "AI-Speak",
  })
  console.log("Onload", option)
  $bus.on("SendMessage", sendMessageHandler)
})

onMounted(() => {})

onBeforeUnmount(() => {
  $bus.off("SendMessage", sendMessageHandler)
})

onShow(() => {
  // 获取用户配置
  accountRequest.getSettings().then((data) => {
    accountSetting.value = data.data
  })
})

/**
 * 如果用户输入回车，则发送消息
 */
const handleInput = (event: any) => {
  console.log(event)
  if (event.keyCode === 13) {
    handleSendText()
  }
}

/**
 * 发送文本
 */
const handleSendText = () => {
  if (!inputHasText.value) {
    return
  }
  const inputTextValue = inputText.value
  inputText.value = ""
  sendMessage(inputTextValue)
}

/**
 * 对提示、翻译的功能进行隐藏\显示的切换
 */
const handleSwitchMenu = () => {
  uni.navigateTo({
    url: `/pages/chat/settings?sessionId=${session.value.id}`,
  })
}

/**
 * 发送语音消息
 */
const sendSpeech = (fileName: string) => {
  const ownertTimestamp = new Date().getTime()
  const ownMessage: any = {
    id: ownertTimestamp,
    content: null,
    owner: true,
    file_name: fileName,
    role: "USER",
    auto_hint: false,
    auto_play: false,
  }
  messages.value.push(ownMessage)

  scrollToBottom()

  chatRequest
    .transformText({ file_name: fileName, sessionId: session.value.id })
    .then((data) => {
      messages.value = messages.value.filter(
        (item) => (item.id as any) !== ownertTimestamp
      )
      let text = data.data
      if (!text || text.trim() === "") {
        uni.showToast({
          title: "语音转文本失败，请稍后再试.",
          icon: "none",
        })
        return
      }
      sendMessage(text, fileName)
    })
}

/**
 * 发送文字消息
 * @param message 消息内容
 * @param fileName 如果是语音发送, 则传入文件名
 */
const sendMessage = (message?: string, fileName?: string) => {
  console.log("send file name")
  const ownertTimestamp = new Date().getTime()
  const ownMessage: any = {
    id: ownertTimestamp,
    session_id: session.value.id,
    content: message,
    owner: true,
    file_name: fileName,
    role: "USER",
    auto_hint: false,
    auto_play: false,
    auto_pronunciation: false,
  }
  messages.value.push(ownMessage)
  // 防止跟前面的timestamp一样
  const timestamp = new Date().getTime() + 1
  const aiMessage: any = {
    id: timestamp,
    session_id: session.value.id,
    content: null,
    owner: false,
    file_name: null,
    role: "ASSISTANT",
    auto_hint: false,
    auto_play: false,
    auto_pronunciation: false,
    achieved_target: false, // Add achieved_target property
  }
  messages.value.push(aiMessage)
  scrollToBottom()
  chatRequest
    .sessionChatInvoke({
      sessionId: session.value.id,
      message: message,
      file_name: fileName,
    })
    .then((data) => {
      data = data.data
      session.value.completed = data?.completed

      // Check for achieved targets and mark messages accordingly
      if (data?.achieved_targets) {
        console.log(message ==
            data.achieved_targets[data.achieved_targets?.length - 1]?.user_say, "相等Achieved targets:", data.achieved_targets[data.achieved_targets.length - 1]?.user_say, message)
        if (
          data.achieved_targets?.length > 0 &&
          message ==
            data.achieved_targets[data.achieved_targets.length - 1].user_say
        ) {
          ownMessage.achieved_target = true
        }
      }

      messages.value = messages.value.filter(
        (item) =>
          (item.id as any) !== timestamp && (item.id as any) !== ownertTimestamp
      )

      ownMessage.id = data?.send_message_id
      messages.value.push({
        ...ownMessage,
      })

      messages.value.push({
        ...aiMessage,
        id: data.id,
        content: data.data,
        auto_hint: accountSetting.value.auto_text_shadow == 1,
        auto_play: accountSetting.value.auto_playing_voice == 1,
      })
      // AI消息自动播放与模糊
      nextTick(() => {
        scrollToBottom()
      })
    })
    .catch((e) => {
      // 为用户提示错误show toast
      uni.showToast({
        title: "发送失败..",
        icon: "none",
      })
      console.error(e)
      messages.value.pop()
      messages.value.pop()
    })
}

// 切换输入方式
const handleSwitchInputType = () => {
  inputTypeVoice.value = !inputTypeVoice.value
}

/**
 * 滚动到最底部
 */
const scrollToBottom = () => {
  // 获取scroll-view实例
  if (messages.value.length === 0) {
    return
  }
  // h5页面直接最原始的API
  nextTick(() => {
    uni.pageScrollTo({
      scrollTop: 10000,
      duration: 100,
    })
  })
}

/**
 * 初始化聊天数据
 * @param sessionId
 */
const initData = (sessionId: string, sessionName: string) => {
  chatRequest.sessionDetailsGet({ sessionId }).then((res: any) => {
    session.value = res.data
    session.value.name = sessionName
    session.value.completed = res.data.completed
    session.value.task_targets = res.data.task_targets
    messages.value = []
    console.log("会话信息...session...", res)
    // 如果没有任何历史消息，则请求后台生成第一条消息
    if (session.value.messages.total === 0) {
      const timestamp = new Date().getTime()
      const aiMessage: any = {
        id: timestamp,
        session_id: session.value.id,
        content: null,
        owner: false,
        file_name: null,
        role: "ASSISTANT",
        auto_hint: false,
        auto_play: false,
        auto_pronunciation: false,
      }
      messages.value.push(aiMessage)
      if (session.value?.task_targets) {
        const formattedTargets = session.value.task_targets.map((target) => ({
          id: target.id || "",
          info_cn: target.info_cn || "",
          info_en: target.info_en || "",
        }))

        chatRequest
          .sessionInitGreeting(sessionId, formattedTargets)
          .then((res: any) => {
            messages.value.pop()
            session.value.messages.list.push(res.data)
            messages.value.push({
              id: res.data.id,
              session_id: res.data.session_id,
              content: res.data.content,
              role: res.data.role,
              owner: res.data.role === "USER",
              auto_hint: accountSetting.value.auto_text_shadow == 1,
              auto_play: accountSetting.value.auto_playing_voice == 1,
              auto_pronunciation: false,
              pronunciation: null,
              achieved_target: false,
            })

            nextTick(() => {
              scrollToBottom()
            })
          })
          .catch((error) => {
            console.error("初始化对话失败:", error)
            uni.showToast({
              title: "初始化对话失败",
              icon: "none",
            })
          })
        return
      }
    }

    session.value.messages.list.forEach((item) => {
      messages.value.push({
        id: item.id,
        session_id: item.session_id,
        content: item.content,
        role: item.role,
        owner: item.role === "USER",
        file_name: item.file_name,
        auto_hint: false,
        auto_play: false,
        auto_pronunciation: false,
        pronunciation: item.pronunciation,
      })
    })
    scrollToBottom()
  })
}

/**
 * 回到主页面
 */
const handleBackPage = () => {
  $bus.emit("autostopAudio")
  // 如果是话题的话，提示用户是否结束些次话题
  if (session.value.type === "TOPIC" || session.value.type === "LESSON") {
    uni.showModal({
      title: "是否结束话题",
      content: "是否结束并且评分话题",
      success: (res) => {
        if (res.confirm) {
          completeTopic()
        } else if (res.cancel) {
          uni.navigateBack()
        }
      },
    })
  } else {
    uni.navigateBack()
  }
}

const completeTopic = () => {
  topicRequest.completeTopic({ session_id: session.value.id }).then((res) => {
    uni.navigateTo({
      url: `/pages/topic/completion?sessionId=${session.value.id}&redirectType=index`,
    })
  })
}
const handlePracticeAgain = () => {
  if(session.value.type === "TOPIC"){
    topicRequest.createTopicSession({ topic_id: topicOrLessonId.value }).then((res) => {
      initData(res.data.id, res.data.name)
    })
  }else{
    console.log("lesson_id", topicOrLessonId.value, session.value.task_targets)
    topicRequest.createLessonSession({ lesson_id: topicOrLessonId.value, sentences: session.value.task_targets}).then((res) => {
      initData(res.data.id, res.data.name)
    })
  }
}


/**
 * 显示模态框
 */
const handleShowModal = () => {
  popup.value.open()
}
</script>

<style lang="less" scoped>
.avatar {
  width: 28rpx;
  height: 28rpx;
}
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 30rpx;
}
.chat-box {
  background-color: #f7f7f7; /* Set background color */
  display: flex;
  flex-direction: column;
  flex: 1;
}

.chat-container {
  width: 90%;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
  box-sizing: border-box;
  padding-bottom: 400rpx;

  .message-content-item {
    margin-top: 40rpx;
  }
}

.chat-bottom-container {
  background-color: #fff;
  box-sizing: border-box;
  width: 100%;
  position: fixed;
  margin: 0 auto;
  bottom: 0;
  padding-bottom: calc(env(safe-area-inset-bottom) / 2);

  .input-bottom-container {
    width: 100%;
    height: 155rpx;
    box-sizing: border-box;
    padding: 50rpx 24rpx;
    display: flex;
    gap: 28rpx;
    align-items: center;
    box-shadow: 0rpx -2rpx 4rpx 0rpx #c4c4c4;

    .voice-icon-box {
      .voice-icon {
        width: 36rpx;
        height: 48rpx;
      }
    }

    .send-icon-box {
      width: 80rpx;
      height: 80rpx;
      background-color: #d3d3d3;
      border-radius: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      &.active {
        background-color: #6236ff;
      }

      .send-icon {
        width: 32rpx;
        height: 32rpx;
      }
    }

    .input-box {
      flex: 1;
      height: 80rpx;

      .textarea {
        background-color: rgba(241, 241, 243, 1);
        box-sizing: border-box;
        border-radius: 40px;
        height: 100%;
      }
    }
  }

  .speech-box {
    padding-top: 32rpx;
  }

  .recorder-box {
    .keybord-icon,
    .input-type-switch-btn {
      width: 96rpx;
      height: 96rpx;

      &.up {
        transform: rotate(180deg);
      }
    }
  }
}

.finish-buttons {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  background-color: #fff;
  box-sizing: border-box;
  width: 100%;
  position: fixed;
  margin: 0 auto;
  bottom: 0;
  padding-bottom: calc(env(safe-area-inset-bottom) / 2);
  .practice-again {
    background: #fff;
    color: #4caf50;
    border: none;
    padding: 15rpx 60rpx;
    margin: 30rpx 10rpx 50rpx 10rpx;
    font-size: 34rpx;
  }
  .feedback-button {
    background: #4caf50;
    color: #fff;
    border: none;
    padding: 15rpx 60rpx;
    margin: 30rpx 10rpx 50rpx 10rpx;
    font-size: 34rpx;
  }
}

.floating-button {
  position: fixed;
  right: 16px;
  bottom: 100px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 128, 255, 0.2);
  z-index: 99;

  image {
    width: 56px;
    height: 56px;
    border-radius: 28px;
  }
}

.modal-content {
  background-color: #fff;
  border-radius: 32rpx 32rpx 0 0;
  position: relative;
  max-height: 80vh; /* 限制最大高度 */
  overflow: hidden; /* 防止内容溢出 */
  display: flex;
  flex-direction: column;
}

.clip {
  width: 60rpx;
  height: 8rpx;
  background: #e5e6eb;
  border-radius: 4rpx;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 24rpx;
}

.modal-body {
  padding: 60rpx 32rpx 32rpx;
  flex: 1;
  overflow-y: auto; /* 允许内容滚动 */
}

.section {
  margin-bottom: 40rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 16rpx;
  display: block;
}

.section-content {
  font-size: 28rpx;
  color: #4e5969;
  line-height: 1.6;
}

.target-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
  background: #f7f8fa;
  border-radius: 12rpx;
  padding: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.star {
  color: #ffb400;
  font-size: 32rpx;
  margin-right: 16rpx;
  line-height: 1.4;
}

.target-text {
  flex: 1;
}

.text-cn {
  display: block;
  color: #1d2129;
  font-size: 28rpx;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.text-en {
  display: block;
  color: #86909c;
  font-size: 24rpx;
  line-height: 1.4;
}

.audio-icon {
  width: 40rpx;
  height: 40rpx;
  margin-left: 12rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  image {
    width: 100%;
    height: 100%;
  }
}

.modal-footer {
  padding: 32rpx;
  border-top: 2rpx solid #e5e6eb;
}

.btn-ok {
  background: #165dff;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 32rpx;
  font-weight: 500;
}
</style>
