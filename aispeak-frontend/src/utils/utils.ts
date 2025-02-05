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
    uploadBinaryData(ossKey, fileData);
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

const isWechat = () => {
  try {
    const ua = navigator?.userAgent?.toLowerCase() || '';
    console.log('User Agent:', ua);
    if (!ua) {
      return true
    }
    return /micromessenger/i.test(ua) || /miniprogram/i.test(ua);
  } catch (e) {
    const systemInfo = uni.getDeviceInfo()
    console.log('System Info:', systemInfo);
    return systemInfo.platform === 'wechat' ||
      systemInfo.platform === 'devtools';
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

  getFileFromOSS: async (ossKey: string, isBinary: false) => {
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
  },
  checkFileInOSS: async (ossKey: string) => {
    try {
      if(isWechat()){
        const { data } = await wx.request({
          url: `${baseUrl}/ali-oss/check-file/?oss_key=${ossKey}`,
          method: 'GET',
          enableHttpDNS: true,
          httpDNSServiceId: "wxa410372c837a5f26",
        });
        return data
      }
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
  base64ToArrayBuffer
};
