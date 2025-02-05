"use strict";
const common_vendor = require("../common/vendor.js");
const components_speechExecuter = require("./speechExecuter.js");
const components_audioPlayerExecuter = require("./audioPlayerExecuter.js");
const utils_utils = require("../utils/utils.js");
require("../config/env.js");
if (!Math) {
  LoadingRound();
}
const LoadingRound = () => "./LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Speech",
  setup(__props, { emit }) {
    var _a;
    (_a = common_vendor.getCurrentInstance()) == null ? void 0 : _a.appContext.config.globalProperties.$bus;
    const recorder = common_vendor.ref({
      start: false,
      processing: false,
      completed: false,
      voiceFileName: null
    });
    const voicePlaying = common_vendor.ref(false);
    const handleSpeech = () => {
      if (recorder.value.start) {
        components_speechExecuter.speech.handleEndVoice();
        return;
      }
      components_audioPlayerExecuter.audioPlayer.stopAudio();
      recorder.value.start = true;
      recorder.value.completed = false;
      components_speechExecuter.speech.handleVoiceStart({
        processing: () => {
          recorder.value.processing = true;
        },
        success: ({ voiceFileName }) => {
          recorder.value.voiceFileName = voiceFileName;
          recorder.value.processing = false;
          recorder.value.start = false;
          recorder.value.completed = true;
        },
        interval: (interval) => {
          recorder.value.remainingTime = interval;
        },
        cancel: () => {
          recorder.value.processing = false;
          recorder.value.start = false;
        },
        error: (err) => {
          recorder.value.processing = false;
          recorder.value.start = false;
        }
      });
    };
    const handleSpeechEnd = () => {
      components_speechExecuter.speech.handleEndVoice();
    };
    const handleTrash = () => {
      recorder.value.completed = false;
    };
    const handlePlaySpeech = () => {
      if (!recorder.value.voiceFileName) {
        console.error("没有语音文件");
        return;
      }
      components_audioPlayerExecuter.audioPlayer.playAudio({
        audioUrl: utils_utils.utils.getVoiceFileUrl(recorder.value.voiceFileName),
        listener: {
          playing: () => {
            voicePlaying.value = true;
          },
          success: () => {
            voicePlaying.value = false;
            console.log(voicePlaying.value);
          },
          error: () => {
            voicePlaying.value = false;
          }
        }
      });
    };
    const handleSend = () => {
      if (!recorder.value.voiceFileName) {
        console.error("没有语音文件");
        return;
      }
      emit("success", {
        fileName: recorder.value.voiceFileName
      });
      recorder.value.completed = false;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !recorder.value.start && !recorder.value.completed
      }, !recorder.value.start && !recorder.value.completed ? {
        b: common_vendor.o(handleSpeech)
      } : {}, {
        c: recorder.value.start
      }, recorder.value.start ? {
        d: common_vendor.o(handleSpeechEnd)
      } : {}, {
        e: recorder.value.completed
      }, recorder.value.completed ? common_vendor.e({
        f: common_vendor.o(handleTrash),
        g: !voicePlaying.value
      }, !voicePlaying.value ? {} : {}, {
        h: voicePlaying.value,
        i: common_vendor.o(handlePlaySpeech),
        j: recorder.value.processing
      }, recorder.value.processing ? {} : {}, {
        k: !recorder.value.processing
      }, !recorder.value.processing ? {} : {}, {
        l: common_vendor.o(handleSend)
      }) : {});
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0e9e744f"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/components/Speech.vue"]]);
wx.createComponent(Component);
