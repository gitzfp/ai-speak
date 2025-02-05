"use strict";
const common_vendor = require("../../common/vendor.js");
const api_textbook = require("../../api/textbook.js");
const api_topic = require("../../api/topic.js");
require("../../axios/api.js");
require("../../config/env.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "lesson",
  setup(__props) {
    const lessonData = common_vendor.ref({
      detail: {
        title: "",
        sub_title: "",
        points: [],
        lesson_id: ""
      },
      exercise_list: []
    });
    const loading = common_vendor.ref(false);
    const error = common_vendor.ref("");
    const currentIndex = common_vendor.ref(0);
    const selectedAnswer = common_vendor.ref("");
    const feedbackMessage = common_vendor.ref("");
    const currentExercise = common_vendor.computed(() => {
      var _a;
      console.log("exercise_list:", lessonData.value.exercise_list);
      return ((_a = lessonData.value.exercise_list) == null ? void 0 : _a[currentIndex.value]) || null;
    });
    const selectAnswer = (option) => {
      selectedAnswer.value = option.text;
      console.log("Selected answer:", selectedAnswer.value);
    };
    const submitAnswer = () => {
      var _a;
      if (!currentExercise.value) {
        console.error("No current exercise available");
        return;
      }
      console.log("Current Exercise:", currentExercise.value);
      const correctOption = (_a = currentExercise.value.options) == null ? void 0 : _a.find((o) => o.is_correct === "1");
      if (!correctOption) {
        console.error("No correct option found");
        return;
      }
      if (selectedAnswer.value === correctOption.text) {
        feedbackMessage.value = "回答正确！正在进入下一题...";
        setTimeout(() => {
          feedbackMessage.value = "";
          nextExercise();
        }, 2e3);
      } else {
        feedbackMessage.value = "回答错误，请再试一次！";
      }
    };
    const nextExercise = () => {
      selectedAnswer.value = "";
      feedbackMessage.value = "";
      if (currentIndex.value < lessonData.value.exercise_list.length - 1) {
        currentIndex.value++;
      } else {
        currentIndex.value = lessonData.value.exercise_list.length;
        feedbackMessage.value = "🎉 恭喜完成所有练习！";
      }
    };
    const loadLesson = async (lessonId) => {
      loading.value = true;
      error.value = "";
      try {
        const res = await api_textbook.textbookRequest.getLessonDetail(lessonId);
        console.log("API Response:", res);
        if (res.data) {
          lessonData.value = {
            ...res.data,
            exercise_list: res.data.exercise_list || []
          };
          console.log("Loaded lesson data:", lessonData.value);
        } else {
          throw new Error("No data returned from server");
        }
      } catch (e) {
        error.value = e.message || "加载失败，请重试";
        console.error("Load lesson error:", e);
      } finally {
        loading.value = false;
      }
    };
    common_vendor.onLoad((options) => {
      console.log("Lesson onLoad options:", options);
      if (options.lessonId) {
        loadLesson(options.lessonId);
      } else {
        error.value = "缺少必要参数";
      }
    });
    const playAudio = (src) => {
      const innerAudioContext = common_vendor.index.createInnerAudioContext();
      innerAudioContext.src = src;
      innerAudioContext.autoplay = true;
      innerAudioContext.onError((res) => {
        console.error("音频播放失败：", res);
        common_vendor.index.showToast({
          title: "音频播放失败",
          icon: "none"
        });
      });
    };
    const isExerciseCompleted = common_vendor.computed(() => {
      return currentIndex.value >= lessonData.value.exercise_list.length;
    });
    const goToTopics = async () => {
      var _a, _b, _c, _d, _e;
      const lessonId = (_b = (_a = lessonData.value) == null ? void 0 : _a.detail) == null ? void 0 : _b.lesson_id;
      const existingSession = await api_topic.topicRequest.getSessionByLessonId({ lesson_id: lessonId });
      let sessionId = (_c = existingSession.data) == null ? void 0 : _c.id;
      if (sessionId) {
        common_vendor.index.navigateTo({
          url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}`
        });
        return;
      }
      api_topic.topicRequest.createLessonSession({ lesson_id: (_e = (_d = lessonData.value) == null ? void 0 : _d.detail) == null ? void 0 : _e.lesson_id }).then((res) => {
        console.log(res.data.id);
        common_vendor.index.navigateTo({
          url: `/pages/chat/index?sessionId=${res.data.id}&type=LESSON&lessonId=${lessonId}`
        });
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: lessonData.value.detail
      }, lessonData.value.detail ? common_vendor.e({
        b: lessonData.value.detail.pic,
        c: common_vendor.t(lessonData.value.detail.title),
        d: common_vendor.t(lessonData.value.detail.sub_title),
        e: common_vendor.f(lessonData.value.detail.points, (point, k0, i0) => {
          return {
            a: common_vendor.t(point.word),
            b: common_vendor.t(point.meaning),
            c: common_vendor.o(($event) => playAudio(point.audio), point.word),
            d: point.word
          };
        }),
        f: !common_vendor.unref(isExerciseCompleted)
      }, !common_vendor.unref(isExerciseCompleted) ? common_vendor.e({
        g: common_vendor.unref(currentExercise)
      }, common_vendor.unref(currentExercise) ? common_vendor.e({
        h: common_vendor.t(currentIndex.value + 1),
        i: common_vendor.t(common_vendor.unref(currentExercise).title),
        j: common_vendor.f(common_vendor.unref(currentExercise).options, (option, k0, i0) => {
          return {
            a: common_vendor.t(option.text),
            b: common_vendor.o(($event) => playAudio(option.audio), option.text),
            c: option.text,
            d: selectedAnswer.value === option.text ? 1 : "",
            e: feedbackMessage.value && selectedAnswer.value === option.text && option.is_correct !== "1" ? 1 : "",
            f: common_vendor.o(($event) => selectAnswer(option), option.text)
          };
        }),
        k: common_vendor.o(submitAnswer),
        l: !selectedAnswer.value,
        m: feedbackMessage.value
      }, feedbackMessage.value ? {
        n: common_vendor.t(feedbackMessage.value)
      } : {}) : {}) : {}, {
        o: common_vendor.unref(isExerciseCompleted)
      }, common_vendor.unref(isExerciseCompleted) ? {
        p: common_vendor.o(goToTopics)
      } : {}) : common_vendor.e({
        q: error.value
      }, error.value ? {
        r: common_vendor.t(error.value)
      } : {}));
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-38a5fd62"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/textbook/lesson.vue"]]);
wx.createPage(MiniProgramPage);
