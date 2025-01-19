import __config from "@/config/env";

export default {
  isWechat: () => {
    try {
      const ua = navigator?.userAgent?.toLowerCase() || '';
      console.log('User Agent:', ua);
      if(!ua) {
        return true
      }
      return /micromessenger/i.test(ua) || /miniprogram/i.test(ua);
    } catch (e) {
        const systemInfo =  uni.getDeviceInfo()
        console.log('System Info:', systemInfo);
        return systemInfo.platform === 'wechat' || 
             systemInfo.platform === 'devtools';
    }
  },
  removeDecimal: (num: number) => {
    return Math.floor(num);
  },
  getVoiceFileUrl: (fileName: string) => {
    return `${__config.basePath}/voices/${fileName}`;
  },
};
