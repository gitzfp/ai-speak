import env from '@/config/env'

class WxShare {
  static async init(options = {}) {
    try {
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
            imgUrl: options.imgUrl,
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