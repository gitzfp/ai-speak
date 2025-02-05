"use strict";
const common_vendor = require("../../common/vendor.js");
const api_topic = require("../../api/topic.js");
const config_env = require("../../config/env.js");
require("../../axios/api.js");
const _sfc_main = {
  setup() {
    const baseUrl = config_env.__config.basePath;
    const pages = common_vendor.ref([]);
    const sentences = common_vendor.ref([]);
    const chapters = common_vendor.ref([]);
    const isPlaying = common_vendor.ref(false);
    const currentAudio = common_vendor.ref(null);
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
    const checkFileInOSS = async (ossKey) => {
      try {
        const { data: data2 } = await common_vendor.index.request({
          url: `${baseUrl}/ali-oss/check-file/?oss_key=${ossKey}`,
          method: "GET"
        });
        return data2;
      } catch (error) {
        console.error("检查文件失败:", error);
        return { exists: false };
      }
    };
    const uploadFileToOSS = async (ossKey, fileData) => {
      try {
        console.log("开始上传文件, ossKey:", ossKey);
        if (ossKey.endsWith(".json")) {
          const { data: data3 } = await common_vendor.index.request({
            url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
            method: "POST",
            header: {
              "Content-Type": "application/json"
            },
            data: {
              oss_key: ossKey,
              content: fileData
            }
          });
          console.log("JSON 数据上传成功:", data3);
          return data3;
        }
        if (typeof fileData === "string" && (fileData.startsWith("http://") || fileData.startsWith("https://"))) {
          const tempFilePath = await new Promise((resolve, reject) => {
            common_vendor.index.downloadFile({
              url: fileData,
              success: (res) => {
                if (res.statusCode === 200) {
                  resolve(res.tempFilePath);
                } else {
                  reject(new Error("下载文件失败"));
                }
              },
              fail: reject
            });
          });
          fileData = tempFilePath;
        }
        const { data: data2 } = await common_vendor.index.uploadFile({
          url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
          filePath: fileData,
          name: "file"
        });
        console.log("文件上传成功:", data2);
        return typeof data2 === "string" ? JSON.parse(data2) : data2;
      } catch (error) {
        console.error("文件上传失败:", error);
        return null;
      }
    };
    const getFileFromOSS = async (ossKey) => {
      var _a;
      try {
        const { data: data2 } = await common_vendor.index.request({
          url: `${baseUrl}/ali-oss/get-file/?oss_key=${ossKey}`,
          method: "GET",
          header: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        });
        if (data2.code !== 1e3) {
          throw new Error(data2.message || "获取文件失败");
        }
        if (ossKey.endsWith(".m3u8")) {
          return (_a = data2 == null ? void 0 : data2.data) == null ? void 0 : _a.content;
        }
        if (ossKey.endsWith(".json")) {
          const jsonContent = JSON.parse(data2.data.content);
          console.log("解析后的 JSON 内容:", jsonContent);
          return jsonContent;
        } else {
          return data2.data.url;
        }
      } catch (error) {
        console.error("获取文件失败:", error);
        return null;
      }
    };
    const fetchPages = async () => {
      try {
        const ossKey = `json_files/${book_id.value}_Web.json`;
        const checkResult = await checkFileInOSS(ossKey);
        if (checkResult == null ? void 0 : checkResult.data.exists) {
          const data2 = await getFileFromOSS(ossKey);
          pages.value = data2.chapters.flatMap((chapter) => chapter.res_main);
          console.log("页面数据获取成功（来自 OSS）:", pages.value);
        } else {
          const url = `https://rjdduploadw.mypep.cn/pub_cloud/10/${book_id.value}/${book_id.value}_Web.json`;
          console.log("页面数据获取请求开始:", pages.value);
          const response = await new Promise((resolve, reject) => {
            common_vendor.index.request({
              url,
              method: "GET",
              success: (res) => {
                resolve(res);
              },
              fail: (err) => {
                reject(err);
              }
            });
          });
          const data2 = response.data;
          pages.value = data2.chapters.flatMap((chapter) => chapter.res_main);
          console.log("页面数据获取成功（来自原接口）:", pages.value);
          const jsonString = JSON.stringify(data2);
          await uploadFileToOSS(ossKey, jsonString);
          console.log("JSON 数据上传成功");
        }
      } catch (error) {
        console.error("页面数据获取失败:", error);
      }
    };
    const fetchSentences = async () => {
      var _a;
      const ossKey = `json_files/${book_id.value}_sentence.json`;
      const checkResult = await checkFileInOSS(ossKey);
      console.log("检查文件是否存在:", checkResult);
      if ((_a = checkResult == null ? void 0 : checkResult.data) == null ? void 0 : _a.exists) {
        const data2 = await getFileFromOSS(ossKey);
        sentences.value = data2.list.flatMap(
          (chapter) => chapter.groups.flatMap((group) => group.sentences)
        );
        chapters.value = data2.list;
        console.log("句子数据获取成功（来自 OSS）:", sentences.value, chapters.value);
      } else {
        try {
          const url = `https://diandu.mypep.cn/static/textbook/chapter/${book_id.value}_sentence.json`;
          const response = await new Promise((resolve, reject) => {
            common_vendor.index.request({
              url,
              method: "GET",
              success: (res) => {
                resolve(res);
              },
              fail: (err) => {
                reject(err);
              }
            });
          });
          const data2 = await response.data;
          chapters.value = data2.list;
          console.log("Chapters data:", chapters.value);
          sentences.value = data2.list.flatMap(
            (chapter) => chapter.groups.flatMap((group) => group.sentences)
          );
          console.log("句子数据获取成功（来自原接口）:", chapters.value, sentences.value);
          const jsonString = JSON.stringify(data2);
          await uploadFileToOSS(ossKey, jsonString);
        } catch (error) {
          console.error("句子数据获取失败:", error);
        }
      }
    };
    const getAccessToken = async () => {
      try {
        const { data: data2 } = await common_vendor.index.request({
          url: `${baseUrl}/ap22/user/pep_click/215/access_token.json`,
          method: "POST",
          header: {
            "Accept": "*/*",
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://diandu.mypep.cn",
            "Referer": "https://diandu.mypep.cn/rjdd/"
          }
        });
        console.log(`获取 access_token 成功:`, data2);
        return data2.access_token;
      } catch (error) {
        console.error("获取 access_token 失败:", error);
        throw error;
      }
    };
    const retryImageSignature = async (pageUrl, accessToken) => {
      const { data: data2 } = await common_vendor.index.request({
        url: `${baseUrl}/ap22/resources/ak/pep_click/user/951/urlSignature.json?access_token=${accessToken}`,
        method: "POST",
        header: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        data: {
          flag: "1",
          fileNameUrl: `https://szjc-3.mypep.cn${pageUrl}`
        }
      });
      console.log("图片 URL 签名成功:", data2);
      return data2.url_signature;
    };
    const fetchImageUrlSignature = async (pageUrl) => {
      if (!pageUrl) {
        console.error("pageUrl 未定义");
        return null;
      }
      let accessToken = "Er0iHLzF3oww+9UGQ6wU8U7ZuQQQa011qxMFTQkJj45MGgNjf4QUVVWL6OyOxinnufcJ7SMVceH7M9JWzsnINw==";
      try {
        try {
          data = await retryImageSignature(pageUrl, accessToken);
          if (!data) {
            accessToken = await getAccessToken();
            return await retryImageSignature(pageUrl, accessToken);
          }
          return data;
        } catch (error) {
          console.log("access_token 已失效，重新获取");
          accessToken = await getAccessToken();
          return await retryImageSignature(pageUrl, accessToken);
        }
      } catch (error) {
        console.error("图片 URL 签名获取失败:", error);
        return null;
      }
    };
    const updateCurrentPageImage = async () => {
      var _a, _b;
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
      const ossKey = `images/${book_id.value}/${pageUrl.split("/").pop()}`;
      const checkResult = await checkFileInOSS(ossKey);
      if ((_b = checkResult == null ? void 0 : checkResult.data) == null ? void 0 : _b.exists) {
        currentPageImage.value = await getFileFromOSS(ossKey);
        console.log("当前页面图片 URL（来自 OSS）:", currentPageImage.value);
      } else {
        const urlSignature = await fetchImageUrlSignature(pageUrl);
        if (!urlSignature) {
          console.error("获取 URL 签名失败");
          currentPageImage.value = "";
          return;
        }
        console.log("当前页面图片 URL（来自原接口）:", urlSignature);
        currentPageImage.value = urlSignature;
        const response = await common_vendor.index.request(urlSignature);
        const blob = await response.blob();
        const file = new File([blob], ossKey.split("/").pop());
        await uploadFileToOSS(ossKey, file);
      }
    };
    const onImageLoad = (e) => {
      const { width: naturalWidth, height: naturalHeight } = e.detail;
      const query = common_vendor.index.createSelectorQuery();
      query.select(".book-container").boundingClientRect((data2) => {
        const containerWidth = data2.width;
        const containerHeight = data2.height;
        const widthScale = containerWidth / naturalWidth;
        const heightScale = containerHeight / naturalHeight;
        const scale = Math.min(widthScale, heightScale);
        scaleX.value = scale;
        scaleY.value = scale;
        console.log("图片缩放比例:", {
          scaleX: scaleX.value,
          scaleY: scaleY.value,
          naturalWidth,
          naturalHeight,
          containerWidth,
          containerHeight
        });
      }).exec();
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
      var _a, _b, _c, _d;
      const ossKey = `audios/${book_id.value}/${res_id}.mp3`;
      console.log("开始获取音频 URL, ossKey:", ossKey);
      try {
        const checkResult = await checkFileInOSS(ossKey);
        console.log("检查 OSS 文件结果:", checkResult);
        if ((_a = checkResult == null ? void 0 : checkResult.data) == null ? void 0 : _a.exists) {
          const m3u8Content = (_b = checkResult == null ? void 0 : checkResult.data) == null ? void 0 : _b.url;
          console.log("从阿里云获取到的 URL:", m3u8Content);
          return m3u8Content;
        } else {
          console.log("开始网络请求音频");
          const hostname = "diandu.mypep.cn";
          const input_string = hostname + res_id;
          const hashed_value = common_vendor.md5Exports(input_string);
          const url = `${baseUrl}/ap33/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/${res_id}/${hashed_value}/hlsIndexM3u8.token?access_token=`;
          const realUrl = `https://api.mypep.com.cn/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/${res_id}/${hashed_value}/hlsIndexM3u8.token?access_token=`;
          console.log("请求 URL:", url);
          const response = await new Promise((resolve, reject) => {
            common_vendor.index.request({
              url,
              method: "GET",
              success: (res) => {
                resolve(res);
              },
              fail: (err) => {
                reject(err);
              }
            });
          });
          if (!response.data) {
            throw new Error("获取音频数据失败");
          }
          console.log("获取到的音频数据:", response.data);
          const encodedRealUrl = encodeURIComponent(realUrl);
          console.log("开始解密和上传");
          const uploadResponse = await new Promise((resolve, reject) => {
            common_vendor.index.request({
              url: `${baseUrl}/ali-oss/decrypt-and-upload/?oss_key=${ossKey}&url=${realUrl}`,
              method: "GET",
              success: (res) => {
                resolve(res);
              },
              fail: (err) => {
                reject(err);
              }
            });
          });
          if (!uploadResponse.data) {
            throw new Error("解密上传失败");
          }
          console.log("解密上传响应:", uploadResponse.data);
          return (_d = (_c = uploadResponse.data) == null ? void 0 : _c.data) == null ? void 0 : _d.url;
        }
      } catch (err) {
        console.error("获取音频 URL 过程中发生错误:", err);
        return null;
      }
    };
    const playAudio = async (sentence) => {
      try {
        if (currentAudio.value) {
          currentAudio.value.stop();
          currentAudio.value.destroy();
          currentAudio.value = null;
        }
        const audioUrl = await fetchM3u8Url(sentence.res_id);
        if (!audioUrl) {
          throw new Error("获取音频地址失败");
        }
        return new Promise((resolve, reject) => {
          const audioContext = common_vendor.index.createInnerAudioContext();
          audioContext.src = audioUrl;
          audioContext.autoplay = true;
          audioContext.onError((res) => {
            console.error("音频播放错误:", res);
            reject(new Error("音频播放失败"));
          });
          audioContext.onEnded(() => {
            audioContext.destroy();
            currentAudio.value = null;
            resolve();
          });
          currentAudio.value = audioContext;
        });
      } catch (error) {
        console.error("播放音频失败:", error);
        throw error;
      }
    };
    const playAllSentences = async () => {
      if (isPlaying.value) {
        stopPlayback();
        return;
      }
      isPlaying.value = true;
      console.log("开始连读，当前播放状态:", isPlaying.value);
      try {
        while (isPlaying.value && currentPageIndex.value < pages.value.length) {
          const sentences2 = currentPageSentences.value;
          if (!sentences2 || sentences2.length === 0) {
            console.log("当前页面没有句子，切换到下一页");
            nextPage();
            continue;
          }
          console.log(`开始播放第 ${currentPageIndex.value + 1} 页，共 ${sentences2.length} 个句子`);
          for (let i = 0; i < sentences2.length; i++) {
            if (!isPlaying.value) {
              console.log("播放被手动停止");
              break;
            }
            const sentence = sentences2[i];
            const sentenceText = getSentenceText(sentence.res_id);
            if (!sentenceText) {
              console.warn(`跳过无效句子: ${sentence.res_id}`);
              continue;
            }
            console.log(`播放第 ${i + 1} 个句子:`, sentenceText);
            await playAudio(sentenceText);
            if (isPlaying.value && i < sentences2.length - 1) {
              console.log("添加 800ms 间隔");
              await new Promise((resolve) => setTimeout(resolve, 800));
            }
          }
          if (isPlaying.value && currentPageIndex.value < pages.value.length - 1) {
            console.log("切换到下一页");
            nextPage();
            await new Promise((resolve) => setTimeout(resolve, 1e3));
          } else {
            console.log("已播放到最后一页，停止连读");
            break;
          }
        }
      } catch (error) {
        console.error("连续播放失败:", error);
        common_vendor.index.showToast({
          title: "连续播放失败",
          icon: "none"
        });
      } finally {
        console.log("连读结束，重置播放状态");
        isPlaying.value = false;
        if (currentAudio.value) {
          currentAudio.value.stop();
          currentAudio.value.destroy();
          currentAudio.value = null;
        }
      }
    };
    const stopPlayback = () => {
      isPlaying.value = false;
      if (currentAudio.value) {
        currentAudio.value.stop();
        currentAudio.value.destroy();
        currentAudio.value = null;
      }
    };
    const currentChapterName = common_vendor.computed(() => {
      if (!chapters.value.length)
        return "";
      const currentChapter = chapters.value.find((chapter) => {
        const startPage = chapter.groups[0].str_page - 1;
        const endPage = startPage + (chapter.groups.length || 0);
        return currentPageIndex.value >= startPage && currentPageIndex.value < endPage;
      });
      return currentChapter ? currentChapter.chapterName : "";
    });
    common_vendor.onMounted(async () => {
      await fetchPages();
      await fetchSentences();
      await updateCurrentPageImage();
    });
    common_vendor.onUnmounted(() => {
      if (currentAudio.value) {
        currentAudio.value.stop();
        currentAudio.value.destroy();
        currentAudio.value = null;
      }
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
      return sentence || { res_id: resId };
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
              url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}&sessionName=${currentChapterName.value}`
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
            url: `/pages/chat/index?sessionId=${response.data.id}&type=LESSON&lessonId=${lessonId}&sessionName=${currentChapterName.value}`
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
      chapters,
      goToChatPage,
      hasValidSentences,
      // 添加这一行
      playAllSentences,
      isPlaying,
      currentChapterName
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
    c: common_vendor.f($setup.chapters, (page, index, i0) => {
      return {
        a: common_vendor.t(page.chapterName),
        b: common_vendor.t(page.groups[0].str_page - 1),
        c: index,
        d: common_vendor.o(($event) => $setup.goToPage(page.groups[0].str_page - 2), index),
        e: $setup.currentPageIndex === page.groups[0].str_page - 2 ? 1 : ""
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
    i: $setup.hasValidSentences
  }, $setup.hasValidSentences ? {
    j: common_vendor.o((...args) => $setup.goToChatPage && $setup.goToChatPage(...args))
  } : {}, {
    k: $setup.currentPageSentences.length > 1
  }, $setup.currentPageSentences.length > 1 ? {
    l: common_vendor.t($setup.isPlaying ? "停止" : "连读"),
    m: common_vendor.o((...args) => $setup.playAllSentences && $setup.playAllSentences(...args))
  } : {}, {
    n: $setup.currentPageIndex === 0 ? 1 : "",
    o: common_vendor.o((...args) => $setup.prevPage && $setup.prevPage(...args)),
    p: common_vendor.t($setup.currentPageIndex + 1),
    q: common_vendor.t($setup.pages.length),
    r: $setup.currentPageIndex === $setup.pages.length - 1 ? 1 : "",
    s: common_vendor.o((...args) => $setup.nextPage && $setup.nextPage(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b93a630c"], ["__file", "/Users/zfp/Downloads/ai-speak/aispeak-frontend/src/pages/textbook/courses.vue"]]);
wx.createPage(MiniProgramPage);
