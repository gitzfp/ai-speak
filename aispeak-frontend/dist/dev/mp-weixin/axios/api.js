"use strict";
const common_vendor = require("../common/vendor.js");
const config_env = require("../config/env.js");
const request = (url, method, data, showLoading) => {
  let _url = config_env.__config.basePath + url;
  return new Promise((resolve, reject) => {
    if (showLoading) {
      common_vendor.index.showLoading();
    }
    common_vendor.index.request({
      url: _url,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        "X-Token": common_vendor.index.getStorageSync("x-token") ? common_vendor.index.getStorageSync("x-token") : ""
      },
      success(res) {
        if (res.statusCode == 200) {
          resolve(res.data);
        } else if (res.statusCode == 401) {
          common_vendor.index.showToast({
            title: "登录过期，重新登录",
            icon: "none",
            duration: 2e3
          });
          common_vendor.index.removeStorageSync("x-token");
          common_vendor.index.navigateTo({
            url: "/pages/login/index"
          });
        } else {
          reject(res.data);
        }
      },
      fail(error) {
        console.error(error);
        reject(error);
      },
      complete(res) {
        var _a;
        if (showLoading) {
          (_a = common_vendor.index) == null ? void 0 : _a.hideLoading();
        }
      }
    });
  });
};
exports.request = request;
