<template>
  <View class="book-container">
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
      </div>
    </div>

    <!-- 页面切换按钮 -->
     <!-- 底部控制区 -->
    <view class="bottom-controls">
      <!-- 页面切换按钮 -->
      <view class="page-controls">
        <view class="control-button" :class="{ disabled: currentPageIndex === 0 }" @tap="prevPage">
          <text class="iconfont icon-left"></text>
          <text>上一页</text>
        </view>
        <view class="page-number">{{ currentPageIndex + 1 }}/{{ pages.length }}</view>
        <view class="control-button" :class="{ disabled: currentPageIndex === pages.length - 1 }" @tap="nextPage">
          <text>下一页</text>
          <text class="iconfont icon-right"></text>
        </view>
      </view>

      <!-- 口语练习按钮 -->
      <view v-if="hasValidSentences" class="speak-button" @tap="goToChatPage">
        <image class="speak-icon" src="https://api.zfpai.top/static/icon_voice_fixed.png"></image>
        <text>口语</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app'; 
import Hls from 'hls.js';
import md5 from 'md5';
import topicRequest from "@/api/topic"; 
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

     const hasValidSentences = computed(() => {
      const sentences = getCurrentPageSentence();
      console.log('当前页面句子:', sentences); // 添加调试日志
      return sentences && sentences.length > 0;
    });
    // 切换侧边目录
    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };

    // 跳转到指定页面
    const goToPage = (index) => {
      currentPageIndex.value = index;
    };

    // 获取页面参数中的 book_id
    const book_id = ref('');
    onLoad((options) => {
      book_id.value = options.book_id;
      console.log('Received book_id:', book_id.value);
    });

    // 修改 fetchPages 方法
    const fetchPages = async () => {
      try {
        const response = await fetch(
          `https://rjdduploadw.mypep.cn/pub_cloud/10/${book_id.value}/${book_id.value}_Web.json`
        );
        const data = await response.json();
        pages.value = data.chapters.flatMap((chapter) => chapter.res_main);
        console.log('页面数据获取成功:', pages.value);
      } catch (error) {
        console.error('页面数据获取失败:', error);
      }
    };

    // 修改 fetchSentences 方法
    const fetchSentences = async () => {
      try {
        const response = await fetch(
          `https://diandu.mypep.cn/static/textbook/chapter/${book_id.value}_sentence.json`
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

    const fetchM3u8Url = async (res_id) => {
          const hostname = "diandu.mypep.cn"
          const input_string = hostname + res_id;
          // 计算字符串的 MD5 哈希
          const hashed_value = md5(input_string);
          console.log(hashed_value); // 输出 MD5 哈希值
          const url = `/ap33/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/${res_id}/${hashed_value}/hlsIndexM3u8.token?access_token=`;
          try {
          const response = await fetch(
            url,{
              method: 'GET',
              headers: {
                'Accept': '*/*',
                'Origin': 'https://diandu.mypep.cn',
                'Referer': 'https://diandu.mypep.cn/',
              },
            }
          );
          const data = await response.text();
          console.log('m3u8 文件内容:', data);
          return data;
        } catch (error) {
          console.error('获取 m3u8 文件失败:', error);
          return null;
        }
    }
    // 播放音频
    const playAudio = async (sentence) => {
      try {
        // 获取 m3u8 文件内容
        const m3u8Content = await fetchM3u8Url(sentence.res_id);
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

    // 获取当前页面所有句子的文本
    const getCurrentPageSentence = () => {
      if (!currentPageSentences.value) return [];
      return currentPageSentences.value
        .map(sentence => getSentenceText(sentence.res_id))
        .filter(sentence => sentence && sentence.text)
        .map(sentence => ({
          info_en: sentence.text,
          info_cn: sentence.translate_pc
        }));
    };

    // 修改返回按钮处理方法
    const goToChatPage = async () => {
      try {
        const lessonId = book_id.value + ":" + currentPageIndex.value;
        const sentences = getCurrentPageSentence();
        
        // 先检查是否存在会话
        const existingSession = await topicRequest.getSessionByLessonId({ lesson_id: lessonId });
        
        if (existingSession?.data) {
          const { id: sessionId, name } = existingSession.data;
          if (sessionId) {
            uni.navigateTo({
              url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}&sessionName=${name}`
            });
            return;
          }
        }
    
        // 创建新会话
        const response = await topicRequest.createLessonSession({
          lesson_id: lessonId,
          sentences: sentences
        });
    
        if (response?.data) {
          uni.navigateTo({
            url: `/pages/chat/index?sessionId=${response.data.id}&type=LESSON&lessonId=${lessonId}&sessionName=${response.data.name}`
          });
        } else {
          throw new Error('创建会话失败');
        }
      } catch (error) {
        console.error('创建课程会话失败:', error);
        uni.showToast({
          title: '创建会话失败',
          icon: 'none'
        });
      }
    };

    // 添加 goToChatPage 到 return 中
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
      hasValidSentences,  // 添加这一行
    };
  }
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
/* 底部控制区样式 */
.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 20%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.control-button {
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: #ffffff;
  border-radius: 100rpx;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.control-button.disabled {
  background: #cccccc;
  opacity: 0.7;
}

.page-number {
  font-size: 28rpx;
  color: #666;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
}

.speak-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  width: 90%;
  padding: 24rpx;
  background: linear-gradient(135deg, #FF6B6B, #FF5252);
  color: #ffffff;
  border-radius: 100rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
  margin-bottom: env(safe-area-inset-bottom);
}

.speak-icon {
  width: 48rpx;
  height: 48rpx;
}
</style>

