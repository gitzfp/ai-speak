"use strict";
const common_vendor = require("../../common/vendor.js");
const api_account = require("../../api/account.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  CommonHeader();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const accountInfo = common_vendor.ref({ account_id: "", today_chat_count: 0, total_chat_count: 0, target_language_label: "" });
    common_vendor.onMounted(() => {
      common_vendor.index.setNavigationBarTitle({
        title: "AI-Speak"
      });
    });
    common_vendor.onShow(() => {
      api_account.accountRequest.accountInfoGet().then((data) => {
        accountInfo.value = data.data;
      });
    });
    const goContact = () => {
      common_vendor.index.navigateTo({
        url: "/pages/contact/index"
      });
    };
    const hangleLogout = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定退出登录吗？",
        confirmColor: "#6236ff",
        success: function(res) {
          if (res.confirm) {
            common_vendor.index.removeStorageSync("x-token");
            common_vendor.index.reLaunch({
              url: "/pages/login/index"
            });
          } else if (res.cancel) {
            console.log("用户点击取消");
          }
        }
      });
    };
    const hangleLogin = () => {
      common_vendor.index.removeStorageSync("x-token");
      common_vendor.index.reLaunch({
        url: "/pages/login/index"
      });
    };
    const goFeedback = () => {
      common_vendor.index.navigateTo({
        url: "/pages/feedback/index"
      });
    };
    const goLearningLanguage = () => {
      common_vendor.index.navigateTo({
        url: "/pages/my/learnLanguage"
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "AISPeak"
        }),
        b: accountInfo.value.account_id.indexOf("visitor") === 0
      }, accountInfo.value.account_id.indexOf("visitor") === 0 ? {
        c: common_vendor.o(hangleLogin)
      } : {
        d: common_vendor.t(accountInfo.value.account_id)
      }, {
        e: common_vendor.t(accountInfo.value.today_chat_count),
        f: common_vendor.t(accountInfo.value.total_chat_count),
        g: common_vendor.t(accountInfo.value.target_language_label),
        h: common_vendor.o(goLearningLanguage),
        i: common_vendor.o(goFeedback),
        j: common_vendor.o(goContact),
        k: accountInfo.value.account_id.indexOf("visitor") < 0
      }, accountInfo.value.account_id.indexOf("visitor") < 0 ? {
        l: common_vendor.o(hangleLogout)
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-276ac604"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/my/index.vue"]]);
wx.createPage(MiniProgramPage);
