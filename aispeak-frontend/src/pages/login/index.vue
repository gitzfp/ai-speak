<template>
  <view class="container">
    <image
      class="logo"
      src="https://dingguagua.fun/static/logo.png"
    ></image>
    <text class="title"> 欢迎使用AISPeak </text>
    <text class="sub-title"> 智能语言学习助手 </text>

    <!-- 微信登录按钮（微信环境显示） -->
    <button
      v-if="isWeixin"
      class="mp-weixin-login-btn-box"
      open-type="getPhoneNumber"
      @getphonenumber="handleWechatLogin"
    >
      <text class="mp-weixin-login-btn">微信一键登录</text>
    </button>

    <!-- 手机号登录表单 -->
    <view v-if="!isWeixin && !showRegisterForm" class="phone-login-form">
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
      <text class="register-link" @tap="showRegisterForm = true">未有账号，去注册</text>
    </view>

    <!-- 注册表单 -->
    <view v-if="!isWeixin && showRegisterForm" class="register-form">
      <!-- <input
        v-model="registerUsername"
        class="input"
        type="text"
        placeholder="请输入用户名"
      /> -->
      <input
        v-model="registerPhoneNumber"
        class="input"
        type="number"
        placeholder="请输入手机号"
      />
      <input
        v-model="registerPassword"
        class="input"
        type="password"
        placeholder="请输入密码"
      />
      <!-- 年级选择器 -->
      <picker 
        :value="gradeIndex"
        :range="gradeOptions" 
        range-key="grade"
        class="grade-picker"
        @change="handleGradeChange"
      >
        <view class="input picker-text">
          {{ grade.grade || '请选择年级' }}
        </view>
      </picker>
      <button class="register-btn" @tap="handleRegister">注册</button>
      <text class="login-link" @tap="showRegisterForm = false">已有账号？返回登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import accountReqeust from "@/api/account"
import utils from "@/utils/utils"
const X_TOKEN = "x-token"
const USER_ID = 'user_id'
const loginLoading = ref(false)
const isWeixin = ref(false) // 是否为微信环境
const phoneNumber = ref("") // 手机号
const password = ref("") // 密码
const registerPhoneNumber = ref("") // 注册手机号
const registerPassword = ref("") // 注册密码
const showRegisterForm = ref(false)
const grade = ref({grade: '一年级', book_id: '1l1_V2' }) // 年级
const gradeIndex = ref(0) // 年级选择器索引
const registerUsername = ref("") // 注册用户名
const gradeOptions = [{grade: '一年级', book_id: '1l1_V2' }, {grade: '二年级', book_id: '1l3_V2' }, {grade: '三年级', book_id: '1l5_V2' }, {grade: '四年级', book_id: '1l7_V2' }, {grade: '五年级', book_id: '1l9_V2' }, {grade: '六年级', book_id: '1l11_V2' }]

const emit = defineEmits<{
  (e: 'switchbookSuccess', book: any): void  // 根据实际类型替换 any
}>();
onMounted(() => {
  uni.setNavigationBarTitle({
    title: "AISPeak",
  })

  // 判断是否为微信环境
  isWeixin.value = utils.isWechat()
  console.log("isWeixin:", isWeixin.value)

  // 是否有保存登录的token
  let storageToken = uni.getStorageSync(X_TOKEN)
  let userId = uni.getStorageSync(USER_ID)
  if (storageToken && userId) {
    loginSucessByToken(storageToken, userId)
  }
})

/**
 * 微信登录
 */
const handleWechatLogin = (e: any) => {
  if (loginLoading.value) return
  loginLoading.value = true

  // 获取微信登录 code
  uni.login({
    provider: "weixin",
    success: (res) => {
      const code = res.code

      // 调用后端微信登录接口
      accountReqeust
        .wechatLogin({ code })
        .then((data) => {
          loginSuccess(data)
        })
        .finally(() => {
          loginLoading.value = false
        })
    },
    fail: (err) => {
      console.error("微信登录失败", err)
      loginLoading.value = false
    },
  })
}

/**
 * 手机号登录
 */
// 添加手机号验证方法
const validatePhoneNumber = (phone: string): boolean => {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
}

// 修改手机号登录方法
const handlePhoneLogin = () => {
  if (!validatePhoneNumber(phoneNumber.value)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    });
    return;
  }
  console.log("手机号登录")
  if (loginLoading.value) return
  loginLoading.value = true

  // 调用后端手机号登录接口
  accountReqeust
    .phoneLogin({
      phone_number: phoneNumber.value,
      password: password.value,
    })
    .then((data) => {
      loginSuccess(data)
    })
    .finally(() => {
      loginLoading.value = false
    })
}

/**
 * 用户登录请求结果处理
 */
const loginSuccess = (data: any) => {
  if (data.code !== 1000) {
    uni.showToast({
      title: data.message,
      icon: "none",
    })
    return
  }
  let storageToken = data.data.token
  const userId = data.data.user_id
  console.log("登录成功，token:", data.data)
  loginSucessByToken(storageToken, userId)
}

/**
 * 通过用户token加载后续逻辑
 */
const loginSucessByToken = (storageToken: string, userId: string) => {
  
  uni.setStorageSync("x-token", storageToken)
  uni.setStorageSync(USER_ID, userId) 
  uni.switchTab({
    url: "/pages/textbook/index3",
  })
}

/**
 * 注册处理
 */
const handleRegister = () => {
  accountReqeust
    .register({
      user_name: registerUsername.value,
      phone_number: registerPhoneNumber.value,
      password: registerPassword.value,
    })
    .then((data) => {
      if (data.code === 1000) {
        console.log("注册成功", grade)
        const bookSelectionObject = {
          version_type: "外研社（一起）",
          grade: grade.value.grade,
          term: "上册",
          publisher: "全部",
          book_id: "1l5_V2"
        }
      
      uni.setStorage({
        key: 'bookSelectionObject',
        data: bookSelectionObject,
        success: () => {
          console.log('数据已存储');
        emit("switchbookSuccess", grade.value);
        },
        fail: (err) => {
          console.error('存储失败:', err);
        }
      }); 
        loginSuccess(data)
      } else {
        uni.showToast({ 
          title: data.message,
          icon: "none",
        })
      }
    })
}
const handleGradeChange = (e: any) => {
  const index = e.detail.value;
  gradeIndex.value = index;
  grade.value = gradeOptions[index];
  console.log("选择的年级:", grade.value);
}
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
    .register-link {
        margin-top: 20rpx;
        margin-left: 10rpx;
        font-size: 28rpx;
        color: #666
      }
  }

  .register-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .input, .select {
      width: 100%;
      height: 90rpx;
      padding: 0 10rpx;
      border: 1rpx solid #ccc;
      border-radius: 20rpx;
      font-size: 32rpx;
      box-sizing: border-box;
    }

    .picker-text {
      display: flex;
      align-items: center;
    }

    .register-btn {
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
    .login-link {
        margin-top: 20rpx;
        margin-left: 10rpx;
        font-size: 28rpx;
        color: #666
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
.toggle-register-btn {
  margin-top: 20rpx;
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
</style>

.auth-switch {
  display: flex;
  gap: 40rpx;
  margin: 40rpx 0;

  .switch-btn {
    padding: 0 40rpx;
    height: 60rpx;
    line-height: 60rpx;
    background: #f5f5f5;
    border-radius: 30rpx;
    font-size: 28rpx;
    color: #666;
    
    &.active {
      background: #5456eb;
      color: white;
    }
  }
}

.register-form {
  margin-top: 40rpx;
}


.register-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;

  .register-content {
    width: 80%;
    background: #fff;
    border-radius: 20rpx;
    padding: 40rpx;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;

      .modal-title {
        font-size: 32rpx;
        font-weight: bold;
      }

      .close-btn {
        font-size: 40rpx;
        color: #999;
        padding: 10rpx;
      }
    }

    .grade-picker {
      width: 100%;
      height: 90rpx;
      border: 1rpx solid #ccc;
      border-radius: 20rpx;
      margin-bottom: 20rpx;
      
      .picker-text {
        padding: 20rpx 20rpx;
        font-size: 32rpx;
        color: #333;
      }
    }
  }
}
