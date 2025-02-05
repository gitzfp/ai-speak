"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "CommonHeader",
  props: {
    leftIcon: { type: Boolean },
    backFn: { type: Function },
    backgroundColor: null
  },
  setup(__props) {
    var _a, _b;
    const props = __props;
    const CustomBar = (_a = common_vendor.getCurrentInstance()) == null ? void 0 : _a.appContext.config.globalProperties.CustomBar;
    const StatusBar = (_b = common_vendor.getCurrentInstance()) == null ? void 0 : _b.appContext.config.globalProperties.StatusBar;
    const style = common_vendor.computed(
      () => `height:${CustomBar}px;padding-top:${StatusBar}px;`
    );
    const handleBack = () => {
      if (props.backFn) {
        props.backFn();
      } else {
        common_vendor.index.navigateBack({
          delta: 1
        });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.leftIcon
      }, __props.leftIcon ? {} : {}, {
        b: common_vendor.o(handleBack),
        c: common_vendor.s(common_vendor.unref(style)),
        d: common_vendor.unref(CustomBar) + "px",
        e: __props.backgroundColor ? __props.backgroundColor : "inhert"
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1bc5cecc"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/components/CommonHeader.vue"]]);
wx.createComponent(Component);
