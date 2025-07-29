<script setup lang="ts">
import { ref } from "vue";
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import accountRequest from "@/api/account";

const xToken = ref<string | null>(null);
const StatusBar = ref<number>(0);
const CustomBar = ref<number>(0);
const Custom = ref<any>(null);

// 检查隐私协议是否已同意
const checkPrivacyAgreement = () => {
  const privacyAgreed = uni.getStorageSync('privacy_agreed');
  const privacyAgreedTime = uni.getStorageSync('privacy_agreed_time');
  
  // 检查是否需要重新同意（比如一年后）
  if (privacyAgreed && privacyAgreedTime) {
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - privacyAgreedTime < oneYear) {
      return true;
    }
  }
  return false;
};

onLaunch(async () => {
  // 检查隐私协议
  const hasAgreedPrivacy = checkPrivacyAgreement();
  
  // 如果没有同意隐私协议，存储标记，在登录页面显示弹窗
  if (!hasAgreedPrivacy) {
    uni.setStorageSync('need_show_privacy', true);
  }
  
  // 检查是否有token
  const token = uni.getStorageSync('x-token');
  if (token) {
    // 如果有token但没有用户信息，则获取用户信息
    const nickname = uni.getStorageSync('nickname');
    const userName = uni.getStorageSync('userName');
    
    if (!nickname && !userName) {
      try {
        const userInfo = await accountRequest.accountInfoGet();
        if (userInfo.code === 1000 && userInfo.data) {
          // 存储用户信息
          uni.setStorageSync('nickname', userInfo.data.nickname || userInfo.data.user_name || '');
          uni.setStorageSync('userName', userInfo.data.user_name || '');
          uni.setStorageSync('userRole', userInfo.data.user_role || 'student');
          console.log('App启动时获取并存储用户信息:', userInfo.data);
        }
      } catch (error) {
        console.error('App启动时获取用户信息失败:', error);
      }
    }
  }
});

onShow(() => {});
onHide(() => {});
</script>

<style>
/* Ensure content isn't hidden behind the footer */
page {
  padding-bottom: 40px;
}
</style>
