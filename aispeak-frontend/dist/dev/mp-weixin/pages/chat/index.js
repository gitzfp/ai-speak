"use strict";
const common_vendor = require("../../common/vendor.js");
const api_chat = require("../../api/chat.js");
const api_account = require("../../api/account.js");
const api_topic = require("../../api/topic.js");
const api_textbook = require("../../api/textbook.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Array) {
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  _easycom_uni_popup2();
}
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (CommonHeader + MessageContent + Prompt + Speech + _easycom_uni_popup)();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const MessageContent = () => "./components/MessageContent.js";
const Prompt = () => "./components/Prompt.js";
const Speech = () => "./components/MessageSpeech.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    var _a;
    const session = common_vendor.ref({
      id: void 0,
      type: void 0,
      messages: { total: 0, list: [] },
      name: "",
      completed: 0
    });
    const messages = common_vendor.ref([]);
    const inputTypeVoice = common_vendor.ref(true);
    const inputText = common_vendor.ref("");
    const menuSwitchDown = common_vendor.ref(true);
    const inputBottom = common_vendor.ref(0);
    const lessonData = common_vendor.ref({
      detail: {
        theme_desc: "",
        chat_nums: 0,
        lesson_id: 0
      },
      task_target: []
    });
    const teacher = common_vendor.ref({
      name: "",
      avatar: "",
      lesson_id: null,
      prompt: "",
      description: ""
    });
    const messageListRef = common_vendor.ref([]);
    const accountSetting = common_vendor.ref({
      auto_playing_voice: 0,
      auto_text_shadow: 0,
      auto_pronunciation: 0,
      playing_voice_speed: "1.0",
      speech_role_name_label: "",
      speech_role_name: "",
      target_language: ""
    });
    const $bus = (_a = common_vendor.getCurrentInstance()) == null ? void 0 : _a.appContext.config.globalProperties.$bus;
    const popup = common_vendor.ref(null);
    const inputFocus = (e) => {
      inputBottom.value = e.detail.height;
    };
    const inputHasText = common_vendor.computed(() => {
      return !!(inputText.value && inputText.value.trim());
    });
    const sendMessageHandler = (info) => {
      if (!info.text) {
        sendSpeech(info.fileName);
      } else {
        sendMessage(info.text, info.fileName);
      }
    };
    const loadLesson = async (lessonId) => {
      try {
        const res = await api_textbook.textbookRequest.getLessonDetail(lessonId);
        console.log("Chatpage loadLesson API Response:", res);
        if (res.data) {
          lessonData.value = {
            ...res.data,
            exercise_list: res.data.exercise_list || []
          };
          teacher.value = res.data.teacher;
          console.log("Loaded lesson data:", lessonData.value, teacher.value);
        } else {
          throw new Error("No data returned from server");
        }
      } catch (e) {
        console.error("Load lesson error:", e);
      }
    };
    common_vendor.onLoad((option) => {
      if (option.type === "LESSON") {
        session.value.type = "LESSON";
        loadLesson(option.lessonId);
      }
      initData(option.sessionId, option.sessionName);
      common_vendor.index.setNavigationBarTitle({
        title: "AI-Speak"
      });
      console.log("Onload", option);
      $bus.on("SendMessage", sendMessageHandler);
    });
    common_vendor.onMounted(() => {
    });
    common_vendor.onBeforeUnmount(() => {
      $bus.off("SendMessage", sendMessageHandler);
    });
    common_vendor.onShow(() => {
      api_account.accountRequest.getSettings().then((data) => {
        accountSetting.value = data.data;
      });
    });
    const handleInput = (event) => {
      console.log(event);
      if (event.keyCode === 13) {
        handleSendText();
      }
    };
    const handleSendText = () => {
      if (!inputHasText.value) {
        return;
      }
      const inputTextValue = inputText.value;
      inputText.value = "";
      sendMessage(inputTextValue);
    };
    const handleSwitchMenu = () => {
      common_vendor.index.navigateTo({
        url: `/pages/chat/settings?sessionId=${session.value.id}`
      });
    };
    const sendSpeech = (fileName) => {
      const ownertTimestamp = new Date().getTime();
      const ownMessage = {
        id: ownertTimestamp,
        content: null,
        owner: true,
        file_name: fileName,
        role: "USER",
        auto_hint: false,
        auto_play: false
      };
      messages.value.push(ownMessage);
      scrollToBottom();
      api_chat.chatRequest.transformText({ file_name: fileName, sessionId: session.value.id }).then((data) => {
        messages.value = messages.value.filter(
          (item) => item.id !== ownertTimestamp
        );
        let text = data.data;
        if (!text || text.trim() === "") {
          common_vendor.index.showToast({
            title: "语音转文本失败，请稍后再试.",
            icon: "none"
          });
          return;
        }
        sendMessage(text, fileName);
      });
    };
    const sendMessage = (message, fileName) => {
      console.log("send file name");
      const ownertTimestamp = new Date().getTime();
      const ownMessage = {
        id: ownertTimestamp,
        session_id: session.value.id,
        content: message,
        owner: true,
        file_name: fileName,
        role: "USER",
        auto_hint: false,
        auto_play: false,
        auto_pronunciation: false
      };
      messages.value.push(ownMessage);
      const timestamp = new Date().getTime() + 1;
      const aiMessage = {
        id: timestamp,
        session_id: session.value.id,
        content: null,
        owner: false,
        file_name: null,
        role: "ASSISTANT",
        auto_hint: false,
        auto_play: false,
        auto_pronunciation: false,
        achieved_target: false
        // Add achieved_target property
      };
      messages.value.push(aiMessage);
      scrollToBottom();
      api_chat.chatRequest.sessionChatInvoke({
        sessionId: session.value.id,
        message,
        file_name: fileName
      }).then((data) => {
        var _a2;
        data = data.data;
        session.value.completed = data.completed;
        if (data.achieved_targets) {
          if (((_a2 = data.achieved_targets) == null ? void 0 : _a2.length) > 0 && message === data.achieved_targets[data.achieved_targets.length - 1].user_say) {
            ownMessage.achieved_target = true;
          }
        }
        messages.value = messages.value.filter(
          (item) => item.id !== timestamp && item.id !== ownertTimestamp
        );
        ownMessage.id = data == null ? void 0 : data.send_message_id;
        ownMessage.auto_pronunciation = true;
        messages.value.push({
          ...ownMessage
        });
        messages.value.push({
          ...aiMessage,
          id: data.id,
          content: data.data,
          auto_hint: accountSetting.value.auto_text_shadow == 1,
          auto_play: accountSetting.value.auto_playing_voice == 1
        });
        common_vendor.nextTick$1(() => {
          scrollToBottom();
        });
      }).catch((e) => {
        common_vendor.index.showToast({
          title: "发送失败..",
          icon: "none"
        });
        console.error(e);
        messages.value.pop();
        messages.value.pop();
      });
    };
    const handleSwitchInputType = () => {
      inputTypeVoice.value = !inputTypeVoice.value;
    };
    const initData = (sessionId, sessionName) => {
      api_chat.chatRequest.sessionDetailsGet({ sessionId }).then((res) => {
        session.value = res.data;
        session.value.name = sessionName;
        session.value.completed = res.data.completed;
        messages.value = [];
        if (session.value.messages.total === 0) {
          const timestamp = new Date().getTime();
          const aiMessage = {
            id: timestamp,
            session_id: session.value.id,
            content: null,
            owner: false,
            file_name: null,
            role: "ASSISTANT",
            auto_hint: false,
            auto_play: false,
            auto_pronunciation: false
          };
          messages.value.push(aiMessage);
          api_chat.chatRequest.sessionInitGreeting(sessionId).then((res2) => {
            messages.value.pop();
            session.value.messages.list.push(res2.data);
            messages.value.push({
              id: res2.data.id,
              session_id: res2.data.session_id,
              content: res2.data.content,
              role: res2.data.role,
              owner: res2.data.role === "USER",
              auto_hint: accountSetting.value.auto_text_shadow == 1,
              auto_play: accountSetting.value.auto_playing_voice == 1,
              auto_pronunciation: false,
              pronunciation: null
            });
            common_vendor.nextTick$1(() => {
              scrollToBottom();
            });
          });
          return;
        }
        session.value.messages.list.forEach((item) => {
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
        scrollToBottom();
      });
    };
    const handleBackPage = () => {
      if (session.value.type === "TOPIC" || session.value.type === "LESSON") {
        common_vendor.index.showModal({
          title: "是否结束话题",
          content: "是否结束并且评分话题",
          success: (res) => {
            if (res.confirm) {
              completeTopic();
            } else if (res.cancel) {
              common_vendor.index.navigateBack();
            }
          }
        });
      } else {
        common_vendor.index.navigateBack();
      }
    };
    const completeTopic = () => {
      api_topic.topicRequest.completeTopic({ session_id: session.value.id }).then((res) => {
        common_vendor.index.navigateTo({
          url: `/pages/topic/completion?sessionId=${session.value.id}&redirectType=index`
        });
      });
    };
    const handlePracticeAgain = () => {
      const lessonId = lessonData.value.detail.lesson_id;
      api_topic.topicRequest.createLessonSession({ lesson_id: lessonId }).then((res) => {
        initData(res.data.id, res.data.name);
      });
    };
    const scrollToBottom = () => {
      if (messages.value.length === 0) {
        return;
      }
      common_vendor.nextTick$1(() => {
        common_vendor.index.pageScrollTo({
          scrollTop: 1e4,
          duration: 100
        });
      });
    };
    const handleShowModal = () => {
      popup.value.open();
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(session.value.name),
        b: common_vendor.p({
          ["background-color"]: "#fff",
          leftIcon: true,
          ["back-fn"]: handleBackPage,
          title: "聊天"
        }),
        c: common_vendor.f(messages.value, (message, index, i0) => {
          return {
            a: common_vendor.sr(messageListRef, "da04a0a0-1-" + i0, {
              "k": "messageListRef",
              "f": 1
            }),
            b: "da04a0a0-1-" + i0,
            c: common_vendor.p({
              ["auto-hint"]: messages.value.auto_text_shadow,
              ["auto-play"]: accountSetting.value.auto_playing_voice,
              ["auto-pronunciation"]: accountSetting.value.auto_pronunciation,
              message
            }),
            d: message.id
          };
        }),
        d: !session.value.completed
      }, !session.value.completed ? common_vendor.e({
        e: !inputTypeVoice.value
      }, !inputTypeVoice.value ? {
        f: common_vendor.o(handleSwitchInputType),
        g: common_vendor.o(inputFocus),
        h: common_vendor.o(handleSendText),
        i: common_vendor.o([($event) => inputText.value = $event.detail.value, handleInput]),
        j: inputText.value,
        k: common_vendor.o(handleSendText),
        l: common_vendor.unref(inputHasText) ? 1 : "",
        m: common_vendor.s("bottom:" + inputBottom.value + "px;")
      } : {}, {
        n: inputTypeVoice.value
      }, inputTypeVoice.value ? common_vendor.e({
        o: menuSwitchDown.value
      }, menuSwitchDown.value ? {
        p: common_vendor.p({
          sessionId: session.value.id
        })
      } : {}, {
        q: common_vendor.o(handleSwitchInputType),
        r: common_vendor.o(handleSwitchMenu),
        s: common_vendor.p({
          ["session-id"]: session.value.id
        })
      }) : {}) : {}, {
        t: session.value.completed
      }, session.value.completed ? {
        v: common_vendor.o(handlePracticeAgain),
        w: common_vendor.o(completeTopic)
      } : {}, {
        x: common_vendor.o(handleShowModal),
        y: common_vendor.t(lessonData.value.detail.theme_desc),
        z: common_vendor.f(lessonData.value.task_target, (target, index, i0) => {
          return {
            a: common_vendor.t(target.info_cn),
            b: common_vendor.t(target.info_en),
            c: common_vendor.o(($event) => _ctx.playAudio(target.info_en), index),
            d: index
          };
        }),
        A: common_vendor.o(($event) => popup.value.close()),
        B: common_vendor.sr(popup, "da04a0a0-4", {
          "k": "popup"
        }),
        C: common_vendor.p({
          type: "bottom"
        })
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-da04a0a0"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/chat/index.vue"]]);
wx.createPage(MiniProgramPage);
