"use strict";
const common_vendor = require("../common/vendor.js");
const api_chat = require("../api/chat.js");
require("../axios/api.js");
require("../config/env.js");
if (!Math) {
  (AudioPlayer + LoadingRound + WordAnalysisPopup)();
}
const AudioPlayer = () => "./AudioPlayer.js";
const WordAnalysisPopup = () => "./WordAnalysisPopup.js";
const LoadingRound = () => "./LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "FunctionalText",
  props: {
    text: null,
    textShadow: null,
    sessionId: null,
    messageId: null,
    fileName: null,
    wordClickable: null,
    translateShow: null,
    autoPlay: null
  },
  setup(__props, { expose }) {
    const props = __props;
    const translateLoading = common_vendor.ref(false);
    const translateText = common_vendor.ref("");
    const clickAbleWord = common_vendor.ref(false);
    const wordAnalysisPopup = common_vendor.ref(null);
    const audioPlayRef = common_vendor.ref(null);
    common_vendor.onMounted(() => {
    });
    common_vendor.watch(
      () => props.translateShow,
      (newVal, oldVal) => {
        if (newVal && !translateText.value) {
          initTranslateData();
        }
      },
      { deep: true }
    );
    const initTranslateData = () => {
      if (translateText.value) {
        return;
      }
      translateLoading.value = true;
      if (props.messageId) {
        api_chat.chatRequest.translateInvoke({
          message_id: props.messageId
        }).then((data) => {
          translateText.value = data.data;
        }).catch((e) => {
          translateText.value = "翻译出错";
        }).finally(() => {
          translateLoading.value = false;
        });
      } else {
        api_chat.chatRequest.translateSourceLanguage({
          text: props.text
        }).then((data) => {
          translateText.value = data.data;
        }).catch((e) => {
          translateText.value = "翻译出错";
        }).finally(() => {
          translateLoading.value = false;
        });
      }
    };
    const handleSpaceClick = () => {
      clickAbleWord.value = false;
    };
    const handleWordClick = () => {
      if (props.textShadow) {
        return;
      }
      clickAbleWord.value = true;
    };
    const handleAnalysis = (word) => {
      const reg = /[^a-zA-Z]/g;
      word = word.replace(reg, "");
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          wordAnalysisPopup.value.open(word);
        }, 100);
      });
    };
    const autoPlayAudio = () => {
      common_vendor.nextTick$1(() => {
        audioPlayRef.value.autoPlayAudio();
      });
    };
    expose({
      initTranslateData,
      autoPlayAudio
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.wordClickable
      }, __props.wordClickable ? {
        b: common_vendor.t(__props.text),
        c: !clickAbleWord.value,
        d: common_vendor.o(handleWordClick),
        e: __props.textShadow ? 1 : ""
      } : {
        f: common_vendor.t(__props.text)
      }, {
        g: __props.wordClickable && clickAbleWord.value && __props.text
      }, __props.wordClickable && clickAbleWord.value && __props.text ? {
        h: common_vendor.f(__props.text.split(" "), (word, index, i0) => {
          return {
            a: common_vendor.t(word),
            b: index,
            c: common_vendor.o(($event) => handleAnalysis(word), index)
          };
        })
      } : {}, {
        i: common_vendor.sr(audioPlayRef, "5ba4dd5b-0", {
          "k": "audioPlayRef"
        }),
        j: common_vendor.p({
          autoPlay: __props.autoPlay,
          sessionId: __props.sessionId,
          messageId: __props.messageId,
          fileName: __props.fileName,
          content: __props.text
        }),
        k: __props.translateShow || translateLoading.value
      }, __props.translateShow || translateLoading.value ? {
        l: common_vendor.t(translateText.value),
        m: !translateLoading.value,
        n: translateLoading.value
      } : {}, {
        o: common_vendor.sr(wordAnalysisPopup, "5ba4dd5b-2", {
          "k": "wordAnalysisPopup"
        }),
        p: common_vendor.o(handleSpaceClick)
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5ba4dd5b"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/components/FunctionalText.vue"]]);
wx.createComponent(Component);
