"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "LoadingRound",
  props: {
    minHeight: null
  },
  setup(__props) {
    const props = __props;
    const containerStyle = common_vendor.computed(
      () => {
        if (props.minHeight) {
          return `min-height:${props.minHeight}rpx;`;
        }
        return "";
      }
    );
    return (_ctx, _cache) => {
      return {
        a: common_vendor.s(common_vendor.unref(containerStyle))
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-591bce23"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/components/LoadingRound.vue"]]);
wx.createComponent(Component);
