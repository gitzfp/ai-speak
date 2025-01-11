"use strict";
const common_vendor = require("../../../common/vendor.js");
if (!Math) {
  Speech();
}
const Speech = () => "../../../components/Speech.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "MessageSpeech",
  setup(__props, { emit }) {
    var _a;
    const $bus = (_a = common_vendor.getCurrentInstance()) == null ? void 0 : _a.appContext.config.globalProperties.$bus;
    const handleSuccess = (data) => {
      const fileName = data.fileName;
      emit("success", data);
      $bus.emit("SendMessage", {
        fileName
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.sr("speechRef", "1242a7bb-0"),
        b: common_vendor.o(handleSuccess)
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/chat/components/MessageSpeech.vue"]]);
wx.createComponent(Component);
