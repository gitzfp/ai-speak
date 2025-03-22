import env from '@/config/env'

class WxShare {
  static async init(options = {}) {
    try {
      // 新增H5环境处理
      // #ifdef H5
      if (options.h5DirectCopy) {
        try {
          const shareUrl = window.location.href;
          await navigator.clipboard.writeText(shareUrl);
          uni.showToast({ title: '分享链接已拷贝', icon: 'none' });
          return true;
        } catch (e) {
          uni.showToast({ title: '自动复制失败，请手动复制网址', icon: 'none' });
          return false;
        }
      }
      // #endif
      // Get current URL for H5
      let currentUrl = '';
      
      // #ifdef H5
      // If no link provided, get current page URL
      if (!options.link) {
        currentUrl = window.location.href.split('#')[0];
      } else {
        currentUrl = options.link;
      }
      // #endif
      
      // Get token from storage
      let token = uni.getStorageSync('x-token');
      
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再分享',
          success: function (res) {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/index'
              });
            }
          }
        });
        return false;
      }
      
      // Get wx share config
      const response = await uni.request({
        url: `${env.basePath}/wx/share/sign`,
        method: 'GET',
        data: { url: currentUrl },
        header: {
          "X-Token": token,
        },
      });

      if (response.data.success) {
        const config = response.data.data;
        // #ifdef H5
        // 添加默认分享图标
        const defaultImg = `${window.location.origin}/static/logo.png`;
        wx.config({
          debug: env.development,
          appId: config.appId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: [
            'updateAppMessageShareData',
            'updateTimelineShareData',
            'onMenuShareTimeline',
            'onMenuShareAppMessage'
          ]
        });

        wx.ready(() => {
          const shareConfig = {
            title: options.title || 'AI-Speak',
            desc: options.desc || '您的智能语言学习助手',
            link: currentUrl,
            imgUrl: options.imgUrl || defaultImg,  // 修改这行
            success: options.success,
            cancel: options.cancel
          };

          wx.updateAppMessageShareData(shareConfig);
          wx.updateTimelineShareData(shareConfig);
        });
        // #endif

        return true;
      }
      return false;
    } catch (error) {
      console.error('初始化微信分享失败:', error);
      uni.showToast({
        title: '分享初始化失败',
        icon: 'none'
      });
      return false;
    }
  }
}

export default WxShare;