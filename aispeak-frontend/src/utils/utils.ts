import __config from "@/config/env";
const baseUrl = __config.basePath;

function arrayBufferToBase64(buffer: any) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return uni.arrayBufferToBase64 ? uni.arrayBufferToBase64(buffer) : window.btoa(binary);
}

const base64ToArrayBuffer = (base64: any) => {
  const binaryString = atob(base64); // 解码 Base64
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer; // 返回 ArrayBuffer
};

const MAX_RETRIES = 10005;

const uploadFileToOSS = async (ossKey: string, fileData: any, retries = MAX_RETRIES) => {
  try {
    console.log('开始上传文件, ossKey:', ossKey);

    // 如果是 JSON 数据，直接上传内容
    if (ossKey.endsWith('.json')) {
      const { data } = await uni.request({
        url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          oss_key: ossKey,
          content: fileData
        }
      });
      console.log('JSON 数据上传成功:', data);
      return data;
    }

    // 如果是图片或音频文件，需要先下载
    if (typeof fileData === 'string' && (fileData.startsWith('http://') || fileData.startsWith('https://'))) {
      const tempFilePath = await new Promise((resolve, reject) => {
        uni.downloadFile({
          url: fileData,
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.tempFilePath);
            } else {
              reject(new Error('下载文件失败'));
            }
          },
          fail: reject
        });
      });
      fileData = tempFilePath;
      const { data } = await uni.uploadFile({
        url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
        filePath: fileData,
        name: 'file',
      });
      console.log('文件上传成功:', data);
      return typeof data === 'string' ? JSON.parse(data) : data;
    }

    // 上传二进制文件
    return uploadBinaryData(ossKey, fileData);
  } catch (error) {
    if (retries > 0) {
      console.warn(`上传失败，剩余重试次数: ${retries - 1}`, error);
      return uploadFileToOSS(ossKey, fileData, retries - 1);
    } else {
      console.error('文件上传失败，重试次数已用完:', error);
      return null;
    }
  }
};

const uploadBinaryData = async (ossKey: string, compressedData: any) => {
  try {
    // 将 compressedData 转换为 ArrayBuffer
    const arrayBuffer = compressedData instanceof ArrayBuffer
      ? compressedData
      : await compressedData.arrayBuffer();

    // 如果是微信环境，将 ArrayBuffer 转换为 Base64
    if (isWechat()) {
      const base64Data = arrayBufferToBase64(arrayBuffer);
      const { data } = await uni.request({
        url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
        method: "POST",
        header: {
          "Content-Type": "application/json"
        },
        data: {
          oss_key: ossKey,
          content: base64Data
        }
      });
      console.log("微信环境上传成功:", data);
      return data;
    } else {
      // 非微信环境，直接上传 ArrayBuffer
      const formData = new FormData();
      const blob = new Blob([arrayBuffer], { type: "application/zip" });
      formData.append("file", blob, "book.zip");
      formData.append("oss_key", ossKey);

      const response = await fetch(`${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      console.log("非微信环境上传成功:", data);
      return data;
    }
  } catch (error) {
    console.error("上传失败:", error);
    throw error;
  }
};

const processAudioToWAV = async (
  int8Data: Int8Array,
  userId: string,
  refObj: { id?: string; word_id?: string }
): Promise<string> => {
  const WAV_HEADER_SIZE = 44;
  const buffer = new ArrayBuffer(WAV_HEADER_SIZE + int8Data.length);
  const view = new DataView(buffer);
  
  // 写入WAV头
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + int8Data.length, true); 
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // 子块大小
  view.setUint16(20, 1, true); // PCM格式
  view.setUint16(22, 1, true); // 单声道
  view.setUint32(24, 16000, true); // 采样率
  view.setUint32(28, 32000, true); // 字节率 (16000*2)
  view.setUint16(32, 2, true); // 块对齐
  view.setUint16(34, 16, true); // 位深
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, int8Data.length, true); // 数据大小

  const wavData = new Uint8Array(buffer);
  wavData.set(int8Data, WAV_HEADER_SIZE);
  const blob = new Blob([wavData], {type: 'audio/wav'});

  const now = new Date();
  const timeString = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  const ossKey = `recordings/${userId}/${timeString}_${refObj.id || refObj.word_id}.wav`;
  
  await uploadFileToOSS(ossKey, blob);
  const url = await getFileFromOSS(ossKey, false);
  
  return url
};


const isWechat = () => {
  try {
    const ua = navigator?.userAgent?.toLowerCase() || '';
    console.log('User Agent:', ua);
    if (!ua) {
      return true
    }
    // 只检测小程序环境
    return /miniprogram/i.test(ua);
  } catch (e) {
    const systemInfo = uni.getDeviceInfo()
    console.log('System Info:', systemInfo);
    // 只在小程序和开发者工具中返回 true
    return systemInfo.platform === 'devtools';
  }
}

/**
 * 获取底部安全区域高度
 * @returns {number} 安全区域高度(rpx单位)
 */
const getSafeAreaBottom = () => {
  try {
    // 获取系统信息
    const systemInfo = uni.getSystemInfoSync();
    
    // 检测浏览器类型
    const ua = navigator?.userAgent?.toLowerCase() || '';
    const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
    const isChrome = /chrome/.test(ua);
    
    // Safari或Chrome浏览器设置固定值
    if (isSafari || isChrome) {
      return 180; // 返回60rpx
    }
    
    // 如果系统信息中有安全区域数据，则使用系统提供的值
    if (systemInfo.safeAreaInsets && systemInfo.safeAreaInsets.bottom) {
      // 将px转换为rpx (假设屏幕宽度为750rpx标准)
      const rpxRatio = 750 / systemInfo.windowWidth;
      return Math.ceil(systemInfo.safeAreaInsets.bottom * rpxRatio);
    }
    
    // 默认返回0
    return 0;
  } catch (error) {
    console.error('获取安全区域高度失败:', error);
    return 0; // 出错时返回0
  }
};

const getFileFromOSS = async (ossKey: string, isBinary: false) => {
    try {
      const { data }: any = await uni.request({
        url: `${baseUrl}/ali-oss/get-${isBinary ? 'binary-' : ''}file/?oss_key=${ossKey}`,
        method: 'GET',
        header: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (data.code !== 1000) {
        throw new Error(data.message || '获取文件失败');
      }

      if (ossKey.endsWith('.m3u8')) {
        return data?.data?.content;
      }

      if (ossKey.endsWith('.json')) {
        // const jsonContent = JSON.parse(data.data.content);
        return data.data.content;
      } else {
        return data.data.url;
      }
    } catch (error) {
      console.error('获取文件失败:', error);
      return null;
    }
  }

export default {
  isWechat: isWechat,
  removeDecimal: (num: number) => {
    return Math.floor(num);
  },
  getVoiceFileUrl: (fileName: string) => {
    return `${__config.basePath}/voices/${fileName}`;
  },
  uploadBinaryData,
  uploadFileToOSS: uploadFileToOSS,
  getSafeAreaBottom, // 导出新方法
  getFileFromOSS,
  checkFileInOSS: async (ossKey: string) => {
    try {
      // if(isWechat()){
      //   const { data } = await wx.request({
      //     url: `${baseUrl}/ali-oss/check-file/?oss_key=${ossKey}`,
      //     method: 'GET',
      //     enableHttpDNS: true,
      //     httpDNSServiceId: "wxa410372c837a5f26",
      //   });
      //   return data
      // }
      const { data } = await uni.request({
        url: `${baseUrl}/ali-oss/check-file/?oss_key=${ossKey}`,
        method: 'GET'
      });
      return data;
    } catch (error) {
      console.error('检查文件失败:'+ossKey, error);
      return { exists: false };
    }
  },

  replaceUrl: (oldUrl: string) => {
    if (!oldUrl) return oldUrl;
    return oldUrl.replace(/^https?:\/\/[^\/]+/, 'https://books-bct.oss-cn-beijing.aliyuncs.com');
  },
  base64ToArrayBuffer,

  processAudioToWAV,
  
};

