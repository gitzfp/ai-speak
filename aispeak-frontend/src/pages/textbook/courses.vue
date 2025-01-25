<template>
  <View class="book-container">
    <div class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }" style="display: block;">
      <button class="sidebar-toggle" @click="toggleSidebar">
        {{ isSidebarOpen ? '收起目录' : '展开目录' }}
      </button>
      <div class="sidebar-content">
        <ul>
          <li
            v-for="(page, index) in chapters"
            :key="index"
            @click="goToPage(page.groups[0].str_page - 2)"
            :class="{ active: currentPageIndex === page.groups[0].str_page - 2}"
          >
            {{ page.chapterName }} - ({{ page.groups[0].str_page - 1}})
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

      <!-- 口语练习按钮 -->
      <view v-if="hasValidSentences" class="speak-button" @tap="goToChatPage">
        <text>口语</text>
      </view>
      
      <!-- 连读按钮 -->
      <view v-if="currentPageSentences.length > 1" class="continuous-read-button" @tap="playAllSentences">
        <text>{{ isPlaying ? '停止' : '连读' }}</text>
      </view>
      <!-- 页面切换按钮 -->
      <view class="page-controls">
        <view class="control-button" :class="{ disabled: currentPageIndex === 0 }" @tap="prevPage">
          <text class="iconfont icon-left"></text>
          <text>上页</text>
        </view>
        <view class="page-number">{{ currentPageIndex + 1 }}/{{ pages.length }}</view>
        <view class="control-button" :class="{ disabled: currentPageIndex === pages.length - 1 }" @tap="nextPage">
          <text>下页</text>
          <text class="iconfont icon-right"></text>
        </view>
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
import env from "@/config/env"; // 导入 env.ts

export default {
  setup() {
    const baseUrl = env.basePath; // 获取 basePath

    // 页面数据
    const pages = ref([]);

    // 句子数据
    const sentences = ref([]);

    // 目录
    const chapters = ref([]);
    // 添加播放状态和当前音频元素的引用
    const isPlaying = ref(false);
    const currentAudio = ref(null);

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

    const checkFileInOSS = async (ossKey) => {
      try {
        const response = await fetch(`${baseUrl}/ali-oss/check-file/?oss_key=${ossKey}`);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('检查文件失败:', error);
        return { exists: false };
      }
    };

    const uploadFileToOSS = async (ossKey, file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        console.log('文件上传成功:', data);
        return data;
      } catch (error) {
        console.error('文件上传失败:', error);
        return null;
      }
    };

    const getFileFromOSS = async (ossKey) => {
      try {
        const response = await fetch(`${baseUrl}/ali-oss/get-file/?oss_key=${ossKey}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`请求失败，状态码：${response.status}`);
        }

        const data = await response.json();
        console.log('OSS response:', ossKey, data);

        if (data.code !== 1000) {
          throw new Error(data.message || '获取文件失败');
        }
        if(ossKey.endsWith('.m3u8')) {
          return data?.data?.content 
        }
        // 根据文件类型处理返回内容
        if (ossKey.endsWith('.json') ) {
          // JSON 文件返回解析后的内容
          const jsonContent = JSON.parse(data.data.content);
          console.log('解析后的 JSON 内容:', jsonContent);
          return jsonContent;
        } else {
          // 其他类型文件（图片、音频等）返回 URL
          return data.data.url;
        }
      } catch (error) {
        console.error('获取文件失败:', error);
        return null;
      }
    };    // 修改 fetchPages 方法
    const fetchPages = async () => {
      // 如果未存储，调用原有接口获取数据
      try {
      const ossKey = `json_files/${book_id.value}_Web.json`;

      // 检查文件是否已存储在阿里云 OSS 中
      const checkResult = await checkFileInOSS(ossKey);

      if (checkResult?.data.exists) {
        // 如果已存储，直接从 FastAPI 获取文件 URL
        const data = await getFileFromOSS(ossKey);
        pages.value = data.chapters.flatMap((chapter) => chapter.res_main);
        console.log('页面数据获取成功（来自 OSS）:', pages.value);
      } else {
        
          const response = await fetch(
            `https://rjdduploadw.mypep.cn/pub_cloud/10/${book_id.value}/${book_id.value}_Web.json`
          );
          const data = await response.json();
          pages.value = data.chapters.flatMap((chapter) => chapter.res_main);
          console.log('页面数据获取成功（来自原接口）:', pages.value);

          // 将数据上传到阿里云 OSS
          const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
          const file = new File([blob], `${book_id.value}_Web.json`);
          await uploadFileToOSS(ossKey, file);
        } 
      }
      catch (error) {
          console.error('页面数据获取失败:', error);
        }
    };

  const fetchSentences = async () => {
    const ossKey = `json_files/${book_id.value}_sentence.json`;

    // 检查文件是否已存储在阿里云 OSS 中
    const checkResult = await checkFileInOSS(ossKey);
    console.log('检查文件是否存在:', checkResult);
    if (checkResult?.data?.exists) {
      // 如果已存储，直接从 FastAPI 获取文件 URL
      const data = await getFileFromOSS(ossKey);
      sentences.value = data.list.flatMap((chapter) =>
        chapter.groups.flatMap((group) => group.sentences)
      );
      chapters.value = data.list
      console.log('句子数据获取成功（来自 OSS）:', sentences.value, chapters.value);
    } else {
      // 如果未存储，调用原有接口获取数据
      try {
        const response = await fetch(
          `https://diandu.mypep.cn/static/textbook/chapter/${book_id.value}_sentence.json`
        );
        const data = await response.json();
        chapters.value = data.list
        console.log('Chapters data:', chapters.value);
        sentences.value = data.list.flatMap((chapter) =>
          chapter.groups.flatMap((group) => group.sentences)
        );
        console.log('句子数据获取成功（来自原接口）:', chapters.value, sentences.value);

        // 将数据上传到阿里云 OSS
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const file = new File([blob], `${book_id.value}_sentence.json`);
        await uploadFileToOSS(ossKey, file);
      } catch (error) {
        console.error('句子数据获取失败:', error);
      }
    }
  }; 

    // 从接口获取图片 URL 签名
    // 获取 access_token
    const getAccessToken = async () => {
      try {
        const response = await fetch(`${baseUrl}/ap22/user/pep_click/215/access_token.json`, {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://diandu.mypep.cn',
            'Referer': 'https://diandu.mypep.cn/rjdd/',
          }
        });
    
        if (!response.ok) {
          throw new Error(`获取 access_token 失败, ${response.status}`);
        }
    
        const data = await response.json();
        console.log(`获取 access_token 成功: ,` ,data);

        return data.access_token;
      } catch (error) {
        console.error('获取 access_token 失败:', error);
        throw error;
      }
    };
    
    // 处理图片签名请求的重试逻辑
    const retryImageSignature = async (pageUrl, accessToken) => {
      const response = await fetch(
        `${baseUrl}/ap22/resources/ak/pep_click/user/951/urlSignature.json?access_token=${accessToken}`,
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
    };
    
    // 修改 fetchImageUrlSignature 函数
    const fetchImageUrlSignature = async (pageUrl) => {
      if (!pageUrl) {
        console.error('pageUrl 未定义');
        return null;
      }
    
      let accessToken = 'Er0iHLzF3oww+9UGQ6wU8U7ZuQQQa011qxMFTQkJj45MGgNjf4QUVVWL6OyOxinnufcJ7SMVceH7M9JWzsnINw==';
    
      try {
        // 尝试使用当前 token 获取签名
        try {
          data =  await retryImageSignature(pageUrl, accessToken);
          if(!data){
            accessToken = await getAccessToken();
            return await retryImageSignature(pageUrl, accessToken);
          }
          return data
        } catch (error) {
          console.log('access_token 已失效，重新获取');
          // 获取新的 token 并重试
          accessToken = await getAccessToken();
          return await retryImageSignature(pageUrl, accessToken);
        }
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

        const ossKey = `images/${book_id.value}/${pageUrl.split('/').pop()}`;

        // 检查文件是否已存储在阿里云 OSS 中
        const checkResult = await checkFileInOSS(ossKey);

        if (checkResult?.data?.exists) {
          // 如果已存储，直接从 FastAPI 获取文件 URL
          currentPageImage.value = await getFileFromOSS(ossKey);
          console.log('当前页面图片 URL（来自 OSS）:', currentPageImage.value);
        } else {
          // 如果未存储，调用原有接口获取数据
          const urlSignature = await fetchImageUrlSignature(pageUrl);
          if (!urlSignature) {
            console.error('获取 URL 签名失败');
            currentPageImage.value = '';
            return;
          }

          console.log('当前页面图片 URL（来自原接口）:', urlSignature);
          currentPageImage.value = urlSignature;

          // 将图片上传到阿里云 OSS
          const response = await fetch(urlSignature);
          const blob = await response.blob();
          const file = new File([blob], ossKey.split('/').pop());
          await uploadFileToOSS(ossKey, file);
        }
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
        const ossKey = `audios/${book_id.value}/${res_id}.m3u8`;

        // 检查文件是否已存储在阿里云 OSS 中
        const checkResult = await checkFileInOSS(ossKey);

        if (checkResult?.data?.exists1) {
          // 如果已存储，直接从 FastAPI 获取文件 URL
         const m3u8Content = await getFileFromOSS(ossKey);
          // 输出提取的 URI
         return m3u8Content
        } else {
          // 如果未存储，调用原有接口获取数据
          const hostname = "diandu.mypep.cn";
          const input_string = hostname + res_id;
          const hashed_value = md5(input_string);
          const url = `${baseUrl}/ap33/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/${res_id}/${hashed_value}/hlsIndexM3u8.token?access_token=`;
          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': '*/*',
                'Origin': 'https://diandu.mypep.cn',
                'Referer': 'https://diandu.mypep.cn/',
              },
            });
            const data = await response.text();
            console.log('m3u8 文件内容（来自原接口）:', data);

            // 将数据上传到阿里云 OSS
            const blob = new Blob([data], { type: 'application/vnd.apple.mpegurl' });
            const file = new File([blob], `${res_id}.m3u8`);
            await uploadFileToOSS(ossKey, file);

            return data;
          } catch (error) {
            console.error('获取 m3u8 文件失败:', error);
            return null;
          }
        }
      };
    // 播放音频
    const playAudio = async (sentence) => {
      try {
        // 获取 m3u8 文件内容
        const m3u8Content = await fetchM3u8Url(sentence.res_id);
        if (!m3u8Content) {
          console.error('无法获取 m3u8 文件内容');
          return null;
        }
        // 将 m3u8 文件内容转换为 Blob URL
        const blob = new Blob([m3u8Content], { type: 'application/vnd.apple.mpegurl' });
        const blobUrl = URL.createObjectURL(blob);

        // 使用 hls.js 播放音频
        if (Hls.isSupported()) {
          const hls = new Hls();
          const audioElement = new Audio();
          hls.loadSource(blobUrl);
          hls.attachMedia(audioElement);
          
          return new Promise((resolve) => {
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              audioElement.play();
              resolve(audioElement);
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
          });
        } else if (audioElement.canPlayType('application/vnd.apple.mpegurl')) {
          // 原生支持 HLS 的浏览器
          audioElement.src = blobUrl;
          audioElement.play();
          return Promise.resolve(audioElement);
        } else {
          console.error('当前浏览器不支持 HLS 播放');
          return null;
        }
      } catch (error) {
        console.error('音频播放失败:', error);
        return null;
      }
    };

    const currentChapterName = computed(() => {
      if (!chapters.value.length) return '';
      // Find the chapter that contains the current page
      const currentChapter = chapters.value.find(chapter => {
        const startPage = chapter.groups[0].str_page - 1;
        const endPage = startPage + (chapter.groups.length || 0);
        return currentPageIndex.value >= startPage && currentPageIndex.value < endPage;
      });
      return currentChapter ? currentChapter.chapterName : '';
    });

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
      return sentence || {res_id: resId};
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
              url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}&sessionName=${currentChapterName.value}`
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
            url: `/pages/chat/index?sessionId=${response.data.id}&type=LESSON&lessonId=${lessonId}&sessionName=${currentChapterName.value}`
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

    // 停止播放
    const stopPlayback = () => {
      isPlaying.value = false;
      if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value = null;
      }
    };

    // 播放所有句子音频
    const playAllSentences = async () => {
      // 如果已经在播放，则停止
      if (isPlaying.value) {
        stopPlayback();
        return;
      }

      // 设置播放状态
      isPlaying.value = true;

      try {
        // 循环播放所有页面
        while (isPlaying.value && currentPageIndex.value < pages.value.length) {
          const sentences = currentPageSentences.value;
          if (!sentences || sentences.length === 0) {
            // 如果当前页面没有句子，直接跳转到下一页
            nextPage();
            continue;
          }

          // 禁用按钮防止重复点击
          const continuousReadButton = document.querySelector('.continuous-read-button');
          if (continuousReadButton) {
            continuousReadButton.classList.add('disabled');
          }

          // 播放当前页面的所有句子
          for (let i = 0; i < sentences.length; i++) {
            // 检查是否被停止
            if (!isPlaying.value) break;
            
            const sentence = sentences[i];
            currentAudio.value = await playAudio(getSentenceText(sentence.res_id));
            
            // 等待当前音频播放完成
            await new Promise((resolve, reject) => {
              if (!currentAudio.value) {
                reject(new Error('无法获取音频元素'));
                return;
              }

              currentAudio.value.addEventListener('ended', resolve);
              currentAudio.value.addEventListener('error', reject);
            });
          }

          // 如果还在播放状态且不是最后一页，跳转到下一页
          if (isPlaying.value && currentPageIndex.value < pages.value.length - 1) {
            nextPage();
            // 等待图片加载完成
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            break;
          }
        }
      } catch (error) {
        console.error('音频播放失败:', error);
        uni.showToast({
          title: '音频播放失败',
          icon: 'none'
        });
      } finally {
        // 重置状态
        isPlaying.value = false;
        currentAudio.value = null;
        
        // 重新启用按钮
        const continuousReadButton = document.querySelector('.continuous-read-button');
        if (continuousReadButton) {
          continuousReadButton.classList.remove('disabled');
        }
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
      chapters,
      goToChatPage,
      hasValidSentences,  // 添加这一行
      playAllSentences,
      isPlaying,
      currentChapterName
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
  gap: 10rpx;
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

.speak-button,
.continuous-read-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  width: 35%;
  padding: 24rpx;
  background: linear-gradient(135deg, #FF6B6B, #FF5252);
  color: #ffffff;
  border-radius: 100rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
  margin-bottom: env(safe-area-inset-bottom);
}

.bottom-controls {
  flex-direction: row;
  justify-content: space-around;
  gap: 10rpx;
}

.speak-icon {
  width: 48rpx;
  height: 48rpx;
}
</style>

