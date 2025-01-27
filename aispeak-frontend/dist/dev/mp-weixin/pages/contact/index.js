"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Math) {
  CommonHeader();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    common_vendor.onMounted(() => {
      common_vendor.index.setNavigationBarTitle({
        title: "AI-Speak"
      });
    });
    const handleBackPage = () => {
      common_vendor.index.switchTab({
        url: "/pages/my/index"
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          leftIcon: true,
          ["back-fn"]: handleBackPage,
          title: "AISPeak"
        })
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-234ce7e8"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/contact/index.vue"]]);
wx.createPage(MiniProgramPage);
