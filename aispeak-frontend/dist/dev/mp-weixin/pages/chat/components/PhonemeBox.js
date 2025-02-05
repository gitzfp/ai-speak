"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "PhonemeBox",
  props: {
    word: null
  },
  setup(__props, { emit }) {
    const handlePhonemeDetail = (phoneme) => {
      emit("phonemeClick", phoneme);
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(__props.word.phonemes, (phoneme, index, i0) => {
          return {
            a: common_vendor.t(phoneme.phoneme),
            b: index,
            c: common_vendor.o(($event) => handlePhonemeDetail(phoneme), index),
            d: phoneme.accuracy_score <= 60 ? 1 : "",
            e: phoneme.accuracy_score > 60 && phoneme.accuracy_score < 75 ? 1 : ""
          };
        })
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7495a7f6"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/chat/components/PhonemeBox.vue"]]);
wx.createComponent(Component);
