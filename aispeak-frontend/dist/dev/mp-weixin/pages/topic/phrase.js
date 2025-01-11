"use strict";
const common_vendor = require("../../common/vendor.js");
const api_topic = require("../../api/topic.js");
const api_account = require("../../api/account.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  (CommonHeader + Statement)();
}
const CommonHeader = () => "../../components/CommonHeader.js";
const Statement = () => "../practice/components/Statement.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "phrase",
  setup(__props) {
    const topicId = common_vendor.ref("");
    const topicPhraseLoading = common_vendor.ref(false);
    const myPhraseLoading = common_vendor.ref(false);
    const topicPhrase = common_vendor.ref([]);
    common_vendor.ref([]);
    const mySentenceList = common_vendor.ref([]);
    const topicSentenceList = common_vendor.ref([]);
    common_vendor.onLoad((props) => {
      common_vendor.index.setNavigationBarTitle({
        title: "AISPeak"
      });
      topicId.value = props.topicId;
      initData(props.topicId);
    });
    const initData = (topicId2) => {
      getTopicPhrases({ topic_id: topicId2 });
      getSen();
    };
    const getTopicPhrases = (params) => {
      if (topicPhraseLoading.value)
        return;
      topicPhraseLoading.value = true;
      api_topic.topicRequest.getPhrase(params).then((data) => {
        topicPhraseLoading.value = false;
        topicPhrase.value = data.data;
        topicPhrase.value.forEach((item) => {
          topicSentenceList.value.push({
            content: item.phrase,
            translation: item.phrase_translation,
            message_id: null,
            type: "SENTENCE"
          });
        });
      });
    };
    const getSen = () => {
      if (myPhraseLoading.value)
        return;
      myPhraseLoading.value = true;
      let params = {
        page: 1,
        type: "SENTENCE"
      };
      api_account.accountRequest.collectsGet(params).then((data) => {
        mySentenceList.value = mySentenceList.value.concat(data.data.list);
      });
      myPhraseLoading.value = false;
    };
    const handleDeleteCollect = () => {
      getSen();
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          leftIcon: true,
          ["back-fn"]: _ctx.handleBackPage,
          backgroundColor: "#F5F5FE"
        }),
        b: common_vendor.f(mySentenceList.value, (sentence, k0, i0) => {
          return {
            a: "bb47d206-1-" + i0,
            b: common_vendor.p({
              collect: sentence
            })
          };
        }),
        c: common_vendor.o(handleDeleteCollect),
        d: common_vendor.f(topicSentenceList.value, (sentence, k0, i0) => {
          return {
            a: "bb47d206-2-" + i0,
            b: common_vendor.p({
              collect: sentence,
              cannotCancel: true
            })
          };
        })
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bb47d206"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/topic/phrase.vue"]]);
wx.createPage(MiniProgramPage);
