"use strict";
const common_vendor = require("../../common/vendor.js");
const api_topic = require("../../api/topic.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  CommonHeader();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "history",
  setup(__props) {
    const topicId = common_vendor.ref("");
    const loading = common_vendor.ref(false);
    const historyArray = common_vendor.ref([]);
    common_vendor.onLoad((props) => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      topicId.value = props.topicId;
      initData(props.topicId);
    });
    const initData = (topicId2) => {
      loading.value = true;
      api_topic.topicRequest.getTopicHistory(topicId2).then((data) => {
        loading.value = false;
        historyArray.value = data.data;
      });
    };
    const handleBackPage = () => {
      common_vendor.index.navigateTo({
        url: `/pages/topic/index?topicId=${topicId.value}`
      });
    };
    const goDetail = (history) => {
      if (history.completed == 1) {
        common_vendor.index.navigateTo({
          url: `/pages/topic/completion?topicId=${topicId.value}&sessionId=${history.session_id}`
        });
      } else {
        common_vendor.index.navigateTo({
          url: `/pages/chat/index?sessionId=${history.session_id}&backPage=topic&topicId=${topicId.value}`
        });
      }
    };
    const handleDelete = (history) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "是否删除该历史记录",
        confirmColor: "#6236ff",
        success: (res) => {
          if (res.confirm) {
            const params = {
              topic_id: history.topic_id,
              session_id: history.session_id
            };
            api_topic.topicRequest.deleteTopicHistory(params).then(() => {
              common_vendor.index.showToast({
                title: "删除成功",
                icon: "none"
              });
              initData(topicId.value);
            });
          } else if (res.cancel)
            ;
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          leftIcon: true,
          ["back-fn"]: handleBackPage,
          backgroundColor: "#F5F5FE"
        }),
        b: historyArray.value.length > 0
      }, historyArray.value.length > 0 ? {
        c: common_vendor.f(historyArray.value, (history, k0, i0) => {
          return common_vendor.e({
            a: history.topic.image_url,
            b: common_vendor.o(($event) => goDetail(history)),
            c: common_vendor.t(history.topic.topic),
            d: common_vendor.t(history.create_time),
            e: history.completed === "1"
          }, history.completed === "1" ? {} : {}, {
            f: history.completed === "1" ? 1 : "",
            g: common_vendor.o(($event) => goDetail(history)),
            h: common_vendor.o(($event) => handleDelete(history))
          });
        })
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d220bb64"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/topic/history.vue"]]);
wx.createPage(MiniProgramPage);
