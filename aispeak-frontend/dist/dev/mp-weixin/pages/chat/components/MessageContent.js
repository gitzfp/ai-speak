"use strict";
const common_vendor = require("../../../common/vendor.js");
const api_chat = require("../../../api/chat.js");
const utils_utils = require("../../../utils/utils.js");
require("../../../axios/api.js");
require("../../../config/env.js");
if (!Math) {
  (Loading + FunctionalText + Collect + AudioPlayer + LoadingRound + MessageGrammar)();
}
const FunctionalText = () => "../../../components/FunctionalText.js";
const AudioPlayer = () => "../../../components/AudioPlayer.js";
const MessageGrammar = () => "./MessageGrammarPopup.js";
const Collect = () => "../../../components/Collect.js";
const Loading = () => "../../../components/Loading.js";
const LoadingRound = () => "../../../components/LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "MessageContent",
  props: {
    message: null
  },
  setup(__props, { expose }) {
    const props = __props;
    const functionalTextRef = common_vendor.ref(null);
    const messageGrammarRef = common_vendor.ref(null);
    const grammarLoading = common_vendor.ref(false);
    const translateShow = common_vendor.ref(false);
    const textShadow = common_vendor.ref(false);
    common_vendor.onMounted(() => {
      if (props.message.auto_hint && props.message.auto_hint === true) {
        textShadow.value = true;
      }
      if (props.message.auto_pronunciation) {
        autoPronunciation();
      }
    });
    common_vendor.computed(() => {
      return props.message.owner;
    });
    const containerClass = common_vendor.computed(() => {
      const messagePosition = props.message.owner ? "right" : "left";
      return `${messagePosition}-content`;
    });
    const handleTranslateText = () => {
      translateShow.value = !translateShow.value;
    };
    const handleCopyText = () => {
      common_vendor.index.setClipboardData({
        data: props.message.content,
        success: () => {
          common_vendor.index.showToast({
            title: "复制成功",
            icon: "none"
          });
        }
      });
    };
    const handleHint = () => {
      textShadow.value = !textShadow.value;
    };
    const handleGrammar = () => {
      let type = "grammar";
      if (props.message.file_name) {
        type = "pronunciation";
      }
      messageGrammarRef.value.open(
        props.message.id,
        props.message.content,
        props.message.file_name,
        props.message.session_id,
        type
      );
    };
    const autoPlayAudio = () => {
      common_vendor.nextTick$1(() => {
        functionalTextRef.value.autoPlayAudio();
      });
    };
    const autoPronunciation = () => {
      grammarLoading.value = true;
      api_chat.chatRequest.pronunciationInvoke({ message_id: props.message.id }).then((data) => {
        props.message.pronunciation = data.data;
        grammarLoading.value = false;
      });
    };
    const autoHandleHint = () => {
      handleHint();
    };
    expose({
      autoPlayAudio,
      autoHandleHint,
      autoPronunciation
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !__props.message.content
      }, !__props.message.content ? {} : common_vendor.e({
        b: !__props.message.owner
      }, !__props.message.owner ? {
        c: common_vendor.sr(functionalTextRef, "30e39fae-1", {
          "k": "functionalTextRef"
        }),
        d: common_vendor.p({
          ["auto-play"]: __props.message.auto_play || false,
          messageId: __props.message.id,
          wordClickable: true,
          text: __props.message.content,
          fileName: __props.message.file_name,
          translateShow: translateShow.value,
          textShadow: textShadow.value
        }),
        e: common_vendor.o(handleTranslateText),
        f: translateShow.value ? 1 : "",
        g: common_vendor.p({
          type: "MESSAGE",
          messageId: __props.message.id || ""
        }),
        h: common_vendor.o(handleCopyText),
        i: common_vendor.o(handleHint),
        j: textShadow.value ? 1 : ""
      } : common_vendor.e({
        k: common_vendor.t(__props.message.content),
        l: __props.message.file_name
      }, __props.message.file_name ? {
        m: common_vendor.p({
          direction: "right",
          fileName: __props.message.file_name
        })
      } : {}), {
        n: __props.message.owner ? 1 : "",
        o: __props.message.owner
      }, __props.message.owner ? common_vendor.e({
        p: grammarLoading.value
      }, grammarLoading.value ? {} : __props.message.pronunciation ? common_vendor.e({
        r: __props.message.achieved_target === true
      }, __props.message.achieved_target === true ? {} : {}, {
        s: common_vendor.t(common_vendor.unref(utils_utils.utils).removeDecimal(__props.message.pronunciation.pronunciation_score)),
        t: common_vendor.o(handleGrammar)
      }) : {
        v: common_vendor.o(handleGrammar)
      }, {
        q: __props.message.pronunciation
      }) : {}), {
        w: common_vendor.sr(messageGrammarRef, "30e39fae-5", {
          "k": "messageGrammarRef"
        }),
        x: common_vendor.n(common_vendor.unref(containerClass))
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-30e39fae"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/chat/components/MessageContent.vue"]]);
wx.createComponent(Component);
