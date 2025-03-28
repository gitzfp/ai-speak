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
      <image
        v-if="currentPageImage"
        :src="currentPageImage"
        mode="widthFix"
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
        const { data } = await uni.request({
          url: `${baseUrl}/ali-oss/check-file/?oss_key=${ossKey}`,
          method: 'GET'
        });
        return data;
      } catch (error) {
        console.error('检查文件失败:', error);
        return { exists: false };
      }
    };

    const uploadFileToOSS = async (ossKey, fileData) => {
      try {
        console.log('开始上传文件, ossKey:', ossKey);
        
        // 如果是 JSON 数据，直接上传内容
        if (ossKey.endsWith('.json')) {
          const { data } = await uni.request({
            url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
            method: 'POST',
            header: {
              'Content-Type': 'application/json'
            },
            data: {
              oss_key: ossKey,
              content: fileData
            }
          });
          console.log('JSON 数据上传成功:', data);
          return data;
        }
        
        // 如果是图片或音频文件，需要先下载
        if (typeof fileData === 'string' && (fileData.startsWith('http://') || fileData.startsWith('https://'))) {
          const tempFilePath = await new Promise((resolve, reject) => {
            uni.downloadFile({
              url: fileData,
              success: (res) => {
                if (res.statusCode === 200) {
                  resolve(res.tempFilePath);
                } else {
                  reject(new Error('下载文件失败'));
                }
              },
              fail: reject
            });
          });
          fileData = tempFilePath;
        }
    
        // 上传文件
        const { data } = await uni.uploadFile({
          url: `${baseUrl}/ali-oss/upload-file/?oss_key=${ossKey}`,
          filePath: fileData,
          name: 'file',
        });
        console.log('文件上传成功:', data);
        return typeof data === 'string' ? JSON.parse(data) : data;
      } catch (error) {
        console.error('文件上传失败:', error);
        return null;
      }
    };



    const getFileFromOSS = async (ossKey) => {
      try {
        const { data } = await uni.request({
          url: `${baseUrl}/ali-oss/get-file/?oss_key=${ossKey}`,
          method: 'GET',
          header: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (data.code !== 1000) {
          throw new Error(data.message || '获取文件失败');
        }

        if(ossKey.endsWith('.m3u8')) {
          return data?.data?.content;
        }

        if (ossKey.endsWith('.json')) {
          const jsonContent = JSON.parse(data.data.content);
          console.log('解析后的 JSON 内容:', jsonContent);
          return jsonContent;
        } else {
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
          const url = `https://rjdduploadw.mypep.cn/pub_cloud/10/${book_id.value}/${book_id.value}_Web.json`;
          console.log('页面数据获取请求开始:', pages.value);
          const response = await new Promise((resolve, reject) => {
              uni.request({
                  url: url,
                  method: 'GET',
                  success: (res) => {
                      resolve(res);
                  },
                  fail: (err) => {
                      reject(err);
                  }
              });
          });

          const data = response.data;
          pages.value = data.chapters.flatMap((chapter) => chapter.res_main);
          console.log('页面数据获取成功（来自原接口）:', pages.value);
      
          // 直接使用 JSON 字符串上传
          const jsonString = JSON.stringify(data);
          await uploadFileToOSS(ossKey, jsonString);
          console.log('JSON 数据上传成功');
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
        const url = `https://diandu.mypep.cn/static/textbook/chapter/${book_id.value}_sentence.json`
        const response = await new Promise((resolve, reject) => {
        uni.request({
          url: url,
          method: 'GET',
          success: (res) => {
            resolve(res);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
        const data = await response.data;
        chapters.value = data.list
        console.log('Chapters data:', chapters.value);
        sentences.value = data.list.flatMap((chapter) =>
          chapter.groups.flatMap((group) => group.sentences)
        );
        console.log('句子数据获取成功（来自原接口）:', chapters.value, sentences.value);

        // 将数据上传到阿里云 OSS
        const jsonString = JSON.stringify(data);
        await uploadFileToOSS(ossKey, jsonString);
      } catch (error) {
        console.error('句子数据获取失败:', error);
      }
    }
  }; 

    // 从接口获取图片 URL 签名
    // 获取 access_token
    const getAccessToken = async () => {
      try {
        const { data } = await uni.request({
          url: `${baseUrl}/ap22/user/pep_click/215/access_token.json`,
          method: 'POST',
          header: {
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://diandu.mypep.cn',
            'Referer': 'https://diandu.mypep.cn/rjdd/',
          }
        });

        console.log(`获取 access_token 成功:`, data);
        return data.access_token;
      } catch (error) {
        console.error('获取 access_token 失败:', error);
        throw error;
      }
    };
    
    // 处理图片签名请求的重试逻辑
    const retryImageSignature = async (pageUrl, accessToken) => {
      const { data } = await uni.request({
        url: `${baseUrl}/ap22/resources/ak/pep_click/user/951/urlSignature.json?access_token=${accessToken}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: {
          flag: '1',
          fileNameUrl: `https://szjc-3.mypep.cn${pageUrl}`,
        }
      });

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
          const response = await uni.request(urlSignature);
          const blob = await response.blob();
          const file = new File([blob], ossKey.split('/').pop());
          await uploadFileToOSS(ossKey, file);
        }
      };
    // 图片加载完成时计算缩放比例
    const onImageLoad = (e) => {
      // 小程序环境下，通过事件获取图片信息
      const { width: naturalWidth, height: naturalHeight } = e.detail;
      
      // 获取容器宽度和高度
      const query = uni.createSelectorQuery();
      query.select('.book-container').boundingClientRect(data => {
        const containerWidth = data.width;
        const containerHeight = data.height;
        
        // 计算宽度和高度的缩放比例
        const widthScale = containerWidth / naturalWidth;
        const heightScale = containerHeight / naturalHeight;
        
        // 使用较小的缩放比例，确保图片完全适应容器
        const scale = Math.min(widthScale, heightScale);
        
        scaleX.value = scale;
        scaleY.value = scale;
        
        console.log('图片缩放比例:', { 
          scaleX: scaleX.value, 
          scaleY: scaleY.value,
          naturalWidth,
          naturalHeight,
          containerWidth,
          containerHeight
        });
      }).exec();
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
  const ossKey = `audios/${book_id.value}/${res_id}.mp3`;
  console.log('开始获取音频 URL, ossKey:', ossKey);

  try {
    const checkResult = await checkFileInOSS(ossKey);
    console.log('检查 OSS 文件结果:', checkResult);

    if (checkResult?.data?.exists) {
      const m3u8Content = checkResult?.data?.url;
      console.log('从阿里云获取到的 URL:', m3u8Content);
      return m3u8Content;
    } else {
      console.log('开始网络请求音频');
      const hostname = "diandu.mypep.cn";
      const input_string = hostname + res_id;
      const hashed_value = md5(input_string);
      
      const url = `${baseUrl}/ap33/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/${res_id}/${hashed_value}/hlsIndexM3u8.token?access_token=`;
      const realUrl = `https://api.mypep.com.cn/api/a/resource/c1ebe466-1cdc-4bd3-ab69-77c3561b9dee/951/${res_id}/${hashed_value}/hlsIndexM3u8.token?access_token=`;
      
      console.log('请求 URL:', url);
      
      // 使用 Promise 包装 uni.request
      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: url,
          method: 'GET',
          success: (res) => {
            resolve(res);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });

      if (!response.data) {
        throw new Error('获取音频数据失败');
      }

      console.log('获取到的音频数据:', response.data);

      const encodedRealUrl = encodeURIComponent(realUrl);

      console.log('开始解密和上传');
      const uploadResponse = await new Promise((resolve, reject) => {
        uni.request({
          url: `${baseUrl}/ali-oss/decrypt-and-upload/?oss_key=${ossKey}&url=${realUrl}`,
          method: 'GET',
          success: (res) => {
            resolve(res);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });

      if (!uploadResponse.data) {
        throw new Error('解密上传失败');
      }

      console.log('解密上传响应:', uploadResponse.data);
      return uploadResponse.data?.data?.url;
    }
  } catch (err) {
    console.error('获取音频 URL 过程中发生错误:', err);
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
      throw new Error('获取音频地址失败');
    }

    return new Promise((resolve, reject) => {
      const audioContext = uni.createInnerAudioContext();
      audioContext.src = audioUrl;
      audioContext.autoplay = true;

      audioContext.onError((res) => {
        console.error('音频播放错误:', res);
        reject(new Error('音频播放失败'));
      });

      audioContext.onEnded(() => {
        audioContext.destroy();
        currentAudio.value = null;
        resolve();
      });

      currentAudio.value = audioContext;
    });
  } catch (error) {
    console.error('播放音频失败:', error);
    throw error;
  }
};

const playAllSentences = async () => {
  if (isPlaying.value) {
    stopPlayback();
    return;
  }

  isPlaying.value = true;
  console.log('开始连读，当前播放状态:', isPlaying.value);

  try {
    // 循环播放所有页面
    while (isPlaying.value && currentPageIndex.value < pages.value.length) {
      const sentences = currentPageSentences.value;
      if (!sentences || sentences.length === 0) {
        console.log('当前页面没有句子，切换到下一页');
        nextPage();
        continue;
      }

      console.log(`开始播放第 ${currentPageIndex.value + 1} 页，共 ${sentences.length} 个句子`);

      // 播放当前页面的所有句子
      for (let i = 0; i < sentences.length; i++) {
        if (!isPlaying.value) {
          console.log('播放被手动停止');
          break;
        }

        const sentence = sentences[i];
        const sentenceText = getSentenceText(sentence.res_id);
        if (!sentenceText) {
          console.warn(`跳过无效句子: ${sentence.res_id}`);
          continue;
        }

        console.log(`播放第 ${i + 1} 个句子:`, sentenceText);
        await playAudio(sentenceText);

        // 如果当前句子不是最后一个，添加间隔时间
        if (isPlaying.value && i < sentences.length - 1) {
          console.log('添加 800ms 间隔');
          await new Promise(resolve => setTimeout(resolve, 800)); // 800ms 间隔
        }
      }

      // 如果还在播放状态且不是最后一页，跳转到下一页
      if (isPlaying.value && currentPageIndex.value < pages.value.length - 1) {
        console.log('切换到下一页');
        nextPage();
        // 等待图片加载完成
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s 等待
      } else {
        console.log('已播放到最后一页，停止连读');
        break; // 如果是最后一页，停止播放
      }
    }
  } catch (error) {
    console.error('连续播放失败:', error);
    uni.showToast({
      title: '连续播放失败',
      icon: 'none'
    });
  } finally {
    console.log('连读结束，重置播放状态');
    isPlaying.value = false;
    if (currentAudio.value) {
      currentAudio.value.stop();
      currentAudio.value.destroy();
      currentAudio.value = null;
    }
  }
};
// 修改 stopPlayback 函数
const stopPlayback = () => {
  isPlaying.value = false;
  if (currentAudio.value) {
    currentAudio.value.stop();
    currentAudio.value.destroy();
    currentAudio.value = null;
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
      // window.addEventListener('resize', onImageLoad);
    });

    // 组件卸载时移除监听器
    onUnmounted(() => {
      // window.removeEventListener('resize', onImageLoad);
       // 移除窗口大小变化监听
  
  // 停止并销毁音频实例
      if (currentAudio.value) {
        currentAudio.value.stop();
        currentAudio.value.destroy();
        currentAudio.value = null;
      }
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
  align-items: center;
}

.speak-icon {
  width: 48rpx;
  height: 48rpx;
}
</style>

