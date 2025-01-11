"use strict";
const common_vendor = require("../../../common/vendor.js");
if (!Array) {
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  _easycom_uni_popup2();
}
const _easycom_uni_popup = () => "../../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (WordDetail + MessageGrammar + MessagePronunciation + _easycom_uni_popup)();
}
const MessageGrammar = () => "./MessageGrammar.js";
const MessagePronunciation = () => "./MessagePronunciation.js";
const WordDetail = () => "./WordDetail.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "MessageGrammarPopup",
  setup(__props, { expose }) {
    const grammarPopup = common_vendor.ref(null);
    const sessionId = common_vendor.ref("");
    const messageId = common_vendor.ref("");
    const messageContent = common_vendor.ref("");
    const fileName = common_vendor.ref("");
    const activeView = common_vendor.ref("grammar");
    common_vendor.ref(null);
    common_vendor.ref(null);
    const wordDetailShow = common_vendor.ref(false);
    const messageGrammarRef = common_vendor.ref(null);
    const messagePronunciationRef = common_vendor.ref(null);
    const wordDetailRef = common_vendor.ref(null);
    const popupBackgoundColor = common_vendor.ref("");
    common_vendor.onMounted(() => {
      {
        popupBackgoundColor.value = "#fff";
      }
    });
    const handleCloseWordDetail = () => {
      wordDetailShow.value = false;
      initData();
    };
    const handleWordDetail = (word) => {
      wordDetailShow.value = true;
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          wordDetailRef.value.initData(word, sessionId.value);
        }, 100);
      });
    };
    const handlePopupChange = ({ show, type }) => {
    };
    const handleActive = (active) => {
      activeView.value = active;
      initData();
    };
    const initData = () => {
      setTimeout(() => {
        if (activeView.value === "pronunciation") {
          common_vendor.nextTick$1(() => {
            messagePronunciationRef.value.initData();
          });
        } else {
          common_vendor.nextTick$1(() => {
            messageGrammarRef.value.initData();
          });
        }
      }, 100);
    };
    const handleClose = () => {
      grammarPopup.value.close();
      activeView.value = "grammar";
      wordDetailShow.value = false;
    };
    const open = (id, content, file, sessionIdVal, type) => {
      messageId.value = id;
      sessionId.value = sessionIdVal;
      messageContent.value = content;
      fileName.value = file;
      if (type && type === "pronunciation") {
        activeView.value = "pronunciation";
      } else {
        activeView.value = "grammar";
      }
      grammarPopup.value.open();
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          if (activeView.value === "pronunciation") {
            messagePronunciationRef.value.initData();
          } else {
            messageGrammarRef.value.initData();
          }
        }, 100);
      });
    };
    const handleWordClick = (word) => {
      handleWordDetail(word);
    };
    expose({
      open,
      handleClose
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(handleClose),
        b: wordDetailShow.value
      }, wordDetailShow.value ? {
        c: common_vendor.o(handleCloseWordDetail)
      } : {}, {
        d: !wordDetailShow.value
      }, !wordDetailShow.value ? {
        e: common_vendor.o(($event) => handleActive("grammar")),
        f: activeView.value === "grammar" ? 1 : "",
        g: common_vendor.o(($event) => handleActive("pronunciation")),
        h: activeView.value === "pronunciation" ? 1 : ""
      } : {}, {
        i: wordDetailShow.value
      }, wordDetailShow.value ? {
        j: common_vendor.sr(wordDetailRef, "ce932745-1,ce932745-0", {
          "k": "wordDetailRef"
        })
      } : {}, {
        k: activeView.value === "grammar" && !wordDetailShow.value
      }, activeView.value === "grammar" && !wordDetailShow.value ? {
        l: common_vendor.sr(messageGrammarRef, "ce932745-2,ce932745-0", {
          "k": "messageGrammarRef"
        }),
        m: common_vendor.p({
          ["message-id"]: messageId.value,
          ["session-id"]: sessionId.value
        })
      } : {}, {
        n: activeView.value === "pronunciation" && !wordDetailShow.value
      }, activeView.value === "pronunciation" && !wordDetailShow.value ? {
        o: common_vendor.sr(messagePronunciationRef, "ce932745-3,ce932745-0", {
          "k": "messagePronunciationRef"
        }),
        p: common_vendor.o(handleWordClick),
        q: common_vendor.p({
          ["message-id"]: messageId.value,
          ["session-id"]: sessionId.value,
          ["message-content"]: messageContent.value,
          ["file-name"]: fileName.value
        })
      } : {}, {
        r: common_vendor.sr(grammarPopup, "ce932745-0", {
          "k": "grammarPopup"
        }),
        s: common_vendor.o(handlePopupChange),
        t: common_vendor.p({
          type: "bottom",
          ["background-color"]: popupBackgoundColor.value
        })
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ce932745"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/chat/components/MessageGrammarPopup.vue"]]);
wx.createComponent(Component);
