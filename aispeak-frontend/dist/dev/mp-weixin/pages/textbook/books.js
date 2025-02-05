"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_utils = require("../../utils/utils.js");
const config_env = require("../../config/env.js");
const api_topic = require("../../api/topic.js");
require("../../axios/api.js");
const _sfc_main = {
  __name: "books",
  setup(__props) {
    const baseUrl = config_env.__config.basePath;
    const loading = common_vendor.ref(true);
    const error = common_vendor.ref("");
    const bookPages = common_vendor.ref([]);
    const catalogData = common_vendor.ref([]);
    const sentences = common_vendor.ref([]);
    const pageTitle = common_vendor.ref("");
    const imageRatios = common_vendor.ref({});
    const currentPage = common_vendor.ref(0);
    const showCatalog = common_vendor.ref(false);
    const isPlaying = common_vendor.ref(false);
    const currentAudio = common_vendor.ref(null);
    const showRepeatSelection = common_vendor.ref(false);
    const isRepeatMode = common_vendor.ref(false);
    const repeatStartIndex = common_vendor.ref(0);
    const repeatEndIndex = common_vendor.ref(0);
    const repeatOptions = common_vendor.ref([]);
    const book_id = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      book_id.value = options.book_id;
      console.log("Received book_id:", book_id.value);
      fetchAndProcessData();
      fetchSentences();
    });
    const fetchSentences = async () => {
      var _a;
      const ossKey = `json_files/${book_id.value}_sentence.json`;
      const checkResult = await utils_utils.utils.checkFileInOSS(ossKey);
      console.log("检查文件是否存在:", checkResult);
      if ((_a = checkResult == null ? void 0 : checkResult.data) == null ? void 0 : _a.exists) {
        let data = await utils_utils.utils.getFileFromOSS(ossKey);
        data = JSON.parse(data);
        sentences.value = data.list.flatMap(
          (chapter) => chapter.groups.flatMap((group) => group.sentences)
        );
        console.log("句子数据获取成功（来OSS）");
      } else {
        try {
          const url = `https://diandu.mypep.cn/static/textbook/chapter/${book_id.value}_sentence.json`;
          const response = await new Promise((resolve, reject) => {
            common_vendor.index.request({
              url,
              method: "GET",
              enableHttpDNS: true,
              httpDNSServiceId: "wxa410372c837a5f26",
              success: (res) => {
                resolve(res);
              },
              fail: (err) => {
                reject(err);
              }
            });
          });
          const data = await response.data;
          sentences.value = data.list.flatMap(
            (chapter) => chapter.groups.flatMap((group) => group.sentences)
          );
          console.log("句子数据获取成功（来自原接口）");
          const jsonString = JSON.stringify(data);
          await utils_utils.utils.uploadFileToOSS(ossKey, jsonString);
        } catch (error2) {
          console.error("句子数据获取失败:", error2);
        }
      }
    };
    function decrypt(t, e = "book.json") {
      const n = new Array(32).fill(" ");
      const r = "".concat(e).concat(n.join("")).substr(0, 32);
      const o = common_vendor.CryptoJS.enc.Utf8.parse(r);
      const s = common_vendor.CryptoJS.enc.Utf8.parse("We Love Manibox!");
      const u = t[0] | t[1] << 8 | t[2] << 16 | t[3] << 24;
      const c = common_vendor.CryptoJS.lib.WordArray.create(t.slice(4));
      const f = common_vendor.CryptoJS.AES.decrypt({ ciphertext: c }, o, {
        iv: s,
        mode: common_vendor.CryptoJS.mode.CBC,
        padding: common_vendor.CryptoJS.pad.Pkcs7
      });
      const h = f.toString(common_vendor.CryptoJS.enc.Hex);
      const d = new Uint8Array(h.match(/../g).map((byte) => parseInt(byte, 16)));
      const p = Math.min(u, d.length);
      const v = d.slice(0, p);
      return v;
    }
    async function handleImageError(e, page) {
      var _a;
      console.error("图片加载失败:", {
        url: ((_a = e.target) == null ? void 0 : _a.src) || "未获取到图片地址",
        pageId: page == null ? void 0 : page.page_id,
        pageUrl: page == null ? void 0 : page.page_url_source
      });
      common_vendor.index.showToast({
        title: "图片加载失败",
        icon: "none"
      });
      const ossKey = processOssKeyUrl(page.page_url_source);
      const originalUrl = handleErrorImageUrl(page.page_url_source);
      console.log("上传的key:", ossKey, "上传的url:", originalUrl);
      await utils_utils.utils.uploadFileToOSS(ossKey, originalUrl);
    }
    async function unzipData(decryptedData) {
      const zip = new common_vendor.JSZip();
      try {
        const content = await zip.loadAsync(decryptedData);
        const files = Object.keys(content.files);
        const unzippedData = await content.files[files[0]].async("text");
        return JSON.parse(unzippedData);
      } catch (error2) {
        console.error("Failed to unzip data:", error2);
        throw error2;
      }
    }
    function playAudio(track) {
      stopCurrentAudio();
      const audio = common_vendor.index.createInnerAudioContext();
      currentAudio.value = audio;
      audio.onError((res) => {
        console.error("Audio playback error:", res);
        common_vendor.index.hideToast();
        common_vendor.index.showToast({
          title: "音频播放失败",
          icon: "none"
        });
      });
      audio.onPlay(() => {
        common_vendor.index.showToast({
          title: track.track_genre,
          duration: 999999,
          // Long duration
          position: "bottom",
          icon: "none"
        });
      });
      audio.onEnded(() => {
        common_vendor.index.hideToast();
        stopCurrentAudio();
      });
      audio.src = track.track_url_source;
      audio.play();
    }
    function stopCurrentAudio() {
      if (currentAudio.value) {
        common_vendor.index.hideToast();
        try {
          currentAudio.value.stop();
          currentAudio.value.destroy();
        } catch (error2) {
          console.error("Error stopping audio:", error2);
        }
        currentAudio.value = null;
      }
    }
    function processOssKeyUrl(url) {
      if (!url)
        return url;
      let processedUrl = url.replace(/^https?:\/\/[^\/]+/, "").replace(/\?.*$/, "");
      if (processedUrl.startsWith("/")) {
        processedUrl = processedUrl.slice(1);
      }
      return processedUrl;
    }
    function handleErrorImageUrl(url) {
      return url.replace(/^https?:\/\/[^\/]+/, "https://pdpd.mypep.cn").replace(/\?ts=\d+$/, "");
    }
    function processUrl(url) {
      if (!url)
        return url;
      return url.replace(
        /^https?:\/\/[^\/]+/,
        "https://books-bct.oss-cn-beijing.aliyuncs.com"
      ).replace(/\?ts=\d+$/, "");
    }
    async function processResources(data) {
      try {
        const processedData = JSON.parse(JSON.stringify(data));
        for (let page of processedData.bookpage) {
          const processedImageUrl = processUrl(page.page_url_source);
          if (!page.page_url_source.startsWith(
            "https://books-bct.oss-cn-beijing.aliyuncs.com"
          )) {
            await utils_utils.utils.uploadFileToOSS(
              processOssKeyUrl(page.page_url_source),
              page.page_url_source
            );
          }
          page.page_url_source = processedImageUrl;
          if (page.track_info) {
            for (let track of page.track_info) {
              const processedAudioUrl = processUrl(track.track_url_source);
              if (!track.track_url_source.startsWith(
                "https://books-bct.oss-cn-beijing.aliyuncs.com"
              )) {
                await utils_utils.utils.uploadFileToOSS(
                  processOssKeyUrl(track.track_url_source),
                  track.track_url_source
                );
              }
              track.track_url_source = processedAudioUrl;
            }
          }
        }
        const zip = new common_vendor.JSZip();
        zip.file("book.zip", JSON.stringify(processedData));
        const compressedData = await zip.generateAsync({
          type: "arraybuffer",
          // 改用 arraybuffer
          compression: "DEFLATE",
          compressionOptions: {
            level: 9
          }
        });
        return compressedData;
      } catch (error2) {
        console.error("Resource processing error:", error2);
      }
    }
    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    async function getBookUrl() {
      var _a, _b, _c;
      const ossKey = `proxy/book/${book_id.value}/getBookUrl.json`;
      const checkResult = await utils_utils.utils.checkFileInOSS(ossKey);
      if ((_a = checkResult == null ? void 0 : checkResult.data) == null ? void 0 : _a.exists) {
        const data = await utils_utils.utils.getFileFromOSS(ossKey);
        console.log("books.json 已存储，直接从 FastAPI 获取文件 URL", data);
        return data;
      }
      if (!book_id.value) {
        throw new Error("Book ID is required");
      }
      const timestamp = formatDate(new Date());
      const sign = common_vendor.CryptoJS.SHA1(
        `book_id=${book_id.value}&fixed_key=bac1359d7feb996b396dff38ab77rf7a&timestamp=${timestamp}`
      ).toString();
      try {
        const response = await common_vendor.index.request({
          url: `${baseUrl}/${ossKey}`,
          method: "POST",
          enableHttpDNS: true,
          httpDNSServiceId: "wxa410372c837a5f26",
          data: {
            book_id: book_id.value,
            sign,
            timestamp
          },
          header: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Origin: "https://diandu.mypep.cn",
            Referer: "https://diandu.mypep.cn/rjdd/",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
          }
        });
        if (response.statusCode === 200 && ((_b = response.data) == null ? void 0 : _b.result)) {
          await utils_utils.utils.uploadFileToOSS(ossKey, response.data.result);
          return response.data.result;
        }
        const errorMessage = ((_c = response.data) == null ? void 0 : _c.message) || "Failed to get book URL";
        console.error("Server response:", response.data);
        throw new Error(errorMessage);
      } catch (error2) {
        console.error("Error getting book URL:", error2);
        throw error2;
      }
    }
    const parseJsonData = (data, comeFrom = "OSS") => {
      var _a;
      try {
        let jsonData = JSON.parse(data);
        console.log(`页面数据获取成功（来自 ${comeFrom}）:`);
        bookPages.value = jsonData.bookpage;
        catalogData.value = ((_a = jsonData.bookaudio_v3) == null ? void 0 : _a.length) > 0 ? jsonData.bookaudio_v3 : jsonData.bookaudio_v2;
        pageTitle.value = catalogData.value[0].title;
        common_vendor.index.setNavigationBarTitle({
          title: catalogData.value[0].title
          // 你想要显示的标题
        });
        loading.value = false;
        return jsonData;
      } catch (error2) {
        console.error("Error parsing JSON data:", error2);
        return null;
      }
    };
    async function fetchAndProcessData() {
      var _a;
      try {
        const bookUrl = await getBookUrl();
        const ossKey = processOssKeyUrl(bookUrl);
        const checkResult = await utils_utils.utils.checkFileInOSS(ossKey);
        if ((_a = checkResult == null ? void 0 : checkResult.data) == null ? void 0 : _a.exists) {
          const data = await utils_utils.utils.getFileFromOSS(ossKey, true);
          const zip = new common_vendor.JSZip();
          const content = await zip.loadAsync(data, { base64: true });
          const files = Object.keys(content.files);
          const unzippedData = await content.files[files[0]].async("text");
          const result = parseJsonData(unzippedData);
          if (result) {
            return;
          }
        }
        const response = await common_vendor.index.request({
          url: `https://pdpd.mypep.cn/${ossKey}`,
          responseType: "arraybuffer"
        });
        const decryptedData = decrypt(new Uint8Array(response.data));
        let jsonData = await unzipData(decryptedData);
        parseJsonData(jsonData, "Orginal");
        setTimeout(async () => {
          jsonData = await processResources(jsonData);
          await utils_utils.utils.uploadBinaryData(ossKey, jsonData);
        }, 0);
      } catch (err) {
        console.error("Error:", err);
        error.value = "加载数据失败，请重试";
      } finally {
        loading.value = false;
      }
    }
    let resizeObserver = null;
    common_vendor.onMounted(() => {
      resizeObserver = new ResizeObserver(() => {
        Object.keys(imageRatios.value).forEach((pageId) => {
          const imageInfo = imageRatios.value[pageId];
          if (imageInfo) {
            imageRatios.value[pageId] = {
              ...imageInfo,
              containerWidth: common_vendor.index.getSystemInfoSync().windowWidth
            };
          }
        });
      });
      const container = document.querySelector(".container");
      if (container) {
        resizeObserver.observe(container);
      }
    });
    common_vendor.onBeforeUnmount(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    });
    function onImageLoad(e, pageId) {
      const { width, height } = e.detail;
      imageRatios.value[pageId] = {
        width,
        height,
        ratio: height / width,
        containerWidth: common_vendor.index.getSystemInfoSync().windowWidth
      };
    }
    function getTrackStyle(track, pageId) {
      const imageInfo = imageRatios.value[pageId];
      if (!imageInfo)
        return {};
      const containerWidth = common_vendor.index.getSystemInfoSync().windowWidth;
      const imageHeight = containerWidth * imageInfo.ratio;
      if (imageInfo.containerWidth !== containerWidth) {
        imageInfo.containerWidth = containerWidth;
      }
      return {
        left: `${track.track_left * containerWidth}px`,
        top: `${track.track_top * imageHeight}px`,
        width: `${(track.track_right - track.track_left) * containerWidth}px`,
        height: `${(track.track_bottom - track.track_top) * imageHeight}px`
      };
    }
    function handlePageChange(e) {
      currentPage.value = e.detail.current;
      stopCurrentAudio();
      isPlaying.value = false;
      console.log("翻页处理", currentPage.value, catalogData.value);
      const currentChapter = catalogData.value.find(
        (chapter) => chapter.page_no === currentPage.value
      );
      if (currentChapter == null ? void 0 : currentChapter.title) {
        pageTitle.value = currentChapter.title;
        common_vendor.index.setNavigationBarTitle({
          title: currentChapter.title
        });
      }
    }
    function toggleCatalog() {
      showCatalog.value = !showCatalog.value;
    }
    function goToPage(index) {
      currentPage.value = index;
      showCatalog.value = false;
    }
    const getCurrentPageSentence = () => {
      const practiceSentences = sentences.value.filter(
        (sentence) => sentence.jump_page == currentPage.value
      );
      console.log(sentences.value, currentPage.value, "practiceSentences");
      return practiceSentences.map((sentence) => ({
        info_en: sentence.text,
        info_cn: sentence.translate
      }));
    };
    const goToChatPage = async () => {
      try {
        const lessonId = book_id.value + ":" + currentPage.value;
        const sentences2 = getCurrentPageSentence();
        if (!sentences2 || (sentences2 == null ? void 0 : sentences2.length) <= 0) {
          common_vendor.index.showToast({
            title: "没有需要测评的口语",
            icon: "none"
          });
          return;
        }
        const existingSession = await api_topic.topicRequest.getSessionByLessonId({
          lesson_id: lessonId
        });
        if (existingSession == null ? void 0 : existingSession.data) {
          const { id: sessionId } = existingSession.data;
          console.log("会话已经存在，句子: ", sentences2, "sessionId: ", sessionId);
          if (sessionId) {
            common_vendor.index.navigateTo({
              url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}&sessionName=${pageTitle.value}`
            });
            return;
          }
        }
        console.log("创建新会话，句子: ", sentences2, "sessionId: ");
        const response = await api_topic.topicRequest.createLessonSession({
          lesson_id: lessonId,
          sentences: sentences2
        });
        if (response == null ? void 0 : response.data) {
          common_vendor.index.navigateTo({
            url: `/pages/chat/index?sessionId=${response.data.id}&type=LESSON&lessonId=${lessonId}&sessionName=${pageTitle.value}`
          });
        } else {
          throw new Error("创建会话失败");
        }
      } catch (error2) {
        console.error("创建课程会话失败:", error2);
        common_vendor.index.showToast({
          title: "创建会话失败",
          icon: "none"
        });
      }
    };
    function playCurrentPage() {
      const currentPageData = bookPages.value[currentPage.value];
      if (!(currentPageData == null ? void 0 : currentPageData.track_info))
        return;
      isPlaying.value = true;
      let currentTrackIndex = 0;
      const playNext = () => {
        if (!isPlaying.value) {
          stopCurrentAudio();
          return;
        }
        if (currentTrackIndex < currentPageData.track_info.length) {
          const track = currentPageData.track_info[currentTrackIndex];
          const audio = common_vendor.index.createInnerAudioContext();
          currentAudio.value = audio;
          audio.src = track.track_url_source;
          audio.onEnded(() => {
            currentTrackIndex++;
            playNext();
          });
          audio.play();
        } else {
          isPlaying.value = false;
        }
      };
      playNext();
    }
    function pauseCurrentPage() {
      if (currentAudio.value) {
        currentAudio.value.pause();
        isPlaying.value = false;
      }
    }
    function togglePlayCurrentPage() {
      if (isPlaying.value) {
        pauseCurrentPage();
      } else {
        playCurrentPage();
      }
    }
    function startRepeatMode() {
      showRepeatSelection.value = true;
      repeatOptions.value = bookPages.value[currentPage.value].track_info.map(
        (track, index) => `段落 ${index + 1}`
      );
    }
    function handleRepeatSelection(e) {
      repeatStartIndex.value = e.detail.value;
      repeatEndIndex.value = e.detail.value;
    }
    function confirmRepeat() {
      showRepeatSelection.value = false;
      isRepeatMode.value = true;
      playRepeat();
    }
    function cancelRepeat() {
      showRepeatSelection.value = false;
    }
    function playRepeat() {
      const currentPageData = bookPages.value[currentPage.value];
      if (!(currentPageData == null ? void 0 : currentPageData.track_info))
        return;
      isPlaying.value = true;
      let currentTrackIndex = repeatStartIndex.value;
      const playNext = () => {
        if (!isPlaying.value || !isRepeatMode.value) {
          stopCurrentAudio();
          return;
        }
        if (currentTrackIndex <= repeatEndIndex.value) {
          const track = currentPageData.track_info[currentTrackIndex];
          const audio = common_vendor.index.createInnerAudioContext();
          currentAudio.value = audio;
          audio.src = track.track_url_source;
          audio.onEnded(() => {
            currentTrackIndex++;
            if (currentTrackIndex > repeatEndIndex.value) {
              currentTrackIndex = repeatStartIndex.value;
            }
            playNext();
          });
          audio.play();
        }
      };
      playNext();
    }
    function exitRepeatMode() {
      isRepeatMode.value = false;
      stopCurrentAudio();
      isPlaying.value = false;
    }
    common_vendor.onBeforeUnmount(() => {
      stopCurrentAudio();
      isPlaying.value = false;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : error.value ? {
        c: common_vendor.t(error.value)
      } : common_vendor.e({
        d: showCatalog.value
      }, showCatalog.value ? {
        e: common_vendor.o(toggleCatalog)
      } : {}, {
        f: common_vendor.f(catalogData.value, (chapter, index, i0) => {
          return {
            a: common_vendor.t(chapter.title),
            b: common_vendor.t(chapter.page_no || index + 1),
            c: chapter.audio_id,
            d: common_vendor.o(($event) => goToPage(chapter.page_no || index), chapter.audio_id)
          };
        }),
        g: showCatalog.value ? 1 : "",
        h: common_vendor.f(bookPages.value, (page, k0, i0) => {
          return {
            a: page.page_url_source,
            b: common_vendor.o((e) => handleImageError(e, page), page.page_id),
            c: common_vendor.o((e) => onImageLoad(e, page.page_id), page.page_id),
            d: common_vendor.f(page.track_info, (track, k1, i1) => {
              return {
                a: track.track_id,
                b: common_vendor.s(getTrackStyle(track, page.page_id)),
                c: common_vendor.o(($event) => playAudio(track), track.track_id)
              };
            }),
            e: page.page_id
          };
        }),
        i: currentPage.value,
        j: common_vendor.o(handlePageChange),
        k: common_vendor.o(toggleCatalog),
        l: common_vendor.t(isPlaying.value ? "暂停" : "连读"),
        m: common_vendor.o(togglePlayCurrentPage),
        n: common_vendor.o(startRepeatMode),
        o: common_vendor.o(goToChatPage),
        p: showRepeatSelection.value
      }, showRepeatSelection.value ? {
        q: repeatOptions.value,
        r: common_vendor.o(handleRepeatSelection),
        s: common_vendor.o(confirmRepeat),
        t: common_vendor.o(cancelRepeat)
      } : {}, {
        v: isRepeatMode.value
      }, isRepeatMode.value ? {
        w: common_vendor.o(exitRepeatMode)
      } : {}), {
        b: error.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/textbook/books.vue"]]);
wx.createPage(MiniProgramPage);
