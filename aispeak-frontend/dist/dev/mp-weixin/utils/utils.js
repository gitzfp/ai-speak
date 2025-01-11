"use strict";
const config_env = require("../config/env.js");
const utils = {
  isWechat: () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("micromessenger") !== -1;
  },
  removeDecimal: (num) => {
    return Math.floor(num);
  },
  getVoiceFileUrl: (fileName) => {
    return `${config_env.__config.basePath}/voices/${fileName}`;
  }
};
exports.utils = utils;
