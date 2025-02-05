"use strict";
const common_vendor = require("../../common/vendor.js");
const api_topic = require("../../api/topic.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  (CommonHeader + LoadingRound)();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const LoadingRound = () => "../../components/LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const loading = common_vendor.ref(false);
    const topicDetail = common_vendor.ref(null);
    common_vendor.onLoad((props) => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      getTopicDetail(props.topicId);
    });
    const getTopicDetail = (topicId) => {
      loading.value = true;
      api_topic.topicRequest.getTopicDetail(topicId).then((res) => {
        loading.value = false;
        topicDetail.value = res.data;
      });
    };
    const goTopicHistory = () => {
      common_vendor.index.navigateTo({
        url: `/pages/topic/history?topicId=${topicDetail.value.id}`
      });
    };
    const goTopicPurchase = () => {
      common_vendor.index.navigateTo({
        url: `/pages/topic/phrase?topicId=${topicDetail.value.id}`
      });
    };
    const goChat = () => {
      api_topic.topicRequest.createSession({ topic_id: topicDetail.value.id }).then((res) => {
        console.log(res.data.id);
        common_vendor.index.navigateTo({
          url: `/pages/chat/index?sessionId=${res.data.id}`
        });
      });
    };
    const handleBackPage = () => {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          leftIcon: true,
          ["back-fn"]: handleBackPage,
          backgroundColor: "#F5F5FE"
        }),
        b: loading.value
      }, loading.value ? {} : {}, {
        c: topicDetail.value
      }, topicDetail.value ? common_vendor.e({
        d: topicDetail.value.image_url,
        e: common_vendor.t(topicDetail.value.name),
        f: common_vendor.o(goTopicHistory),
        g: common_vendor.t(topicDetail.value.description),
        h: common_vendor.f(topicDetail.value.main_targets, (main_target, k0, i0) => {
          return {
            a: common_vendor.t(main_target.description),
            b: main_target.id
          };
        }),
        i: topicDetail.value.trial_targets && topicDetail.value.trial_targets.length > 0
      }, topicDetail.value.trial_targets && topicDetail.value.trial_targets.length > 0 ? {
        j: common_vendor.f(topicDetail.value.trial_targets, (main_target, k0, i0) => {
          return {
            a: common_vendor.t(main_target.description),
            b: main_target.id
          };
        })
      } : {}) : {}, {
        k: common_vendor.o(goTopicPurchase),
        l: common_vendor.o(goChat)
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-253cffcd"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/topic/index.vue"]]);
wx.createPage(MiniProgramPage);
