"use strict";
const common_vendor = require("../../common/vendor.js");
const api_textbook = require("../../api/textbook.js");
const api_topic = require("../../api/topic.js");
require("../../axios/api.js");
require("../../config/env.js");
if (!Array) {
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  _easycom_uni_load_more2();
}
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  _easycom_uni_load_more();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "courses",
  setup(__props) {
    const courses = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const error = common_vendor.ref("");
    const currentOptions = common_vendor.ref(null);
    const loadCourses = async (options) => {
      loading.value = true;
      error.value = "";
      try {
        const { textbookId, categoryId } = options;
        if (!textbookId || !categoryId) {
          throw new Error("Missing textbookId or categoryId");
        }
        const res = await api_textbook.textbookRequest.getCourseDetail(textbookId, categoryId);
        console.log("Course detail response:", res.data.courses);
        if (res.data) {
          courses.value = res.data.courses;
        } else {
          throw new Error("No data returned from server");
        }
      } catch (e) {
        error.value = e.message || "加载失败，请重试";
        console.error("Load courses error:", e);
      } finally {
        loading.value = false;
      }
    };
    const retryLoad = () => {
      if (currentOptions.value) {
        loadCourses(currentOptions.value);
      }
    };
    const handleCourseSelect = async (course) => {
      try {
        const lessonId = course.id;
        const existingSession = await api_topic.topicRequest.getSessionByLessonId({ lesson_id: lessonId });
        if (existingSession == null ? void 0 : existingSession.data) {
          const { id: sessionId, completed, name } = existingSession.data;
          if (sessionId) {
            common_vendor.index.navigateTo({
              url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}&sessionName=${name}`
            });
            return;
          }
        }
        api_topic.topicRequest.createLessonSession({ lesson_id: lessonId }).then((res) => {
          common_vendor.index.navigateTo({
            url: `/pages/chat/index?sessionId=${res.data.id}&type=LESSON&lessonId=${lessonId}&sessionName=${res.data.name}`
          });
        });
      } catch (error2) {
        console.error("Error in handleCourseSelect:", error2);
        common_vendor.index.showToast({
          title: "获取课程会话失败",
          icon: "none"
        });
      }
    };
    common_vendor.onLoad((options) => {
      console.log("onLoad called with options:", options);
      currentOptions.value = options;
      loadCourses(options);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {
        b: common_vendor.p({
          status: "loading"
        })
      } : error.value ? {
        d: common_vendor.t(error.value),
        e: common_vendor.o(retryLoad)
      } : {
        f: common_vendor.f(courses.value, (course, k0, i0) => {
          var _a;
          return common_vendor.e({
            a: course.pic,
            b: common_vendor.t(course.title),
            c: common_vendor.t(course.sub_title),
            d: common_vendor.t(course.info_cn),
            e: common_vendor.t(course.info_en),
            f: common_vendor.t((_a = course.steps) == null ? void 0 : _a.length),
            g: course.max_score
          }, course.max_score ? {
            h: common_vendor.t(course.max_score)
          } : {}, {
            i: course.id,
            j: common_vendor.o(($event) => handleCourseSelect(course), course.id)
          });
        })
      }, {
        c: error.value
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b93a630c"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/textbook/courses.vue"]]);
wx.createPage(MiniProgramPage);
