"use strict";
const common_vendor = require("../../common/vendor.js");
const api_topic = require("../../api/topic.js");
require("../../axios/api.js");
require("../../config/env.js");
const _sfc_main = {
  setup() {
    const pages = common_vendor.ref([]);
    const sentences = common_vendor.ref([]);
    const currentPageIndex = common_vendor.ref(0);
    const currentPageImage = common_vendor.ref("");
    const scaleX = common_vendor.ref(1);
    const scaleY = common_vendor.ref(1);
    const pageImage = common_vendor.ref(null);
    const isSidebarOpen = common_vendor.ref(false);
    const hasValidSentences = common_vendor.computed(() => {
      const sentences2 = getCurrentPageSentence();
      console.log("当前页面句子:", sentences2);
      return sentences2 && sentences2.length > 0;
    });
    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };
    const goToPage = (index) => {
      currentPageIndex.value = index;
    };
    const book_id = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      book_id.value = options.book_id;
      console.log("Received book_id:", book_id.value);
    });
    const fetchPages = async () => {
      try {
        const response = await fetch(
          `https://rjdduploadw.mypep.cn/pub_cloud/10/${book_id.value}/${book_id.value}_Web.json`
        );
        const data = await response.json();
        pages.value = data.chapters.flatMap((chapter) => chapter.res_main);
        console.log("页面数据获取成功:", pages.value);
      } catch (error) {
        console.error("页面数据获取失败:", error);
      }
    };
    const fetchSentences = async () => {
      try {
        const response = await fetch(
          `https://diandu.mypep.cn/static/textbook/chapter/${book_id.value}_sentence.json`
        );
        const data = await response.json();
        sentences.value = data.list.flatMap(
          (chapter) => chapter.groups.flatMap((group) => group.sentences)
        );
        console.log("句子数据获取成功:", sentences.value);
      } catch (error) {
        console.error("句子数据获取失败:", error);
      }
    };
    const fetchImageUrlSignature = async (pageUrl) => {
      if (!pageUrl) {
        console.error("pageUrl 未定义");
        return null;
      }
      try {
        const response = await fetch(
          "/ap22/resources/ak/pep_click/user/951/urlSignature.json?access_token=KVEmCAZAAQxpKjcsArcMfTuUfkLeg%2BpddaupDU%2FFAtsl0ONFwKl%2Bx66qKejTFeD8sy4NV19l2dyDVvH2RdV0tA%3D%3D",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              flag: "1",
              fileNameUrl: `https://szjc-3.mypep.cn${pageUrl}`
            })
          }
        );
        if (!response.ok) {
          throw new Error(`请求失败，状态码：${response.status}`);
        }
        const data = await response.json();
        console.log("图片 URL 签名成功:", data);
        return data.url_signature;
      } catch (error) {
        console.error("图片 URL 签名获取失败:", error);
        return null;
      }
    };
    const updateCurrentPageImage = async () => {
      var _a;
      if (pages.value.length === 0) {
        console.error("页面数据未加载");
        currentPageImage.value = "";
        return;
      }
      const pageUrl = (_a = pages.value[currentPageIndex.value]) == null ? void 0 : _a.page_url;
      if (!pageUrl) {
        console.error("当前页面 URL 未找到");
        currentPageImage.value = "";
        return;
      }
      const urlSignature = await fetchImageUrlSignature(pageUrl);
      if (!urlSignature) {
        console.error("获取 URL 签名失败");
        currentPageImage.value = "";
        return;
      }
      console.log("当前页面图片 URL:", urlSignature);
      currentPageImage.value = urlSignature;
    };
    const onImageLoad = () => {
      const image = pageImage.value;
      if (image) {
        const containerWidth = document.querySelector(".book-container").clientWidth;
        scaleX.value = containerWidth / image.naturalWidth;
        scaleY.value = containerWidth / image.naturalWidth;
        console.log("图片缩放比例:", { scaleX: scaleX.value, scaleY: scaleY.value });
      }
    };
    const getScaledPosition = (value, axis) => {
      if (axis === "x") {
        return value * scaleX.value;
      } else if (axis === "y") {
        return value * scaleY.value;
      }
      return value;
    };
    const fetchM3u8Url = async (res_id) => {
      const hostname = "diandu.mypep.cn";
      const input_string = hostname + res_id;
      const hashed_value = common_vendor.md5Exports(input_string);
      console.log(hashed_value);
      const url = `/ap33/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/${res_id}/${hashed_value}/hlsIndexM3u8.token?access_token=`;
      try {
        const response = await fetch(
          url,
          {
            method: "GET",
            headers: {
              "Accept": "*/*",
              "Origin": "https://diandu.mypep.cn",
              "Referer": "https://diandu.mypep.cn/"
            }
          }
        );
        const data = await response.text();
        console.log("m3u8 文件内容:", data);
        return data;
      } catch (error) {
        console.error("获取 m3u8 文件失败:", error);
        return null;
      }
    };
    const playAudio = async (sentence) => {
      try {
        const m3u8Content = await fetchM3u8Url(sentence.res_id);
        if (!m3u8Content) {
          console.error("无法获取 m3u8 文件内容");
          return;
        }
        const blob = new Blob([m3u8Content], { type: "application/vnd.apple.mpegurl" });
        const blobUrl = URL.createObjectURL(blob);
        if (common_vendor.Hls.isSupported()) {
          const hls = new common_vendor.Hls();
          hls.loadSource(blobUrl);
          const audioElement2 = new Audio();
          hls.attachMedia(audioElement2);
          hls.on(common_vendor.Hls.Events.MANIFEST_PARSED, () => {
            audioElement2.play();
          });
          hls.on(common_vendor.Hls.Events.ERROR, (event, data) => {
            console.error("HLS 错误:", data);
            if (data.fatal) {
              switch (data.type) {
                case common_vendor.Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("网络错误，尝试重新加载");
                  hls.startLoad();
                  break;
                case common_vendor.Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("媒体错误，尝试重新加载");
                  hls.recoverMediaError();
                  break;
                default:
                  console.error("无法恢复的错误");
                  hls.destroy();
                  break;
              }
            }
          });
        } else if (audioElement.canPlayType("application/vnd.apple.mpegurl")) {
          const audioElement2 = new Audio(blobUrl);
          audioElement2.play();
        } else {
          console.error("当前浏览器不支持 HLS 播放");
        }
      } catch (error) {
        console.error("音频播放失败:", error);
      }
    };
    common_vendor.onMounted(async () => {
      await fetchPages();
      await fetchSentences();
      await updateCurrentPageImage();
      window.addEventListener("resize", onImageLoad);
    });
    common_vendor.onUnmounted(() => {
      window.removeEventListener("resize", onImageLoad);
    });
    common_vendor.watch(currentPageIndex, async () => {
      await updateCurrentPageImage();
    });
    const currentPageSentences = common_vendor.computed(() => {
      if (pages.value.length === 0)
        return [];
      return pages.value[currentPageIndex.value].track_info;
    });
    const getSentenceText = (resId) => {
      const sentence = sentences.value.find((s) => s.res_id === resId);
      console.log("查找句子:", resId, "结果:", sentence);
      return sentence || {};
    };
    const prevPage = () => {
      if (currentPageIndex.value > 0) {
        currentPageIndex.value--;
      }
    };
    const nextPage = () => {
      if (currentPageIndex.value < pages.value.length - 1) {
        currentPageIndex.value++;
      }
    };
    const getCurrentPageSentence = () => {
      if (!currentPageSentences.value)
        return [];
      return currentPageSentences.value.map((sentence) => getSentenceText(sentence.res_id)).filter((sentence) => sentence && sentence.text).map((sentence) => ({
        info_en: sentence.text,
        info_cn: sentence.translate_pc
      }));
    };
    const goToChatPage = async () => {
      try {
        const lessonId = book_id.value + ":" + currentPageIndex.value;
        const sentences2 = getCurrentPageSentence();
        const existingSession = await api_topic.topicRequest.getSessionByLessonId({ lesson_id: lessonId });
        if (existingSession == null ? void 0 : existingSession.data) {
          const { id: sessionId, name } = existingSession.data;
          if (sessionId) {
            common_vendor.index.navigateTo({
              url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}&sessionName=${name}`
            });
            return;
          }
        }
        const response = await api_topic.topicRequest.createLessonSession({
          lesson_id: lessonId,
          sentences: sentences2
        });
        if (response == null ? void 0 : response.data) {
          common_vendor.index.navigateTo({
            url: `/pages/chat/index?sessionId=${response.data.id}&type=LESSON&lessonId=${lessonId}&sessionName=${response.data.name}`
          });
        } else {
          throw new Error("创建会话失败");
        }
      } catch (error) {
        console.error("创建课程会话失败:", error);
        common_vendor.index.showToast({
          title: "创建会话失败",
          icon: "none"
        });
      }
    };
    return {
      currentPageIndex,
      currentPageImage,
      currentPageSentences,
      prevPage,
      nextPage,
      playAudio,
      getSentenceText,
      onImageLoad,
      pageImage,
      getScaledPosition,
      isSidebarOpen,
      toggleSidebar,
      goToPage,
      pages,
      goToChatPage,
      hasValidSentences
      // 添加这一行
    };
  }
};
if (!Array) {
  const _component_View = common_vendor.resolveComponent("View");
  _component_View();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($setup.isSidebarOpen ? "收起目录" : "展开目录"),
    b: common_vendor.o((...args) => $setup.toggleSidebar && $setup.toggleSidebar(...args)),
    c: common_vendor.f($setup.pages, (page, index, i0) => {
      return {
        a: common_vendor.t(index + 1),
        b: index,
        c: common_vendor.o(($event) => $setup.goToPage(index), index),
        d: $setup.currentPageIndex === index ? 1 : ""
      };
    }),
    d: $setup.isSidebarOpen ? 1 : "",
    e: $setup.currentPageImage
  }, $setup.currentPageImage ? {
    f: $setup.currentPageImage,
    g: common_vendor.o((...args) => $setup.onImageLoad && $setup.onImageLoad(...args))
  } : {}, {
    h: common_vendor.f($setup.currentPageSentences, (sentence, k0, i0) => {
      return {
        a: sentence.res_id,
        b: `${$setup.getScaledPosition(sentence.rect_pos_x, "x")}px`,
        c: `${$setup.getScaledPosition(sentence.rect_pos_y, "y")}px`,
        d: `${$setup.getScaledPosition(sentence.rect_width, "x")}px`,
        e: `${$setup.getScaledPosition(sentence.rect_height, "y")}px`,
        f: common_vendor.o(($event) => $setup.playAudio($setup.getSentenceText(sentence.res_id)), sentence.res_id)
      };
    }),
    i: $setup.currentPageIndex === 0 ? 1 : "",
    j: common_vendor.o((...args) => $setup.prevPage && $setup.prevPage(...args)),
    k: common_vendor.t($setup.currentPageIndex + 1),
    l: common_vendor.t($setup.pages.length),
    m: $setup.currentPageIndex === $setup.pages.length - 1 ? 1 : "",
    n: common_vendor.o((...args) => $setup.nextPage && $setup.nextPage(...args)),
    o: $setup.hasValidSentences
  }, $setup.hasValidSentences ? {
    p: common_vendor.o((...args) => $setup.goToChatPage && $setup.goToChatPage(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b93a630c"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/textbook/courses.vue"]]);
wx.createPage(MiniProgramPage);
