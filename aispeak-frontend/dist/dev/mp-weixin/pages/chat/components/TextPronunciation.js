"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "TextPronunciation",
  props: {
    content: null,
    pronunciation: null
  },
  setup(__props, { emit }) {
    const handleWordDetail = (word) => {
      console.log(word);
      emit("wordClick", word);
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(__props.pronunciation.words, (word, k0, i0) => {
          return {
            a: common_vendor.t(word.word),
            b: word.word,
            c: common_vendor.o(($event) => handleWordDetail(word), word.word),
            d: word.accuracy_score <= 60 ? 1 : "",
            e: word.accuracy_score > 60 && word.accuracy_score < 75 ? 1 : ""
          };
        })
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f08da118"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/chat/components/TextPronunciation.vue"]]);
wx.createComponent(Component);
