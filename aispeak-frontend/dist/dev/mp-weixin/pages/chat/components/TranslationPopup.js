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
  (LoadingRound + AudioPlayer + Speech + _easycom_uni_popup)();
}
const AudioPlayer = () => "../../../components/AudioPlayer.js";
const Speech = () => "./MessageSpeech.js";
const LoadingRound = () => "../../../components/LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "TranslationPopup",
  setup(__props, { expose }) {
    var _a;
    const $bus = (_a = common_vendor.getCurrentInstance()) == null ? void 0 : _a.appContext.config.globalProperties.$bus;
    const translationPopup = common_vendor.ref(null);
    const inputText = common_vendor.ref("");
    const translating = common_vendor.ref(false);
    const translationText = common_vendor.ref("");
    const sessionId = common_vendor.ref("");
    const popupBackgoundColor = common_vendor.ref("");
    common_vendor.onMounted(() => {
      {
        popupBackgoundColor.value = "#fff";
      }
    });
    const inputHasText = common_vendor.computed(() => {
      return !!(inputText.value && inputText.value.trim());
    });
    const handleTranslate = () => {
      if (!inputHasText.value) {
        common_vendor.index.showToast({
          title: "请输入文本",
          icon: "none"
        });
        return;
      }
      translating.value = true;
      api_chat.chatRequest.translateSettingLanguage({
        text: inputText.value,
        session_id: sessionId.value
      }).then((data) => {
        translationText.value = data.data;
        translating.value = false;
      }).catch(() => {
        translating.value = false;
      });
    };
    const handleSend = () => {
      if (!translationText.value) {
        common_vendor.index.showToast({
          title: "请输入文本并进行翻译",
          icon: "none"
        });
        return;
      }
      $bus.emit("SendMessage", {
        text: translationText.value
      });
      handleClose();
    };
    const handleSuccess = (data) => {
      handleClose();
    };
    const handleClose = () => {
      translationPopup.value.close();
      inputText.value = "";
      translationText.value = "";
      sessionId.value = "";
    };
    const open = (sessionIdVal) => {
      sessionId.value = sessionIdVal;
      translationPopup.value.open();
    };
    expose({
      open,
      handleClose
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handleClose),
        b: inputText.value,
        c: common_vendor.o(($event) => inputText.value = $event.detail.value),
        d: common_vendor.o(handleTranslate),
        e: common_vendor.unref(inputHasText) ? 1 : "",
        f: translating.value
      }, translating.value ? {} : {}, {
        g: translationText.value && !translating.value
      }, translationText.value && !translating.value ? {
        h: common_vendor.t(translationText.value),
        i: common_vendor.p({
          content: translationText.value,
          ["session-id"]: sessionId.value
        })
      } : {}, {
        j: translationText.value && !translating.value
      }, translationText.value && !translating.value ? {
        k: common_vendor.o(handleSend)
      } : {}, {
        l: common_vendor.o(handleSuccess),
        m: common_vendor.p({
          sessionId: sessionId.value
        }),
        n: common_vendor.sr(translationPopup, "b772b10a-0", {
          "k": "translationPopup"
        }),
        o: common_vendor.p({
          type: "bottom",
          ["background-color"]: popupBackgoundColor.value
        })
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b772b10a"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/chat/components/TranslationPopup.vue"]]);
wx.createComponent(Component);
