"use strict";
const common_vendor = require("../common/vendor.js");
if (!Math) {
  SeekBar();
}
const SeekBar = () => "./Rare2.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Rate",
  props: {
    rate: null
  },
  setup(__props) {
    common_vendor.onMounted(() => {
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.rate && __props.rate > 0
      }, __props.rate && __props.rate > 0 ? {
        b: common_vendor.p({
          width: 140,
          processVal: __props.rate
        })
      } : {});
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8576ae7b"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/components/Rate.vue"]]);
wx.createComponent(Component);
