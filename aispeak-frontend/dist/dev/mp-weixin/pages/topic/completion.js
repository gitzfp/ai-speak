"use strict";
const common_vendor = require("../../common/vendor.js");
const api_topic = require("../../api/topic.js");
const api_chat = require("../../api/chat.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  (CommonHeader + MessageContent)();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const MessageContent = () => "../chat/components/MessageContent.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "completion",
  setup(__props) {
    const loading = common_vendor.ref(false);
    const messageLoading = common_vendor.ref(false);
    const topicHistory = common_vendor.ref(null);
    const redirectType = common_vendor.ref(null);
    const messageSession = common_vendor.ref({
      id: void 0,
      speech_role_name: "",
      avatar: "",
      messages: { total: 0, list: [] },
      topic_id: ""
    });
    const messages = common_vendor.ref([]);
    common_vendor.onLoad((props) => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      if (props.redirectType) {
        redirectType.value = props.redirectType;
      }
      initData(props.topicId, props.sessionId);
    });
    const initData = (topicId, sessionId) => {
      loading.value = true;
      api_topic.topicRequest.getTopicCompletation({ topic_id: topicId, session_id: sessionId }).then((res) => {
        loading.value = false;
        topicHistory.value = res.data;
      });
      messageLoading.value = true;
      api_chat.chatRequest.sessionDetailsGet({ sessionId }).then((res) => {
        messageLoading.value = false;
        messageSession.value = res.data;
        messageSession.value.messages.list.forEach((item) => {
          messages.value.push({
            id: item.id,
            session_id: item.session_id,
            content: item.content,
            role: item.role,
            owner: item.role === "USER",
            file_name: item.file_name,
            auto_hint: false,
            auto_play: false,
            auto_pronunciation: false,
            pronunciation: item.pronunciation
          });
        });
      });
    };
    const handleBackFn = () => {
      if (redirectType.value === "index") {
        common_vendor.index.switchTab({
          url: "/pages/textbook/index"
        });
      } else {
        common_vendor.index.navigateBack();
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          leftIcon: true,
          backFn: handleBackFn,
          backgroundColor: "#F5F5FE"
        }),
        b: topicHistory.value
      }, topicHistory.value ? {
        c: common_vendor.t(topicHistory.value.main_target_completed_count + topicHistory.value.trial_target_completed_count),
        d: common_vendor.t(topicHistory.value.main_target_count + topicHistory.value.trial_target_count),
        e: common_vendor.t(topicHistory.value.content_score),
        f: common_vendor.t(topicHistory.value.word_count)
      } : {}, {
        g: topicHistory.value
      }, topicHistory.value ? {
        h: common_vendor.t(topicHistory.value.suggestion)
      } : {}, {
        i: messageSession.value
      }, messageSession.value ? {
        j: common_vendor.f(messages.value, (message, index, i0) => {
          return {
            a: common_vendor.sr("messageListRef", "fec29e2e-1-" + i0, {
              "f": 1
            }),
            b: "fec29e2e-1-" + i0,
            c: common_vendor.p({
              ["auto-hint"]: false,
              ["auto-play"]: false,
              ["auto-pronunciation"]: false,
              message,
              ["message-session"]: messageSession.value
            }),
            d: message.id
          };
        })
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fec29e2e"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/topic/completion.vue"]]);
wx.createPage(MiniProgramPage);
