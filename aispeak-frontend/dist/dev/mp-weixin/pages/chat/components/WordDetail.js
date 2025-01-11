"use strict";
const common_vendor = require("../../../common/vendor.js");
const api_chat = require("../../../api/chat.js");
require("../../../axios/api.js");
require("../../../config/env.js");
if (!Math) {
  (LoadingRound + Rate + PhonemeBox + AudioPlayer + Collect + Speech)();
}
const AudioPlayer = () => "../../../components/AudioPlayer.js";
const LoadingRound = () => "../../../components/LoadingRound.js";
const Speech = () => "../../../components/Speech.js";
const Collect = () => "../../../components/Collect.js";
const Rate = () => "../../../components/Rate.js";
const PhonemeBox = () => "./PhonemeBox.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "WordDetail",
  setup(__props, { expose }) {
    const wordDetailLoading = common_vendor.ref(false);
    const practiceLoading = common_vendor.ref(false);
    const wordDetailAccuracyScore = common_vendor.ref(null);
    const wordPronunciation = common_vendor.ref();
    const wordDetail = common_vendor.ref(null);
    const sessionId = common_vendor.ref("");
    const practiceFile = common_vendor.ref(null);
    const initData = (word, sessionIdVal) => {
      wordPronunciation.value = word;
      wordDetail.value = null;
      sessionId.value = sessionIdVal;
      wordDetailLoading.value = true;
      api_chat.chatRequest.wordDetail({ word: word.word }).then((data) => {
        const wordDetailData = data.data;
        wordDetail.value = wordDetailData;
        wordDetailLoading.value = false;
      });
    };
    const handleSuccess = (data) => {
      if (!wordDetail.value) {
        return;
      }
      wordDetailAccuracyScore.value = null;
      practiceLoading.value = true;
      practiceFile.value = null;
      api_chat.chatRequest.wordPractice({
        word: wordDetail.value.original,
        session_id: sessionId.value,
        file_name: data.fileName
      }).then((res) => {
        const wordDetailData = res.data;
        wordPronunciation.value = wordDetailData["words"][0];
        practiceLoading.value = false;
        practiceFile.value = data.fileName;
      });
    };
    const handlePhonemeClick = (phoneme) => {
      console.log(phoneme);
    };
    expose({
      initData
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: practiceLoading.value
      }, practiceLoading.value ? {} : wordPronunciation.value ? common_vendor.e({
        c: common_vendor.p({
          rate: wordPronunciation.value.accuracy_score
        }),
        d: common_vendor.o(handlePhonemeClick),
        e: common_vendor.p({
          word: wordPronunciation.value
        }),
        f: practiceFile.value
      }, practiceFile.value ? {
        g: common_vendor.p({
          ["file-name"]: practiceFile.value
        })
      } : {}) : {}, {
        b: wordPronunciation.value,
        h: wordDetailLoading.value
      }, wordDetailLoading.value ? {} : wordDetail.value ? {
        j: common_vendor.t(wordDetail.value.original),
        k: common_vendor.p({
          content: wordDetail.value.original,
          ["session-id"]: sessionId.value
        }),
        l: common_vendor.p({
          type: "WORD",
          content: wordDetail.value.original
        }),
        m: common_vendor.t(wordDetail.value.phonetic),
        n: common_vendor.t(wordDetail.value.translation)
      } : {}, {
        i: wordDetail.value,
        o: common_vendor.o(handleSuccess)
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d52515e0"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/chat/components/WordDetail.vue"]]);
wx.createComponent(Component);
