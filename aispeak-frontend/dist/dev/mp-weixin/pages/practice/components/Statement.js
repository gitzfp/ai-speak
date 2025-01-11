"use strict";
const common_vendor = require("../../../common/vendor.js");
const api_account = require("../../../api/account.js");
require("../../../axios/api.js");
require("../../../config/env.js");
if (!Math) {
  AudioPlayer();
}
const AudioPlayer = () => "../../../components/AudioPlayer.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Statement",
  props: {
    collect: null,
    cannotCancel: { type: Boolean }
  },
  setup(__props, { emit }) {
    const props = __props;
    const handleDelete = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "是否删除该收藏",
        confirmColor: "#6236ff",
        success: (res) => {
          if (res.confirm) {
            api_account.accountRequest.cancelCollect({
              type: props.collect.type,
              message_id: props.collect.message_id,
              content: props.collect.content
            }).then(() => {
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "none"
              });
              emit("deleteCollect", props.collect);
            });
          } else if (res.cancel)
            ;
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(__props.collect.content),
        b: common_vendor.p({
          messageId: __props.collect.message_id,
          content: __props.collect.content
        }),
        c: !__props.cannotCancel
      }, !__props.cannotCancel ? {
        d: common_vendor.o(handleDelete)
      } : {}, {
        e: common_vendor.t(__props.collect.translation)
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/practice/components/Statement.vue"]]);
wx.createComponent(Component);
