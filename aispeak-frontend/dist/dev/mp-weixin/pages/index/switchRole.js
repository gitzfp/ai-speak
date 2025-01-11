"use strict";
const common_vendor = require("../../common/vendor.js");
const api_chat = require("../../api/chat.js");
const api_account = require("../../api/account.js");
const api_sys = require("../../api/sys.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  (CommonHeader + AudioPlayer)();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const AudioPlayer = () => "../../components/AudioPlayer.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "switchRole",
  setup(__props) {
    const roles = common_vendor.ref([]);
    const duration = common_vendor.ref(500);
    const interval = common_vendor.ref(2e3);
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
    const swiperChange = (info) => {
      selectIndex.value = info.detail.current;
    };
    const confirmUpdate = () => {
      let role = roles.value[selectIndex.value];
      api_account.accountRequest.setSettings({
        speech_role_name: role.short_name
      }).then((data) => {
        common_vendor.index.showToast({
          title: "切换成功",
          icon: "none",
          duration: 2e3
        });
        common_vendor.index.navigateBack();
      });
    };
    const handleBackPage = () => {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(handleBackPage),
        b: common_vendor.p({
          ["left-icon"]: true,
          ["back-fn"]: handleBackPage,
          title: "聊天"
        }),
        c: common_vendor.f(roles.value, (m, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(m.local_name),
            b: m.avatar
          }, m.avatar ? {
            c: m.avatar
          } : m.gender == "2" ? {} : {}, {
            d: m.gender == "2",
            e: common_vendor.f(m.styles, (style, k1, i1) => {
              return {
                a: common_vendor.t(style.label || "默认"),
                b: style,
                c: "304d792d-1-" + i0 + "-" + i1,
                d: common_vendor.p({
                  content: audioPlayerContent.value,
                  speechRoleName: m.short_name,
                  speechRoleStyle: style.value
                })
              };
            }),
            f: m.id
          });
        }),
        d: interval.value,
        e: duration.value,
        f: common_vendor.o(swiperChange),
        g: swiperCurrent.value,
        h: common_vendor.o(confirmUpdate)
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-304d792d"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/index/switchRole.vue"]]);
wx.createPage(MiniProgramPage);
