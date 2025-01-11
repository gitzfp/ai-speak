"use strict";
const common_vendor = require("../../common/vendor.js");
const api_textbook = require("../../api/textbook.js");
require("../../axios/api.js");
require("../../config/env.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const textbook = common_vendor.ref({});
    common_vendor.onMounted(async () => {
      const res = await api_textbook.textbookRequest.getTextbookDetail("2");
      textbook.value = res.data;
    });
    const handleCategorySelect = (category) => {
      const url = `/pages/textbook/courses?textbookId=${category.textbook_id}&categoryId=${category.category_id}`;
      console.log("Navigating to:", url);
      common_vendor.index.navigateTo({
        url
      });
    };
    const handleSubCategorySelect = (subCategory) => {
      const url = `/pages/textbook/courses?textbookId=${subCategory.textbook_id}&categoryId=${subCategory.category_id}`;
      console.log("Navigating to:", url);
      common_vendor.index.navigateTo({
        url
      });
    };
    return (_ctx, _cache) => {
      return {
        a: textbook.value.pic,
        b: common_vendor.t(textbook.value.title),
        c: common_vendor.f(textbook.value.category, (category, k0, i0) => {
          return {
            a: common_vendor.t(category.title),
            b: common_vendor.f(category.sub_list, (sub, k1, i1) => {
              return {
                a: common_vendor.t(sub.title),
                b: sub.category_id,
                c: common_vendor.o(($event) => handleSubCategorySelect(sub), sub.category_id)
              };
            }),
            c: category.category_id,
            d: common_vendor.o(($event) => {
              var _a;
              return handleCategorySelect(((_a = category.sub_list) == null ? void 0 : _a.length) > 0 ? category.sub_list[0] : {});
            }, category.category_id)
          };
        })
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c8daf7c1"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/textbook/index.vue"]]);
wx.createPage(MiniProgramPage);
