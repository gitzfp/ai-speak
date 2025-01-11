"use strict";
const common_vendor = require("../../common/vendor.js");
const api_account = require("../../api/account.js");
const api_chat = require("../../api/chat.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  (CommonHeader + Checkbox)();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const Checkbox = () => "../../components/Checkbox.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "settings",
  setup(__props) {
    const settingInfo = common_vendor.ref({});
    const sessionId = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      sessionId.value = options.sessionId;
    });
    common_vendor.onShow(() => {
      api_account.accountRequest.getSettings().then((data) => {
        if (data.code === 1e3) {
          settingInfo.value = data.data;
        }
      });
    });
    const goSwitchRole = () => {
      common_vendor.index.navigateTo({
        url: "/pages/index/switchRole"
      });
    };
    const handleBackPage = () => {
      common_vendor.index.navigateBack({
        delta: 1
      });
    };
    const selectTab = (id) => {
      settingInfo.value.playing_voice_speed = id;
      api_account.accountRequest.setSettings({
        "playing_voice_speed": id
      }).then((data) => {
        console.log(data);
        if (data.code === 1e3) {
          console.log("设置成功");
        }
      });
    };
    const inputCheck = (type, check) => {
      api_account.accountRequest.setSettings({
        [type]: check ? 1 : 0
      }).then((data) => {
        console.log(data);
        if (data.code === 1e3) {
          console.log("设置成功");
        }
      });
    };
    const deleteLatestMessages = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定清空上一次聊天记录吗？",
        success: function(res) {
          if (res.confirm) {
            console.log("用户点击确定");
            api_chat.chatRequest.messagesLatestDelete(sessionId.value).then((data) => {
              console.log(data);
              common_vendor.index.showToast({
                title: "清空成功",
                icon: "none"
              });
              common_vendor.index.navigateTo({
                url: `/pages/chat/index?sessionId=${sessionId.value}`
              });
            });
          } else if (res.cancel) {
            console.log("用户点击取消");
          }
        }
      });
    };
    const deleteAllMessages = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定清空聊天记录吗？",
        success: function(res) {
          if (res.confirm) {
            console.log("用户点击确定");
            api_chat.chatRequest.messagesAllDelete(sessionId.value).then((data) => {
              console.log(data);
              common_vendor.index.showToast({
                title: "清空成功",
                icon: "none"
              });
              common_vendor.index.navigateTo({
                url: `/pages/chat/index?sessionId=${sessionId.value}`
              });
            });
          } else if (res.cancel) {
            console.log("用户点击取消");
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          leftIcon: true,
          ["back-fn"]: handleBackPage,
          title: "AISPeak"
        }),
        b: common_vendor.t(settingInfo.value.speech_role_name_label || "默认角色"),
        c: common_vendor.o(goSwitchRole),
        d: common_vendor.o((check) => inputCheck("auto_playing_voice", check)),
        e: common_vendor.p({
          checked: settingInfo.value.auto_playing_voice === 1
        }),
        f: common_vendor.o((check) => inputCheck("auto_text_shadow", check)),
        g: common_vendor.p({
          checked: settingInfo.value.auto_text_shadow === 1
        }),
        h: common_vendor.o((check) => inputCheck("auto_pronunciation", check)),
        i: common_vendor.p({
          checked: settingInfo.value.auto_pronunciation === 1
        }),
        j: common_vendor.n(`tab-item ${settingInfo.value.playing_voice_speed == "0.5" ? "tab-item-select" : ""}`),
        k: common_vendor.o(($event) => selectTab("0.5")),
        l: common_vendor.n(`tab-item ${settingInfo.value.playing_voice_speed == "1.0" ? "tab-item-select" : ""}`),
        m: common_vendor.o(($event) => selectTab("1.0")),
        n: common_vendor.n(`tab-item ${settingInfo.value.playing_voice_speed == "1.5" ? "tab-item-select" : ""}`),
        o: common_vendor.o(($event) => selectTab("1.5")),
        p: common_vendor.o(deleteLatestMessages),
        q: common_vendor.o(deleteAllMessages)
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1fcfa29c"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/chat/settings.vue"]]);
wx.createPage(MiniProgramPage);
