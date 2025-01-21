"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  setup() {
    const versions = common_vendor.ref(["全部", "PEP", "精通", "新起点", "初中"]);
    const grades = common_vendor.ref(["全部", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级"]);
    const terms = common_vendor.ref(["全部", "上册", "下册", "全一册"]);
    const selectedVersion = common_vendor.ref("全部");
    const selectedGrade = common_vendor.ref("全部");
    const selectedTerm = common_vendor.ref("全部");
    const books = common_vendor.ref([]);
    const fetchBooks = () => {
      common_vendor.index.request({
        url: "https://diandu.mypep.cn/static/textbook/bookList_pep_click_subject_web_1_0_0.json",
        success: (res) => {
          const englishSubject = res.data.booklist.find((subject) => subject.subject_name === "英语");
          if (englishSubject) {
            books.value = englishSubject.versions.flatMap((version) => version.textbooks);
          }
        },
        fail: (err) => {
          console.error("Failed to fetch books:", err);
        }
      });
    };
    const filteredBooks = common_vendor.computed(() => {
      return books.value.filter((book) => {
        const matchVersion = selectedVersion.value === "全部" || book.version_type === selectedVersion.value;
        const matchGrade = selectedGrade.value === "全部" || book.grade === selectedGrade.value;
        const matchTerm = selectedTerm.value === "全部" || book.term === selectedTerm.value;
        return matchVersion && matchGrade && matchTerm;
      });
    });
    common_vendor.onMounted(() => {
      fetchBooks();
    });
    const handleBuy = (book) => {
      common_vendor.index.showToast({
        title: `购买 ${book.book_name}`,
        icon: "none"
      });
    };
    const goToCourse = (book) => {
      common_vendor.index.navigateTo({
        url: `/pages/textbook/courses?book_id=${book.book_id}`
      });
    };
    return {
      versions,
      grades,
      terms,
      selectedVersion,
      selectedGrade,
      selectedTerm,
      filteredBooks,
      handleBuy,
      goToCourse
      // 添加这一行
    };
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($setup.versions, (item, index, i0) => {
      return {
        a: common_vendor.t(item),
        b: index,
        c: common_vendor.n($setup.selectedVersion === item ? "active" : ""),
        d: common_vendor.o(($event) => $setup.selectedVersion = item, index)
      };
    }),
    b: common_vendor.f($setup.grades, (grade, index, i0) => {
      return {
        a: common_vendor.t(grade),
        b: index,
        c: common_vendor.n($setup.selectedGrade === grade ? "active" : ""),
        d: common_vendor.o(($event) => $setup.selectedGrade = grade, index)
      };
    }),
    c: common_vendor.f($setup.terms, (term, index, i0) => {
      return {
        a: common_vendor.t(term),
        b: index,
        c: common_vendor.n($setup.selectedTerm === term ? "active" : ""),
        d: common_vendor.o(($event) => $setup.selectedTerm = term, index)
      };
    }),
    d: common_vendor.f($setup.filteredBooks, (book, index, i0) => {
      return {
        a: book.icon_url,
        b: common_vendor.t(book.book_name),
        c: common_vendor.t(book.grade),
        d: common_vendor.t(book.term),
        e: index,
        f: common_vendor.o(($event) => $setup.goToCourse(book), index)
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/textbook/index.vue"]]);
wx.createPage(MiniProgramPage);
