"use strict";
const common_vendor = require("../common/vendor.js");
const utils_utils = require("../utils/utils.js");
const components_audioPlayerExecuter = require("./audioPlayerExecuter.js");
const config_env = require("../config/env.js");
if (!Math) {
  LoadingRound();
}
const LoadingRound = () => "./LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "AudioPlayer",
  props: {
    messageId: null,
    fileName: null,
    content: null,
    direction: null,
    autoPlay: null,
    speechRoleName: null,
    speechRoleStyle: null,
    sessionId: null
  },
  setup(__props, { expose }) {
    const props = __props;
    const transformFileLoading = common_vendor.ref(false);
    const speechLoading = common_vendor.ref(false);
    common_vendor.ref("");
    common_vendor.onMounted(() => {
      if (props.autoPlay) {
        handleSpeech();
      }
    });
    const handleSpeech = async () => {
      let audioUrl = "";
      if (props.fileName) {
        audioUrl = utils_utils.utils.getVoiceFileUrl(props.fileName);
      } else {
        if (props.messageId) {
          transformFileLoading.value = true;
          audioUrl = `${config_env.__config.basePath}/message/speech?message_id=${props.messageId}`;
        } else if (props.content) {
          transformFileLoading.value = true;
          audioUrl = `${config_env.__config.basePath}/message/speech-content?content=${props.content}`;
          if (props.speechRoleName) {
            audioUrl += `&speech_role_name=${props.speechRoleName}`;
          }
          if (props.speechRoleStyle) {
            audioUrl += `&speech_role_style=${props.speechRoleStyle}`;
          }
          if (props.sessionId) {
            audioUrl += `&session_id=${props.sessionId}`;
          }
        }
        if (common_vendor.index.getStorageSync("x-token")) {
          audioUrl += `&x_token_query=${common_vendor.index.getStorageSync("x-token")}`;
        }
      }
      console.log(audioUrl);
      components_audioPlayerExecuter.audioPlayer.playAudio({
        audioUrl,
        listener: {
          playing: () => {
            transformFileLoading.value = false;
            speechLoading.value = true;
          },
          success: () => {
            transformFileLoading.value = false;
            speechLoading.value = false;
          },
          error: () => {
            transformFileLoading.value = false;
            speechLoading.value = false;
          }
        }
      });
      return;
    };
    const autoPlayAudio = () => {
      common_vendor.nextTick$1(() => {
        handleSpeech();
      });
    };
    expose({
      autoPlayAudio
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: transformFileLoading.value
      }, transformFileLoading.value ? {} : common_vendor.e({
        b: speechLoading.value
      }, speechLoading.value ? {
        c: __props.direction && __props.direction == "right" ? 1 : ""
      } : {
        d: __props.direction && __props.direction == "right" ? 1 : ""
      }), {
        e: common_vendor.o(handleSpeech),
        f: speechLoading.value
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9e3d83e8"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/components/AudioPlayer.vue"]]);
wx.createComponent(Component);
