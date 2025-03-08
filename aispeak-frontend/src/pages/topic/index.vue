<template>
  <view class="container">
    <CommonHeader
      :leftIcon="true"
      :back-fn="handleBackPage"
      backgroundColor="#F5F5FE"
    >
      <template v-slot:content>
        <text></text>
      </template>
    </CommonHeader>
    <view class="content">
      <LoadingRound v-if="loading" />
      <view v-if="topicDetail" class="topic-content">
        <view class="profile-box">
          <image
            class="profile-image"
            :src="topicDetail.image_url"
            mode="aspectFill"
          />
          <view class="name-box">
            {{ topicDetail.name }}
            <image
              @click="goTopicHistory"
              class="icon"
              src="http://114.116.224.128:8097/static/img/icons/history-records.png"
            />
          </view>
        </view>

        <view class="description-box">
          <view class="description-title"> 场景 </view>
          <view class="description-content">
            {{ topicDetail.description }}
          </view>
        </view>

        <!-- 核心短语 -->
        <phrase :topic-id="topicDetail.id"/> 

      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-box">
      <view class="atk-btn-box start-btn-box" @click="goChat">
        <text class="atk-btn">开始</text>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import CommonHeader from "@/components/CommonHeader.vue"
import LoadingRound from "@/components/LoadingRound.vue"
import topicRequest from "@/api/topic"
import { ref } from "vue"
import phrase from '@/pages/topic/phrase.vue'
import { onLoad } from "@dcloudio/uni-app"

const loading = ref(false)
const topicDetail = ref(null)

onLoad((props) => {
  uni.setNavigationBarTitle({
    title: "AISPeak",
  })

  getTopicDetail(props.topicId)
})

const getTopicDetail = (topicId: string) => {
  loading.value = true
  topicRequest.getTopicDetail(topicId).then((res) => {
    loading.value = false
    topicDetail.value = res.data
  })
}

const goTopicHistory = () => {
  uni.navigateTo({
    url: `/pages/topic/history?topicId=${topicDetail.value.id}`,
  })
}


const getTopicSentences = async (topic_id: string) => {
    const topicSentenceList : any = []
    await topicRequest.getPhrase({topic_id}).then((data) => {
        data?.data?.forEach((item: any)=>{
            topicSentenceList.push({
                content: item.phrase,
                translation: item.phrase_translation,
                message_id: null,
                type: "SENTENCE",
            })        
            return topicSentenceList
        })
    });
    return topicSentenceList.map((sentence: {content: string, translation: string}) => ({
          info_en: sentence.content,
          info_cn: sentence.translation,
        }))
}
/**
 * 先生成session信息，再根据session进行跳转
 */
const goChat = async () => {
  const sentences = await getTopicSentences(topicDetail.value.id)
  console.log(sentences)
  const data = await topicRequest.getSessionByTopicId({
    topic_id: topicDetail.value.id,
  }).then((res) => {
    return res.data
  })
  if(data?.id){
    uni.navigateTo({
      url: `/pages/chat/index?sessionId=${data.id}`,
    })
    return
  }
  topicRequest.createSession({ topic_id: topicDetail.value.id }).then((res) => {
    uni.navigateTo({
      url: `/pages/chat/index?sessionId=${res.data.id}`,
    })
  })
}

const handleBackPage = () => {
  uni.switchTab({
    url: "/pages/index/index",
  })
}
</script>
<style scoped lang="less">
@import url("@/less/global.less");

.container {
  background-color: #f5f5fe;
}

.content {
  margin: 0 32rpx;
  padding-bottom: 330rpx;

  .topic-content {
    .profile-box {
      display: flex;
      flex-direction: column;
      align-items: center;

      .profile-image {
        width: 320rpx;
        height: 320rpx;
        border-radius: 30rpx;
      }

      .name-box {
        font-size: 36rpx;
        font-weight: bold;
        margin-top: 32rpx;
        display: flex;
        align-items: center;
        
        .icon {
          width: 48rpx;
          height: 48rpx;
          margin-left: 16rpx;
        }
      }
    }

    .description-box {
      margin-top: 32rpx;

      .description-title {
        font-size: 36rpx;
        color: #333;
        font-weight: 500;
      }

      .description-content {
        margin-top: 16rpx;
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
      }
    }

    .main-target-box {
      margin-top: 64rpx;

      .main-target-title {
        font-size: 36rpx;
        color: #333;
        font-weight: 500;
      }

      .main-target-content {
        margin-top: 16rpx;
        padding: 16rpx 32rpx;
        font-size: 28rpx;
        color: #666;
        background-color: #fff;
        border-radius: 24rpx;

        .main-target-item {
          padding: 20rpx 0;
          border-bottom: 1px solid #f1f1f3;
          
          &:last-child {
            border-bottom: none;
          }
          
          .target-description {
            color: #333;
            font-weight: 500;
            margin-bottom: 8rpx;
            line-height: 1.5;
            word-break: break-word;
          }
          
          .target-translation {
            color: #666;
            font-size: 26rpx;
            line-height: 1.5;
            word-break: break-word;
          }
        }
      }
    }
  }
}

.bottom-box {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  background-color: #f5f5fe;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .start-btn-box {
    margin-top: 24rpx;
  }
}
</style>
