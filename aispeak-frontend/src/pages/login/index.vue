<template>
  <view class="container">
    <image class="logo" src="https://api.zfpai.top/static/logo.png"></image>
    <text class="title">
      欢迎使用AISPeak
    </text>
    <text class="sub-title">
      智能语言学习助手
    </text>

    <!-- 微信登录按钮（微信环境显示） -->
    <button
      v-if="isWeixin"
      class="mp-weixin-login-btn-box"
      open-type="getPhoneNumber"
      @getphonenumber="handleWechatLogin"
    >
      <text class="mp-weixin-login-btn">微信一键登录</text>
    </button>

    <!-- 手机号登录表单（非微信环境显示） -->
    <view v-else class="phone-login-form">
      <input
        v-model="phoneNumber"
        class="input"
        type="number"
        placeholder="请输入手机号"
      />
      <input
        v-model="password"
        class="input"
        type="password"
        placeholder="请输入密码"
      />
      <button class="login-btn" @tap="handlePhoneLogin">登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import accountReqeust from '@/api/account';
import utils from '@/utils/utils';
const X_TOKEN = 'x-token';
const loginLoading = ref(false);
const isWeixin = ref(false); // 是否为微信环境
const phoneNumber = ref(''); // 手机号
const password = ref(''); // 密码

onMounted(() => {
  uni.setNavigationBarTitle({
    title: 'AISPeak',
  });
 
  // 判断是否为微信环境
  isWeixin.value = utils.isWechat();
  console.log('isWeixin:', isWeixin.value);
 
  // 是否有保存登录的token
  let storageToken = uni.getStorageSync(X_TOKEN);
  if (storageToken) {
    loginSucessByToken(storageToken);
  }
});

/**
 * 微信登录
 */
const handleWechatLogin = (e: any) => {
  if (loginLoading.value) return;
  loginLoading.value = true;

  // 获取微信登录 code
  uni.login({
    provider: 'weixin',
    success: (res) => {
      const code = res.code;

      // 调用后端微信登录接口
      accountReqeust.wechatLogin({ code })
        .then((data) => {
          loginSuccess(data);
        })
        .finally(() => {
          loginLoading.value = false;
        });
    },
    fail: (err) => {
      console.error('微信登录失败', err);
      loginLoading.value = false;
    },
  });
};

/**
 * 手机号登录
 */
const handlePhoneLogin = () => {
  console.log('手机号登录');
  if (loginLoading.value) return;
  loginLoading.value = true;

  // 调用后端手机号登录接口
  accountReqeust.phoneLogin({
    phone_number: phoneNumber.value,
    password: password.value,
  })
    .then((data) => {
      loginSuccess(data);
    })
    .finally(() => {
      loginLoading.value = false;
    });
};

/**
 * 用户登录请求结果处理
 */
const loginSuccess = (data: any) => {
  if (data.code !== 1000) {
    uni.showToast({
      title: data.message,
      icon: 'none',
    });
    return;
  }
  let storageToken = data.data.token;
  loginSucessByToken(storageToken);
};

/**
 * 通过用户token加载后续逻辑
 */
const loginSucessByToken = (storageToken: string) => {
  uni.setStorageSync('x-token', storageToken);
  uni.switchTab({
    url: '/pages/textbook/index',
  });
};
</script>

<style scoped lang="less">
.container {
  padding: 380rpx 48rpx 0 48rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .logo {
    width: 120rpx;
    height: 120rpx;
  }

  .title {
    margin-top: 60rpx;
    width: 430rpx;
    height: 67rpx;
    font-size: 48rpx;
    font-weight: 600;
    color: #000000;
    line-height: 67rpx;
    letter-spacing: 1px;
    text-align: center;
  }

  .sub-title {
    margin-top: 20rpx;
    margin-bottom: 160rpx;
    width: 390rpx;
    height: 45rpx;
    font-size: 32rpx;
    color: #939193;
    line-height: 45rpx;
    letter-spacing: 1px;
    text-align: center;
  }

  .mp-weixin-login-btn-box {
    width: 100%;
    height: 90rpx;
    border-radius: 60rpx;
    background-color: #5456eb;
    display: flex;
    align-items: center;
    justify-content: center;

    .mp-weixin-login-btn {
      color: #fff;
      font-size: 32rpx;
      font-weight: 400;
      height: 45rpx;
      line-height: 45rpx;
    }
  }

  .phone-login-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .input {
      width: 100%;
      height: 90rpx;
      padding: 0 10rpx;
      border: 1rpx solid #ccc;
      border-radius: 20rpx;
      font-size: 32rpx;
      box-sizing: border-box;
    }

    .login-btn {
      width: 100%;
      height: 90rpx;
      border-radius: 20rpx;
      background-color: #5456eb;
      color: #fff;
      font-size: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .visitor-login {
    margin-top: 40rpx;
    height: 45rpx;
    font-size: 32rpx;
    font-weight: 400;
    color: #6236ff;
    line-height: 45rpx;
    letter-spacing: 1px;
  }
}
</style>
