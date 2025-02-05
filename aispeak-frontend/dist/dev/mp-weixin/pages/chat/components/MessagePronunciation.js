"use strict";
const common_vendor = require("../../../common/vendor.js");
const api_chat = require("../../../api/chat.js");
const global_globalCount_hooks = require("../../../global/globalCount.hooks.js");
const utils_utils = require("../../../utils/utils.js");
require("../../../axios/api.js");
require("../../../config/env.js");
if (!Math) {
  (LoadingRound + Rate + TextPronunciation + AudioPlayer + Speech)();
}
const AudioPlayer = () => "../../../components/AudioPlayer.js";
const LoadingRound = () => "../../../components/LoadingRound.js";
const Speech = () => "../../../components/Speech.js";
const Rate = () => "../../../components/Rate.js";
const TextPronunciation = () => "./TextPronunciation.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "MessagePronunciation",
  props: {
    messageId: null,
    sessionId: null,
    messageContent: null,
    fileName: null
  },
  setup(__props, { expose, emit }) {
    const props = __props;
    const { globalUserInfo, globalLoading } = global_globalCount_hooks.useUserInfo();
    const pronunciationLoading = common_vendor.ref(false);
    const pronunciationResult = common_vendor.ref(null);
    const practiceFileName = common_vendor.ref(null);
    const initData = () => {
      if (pronunciationResult.value || !props.fileName) {
        return;
      }
      pronunciationLoading.value = true;
      api_chat.chatRequest.pronunciationInvoke({ message_id: props.messageId }).then((data) => {
        pronunciationResult.value = data.data;
      }).finally(() => {
        pronunciationLoading.value = false;
        console.log(pronunciationLoading.value);
      });
    };
    const handleSuccess = (data) => {
      pronunciationLoading.value = true;
      pronunciationResult.value = null;
      api_chat.chatRequest.messagePractice({ message_id: props.messageId, file_name: data.fileName }).then((resp) => {
        practiceFileName.value = data.fileName;
        pronunciationResult.value = resp.data;
      }).finally(() => {
        pronunciationLoading.value = false;
        console.log(pronunciationLoading.value);
      });
    };
    const handleWordDetail = (word) => {
      emit("wordClick", word);
    };
    expose({
      initData
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: pronunciationLoading.value
      }, pronunciationLoading.value ? {} : {}, {
        b: pronunciationResult.value
      }, pronunciationResult.value ? {
        c: common_vendor.p({
          rate: common_vendor.unref(utils_utils.utils).removeDecimal(pronunciationResult.value.pronunciation_score)
        })
      } : {}, {
        d: pronunciationResult.value
      }, pronunciationResult.value ? {} : {}, {
        e: pronunciationResult.value
      }, pronunciationResult.value ? {
        f: common_vendor.o(handleWordDetail),
        g: common_vendor.p({
          content: __props.messageContent,
          pronunciation: pronunciationResult.value
        })
      } : {}, {
        h: common_vendor.unref(globalUserInfo).teacher_avatar || "/static/ai-robot.jpg",
        i: common_vendor.p({
          content: __props.messageContent,
          sessionId: __props.sessionId
        }),
        j: __props.fileName
      }, __props.fileName ? {
        k: common_vendor.p({
          fileName: practiceFileName.value || __props.fileName
        })
      } : {}, {
        l: common_vendor.o(handleSuccess)
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-622aa746"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/chat/components/MessagePronunciation.vue"]]);
wx.createComponent(Component);
