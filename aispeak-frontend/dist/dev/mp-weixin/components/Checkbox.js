"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Checkbox",
  props: {
    checked: { type: Boolean }
  },
  emits: ["input"],
  setup(__props, { emit }) {
    const props = __props;
    const title = common_vendor.ref("Hello");
    const isCheck = common_vendor.ref(false);
    setTimeout(() => {
      title.value = "首页";
    }, 3e3);
    const checkIt = (e) => {
      e.stopPropagation();
      isCheck.value = !isCheck.value;
      emit("input", isCheck.value);
    };
    common_vendor.watch(
      () => props.checked,
      (newVal) => {
        console.log("props.checked", props.checked);
        isCheck.value = !!props.checked;
      }
    );
    common_vendor.onMounted(() => {
      console.log("props.checked", props.checked);
      isCheck.value = !!props.checked;
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.n(isCheck.value ? "checkbox-box-ico" : "checkbox-box-ico un-checkbox-box-ico"),
        b: common_vendor.n(!isCheck.value ? "checkbox-box-ico" : "checkbox-box-ico un-checkbox-box-ico"),
        c: common_vendor.o(checkIt)
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/components/Checkbox.vue"]]);
wx.createComponent(Component);
