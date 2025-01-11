"use strict";
const common_vendor = require("../../common/vendor.js");
const api_sys = require("../../api/sys.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  CommonHeader();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const pushStatus = common_vendor.ref(false);
    const content = common_vendor.ref("");
    const contact = common_vendor.ref("user");
    common_vendor.onMounted(() => {
      common_vendor.index.setNavigationBarTitle({
        title: "AI-Speak"
      });
    });
    const handleAddFeedback = () => {
      if (!content.value) {
        common_vendor.index.showToast({
          title: "内容不能为空",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      api_sys.sysRequest.feedbackAdd({
        content: content.value,
        contact: contact.value
      }).then(() => {
        pushStatus.value = true;
      });
    };
    const handleBackPage = () => {
      common_vendor.index.switchTab({
        url: "/pages/my/index"
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          leftIcon: true,
          ["back-fn"]: handleBackPage,
          title: "AISPeak"
        }),
        b: !pushStatus.value
      }, !pushStatus.value ? {
        c: content.value,
        d: common_vendor.o(($event) => content.value = $event.detail.value),
        e: common_vendor.o(handleAddFeedback)
      } : {
        f: common_vendor.o(handleBackPage)
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3aa1718d"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/feedback/index.vue"]]);
wx.createPage(MiniProgramPage);
