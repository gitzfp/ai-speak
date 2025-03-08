<template>
  <view class="container">
    <view class="header">
      <text class="title">艾宾浩斯记忆法</text>
    </view>
    <view class="content">
      <view class="section">
        <text class="section-title">什么是艾宾浩斯记忆法？</text>
        <text class="section-text">
          艾宾浩斯记忆法（Ebbinghaus Forgetting Curve）是基于德国心理学家赫尔曼·艾宾浩斯（Hermann Ebbinghaus）的研究提出的。艾宾浩斯通过实验发现，人类在学习新信息后，记忆的遗忘速度是很快的，尤其是在学习后的最初几天内。为了对抗这种遗忘，他提出了间隔重复（Spaced Repetition）的概念，即在适当的时间间隔内重复复习所学内容，以加强记忆。
        </text>
      </view>
      <view class="section">
        <text class="section-title">艾宾浩斯记忆法的核心原理</text>
        <view class="subsection">
          <text class="subsection-title">遗忘曲线</text>
          <text class="subsection-text">
            学习后，记忆会随着时间的推移逐渐减弱，尤其是在最初的24小时内遗忘速度最快。
          </text>
        </view>
        <view class="subsection">
          <text class="subsection-title">间隔重复</text>
          <text class="subsection-text">
            通过在不同时间间隔内重复复习，可以有效减缓遗忘速度，巩固记忆。
          </text>
        </view>
        <view class="subsection">
          <text class="subsection-title">主动回忆</text>
          <text class="subsection-text">
            通过主动回忆（如测试、默写）来强化记忆，而不是被动地重新阅读。
          </text>
        </view>
      </view>
      <view class="section">
        <text class="section-title">结合艾宾浩斯记忆法</text>
        <view class="subsection">
          <text class="subsection-title">我们英语单词复习规则</text>
          <view class="rule">
            <text class="rule-text">答错 0~1 次：非常熟悉，30 天后复习</text>
          </view>
          <view class="rule">
            <text class="rule-text">答错 2~4 次：基本熟悉，15 天后复习</text>
          </view>
          <view class="rule">
            <text class="rule-text">答错 5~7 次：基本不熟，7 天后复习</text>
          </view>
          <view class="rule">
            <text class="rule-text">答错 8 次以上：完全不熟，3 天后复习</text>
          </view>
        </view>
      </view>
	  
	  
	 
	  
    </view>
  </view>
</template>

<script setup>
// Vue3 的 setup 语法
</script>

<style scoped>
.container {
  padding: 40rpx;
  /* background-color: #f5f5f5; */
}

.header {
  margin-bottom: 40rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.content {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 16rpx;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.section-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.subsection {
  margin-bottom: 30rpx;
}

.subsection-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subsection-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.rule {
  margin-bottom: 20rpx;
}

.rule-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}
</style>