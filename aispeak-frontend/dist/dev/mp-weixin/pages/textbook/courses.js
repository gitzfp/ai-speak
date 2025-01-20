"use strict";
const common_vendor = require("../../common/vendor.js");
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
    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };
    const goToPage = (index) => {
      currentPageIndex.value = index;
    };
    const fetchPages = async () => {
      try {
        const response = await fetch(
          "https://rjdduploadw.mypep.cn/pub_cloud/10/1212001101244/1212001101244_Web.json"
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
          "https://diandu.mypep.cn/static/textbook/chapter/1212001101244_sentence.json"
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
    const fetchSignedUrl = async (filePath) => {
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
              fileNameUrl: `https://szjc-3.mypep.cn${filePath}`
            })
          }
        );
        if (!response.ok) {
          throw new Error(`请求失败，状态码：${response.status}`);
        }
        const data = await response.json();
        return data.url_signature;
      } catch (error) {
        console.error("获取签名 URL 失败:", error);
        return null;
      }
    };
    const fetchM3u8Url = async (filePath) => {
      try {
        const response = await fetch(
          `/ap33/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/12120011012440100001724326791314/79a95acd885d781183cebec7386e300e/hlsIndexM3u8.token?access_token=`,
          {
            method: "GET",
            headers: {
              "Accept": "*/*",
              "Origin": "https://diandu.mypep.cn",
              "Referer": "https://diandu.mypep.cn/"
            }
          }
        );
        if (!response.ok) {
          throw new Error(`请求失败，状态码：${response.status}`);
        }
        const data = await response.text();
        return data;
      } catch (error) {
        console.error("获取 m3u8 URL 失败:", error);
        return null;
      }
    };
    const playAudio = async (sentence) => {
      try {
        await fetchSignedUrl(sentence.file_path, sentence.access_token);
        const m3u8Content = await fetchM3u8Url(sentence.file_path, sentence.access_token);
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
      pages
    };
  }
};
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
        a: common_vendor.t($setup.getSentenceText(sentence.res_id).text),
        b: sentence.res_id,
        c: `${$setup.getScaledPosition(sentence.rect_pos_x, "x")}px`,
        d: `${$setup.getScaledPosition(sentence.rect_pos_y, "y")}px`,
        e: `${$setup.getScaledPosition(sentence.rect_width, "x")}px`,
        f: `${$setup.getScaledPosition(sentence.rect_height, "y")}px`,
        g: common_vendor.o(($event) => $setup.playAudio($setup.getSentenceText(sentence.res_id)), sentence.res_id)
      };
    }),
    i: common_vendor.o((...args) => $setup.prevPage && $setup.prevPage(...args)),
    j: common_vendor.o((...args) => $setup.nextPage && $setup.nextPage(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b93a630c"], ["__file", "/Users/fpz/Documents/GitHub/ai-speak/aispeak-frontend/src/pages/textbook/courses.vue"]]);
wx.createPage(MiniProgramPage);
