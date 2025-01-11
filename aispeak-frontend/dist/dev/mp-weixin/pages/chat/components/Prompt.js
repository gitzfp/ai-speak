"use strict";
const common_vendor = require("../../../common/vendor.js");
if (!Math) {
  (PromptPopup + TranslationPopup)();
}
const PromptPopup = () => "./PromptPopup.js";
const TranslationPopup = () => "./TranslationPopup.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Prompt",
  props: {
    sessionId: null
  },
  setup(__props) {
    const props = __props;
    common_vendor.ref("");
    const promotPopupRef = common_vendor.ref(null);
    const translationPopupRef = common_vendor.ref(null);
    const handlePrompt = () => {
      promotPopupRef.value.open(props.sessionId);
    };
    const handleTranslate = () => {
      translationPopupRef.value.open(props.sessionId);
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(handlePrompt),
        b: common_vendor.o(handleTranslate),
        c: common_vendor.sr(promotPopupRef, "191d459c-0", {
          "k": "promotPopupRef"
        }),
        d: common_vendor.sr(translationPopupRef, "191d459c-1", {
          "k": "translationPopupRef"
        })
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-191d459c"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/chat/components/Prompt.vue"]]);
wx.createComponent(Component);
