"use strict";
const common_vendor = require("../common/vendor.js");
const api_account = require("../api/account.js");
require("../axios/api.js");
require("../config/env.js");
if (!Math) {
  LoadingRound();
}
const LoadingRound = () => "./LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Collect",
  props: {
    type: null,
    messageId: null,
    content: null
  },
  setup(__props) {
    const props = __props;
    getApp();
    const collected = common_vendor.ref(false);
    const collectLoading = common_vendor.ref(false);
    const requestParams = {
      type: props.type,
      message_id: props.messageId ? props.messageId : "",
      content: props.content ? props.content : ""
    };
    common_vendor.onMounted(() => {
      if (!props.messageId && !props.content) {
        console.warn(`Collect组件需要传入messageId或content,当前传入的参数为${JSON.stringify(props)}`);
        return;
      }
      api_account.accountRequest.collectGet(requestParams).then((data) => {
        collected.value = data.data.is_collect;
      });
    });
    const handleCollect = () => {
      if (collectLoading.value) {
        return;
      }
      collectLoading.value = true;
      api_account.accountRequest.collect(requestParams).then(() => {
        collected.value = true;
        collectLoading.value = false;
      });
    };
    const handleCancel = () => {
      if (collectLoading.value) {
        return;
      }
      collectLoading.value = true;
      api_account.accountRequest.cancelCollect(requestParams).then(() => {
        collected.value = false;
        collectLoading.value = false;
      });
    };
    return (_ctx, _cache) => {
      return {
        a: collectLoading.value,
        b: common_vendor.o(handleCollect),
        c: !collectLoading.value && !collected.value,
        d: common_vendor.o(handleCancel),
        e: !collectLoading.value && collected.value
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2251c80e"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/components/Collect.vue"]]);
wx.createComponent(Component);
