"use strict";
const common_vendor = require("../../common/vendor.js");
const api_account = require("../../api/account.js");
require("../../axios/api.js");
require("../../config/env.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const X_TOKEN = "x-token";
    const loginLoading = common_vendor.ref(false);
    const isWeixin = common_vendor.ref(false);
    const phoneNumber = common_vendor.ref("");
    const password = common_vendor.ref("");
    common_vendor.onMounted(() => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      isWeixin.value = common_vendor.index.getSystemSetting().platform === "wechat" || common_vendor.index.getSystemInfoSync().platform === "devtools";
      let storageToken = common_vendor.index.getStorageSync(X_TOKEN);
      if (storageToken) {
        loginSucessByToken(storageToken);
      }
    });
    const handleWechatLogin = (e) => {
      if (loginLoading.value)
        return;
      loginLoading.value = true;
      common_vendor.index.login({
        provider: "weixin",
        success: (res) => {
          const code = res.code;
          api_account.accountRequest.wechatLogin({ code }).then((data) => {
            loginSuccess(data);
          }).finally(() => {
            loginLoading.value = false;
          });
        },
        fail: (err) => {
          console.error("微信登录失败", err);
          loginLoading.value = false;
        }
      });
    };
    const handlePhoneLogin = () => {
      console.log("手机号登录");
      if (loginLoading.value)
        return;
      loginLoading.value = true;
      api_account.accountRequest.phoneLogin({
        phone_number: phoneNumber.value,
        password: password.value
      }).then((data) => {
        loginSuccess(data);
      }).finally(() => {
        loginLoading.value = false;
      });
    };
    const loginSuccess = (data) => {
      if (data.code !== 1e3) {
        common_vendor.index.showToast({
          title: data.message,
          icon: "none"
        });
        return;
      }
      let storageToken = data.data.token;
      loginSucessByToken(storageToken);
    };
    const loginSucessByToken = (storageToken) => {
      common_vendor.index.setStorageSync("x-token", storageToken);
      common_vendor.index.switchTab({
        url: "/pages/textbook/index"
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: isWeixin.value
      }, isWeixin.value ? {
        b: common_vendor.o(handleWechatLogin)
      } : {
        c: phoneNumber.value,
        d: common_vendor.o(($event) => phoneNumber.value = $event.detail.value),
        e: password.value,
        f: common_vendor.o(($event) => password.value = $event.detail.value),
        g: common_vendor.o(handlePhoneLogin)
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-45258083"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/login/index.vue"]]);
wx.createPage(MiniProgramPage);
