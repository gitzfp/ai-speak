"use strict";
const common_vendor = require("../../common/vendor.js");
const api_chat = require("../../api/chat.js");
const api_account = require("../../api/account.js");
const api_sys = require("../../api/sys.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Array) {
  const _component_AudioPlayer = common_vendor.resolveComponent("AudioPlayer");
  _component_AudioPlayer();
}
if (!Math) {
  Topics();
}
const Topics = () => "./components/Topics.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const roles = common_vendor.ref([]);
    const selectIndex = common_vendor.ref(0);
    const audioPlayerContent = common_vendor.ref("");
    const language = common_vendor.ref("");
    const redirectType = common_vendor.ref(null);
    const swiperCurrent = common_vendor.ref(0);
    common_vendor.onLoad((options) => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      if (options.redirectType) {
        redirectType.value = options.redirectType;
      }
    });
    common_vendor.onShow(() => {
      api_account.accountRequest.getSettings().then((data) => {
        language.value = data.data.target_language;
        initAudioPlayerContent();
        initRoles();
      });
    });
    const initAudioPlayerContent = () => {
      api_chat.chatRequest.languageExampleGet({
        language: language.value
      }).then((data) => {
        audioPlayerContent.value = data.data;
      });
    };
    const initRoles = () => {
      api_sys.sysRequest.getRoles({
        locale: language.value
      }).then((data) => {
        roles.value = data.data;
        api_account.accountRequest.getSettings().then((data2) => {
          let speechRoleName = data2.data.speech_role_name;
          if (speechRoleName) {
            let index = roles.value.findIndex(
              (m) => m.short_name == speechRoleName
            );
            if (index > -1) {
              selectIndex.value = index;
            }
          }
          common_vendor.nextTick$1(() => {
            swiperCurrent.value = selectIndex.value;
          });
        });
      });
    };
    const goChat = () => {
      common_vendor.index.navigateTo({
        url: "/pages/textbook/index"
      });
      return;
    };
    const handleRoleSelect = (role) => {
      selectIndex.value = roles.value.findIndex((m) => m.id === role.id);
      goChat();
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(roles.value, (m, k0, i0) => {
          var _a;
          return common_vendor.e({
            a: m.avatar
          }, m.avatar ? {
            b: m.avatar
          } : m.gender == "2" ? {} : {}, {
            c: m.gender == "2",
            d: common_vendor.t(m.local_name),
            e: common_vendor.f(m.styles.slice(0, 2), (style, k1, i1) => {
              return {
                a: common_vendor.t(style.label || "默认"),
                b: style.value
              };
            }),
            f: m.styles.length > 2
          }, m.styles.length > 2 ? {
            g: common_vendor.t(m.styles.length - 2)
          } : {}, {
            h: "83a5a03c-1-" + i0,
            i: common_vendor.p({
              content: audioPlayerContent.value,
              speechRoleName: m.short_name,
              speechRoleStyle: (_a = m.styles[0]) == null ? void 0 : _a.value
            }),
            j: m.id,
            k: common_vendor.o(($event) => handleRoleSelect(m), m.id)
          });
        })
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-83a5a03c"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/index/index.vue"]]);
wx.createPage(MiniProgramPage);
