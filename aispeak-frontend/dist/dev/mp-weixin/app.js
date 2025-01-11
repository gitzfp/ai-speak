"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const utils_bus = require("./utils/bus.js");
if (!Math) {
  "./pages/login/index.js";
  "./pages/index/index.js";
  "./pages/textbook/index.js";
  "./pages/textbook/courses.js";
  "./pages/textbook/lesson.js";
  "./pages/index/switchRole.js";
  "./pages/chat/index.js";
  "./pages/chat/settings.js";
  "./pages/practice/index.js";
  "./pages/my/index.js";
  "./pages/my/learnLanguage.js";
  "./pages/contact/index.js";
  "./pages/feedback/index.js";
  "./pages/topic/index.js";
  "./pages/topic/history.js";
  "./pages/topic/phrase.js";
  "./pages/topic/completion.js";
  "./pages/topic/topicCreate.js";
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "App",
  setup(__props) {
    common_vendor.ref(null);
    common_vendor.ref(0);
    common_vendor.ref(0);
    common_vendor.ref(null);
    common_vendor.onLaunch(() => {
    });
    common_vendor.onShow(() => {
    });
    common_vendor.onHide(() => {
    });
    return () => {
    };
  }
});
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/App.vue"]]);
const getHeight = (global) => {
  common_vendor.index.getSystemInfo({
    success: (e) => {
      global.StatusBar = e.statusBarHeight || 0;
      if (e.platform === "android") {
        global.CustomBar = global.StatusBar + 50;
      } else {
        global.CustomBar = global.StatusBar + 45;
      }
      global.Custom = common_vendor.wx$1.getMenuButtonBoundingClientRect();
      let customBar = global.Custom.bottom + global.Custom.top - global.StatusBar + 4;
      global.CustomBar = customBar;
    }
  });
};
function createApp() {
  const $bus = new utils_bus.EventBus();
  const app = common_vendor.createSSRApp(App);
  app.provide("$bus", $bus);
  app.config.globalProperties.$bus = $bus;
  getHeight(app.config.globalProperties);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
