"use strict";
const common_vendor = require("../../common/vendor.js");
const api_account = require("../../api/account.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Math) {
  (CommonHeader + Single + LoadingRound + Statement)();
}
const LoadingRound = () => "../../components/LoadingRound.js";
const CommonHeader = () => "../../components/CommonHeader.js";
const Single = () => "./components/Single.js";
const Statement = () => "./components/Statement.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const wordList = common_vendor.ref([]);
    const sentenceList = common_vendor.ref([]);
    const tabNum = common_vendor.ref("1");
    const wordPageSize = common_vendor.ref(1);
    const senPageSize = common_vendor.ref(1);
    const wordLoading = common_vendor.ref(false);
    const sentenceLoading = common_vendor.ref(false);
    common_vendor.onMounted(() => {
      common_vendor.index.setNavigationBarTitle({
        title: "AI-Speak"
      });
    });
    common_vendor.onShow(() => {
      common_vendor.nextTick$1(() => {
        initData();
      });
    });
    const handleDeleteCollect = (id) => {
      initData();
    };
    const initData = () => {
      wordPageSize.value = 1;
      senPageSize.value = 1;
      wordList.value = [];
      sentenceList.value = [];
      getWord();
      getSen();
    };
    const getWord = () => {
      if (wordLoading.value)
        return;
      wordLoading.value = true;
      let params = {
        page: wordPageSize.value,
        page_size: 10,
        type: "WORD"
      };
      api_account.accountRequest.collectsGet(params).then((data) => {
        wordList.value = wordList.value.concat(data.data.list);
      });
      wordLoading.value = false;
    };
    const getSen = () => {
      if (sentenceLoading.value)
        return;
      sentenceLoading.value = true;
      let params = {
        page: senPageSize.value,
        type: "SENTENCE"
      };
      api_account.accountRequest.collectsGet(params).then((data) => {
        sentenceList.value = sentenceList.value.concat(data.data.list);
      });
      sentenceLoading.value = false;
    };
    const tabChange = (type) => {
      tabNum.value = type;
    };
    const onScroll = (event) => {
      if (tabNum.value === "1") {
        wordPageSize.value = wordPageSize.value + 1;
        getWord();
      } else {
        senPageSize.value = senPageSize.value + 1;
        getSen();
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "AISPeak"
        }),
        b: common_vendor.n(`chat-tab ${tabNum.value === "1" ? "chat-tab-actice" : ""}`),
        c: common_vendor.o(($event) => tabChange("1")),
        d: common_vendor.n(`chat-tab ${tabNum.value === "2" ? "chat-tab-actice" : ""}`),
        e: common_vendor.o(($event) => tabChange("2")),
        f: common_vendor.f(wordList.value, (word, k0, i0) => {
          return {
            a: "b58fe68c-1-" + i0,
            b: common_vendor.p({
              collect: word
            })
          };
        }),
        g: common_vendor.o(handleDeleteCollect),
        h: wordLoading.value
      }, wordLoading.value ? {} : {}, {
        i: common_vendor.n(`chat-tab-content-one ${tabNum.value === "2" ? "chat-tab-content-one_hidden" : ""}`),
        j: common_vendor.o(onScroll),
        k: common_vendor.f(sentenceList.value, (sentence, k0, i0) => {
          return {
            a: "b58fe68c-3-" + i0,
            b: common_vendor.p({
              collect: sentence,
              cannotCancel: false
            })
          };
        }),
        l: sentenceLoading.value
      }, sentenceLoading.value ? {} : {}, {
        m: common_vendor.n(`chat-tab-content-two ${tabNum.value === "1" ? "chat-tab-content-two_hidden" : ""}`),
        n: common_vendor.o(onScroll)
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/practice/index.vue"]]);
wx.createPage(MiniProgramPage);
