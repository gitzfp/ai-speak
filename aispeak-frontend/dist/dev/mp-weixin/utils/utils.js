"use strict";
const common_vendor = require("../common/vendor.js");
const config_env = require("../config/env.js");
const baseUrl = config_env.__config.basePath;
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return common_vendor.index.arrayBufferToBase64 ? common_vendor.index.arrayBufferToBase64(buffer) : window.btoa(binary);
}
const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
const MAX_RETRIES = 10005;
const uploadFileToOSS = async (ossKey, fileData, retries = MAX_RETRIES) => {
  try {
    console.log("开始上传文件, ossKey:", ossKey);
    if (ossKey.endsWith(".json")) {
      const { data } = await common_vendor.index.request({
        url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
        method: "POST",
        header: {
          "Content-Type": "application/json"
        },
        data: {
          oss_key: ossKey,
          content: fileData
        }
      });
      console.log("JSON 数据上传成功:", data);
      return data;
    }
    if (typeof fileData === "string" && (fileData.startsWith("http://") || fileData.startsWith("https://"))) {
      const tempFilePath = await new Promise((resolve, reject) => {
        common_vendor.index.downloadFile({
          url: fileData,
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.tempFilePath);
            } else {
              reject(new Error("下载文件失败"));
            }
          },
          fail: reject
        });
      });
      fileData = tempFilePath;
      const { data } = await common_vendor.index.uploadFile({
        url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
        filePath: fileData,
        name: "file"
      });
      console.log("文件上传成功:", data);
      return typeof data === "string" ? JSON.parse(data) : data;
    }
    uploadBinaryData(ossKey, fileData);
  } catch (error) {
    if (retries > 0) {
      console.warn(`上传失败，剩余重试次数: ${retries - 1}`, error);
      return uploadFileToOSS(ossKey, fileData, retries - 1);
    } else {
      console.error("文件上传失败，重试次数已用完:", error);
      return null;
    }
  }
};
const uploadBinaryData = async (ossKey, compressedData) => {
  try {
    const arrayBuffer = compressedData instanceof ArrayBuffer ? compressedData : await compressedData.arrayBuffer();
    if (isWechat()) {
      const base64Data = arrayBufferToBase64(arrayBuffer);
      const { data } = await common_vendor.index.request({
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
  var _a;
  try {
    const ua = ((_a = navigator == null ? void 0 : navigator.userAgent) == null ? void 0 : _a.toLowerCase()) || "";
    console.log("User Agent:", ua);
    if (!ua) {
      return true;
    }
    return /micromessenger/i.test(ua) || /miniprogram/i.test(ua);
  } catch (e) {
    const systemInfo = common_vendor.index.getDeviceInfo();
    console.log("System Info:", systemInfo);
    return systemInfo.platform === "wechat" || systemInfo.platform === "devtools";
  }
};
const utils = {
  isWechat,
  removeDecimal: (num) => {
    return Math.floor(num);
  },
  getVoiceFileUrl: (fileName) => {
    return `${config_env.__config.basePath}/voices/${fileName}`;
  },
  uploadBinaryData,
  uploadFileToOSS,
  getFileFromOSS: async (ossKey, isBinary) => {
    var _a;
    try {
      const { data } = await common_vendor.index.request({
        url: `${baseUrl}/ali-oss/get-${isBinary ? "binary-" : ""}file/?oss_key=${ossKey}`,
        method: "GET",
        header: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      if (data.code !== 1e3) {
        throw new Error(data.message || "获取文件失败");
      }
      if (ossKey.endsWith(".m3u8")) {
        return (_a = data == null ? void 0 : data.data) == null ? void 0 : _a.content;
      }
      if (ossKey.endsWith(".json")) {
        return data.data.content;
      } else {
        return data.data.url;
      }
    } catch (error) {
      console.error("获取文件失败:", error);
      return null;
    }
  },
  checkFileInOSS: async (ossKey) => {
    try {
      if (isWechat()) {
        const { data: data2 } = await common_vendor.wx$1.request({
          url: `${baseUrl}/ali-oss/check-file/?oss_key=${ossKey}`,
          method: "GET",
          enableHttpDNS: true,
          httpDNSServiceId: "wxa410372c837a5f26"
        });
        return data2;
      }
      const { data } = await common_vendor.index.request({
        url: `${baseUrl}/ali-oss/check-file/?oss_key=${ossKey}`,
        method: "GET"
      });
      return data;
    } catch (error) {
      console.error("检查文件失败:" + ossKey, error);
      return { exists: false };
    }
  },
  replaceUrl: (oldUrl) => {
    if (!oldUrl)
      return oldUrl;
    return oldUrl.replace(/^https?:\/\/[^\/]+/, "https://books-bct.oss-cn-beijing.aliyuncs.com");
  },
  base64ToArrayBuffer
};
exports.utils = utils;
