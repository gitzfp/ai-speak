"use strict";
const common_vendor = require("../../common/vendor.js");
const api_sys = require("../../api/sys.js");
const api_account = require("../../api/account.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  CommonHeader();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "learnLanguage",
  setup(__props) {
    const languages = common_vendor.ref([]);
    common_vendor.onMounted(() => {
      api_sys.sysRequest.getLanguages().then((data) => {
        languages.value = data.data;
      });
    });
    const selectLanguage = (language) => {
      api_account.accountRequest.setSettings({ target_language: language.value }).then((data) => {
        common_vendor.index.navigateBack();
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          leftIcon: _ctx.redirectType !== "init",
          ["background-color"]: "#F5F5FE"
        }),
        b: common_vendor.f(languages.value, (language, k0, i0) => {
          return {
            a: common_vendor.t(language.label),
            b: common_vendor.o(($event) => selectLanguage(language))
          };
        })
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-232ea9a0"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/my/learnLanguage.vue"]]);
wx.createPage(MiniProgramPage);
