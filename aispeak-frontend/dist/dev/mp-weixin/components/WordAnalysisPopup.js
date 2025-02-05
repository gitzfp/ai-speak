"use strict";
const common_vendor = require("../common/vendor.js");
const api_chat = require("../api/chat.js");
require("../axios/api.js");
require("../config/env.js");
if (!Array) {
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  _easycom_uni_popup2();
}
const _easycom_uni_popup = () => "../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (LoadingRound + Collect + AudioPlayer + _easycom_uni_popup)();
}
const AudioPlayer = () => "./AudioPlayer.js";
const LoadingRound = () => "./LoadingRound.js";
const Collect = () => "./Collect.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "WordAnalysisPopup",
  setup(__props, { expose }) {
    getApp();
    const word = common_vendor.ref("");
    const wordAnalysisPopup = common_vendor.ref(null);
    const wordPhoneticSymbol = common_vendor.ref(null);
    const wordExplain = common_vendor.ref(null);
    const wordDetailLoading = common_vendor.ref(false);
    const popupBackgoundColor = common_vendor.ref("");
    common_vendor.onMounted(() => {
      {
        popupBackgoundColor.value = "#fff";
      }
    });
    const handleClose = () => {
      wordAnalysisPopup.value.close();
      wordPhoneticSymbol.value = null;
      wordExplain.value = null;
    };
    const open = (wordText) => {
      word.value = wordText;
      wordDetailLoading.value = true;
      api_chat.chatRequest.wordDetail({ word: wordText }).then((res) => {
        wordPhoneticSymbol.value = res.data.phonetic;
        wordExplain.value = res.data.translation;
        wordDetailLoading.value = false;
      });
      wordAnalysisPopup.value.open();
    };
    expose({
      open,
      handleClose
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handleClose),
        b: wordDetailLoading.value
      }, wordDetailLoading.value ? {
        c: common_vendor.p({
          ["min-height"]: 200
        })
      } : wordPhoneticSymbol.value ? {
        e: common_vendor.t(word.value),
        f: common_vendor.p({
          type: "WORD",
          content: word.value
        }),
        g: common_vendor.t(wordPhoneticSymbol.value),
        h: common_vendor.p({
          content: word.value
        }),
        i: common_vendor.t(wordExplain.value)
      } : {}, {
        d: wordPhoneticSymbol.value,
        j: common_vendor.sr(wordAnalysisPopup, "d41638ae-0", {
          "k": "wordAnalysisPopup"
        }),
        k: common_vendor.p({
          type: "bottom",
          ["background-color"]: popupBackgoundColor.value
        })
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d41638ae"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/components/WordAnalysisPopup.vue"]]);
wx.createComponent(Component);
