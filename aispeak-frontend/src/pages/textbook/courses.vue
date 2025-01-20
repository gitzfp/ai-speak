<template>
  <div class="book-container">
    <!-- 侧边目录 -->
    <div class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <button class="sidebar-toggle" @click="toggleSidebar">
        {{ isSidebarOpen ? '收起目录' : '展开目录' }}
      </button>
      <div class="sidebar-content">
        <ul>
          <li
            v-for="(page, index) in pages"
            :key="index"
            @click="goToPage(index)"
            :class="{ active: currentPageIndex === index }"
          >
            第 {{ index + 1 }} 页
          </li>
        </ul>
      </div>
    </div>

    <!-- 当前页面 -->
    <div class="page">
      <!-- 页面图片 -->
      <img
        v-if="currentPageImage"
        :src="currentPageImage"
        alt="Page Image"
        class="page-image"
        @load="onImageLoad"
        ref="pageImage"
      />

      <!-- 句子 -->
      <div
        v-for="sentence in currentPageSentences"
        :key="sentence.res_id"
        :style="{
          position: 'absolute',
          left: `${getScaledPosition(sentence.rect_pos_x, 'x')}px`,
          top: `${getScaledPosition(sentence.rect_pos_y, 'y')}px`,
          width: `${getScaledPosition(sentence.rect_width, 'x')}px`,
          height: `${getScaledPosition(sentence.rect_height, 'y')}px`,
          cursor: 'pointer',
          color: 'red',
          fontSize: '16px',
          fontWeight: 'bold',
          zIndex: 100,
          border: '1px solid #ccc',
        }"
        @click="playAudio(getSentenceText(sentence.res_id))"
      >
        {{ getSentenceText(sentence.res_id).text }}
      </div>
    </div>

    <!-- 页面切换按钮 -->
    <div class="page-controls">
      <button @click="prevPage" class="control-button">上一页</button>
      <button @click="nextPage" class="control-button">下一页</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import Hls from 'hls.js'; // 引入 hls.js 库

export default {
  setup() {
    // 页面数据
    const pages = ref([]);

    // 句子数据
    const sentences = ref([]);

    // 当前页面索引
    const currentPageIndex = ref(0);

    // 当前页面图片 URL
    const currentPageImage = ref('');

    // 图片缩放比例
    const scaleX = ref(1);
    const scaleY = ref(1);

    // 图片 DOM 元素
    const pageImage = ref(null);

    // 侧边目录展开状态
    const isSidebarOpen = ref(false);

    // 切换侧边目录
    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };

    // 跳转到指定页面
    const goToPage = (index) => {
      currentPageIndex.value = index;
    };

    // 从接口获取页面数据
    const fetchPages = async () => {
      try {
        const response = await fetch(
          'https://rjdduploadw.mypep.cn/pub_cloud/10/1212001101244/1212001101244_Web.json'
        );
        const data = await response.json();
        pages.value = data.chapters.flatMap((chapter) => chapter.res_main);
        console.log('页面数据获取成功:', pages.value);
      } catch (error) {
        console.error('页面数据获取失败:', error);
      }
    };

    // 从接口获取句子数据
    const fetchSentences = async () => {
      try {
        const response = await fetch(
          'https://diandu.mypep.cn/static/textbook/chapter/1212001101244_sentence.json'
        );
        const data = await response.json();
        sentences.value = data.list.flatMap((chapter) =>
          chapter.groups.flatMap((group) => group.sentences)
        );
        console.log('句子数据获取成功:', sentences.value);
      } catch (error) {
        console.error('句子数据获取失败:', error);
      }
    };

    // 从接口获取图片 URL 签名
    const fetchImageUrlSignature = async (pageUrl) => {
      if (!pageUrl) {
        console.error('pageUrl 未定义');
        return null;
      }

      try {
        const response = await fetch(
          '/ap22/resources/ak/pep_click/user/951/urlSignature.json?access_token=KVEmCAZAAQxpKjcsArcMfTuUfkLeg%2BpddaupDU%2FFAtsl0ONFwKl%2Bx66qKejTFeD8sy4NV19l2dyDVvH2RdV0tA%3D%3D',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              flag: '1',
              fileNameUrl: `https://szjc-3.mypep.cn${pageUrl}`,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`请求失败，状态码：${response.status}`);
        }

        const data = await response.json();
        console.log('图片 URL 签名成功:', data);
        return data.url_signature;
      } catch (error) {
        console.error('图片 URL 签名获取失败:', error);
        return null;
      }
    };

    // 更新当前页面图片 URL
    const updateCurrentPageImage = async () => {
      if (pages.value.length === 0) {
        console.error('页面数据未加载');
        currentPageImage.value = '';
        return;
      }

      const pageUrl = pages.value[currentPageIndex.value]?.page_url;
      if (!pageUrl) {
        console.error('当前页面 URL 未找到');
        currentPageImage.value = '';
        return;
      }

      const urlSignature = await fetchImageUrlSignature(pageUrl);
      if (!urlSignature) {
        console.error('获取 URL 签名失败');
        currentPageImage.value = '';
        return;
      }

      console.log('当前页面图片 URL:', urlSignature);
      currentPageImage.value = urlSignature;
    };

    // 图片加载完成时计算缩放比例
    const onImageLoad = () => {
      const image = pageImage.value;
      if (image) {
        const containerWidth = document.querySelector('.book-container').clientWidth;
        scaleX.value = containerWidth / image.naturalWidth;
        scaleY.value = containerWidth / image.naturalWidth; // 保持宽高比一致
        console.log('图片缩放比例:', { scaleX: scaleX.value, scaleY: scaleY.value });
      }
    };

    // 根据缩放比例调整位置
    const getScaledPosition = (value, axis) => {
      if (axis === 'x') {
        return value * scaleX.value;
      } else if (axis === 'y') {
        return value * scaleY.value;
      }
      return value;
    };

    const fetchSignedUrl = async (filePath) => {
  try {
    const response = await fetch(
      '/ap22/resources/ak/pep_click/user/951/urlSignature.json?access_token=KVEmCAZAAQxpKjcsArcMfTuUfkLeg%2BpddaupDU%2FFAtsl0ONFwKl%2Bx66qKejTFeD8sy4NV19l2dyDVvH2RdV0tA%3D%3D',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          flag: '1',
          fileNameUrl: `https://szjc-3.mypep.cn${filePath}`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`请求失败，状态码：${response.status}`);
    }

    const data = await response.json();
    return data.url_signature; // 返回签名后的 URL
  } catch (error) {
    console.error('获取签名 URL 失败:', error);
    return null;
  }
};

const fetchM3u8Url = async (filePath) => {
  try {
    const response = await fetch(
      `/ap33/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/12120011012440100001724326791314/79a95acd885d781183cebec7386e300e/hlsIndexM3u8.token?access_token=`,
      {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Origin': 'https://diandu.mypep.cn',
          'Referer': 'https://diandu.mypep.cn/',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`请求失败，状态码：${response.status}`);
    }

    const data = await response.text() 
    return data
  } catch (error) {
    console.error('获取 m3u8 URL 失败:', error);
    return null;
  }
};
    // 播放音频
    const playAudio = async (sentence) => {
      try {
        await fetchSignedUrl(sentence.file_path, sentence.access_token);
        // 获取 m3u8 文件内容
        const m3u8Content = await fetchM3u8Url(sentence.file_path, sentence.access_token);
        if (!m3u8Content) {
          console.error('无法获取 m3u8 文件内容');
          return;
        }

        // 将 m3u8 文件内容转换为 Blob URL
        const blob = new Blob([m3u8Content], { type: 'application/vnd.apple.mpegurl' });
        const blobUrl = URL.createObjectURL(blob);

        // 使用 hls.js 播放音频
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(blobUrl);
          const audioElement = new Audio();
          hls.attachMedia(audioElement);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            audioElement.play();
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS 错误:', data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('网络错误，尝试重新加载');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('媒体错误，尝试重新加载');
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('无法恢复的错误');
                  hls.destroy();
                  break;
              }
            }
          });
        } else if (audioElement.canPlayType('application/vnd.apple.mpegurl')) {
          // 原生支持 HLS 的浏览器
          const audioElement = new Audio(blobUrl);
          audioElement.play();
        } else {
          console.error('当前浏览器不支持 HLS 播放');
        }
      } catch (error) {
        console.error('音频播放失败:', error);
      }
    };

    // 组件挂载时获取数据
    onMounted(async () => {
      await fetchPages();
      await fetchSentences();
      await updateCurrentPageImage();

      // 监听窗口大小变化
      window.addEventListener('resize', onImageLoad);
    });

    // 组件卸载时移除监听器
    onUnmounted(() => {
      window.removeEventListener('resize', onImageLoad);
    });

    // 监听 currentPageIndex 变化，更新图片 URL
    watch(currentPageIndex, async () => {
      await updateCurrentPageImage();
    });

    // 当前页面的句子数据
    const currentPageSentences = computed(() => {
      if (pages.value.length === 0) return [];
      return pages.value[currentPageIndex.value].track_info;
    });

    // 根据 res_id 获取句子的 text
    const getSentenceText = (resId) => {
      const sentence = sentences.value.find((s) => s.res_id === resId);
      console.log('查找句子:', resId, '结果:', sentence);
      return sentence || {};
    };

    // 上一页
    const prevPage = () => {
      if (currentPageIndex.value > 0) {
        currentPageIndex.value--;
      }
    };

    // 下一页
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
      pages,
    };
  },
};
</script>

<style scoped>
.book-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 侧边目录 */
.sidebar {
  position: fixed;
  top: 30px;
  left: -300px;
  width: 300px;
  height: 100vh;
  background-color: #f8f9fa;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 1000;
}

.sidebar.sidebar-open {
  left: 0;
}

.sidebar-toggle {
  position: absolute;
  top: 20px;
  right: -60px;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 14px;
}

.sidebar-content {
  padding: 20px;
}

.sidebar-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-content li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
  transition: background-color 0.2s ease;
}

.sidebar-content li:hover {
  background-color: #e9ecef;
}

.sidebar-content li.active {
  background-color: #4CAF50;
  color: white;
}

/* 页面内容 */
.page {
  position: relative;
  flex: 1;
  overflow: auto;
}

.page-image {
  width: 100%;
  height: auto;
}

/* 页面切换按钮 */
.page-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 1000;
}

.control-button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;
}

.control-button:hover {
  background-color: #45a049;
}
</style>