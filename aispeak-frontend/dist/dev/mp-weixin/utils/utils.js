"use strict";
const common_vendor = require("../common/vendor.js");
const config_env = require("../config/env.js");
const utils = {
  isWechat: () => {
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
  },
  removeDecimal: (num) => {
    return Math.floor(num);
  },
  getVoiceFileUrl: (fileName) => {
    return `${config_env.__config.basePath}/voices/${fileName}`;
  }
};
exports.utils = utils;
