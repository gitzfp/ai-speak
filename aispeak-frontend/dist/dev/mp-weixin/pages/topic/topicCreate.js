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
  __name: "topicCreate",
  setup(__props) {
    const randomInput = common_vendor.ref({
      my_role: "",
      ai_role: "",
      topic: ""
    });
    common_vendor.ref([]);
    common_vendor.onLoad(() => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      initMyTopics();
    });
    const initMyTopics = () => {
      api_topic.topicRequest.getMyTopics().then((res) => {
        console.log(res.data);
      });
    };
    const handleRandomTopic = () => {
      api_topic.topicRequest.getTopicExample().then((res) => {
        randomInput.value = res.data;
      });
    };
    const createTopic = () => {
      const { my_role, ai_role, topic } = randomInput.value;
      if (!my_role || !ai_role || !topic) {
        common_vendor.index.showToast({
          title: "请填写完整",
          icon: "none"
        });
        return;
      }
      api_topic.topicRequest.createTopic({ my_role, ai_role, topic }).then((res) => {
        res.data;
        common_vendor.index.navigateTo({
          url: `/pages/chat/index?accountTopicId=account_topic_id`
        });
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          leftIcon: true,
          backgroundColor: "#F5F5FE"
        }),
        b: common_vendor.o(handleRandomTopic),
        c: randomInput.value.my_role,
        d: randomInput.value.ai_role,
        e: randomInput.value.topic,
        f: common_vendor.o(createTopic)
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fa88a425"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/topic/topicCreate.vue"]]);
wx.createPage(MiniProgramPage);
