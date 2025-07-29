<template>
  <view class="privacy-page">
    <CommonHeader title="隐私协议" />
    <scroll-view class="privacy-content" scroll-y>
      <view class="content-wrapper">
        <view class="title">用户隐私保护指引</view>
        
        <view class="update-info">
          <text>更新日期：2025年1月29日</text>
          <text>生效日期：2025年1月29日</text>
        </view>

        <view class="section">
          <view class="section-title">开发者信息</view>
          <view class="section-content">
            <view>开发者名称：AISpeak</view>
            <view>联系方式：13928401083@163.com</view>
          </view>
        </view>

        <view class="section">
          <view class="section-title">概述</view>
          <view class="section-content">
            AISpeak（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规的规定，保护您的个人信息及隐私安全。我们制定本《用户隐私保护指引》并特别提示：希望您在使用我们的产品和服务前仔细阅读并理解本隐私政策，以便做出适当的选择。
          </view>
        </view>

        <view class="section">
          <view class="section-title">我们收集的信息</view>
          <view class="section-subtitle">1. 您主动提供的信息</view>
          <view class="section-content">
            <view class="info-item">• 账号信息：当您注册账号时，我们会收集您的手机号码、昵称等信息。我们使用微信提供的手机号快速验证功能时，会在您授权后获取您的手机号码用于账号注册和登录</view>
            <view class="info-item">• 学习信息：您在使用学习功能时产生的学习记录、练习成绩、语音录音等</view>
            <view class="info-item">• 班级信息：当您创建或加入班级时的相关信息</view>
          </view>
          
          <view class="section-subtitle">2. 我们在您使用服务时获取的信息</view>
          <view class="section-content">
            <view class="info-item">• 设备信息：设备型号、操作系统、唯一设备标识符、网络信息等</view>
            <view class="info-item">• 日志信息：使用时长、浏览记录、点击记录等</view>
            <view class="info-item">• 位置信息：仅在您主动开启定位功能时收集</view>
          </view>
          
          <view class="section-subtitle">3. 第三方SDK收集的信息</view>
          <view class="section-content">
            <view class="info-item">• 微信登录SDK：用于实现微信快捷登录功能</view>
            <view class="info-item">• 语音识别SDK：用于实现语音评测功能</view>
          </view>
        </view>

        <view class="section">
          <view class="section-title">信息的使用</view>
          <view class="section-content">
            我们收集您的信息主要用于：
            <view class="info-item">1. 为您提供学习服务，记录学习进度</view>
            <view class="info-item">2. 改进和优化我们的产品和服务</view>
            <view class="info-item">3. 保障账号安全，进行身份验证</view>
            <view class="info-item">4. 推送学习提醒和活动通知（您可以选择关闭）</view>
            <view class="info-item">5. 进行数据统计和分析</view>
          </view>
        </view>

        <view class="section">
          <view class="section-title">信息的存储</view>
          <view class="section-content">
            <view class="info-item">1. 存储地点：您的个人信息将存储在中华人民共和国境内</view>
            <view class="info-item">2. 存储期限：我们会按照法律法规规定的最短期限存储您的信息</view>
            <view class="info-item">3. 信息删除：当您注销账号后，我们将删除或匿名化处理您的个人信息</view>
          </view>
        </view>

        <view class="section">
          <view class="section-title">信息的共享、转让、公开披露</view>
          <view class="section-content">
            <view class="info-item">1. 我们不会向第三方共享、转让您的个人信息，除非：</view>
            <view class="sub-item">• 获得您的明确同意</view>
            <view class="sub-item">• 法律法规要求</view>
            <view class="sub-item">• 保护您或他人的生命财产安全</view>
            
            <view class="info-item">2. 我们不会公开披露您的个人信息，除非：</view>
            <view class="sub-item">• 获得您的明确同意</view>
            <view class="sub-item">• 基于法律法规的要求</view>
          </view>
        </view>

        <view class="section">
          <view class="section-title">您的权利</view>
          <view class="section-content">
            您对您的个人信息享有以下权利：
            <view class="info-item">1. 查询和更正：您可以在个人中心查询和更正您的个人信息</view>
            <view class="info-item">2. 删除：您可以删除您的学习记录等信息</view>
            <view class="info-item">3. 撤回同意：您可以撤回您对个人信息处理的同意</view>
            <view class="info-item">4. 注销账号：您可以申请注销您的账号</view>
          </view>
        </view>

        <view class="section">
          <view class="section-title">未成年人保护</view>
          <view class="section-content">
            我们非常重视对未成年人信息的保护：
            <view class="info-item">1. 若您是未满14周岁的未成年人，请在您的父母或其他监护人的陪同下阅读本政策</view>
            <view class="info-item">2. 我们不会主动直接向未成年人收集其个人信息</view>
            <view class="info-item">3. 对于经监护人同意而收集的未成年人信息，我们只会在法律允许、监护人明确同意的情况下使用</view>
          </view>
        </view>

        <view class="section">
          <view class="section-title">隐私政策的更新</view>
          <view class="section-content">
            我们可能会不定期修改本隐私政策，如有重大变更，我们会通过小程序内通知等方式告知您。
          </view>
        </view>

        <view class="section">
          <view class="section-title">联系我们</view>
          <view class="section-content">
            如您对本隐私政策有任何疑问、意见或建议，请通过以下方式与我们联系：
            <view class="info-item">邮箱：13928401083@163.com</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import CommonHeader from '@/components/CommonHeader.vue'
</script>

<style lang="scss" scoped>
.privacy-page {
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.privacy-content {
  flex: 1;
  width: 100%;
}

.content-wrapper {
  padding: 20rpx 30rpx 40rpx;
  background-color: #fff;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20rpx;
}

.update-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  
  text {
    font-size: 24rpx;
    color: #999;
    line-height: 36rpx;
  }
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.section-subtitle {
  font-size: 28rpx;
  font-weight: 500;
  color: #555;
  margin-top: 20rpx;
  margin-bottom: 15rpx;
}

.section-content {
  font-size: 28rpx;
  color: #666;
  line-height: 44rpx;
}

.info-item {
  margin-bottom: 15rpx;
  padding-left: 20rpx;
}

.sub-item {
  margin-bottom: 10rpx;
  padding-left: 40rpx;
  color: #888;
}
</style>