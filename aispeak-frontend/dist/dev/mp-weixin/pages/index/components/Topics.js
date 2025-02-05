"use strict";
const common_vendor = require("../../../common/vendor.js");
const api_topic = require("../../../api/topic.js");
require("../../../axios/api.js");
require("../../../config/env.js");
if (!Math) {
  LoadingRound();
}
const LoadingRound = () => "../../../components/LoadingRound.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Topics",
  setup(__props) {
    const loading = common_vendor.ref(false);
    const topicData = common_vendor.ref(null);
    const activeType = common_vendor.ref("ROLE_PLAY");
    const activeGroup = common_vendor.ref(null);
    const topics = common_vendor.ref([]);
    common_vendor.onMounted(() => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      selectType("ROLE_PLAY");
    });
    const selectType = (type) => {
      activeType.value = type;
      loading.value = true;
      topics.value = [];
      api_topic.topicRequest.getTopicData({ type }).then((res) => {
        loading.value = false;
        topicData.value = res.data;
        if (res.data && res.data.length > 0) {
          handleActiveGroup(res.data[0]);
        } else {
          handleActiveGroup(null);
        }
      });
    };
    const handleActiveGroup = (group) => {
      if (group) {
        activeGroup.value = group.id;
        topics.value = group.topics;
      } else {
        activeGroup.value = null;
        topics.value = [];
      }
    };
    const goTopic = (topic) => {
      common_vendor.index.navigateTo({
        url: `/pages/topic/index?topicId=${topic.id}`
      });
    };
    const goAccountCreatePage = () => {
      common_vendor.index.navigateTo({
        url: `/pages/topic/topicCreate`
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.n(`tab ${activeType.value === "ROLE_PLAY" ? "tab-actice" : ""}`),
        b: common_vendor.o(($event) => selectType("ROLE_PLAY")),
        c: loading.value
      }, loading.value ? {} : {}, {
        d: activeType.value == "CHAT_TOPIC"
      }, activeType.value == "CHAT_TOPIC" ? {
        e: common_vendor.o(goAccountCreatePage)
      } : {}, {
        f: common_vendor.f(topicData.value, (group, k0, i0) => {
          return {
            a: common_vendor.t(group.name),
            b: group.id,
            c: common_vendor.n(`group-item ${activeGroup.value == group.id ? "active" : ""}`),
            d: common_vendor.o(($event) => handleActiveGroup(group), group.id)
          };
        }),
        g: common_vendor.f(topics.value, (topic, k0, i0) => {
          return common_vendor.e({
            a: topic.image_url
          }, topic.image_url ? {
            b: topic.image_url
          } : {}, {
            c: common_vendor.t(topic.name),
            d: common_vendor.f(topic.level, (index, k1, i1) => {
              return {
                a: "level_icon_" + topic.id + "_" + index
              };
            }),
            e: topic.completed === "1"
          }, topic.completed === "1" ? {} : {}, {
            f: topic.id,
            g: common_vendor.o(($event) => goTopic(topic), topic.id)
          });
        })
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ce3e018f"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/index/components/Topics.vue"]]);
wx.createComponent(Component);
