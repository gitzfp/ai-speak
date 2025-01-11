"use strict";
const common_vendor = require("../../../common/vendor.js");
const api_chat = require("../../../api/chat.js");
require("../../../axios/api.js");
require("../../../config/env.js");
if (!Array) {
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  _easycom_uni_popup2();
}
const _easycom_uni_popup = () => "../../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (LoadingRound + FunctionalText + Speech + _easycom_uni_popup)();
}
const FunctionalText = () => "../../../components/FunctionalText.js";
const Speech = () => "./MessageSpeech.js";
const LoadingRound = () => "../../../components/LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "PromptPopup",
  setup(__props, { expose }) {
    var _a;
    const promotPopup = common_vendor.ref(null);
    const sessionId = common_vendor.ref(null);
    const promptLoading = common_vendor.ref(true);
    const promoptList = common_vendor.ref([]);
    const $bus = (_a = common_vendor.getCurrentInstance()) == null ? void 0 : _a.appContext.config.globalProperties.$bus;
    const popupBackgoundColor = common_vendor.ref("");
    common_vendor.onMounted(() => {
      {
        popupBackgoundColor.value = "#fff";
      }
    });
    const handleClose = () => {
      closePopup();
    };
    const open = (sessionIdValue) => {
      sessionId.value = sessionIdValue;
      promotPopup.value.open();
      promptLoading.value = true;
      api_chat.chatRequest.promptInvoke({
        session_id: sessionIdValue
      }).then((data) => {
        promoptList.value = [{
          text: data.data,
          translateShow: false
        }];
      }).finally(() => {
        promptLoading.value = false;
      });
    };
    const handleTranslatePrompt = (prompt) => {
      prompt.translateShow = !prompt.translateShow;
    };
    const sendMessage = (prompt) => {
      $bus.emit("SendMessage", {
        text: prompt.text
      });
      closePopup();
    };
    const handleSpeechSuccess = () => {
      closePopup();
    };
    const closePopup = () => {
      console.log("closePopup");
      sessionId.value = "";
      promoptList.value = [];
      promotPopup.value.close();
    };
    expose({
      open
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handleClose),
        b: promptLoading.value
      }, promptLoading.value ? {} : {}, {
        c: common_vendor.f(promoptList.value, (prompt, k0, i0) => {
          return {
            a: "4779b32d-2-" + i0 + ",4779b32d-0",
            b: common_vendor.p({
              ["session-id"]: sessionId.value,
              text: prompt.text,
              ["translate-show"]: prompt.translateShow
            }),
            c: common_vendor.o(($event) => handleTranslatePrompt(prompt), prompt.text),
            d: prompt.translateShow ? 1 : "",
            e: common_vendor.o(($event) => sendMessage(prompt), prompt.text),
            f: prompt.text
          };
        }),
        d: common_vendor.o(handleSpeechSuccess),
        e: common_vendor.p({
          sessionId: sessionId.value
        }),
        f: common_vendor.sr(promotPopup, "4779b32d-0", {
          "k": "promotPopup"
        }),
        g: common_vendor.p({
          type: "bottom",
          ["background-color"]: popupBackgoundColor.value
        })
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4779b32d"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/chat/components/PromptPopup.vue"]]);
wx.createComponent(Component);
