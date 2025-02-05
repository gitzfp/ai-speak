"use strict";
const common_vendor = require("../../../common/vendor.js");
const api_chat = require("../../../api/chat.js");
require("../../../axios/api.js");
require("../../../config/env.js");
if (!Math) {
  (LoadingRound + FunctionalText + Collect)();
}
const FunctionalText = () => "../../../components/FunctionalText.js";
const LoadingRound = () => "../../../components/LoadingRound.js";
const Collect = () => "../../../components/Collect.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "MessageGrammar",
  props: {
    sessionId: null,
    messageId: null
  },
  setup(__props, { expose }) {
    const props = __props;
    const grammarAnalysisLoading = common_vendor.ref(false);
    const grammarAnalysisResult = common_vendor.ref(null);
    const translateBetterContentShow = common_vendor.ref(false);
    common_vendor.onMounted(() => {
    });
    const initData = () => {
      console.log(props.sessionId);
      if (grammarAnalysisResult.value) {
        return;
      }
      grammarAnalysisLoading.value = true;
      api_chat.chatRequest.grammarInvoke({ message_id: props.messageId }).then((data) => {
        grammarAnalysisLoading.value = false;
        grammarAnalysisResult.value = data.data;
      });
    };
    const handleTranlate = (message) => {
      translateBetterContentShow.value = !translateBetterContentShow.value;
    };
    const handleCopy = (message) => {
      common_vendor.index.setClipboardData({
        data: message,
        success: () => common_vendor.index.showToast({ title: "复制成功" }),
        fail: () => common_vendor.index.showToast({ title: "复制失败", icon: "none" })
      });
    };
    expose({
      initData
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: grammarAnalysisLoading.value
      }, grammarAnalysisLoading.value ? {} : {}, {
        b: !grammarAnalysisLoading.value && grammarAnalysisResult.value
      }, !grammarAnalysisLoading.value && grammarAnalysisResult.value ? common_vendor.e({
        c: grammarAnalysisResult.value.is_correct
      }, grammarAnalysisResult.value.is_correct ? {} : {
        d: common_vendor.t(grammarAnalysisResult.value.original),
        e: common_vendor.t(grammarAnalysisResult.value.correct_content)
      }, {
        f: grammarAnalysisResult.value.error_reason
      }, grammarAnalysisResult.value.error_reason ? {
        g: common_vendor.t(grammarAnalysisResult.value.error_reason)
      } : {}, {
        h: grammarAnalysisResult.value.better
      }, grammarAnalysisResult.value.better ? {
        i: common_vendor.p({
          text: grammarAnalysisResult.value.better,
          wordClickable: false,
          sessionId: __props.sessionId,
          translateShow: translateBetterContentShow.value
        }),
        j: common_vendor.o(($event) => handleTranlate(grammarAnalysisResult.value.better)),
        k: common_vendor.p({
          type: "SENTENCE",
          content: grammarAnalysisResult.value.better
        }),
        l: common_vendor.o(($event) => handleCopy(grammarAnalysisResult.value.better))
      } : {}) : {});
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c321d887"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/chat/components/MessageGrammar.vue"]]);
wx.createComponent(Component);
