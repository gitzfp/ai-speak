<template>
  <view class="container">
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <!-- <text class="loading-text">加载中...</text> -->
    </view>
    <view v-else-if="error">{{ error }}</view>
    <view v-else>
      <!-- 遮罩层 -->
      <view v-if="showCatalog" class="mask" @click="toggleCatalog"></view>

      <!-- 目录抽屉 -->
      <view class="catalog-drawer" :class="{ 'drawer-open': showCatalog }">
        <view class="catalog-header">目录</view>
        <view
          class="catalog-item"
          v-for="(chapter, index) in catalogData"
          :key="chapter.audio_id"
          @click="goToPage(chapter.page_no || index)"
        >
          <text class="catalog-title">{{ chapter.title }}</text>
          <text class="catalog-page"
            >第{{ chapter.page_no || index + 1 }}页</text
          >
        </view>
      </view>

      <!-- 主要内容区域 -->
      <swiper
        class="swiper-container"
        :current="currentPage"
        :skip-hidden-item-layout="true"  
        :damping="200"  
        :duration="300"
        @change="handlePageChange"
      >
        <swiper-item v-for="page in bookPages" :key="page.page_id">
          <view class="image-wrapper">
            <image
              :src="page.page_url_source"
              mode="widthFix"
              class="page-image"
              @error="(e) => handleImageError(e, page)"
              @load="(e) => onImageLoad(e, page.page_id)"
            />
            <view
              v-for="track in page.track_info"
              :key="track.track_id"
              class="track-area"
              :style="getTrackStyle(track, page.page_id)"
              @click="playAudio(track)"
            >
            </view>
          </view>
        </swiper-item>
      </swiper>

      <!-- 添加悬浮目录按钮 -->
      <view class="floating-catalog-btn" @click="toggleCatalog">
        <text>目录</text>
      </view>

      <!-- 修改底部工具栏，移除目录按钮 -->
      <view class="toolbar">
        <view class="tool-item" @click="togglePlayCurrentPage">
          <text>{{ isPlaying ? "暂停" : "连读" }}</text>
        </view>
        <view class="tool-item" @click="startRepeatMode">
          <text>复读</text>
        </view>
        <view class="tool-item" @click="goToWords">
          <text>单词</text>
        </view>
        <view class="tool-item" @click="goToassess">
          <text>测评</text>
        </view>
        <view class="tool-item" @click="goToChatPage">
          <text>口语</text>
        </view>
      </view>

      <!-- 复读蒙版层 -->
      <view v-if="showRepeatSelection" class="fdmask" @click="cancelRepeat"></view>
      <!-- 复读模式选择框 -->
      <view v-if="showRepeatSelection" class="repeat-selection">
        <view class="repeat-header">选择复读段落</view>
        <view class="repeat-options">
          <view
            v-for="(option, index) in repeatOptions"
            :key="index"
            class="repeat-option"
            :class="{ 'repeat-option-active': index === repeatStartIndex }"
            @click="handleRepeatSelection({ detail: { value: index } })"
          >
            {{ option }}
          </view>
        </view>
        <view class="repeat-actions">
          <button @click="confirmRepeat">确认</button>
          <button @click="cancelRepeat">取消</button>
        </view>
      </view>

      <!-- 复读模式提示 -->
      <view v-if="isRepeatMode" class="repeat-mode-indicator">
        <text>复读模式中...</text>
        <button @click="exitRepeatMode">退出复读</button>
      </view>

      <AssessmentPopup :repeatOptions="repeatOptions" :showAssessSelection="showAssessSelection" @assessPopupHide="assessPopupHide" />

    </view>
  </view>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted } from "vue"
import { onLoad } from "@dcloudio/uni-app"
import CryptoJS from "crypto-js"
import JSZip from "jszip"
import utils from "@/utils/utils"
import env from "@/config/env" 
import topicRequest from "@/api/topic"
import AssessmentPopup from "./AssessmentPopup.vue"
const baseUrl = env.basePath // 获取 basePath

// 定义响应式数据
const loading = ref(true)
const error = ref("")
const bookPages = ref([])
const catalogData = ref([])
const sentences = ref([])
const pageTitle = ref("")
const imageRatios = ref({})
const currentPage = ref(0)
const showCatalog = ref(false)
const isPlaying = ref(false)
const currentAudio = ref(null)
const showRepeatSelection = ref(false) // 是否显示复读选择框
const isRepeatMode = ref(false) // 是否处于复读模式
const repeatStartIndex = ref(0) // 复读起始段落
const repeatEndIndex = ref(0) // 复读结束段落
const repeatOptions = ref([]) // 复读段落选项

const showAssessSelection = ref(false) // 测评 总弹窗显示控制


// 获取页面参数中的 book_id
const book_id = ref("")
onLoad((options) => {
  book_id.value = options.book_id
  console.log("Received book_id:", book_id.value)
  // 页面加载时调用

  fetchAndProcessData()
  fetchSentences()
})

const goToWords = () => {
  // 查找当前页面所属的章节
  console.log(currentPage.value+'章节数据:', catalogData.value)
  let lessonId = 1
  catalogData.value.map((chapter, index) => {
    const currentPageNo = Number(currentPage.value);
    const chapterPageNo = Number(chapter.page_no);
    if(currentPageNo >= chapterPageNo){
      lessonId = index + 1
      console.log('当前章节:', chapter.page_no, '当前页码:', currentPageNo, '章节id:', index)
    }
  });

  if (lessonId > 0) {
    uni.navigateTo({
      url: `/pages/textbook/Learnwords?bookId=${book_id.value}&lessonId=${lessonId}`
    });
  } else {
    uni.showToast({
      title: '当前页面无单词列表',
      icon: 'none'
    });
  }
}
const fetchSentences = async () => {
  const ossKey = `json_files/${book_id.value}_sentence.json`
  // 检查文件是否已存储在阿里云 OSS 中
  const checkResult = await utils.checkFileInOSS(ossKey)
  console.log("检查文件是否存在:", checkResult)
  if (checkResult?.data?.exists) {
    // 如果已存储，直接从 FastAPI 获取文件 URL
    let data = await utils.getFileFromOSS(ossKey)
    data = JSON.parse(data)
    sentences.value = data.list.flatMap((chapter) =>
      chapter.groups.flatMap((group) => group.sentences)
    )
    console.log("句子数据获取成功（来OSS）")
  } else {
    // 如果未存储，调用原有接口获取数据
    try {
      const url = `https://diandu.mypep.cn/static/textbook/chapter/${book_id.value}_sentence.json`
      const response = await new Promise((resolve, reject) => {
        uni.request({
          url: url,
          method: "GET",
          enableHttpDNS: true,
          httpDNSServiceId: "wxa410372c837a5f26",
          success: (res) => {
            resolve(res)
          },
          fail: (err) => {
            reject(err)
          },
        })
      })
      const data = await response.data
      sentences.value = data.list.flatMap((chapter) =>
        chapter.groups.flatMap((group) => group.sentences)
      )
      console.log("句子数据获取成功（来自原接口）")
      // 将数据上传到阿里云 OSS
      const jsonString = JSON.stringify(data)
      await utils.uploadFileToOSS(ossKey, jsonString)
    } catch (error) {
      console.error("句子数据获取失败:", error)
    }
  }
}

// 解密函数
function decrypt(t, e = "book.json") {
  const n = new Array(32).fill(" ")
  const r = "".concat(e).concat(n.join("")).substr(0, 32)
  const o = CryptoJS.enc.Utf8.parse(r)
  const s = CryptoJS.enc.Utf8.parse("We Love Manibox!")
  const u = t[0] | (t[1] << 8) | (t[2] << 16) | (t[3] << 24)
  const c = CryptoJS.lib.WordArray.create(t.slice(4))
  const f = CryptoJS.AES.decrypt({ ciphertext: c }, o, {
    iv: s,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  const h = f.toString(CryptoJS.enc.Hex)
  const d = new Uint8Array(h.match(/../g).map((byte) => parseInt(byte, 16)))
  const p = Math.min(u, d.length)
  const v = d.slice(0, p)
  return v
}

// 图片加载失败处理函数
async function handleImageError(e, page) {
  console.error("图片加载失败:", {
    url: e.target?.src || "未获取到图片地址",
    pageId: page?.page_id,
    pageUrl: page?.page_url_source,
  })
  uni.showToast({
    title: "图片加载失败",
    icon: "none",
  })
  const ossKey = processOssKeyUrl(page.page_url_source)
  const originalUrl = handleErrorImageUrl(page.page_url_source)
  console.log("上传的key:", ossKey, "上传的url:", originalUrl)
  await utils.uploadFileToOSS(ossKey, originalUrl)
}

// 解压函数
async function unzipData(decryptedData) {
  const zip = new JSZip()
  try {
    const content = await zip.loadAsync(decryptedData)
    const files = Object.keys(content.files)
    const unzippedData = await content.files[files[0]].async("text")
    return JSON.parse(unzippedData)
  } catch (error) {
    console.error("Failed to unzip data:", error)
    throw error
  }
}

// 播放音频
function playAudio(track) {
  stopCurrentAudio() // First stop any existing audio

  const audio = uni.createInnerAudioContext()
  currentAudio.value = audio

  // Set up event listeners before starting playback
  audio.onError((res) => {
    console.error("Audio playback error:", res)
    uni.hideToast()
    uni.showToast({
      title: "音频播放失败",
      icon: "none",
    })
  })

  audio.onPlay(() => {
    // Show toast only when audio actually starts playing
    uni.showToast({
      title: track.track_genre,
      duration: 999999, // Long duration
      position: "bottom",
      icon: "none",
    })
  })

  audio.onEnded(() => {
    uni.hideToast()
    stopCurrentAudio()
  })

  // Set source and play
  audio.src = track.track_url_source
  audio.play()
}


// Update stopCurrentAudio to clean up properly
function stopCurrentAudio() {
  if (currentAudio.value) {
    uni.hideToast() // Hide any existing toast
    try {
      currentAudio.value.stop()
      currentAudio.value.destroy()
    } catch (error) {
      console.error("Error stopping audio:", error)
    }
    currentAudio.value = null
  }
}

function processOssKeyUrl(url) {
  if (!url) return url
  // 移除域名和所有查询参数
  let processedUrl = url.replace(/^https?:\/\/[^\/]+/, "").replace(/\?.*$/, "") // 移除 ? 及其后的所有内容
  // 确保不以斜杠开头
  if (processedUrl.startsWith("/")) {
    processedUrl = processedUrl.slice(1)
  }
  return processedUrl
}

function handleErrorImageUrl(url) {
  return url
    .replace(/^https?:\/\/[^\/]+/, "https://pdpd.mypep.cn")
    .replace(/\?ts=\d+$/, "")
}

// 处理 URL，移除域名和时间戳
function processUrl(url) {
  if (!url) return url
  // 移除域名和时间戳，并确保返回的 URL 不以斜杆开头
  return url
    .replace(
      /^https?:\/\/[^\/]+/,
      "https://books-bct.oss-cn-beijing.aliyuncs.com"
    )
    .replace(/\?ts=\d+$/, "")
}

// 异步处理资源
async function processResources(data) {
  try {
    const processedData = JSON.parse(JSON.stringify(data))
    // 处理每个页面的资源
    for (let page of processedData.bookpage) {
      // 处理图片URL
      const processedImageUrl = processUrl(page.page_url_source)
      // 检查URL前缀，如果不是目标OSS地址才进行上传
      if (
        !page.page_url_source.startsWith(
          "https://books-bct.oss-cn-beijing.aliyuncs.com"
        )
      ) {
        await utils.uploadFileToOSS(
          processOssKeyUrl(page.page_url_source),
          page.page_url_source
        )
      }
      page.page_url_source = processedImageUrl
      // 处理音频URL
      if (page.track_info) {
        for (let track of page.track_info) {
          const processedAudioUrl = processUrl(track.track_url_source)
          // 检查URL前缀，如果不是目标OSS地址才进行上传
          if (
            !track.track_url_source.startsWith(
              "https://books-bct.oss-cn-beijing.aliyuncs.com"
            )
          ) {
            await utils.uploadFileToOSS(
              processOssKeyUrl(track.track_url_source),
              track.track_url_source
            )
          }
          track.track_url_source = processedAudioUrl
        }
      }
    }
    // 压缩处理后的数据
    const zip = new JSZip()
    zip.file("book.zip", JSON.stringify(processedData))
    const compressedData = await zip.generateAsync({
      type: "arraybuffer", // 改用 arraybuffer
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    })
    return compressedData
  } catch (error) {
    console.error("Resource processing error:", error)
  }
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

async function getBookUrl() {
  // 检查文件是否已存储在阿里云 OSS 中
  const ossKey = `proxy/book/${book_id.value}/getBookUrl.json`
  const checkResult = await utils.checkFileInOSS(ossKey)
  if (checkResult?.data?.exists) {
    // 如果已存储，直接从 FastAPI 获取文件 URL
    const data = await utils.getFileFromOSS(ossKey)
    console.log("books.json 已存储，直接从 FastAPI 获取文件 URL", data)
    return data
  }
  if (!book_id.value) {
    throw new Error("Book ID is required")
  }

  const timestamp = formatDate(new Date())
  const sign = CryptoJS.SHA1(
    `book_id=${book_id.value}&fixed_key=bac1359d7feb996b396dff38ab77rf7a&timestamp=${timestamp}`
  ).toString()

  try {
    const response = await uni.request({
      url: `${baseUrl}/${ossKey}`,
      method: "POST",
      enableHttpDNS: true,
      httpDNSServiceId: "wxa410372c837a5f26",
      data: {
        book_id: book_id.value,
        sign: sign,
        timestamp: timestamp,
      },
      header: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Origin: "https://diandu.mypep.cn",
        Referer: "https://diandu.mypep.cn/rjdd/",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      },
    })

    if (response.statusCode === 200 && response.data?.result) {
      await utils.uploadFileToOSS(ossKey, response.data.result)
      return response.data.result
    }

    const errorMessage = response.data?.message || "Failed to get book URL"
    console.error("Server response:", response.data)
    throw new Error(errorMessage)
  } catch (error) {
    console.error("Error getting book URL:", error)
    throw error
  }
}

const parseJsonData = (data, comeFrom = "OSS") => {
  try {
    let jsonData = JSON.parse(data)
    console.log(`页面数据获取成功（来自 ${comeFrom}）:`, jsonData)
    // 更新页面数据
    bookPages.value = jsonData.bookpage
    catalogData.value =
      jsonData.bookaudio_v3?.length > 0
        ? jsonData.bookaudio_v3
        : jsonData.bookaudio_v2
    pageTitle.value = catalogData.value[0].title
    uni.setNavigationBarTitle({
      title: catalogData.value[0].title, // 你想要显示的标题
    })
    loading.value = false
    return jsonData
  } catch (error) {
    console.error("Error parsing JSON data:", error)
    return null
  }
}

// 获取数据并处理
async function fetchAndProcessData() {
  try {
    const bookUrl = await getBookUrl()
    const ossKey = processOssKeyUrl(bookUrl)
    const checkResult = await utils.checkFileInOSS(ossKey)
    if (checkResult?.data?.exists) {
      // 如果已存储，直接从 FastAPI 获取文件 URL
      const data = await utils.getFileFromOSS(ossKey, true)

      // 解压数据并更新页面
      const zip = new JSZip()
      const content = await zip.loadAsync(data, { base64: true })
      const files = Object.keys(content.files)
      const unzippedData = await content.files[files[0]].async("text")
      const result = parseJsonData(unzippedData)
      if (result) {
        return
      }
    }
    const response = await uni.request({
      url: `https://pdpd.mypep.cn/${ossKey}`,
      responseType: "arraybuffer",
    })

    const decryptedData = decrypt(new Uint8Array(response.data))
    let jsonData = await unzipData(decryptedData)
    parseJsonData(jsonData, "Orginal")
    // 在后台处理资源
    console.log('isWechat:',utils.isWechat())
    if(!utils.isWechat()){
      setTimeout(async () => {
        jsonData = await processResources(jsonData)
        await utils.uploadBinaryData(ossKey, jsonData)
      }, 0)
    }
   
  } catch (err) {
    console.error("Error:", err)
    error.value = "加载数据失败，请重试"
  } finally {
    loading.value = false
  }
}

// 添加页面缩放监听
let resizeObserver = null

onMounted(() => {
  // 创建 ResizeObserver 实例
  resizeObserver = new ResizeObserver(() => {
    // 重新计算所有已加载图片的比例
    Object.keys(imageRatios.value).forEach((pageId) => {
      const imageInfo = imageRatios.value[pageId]
      if (imageInfo) {
        imageRatios.value[pageId] = {
          ...imageInfo,
          containerWidth: uni.getWindowInfo().windowWidth,
        }
      }
    })
  })

  // 监听容器大小变化
  const container = document.querySelector(".container")
  if (container) {
    resizeObserver.observe(container)
  }
})

// 在组件销毁时清理
onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 修改图片加载处理函数
function onImageLoad(e, pageId) {
  const { width, height } = e.detail
  imageRatios.value[pageId] = {
    width,
    height,
    ratio: height / width,
    containerWidth: uni.getWindowInfo().windowWidth,
  }
}

// 修改计算音频区域样式的函数
function getTrackStyle(track, pageId) {
  const imageInfo = imageRatios.value[pageId]
  if (!imageInfo) return {}

  const containerWidth = uni.getWindowInfo().windowWidth
  const imageHeight = containerWidth * imageInfo.ratio

  // 如果容器宽度发生变化，更新存储的宽度
  if (imageInfo.containerWidth !== containerWidth) {
    imageInfo.containerWidth = containerWidth
  }

  return {
    left: `${track.track_left * containerWidth}px`,
    top: `${track.track_top * imageHeight}px`,
    width: `${(track.track_right - track.track_left) * containerWidth}px`,
    height: `${(track.track_bottom - track.track_top) * imageHeight}px`,
  }
}

// 增加防抖控制
const debounceFlag = ref(false)

// 修改后的翻页处理函数
function handlePageChange(e) {
  console.log('handlePageChange'+debounceFlag.value,e.detail) 

  //有复读的时候退出复读
  if (isRepeatMode.value) {
    exitRepeatMode()
  }


  if (debounceFlag.value) return
  debounceFlag.value = true
  // 立即停止当前页音频
  stopCurrentAudio()
  // 使用nextTick确保更新顺序
  currentPage.value = e.detail.current
    isPlaying.value = false
    
    // 更新标题逻辑
    const currentChapter = catalogData.value.find(
      chapter => chapter.page_no === e.detail.current
    )
    if (currentChapter?.title) {
      pageTitle.value = currentChapter.title
      uni.setNavigationBarTitle({ title: currentChapter.title })
    }
    
    // 防抖解除（可根据实际需求调整时间）
    setTimeout(() => {
      debounceFlag.value = false
    }, 300) 
}

// 目录开关
function toggleCatalog() {
  showCatalog.value = !showCatalog.value
}

// 跳转到指定页面
function goToPage(index) {
  currentPage.value = index
  showCatalog.value = false
}

// 获取当前页面所有句子的文本
const getCurrentPageSentence = () => {
  const practiceSentences = sentences.value.filter(
    (sentence) => sentence.jump_page == currentPage.value
  )
  console.log(sentences.value, currentPage.value, "practiceSentences")
  return practiceSentences.map((sentence) => ({
    info_en: sentence.text,
    info_cn: sentence.translate,
  }))
}

const goToChatPage = async () => {
  try {
    const lessonId = book_id.value + ":" + currentPage.value
    const sentences = getCurrentPageSentence()
    if (!sentences || sentences?.length <= 0) {
      uni.showToast({
        title: "没有需要测评的口语",
        icon: "none",
      })
      return
    }
    // 先检查是否存在会话
    const existingSession = await topicRequest.getSessionByLessonId({
      lesson_id: lessonId,
    })

    if (existingSession?.data) {
      const { id: sessionId } = existingSession.data
      console.log("会话已经存在，句子: ", sentences, "sessionId: ", sessionId)
      if (sessionId) {
        uni.navigateTo({
          url: `/pages/chat/index?sessionId=${sessionId}&type=LESSON&lessonId=${lessonId}&sessionName=${pageTitle.value}`,
        })
        return
      }
    }
    console.log("创建新会话，句子: ", sentences, "sessionId: ")
    // 创建新会话
    const response = await topicRequest.createLessonSession({
      lesson_id: lessonId,
      sentences: sentences,
    })

    if (response?.data) {
      uni.navigateTo({
        url: `/pages/chat/index?sessionId=${response.data.id}&type=LESSON&lessonId=${lessonId}&sessionName=${pageTitle.value}`,
      })
    } else {
      throw new Error("创建会话失败")
    }
  } catch (error) {
    console.error("创建课程会话失败:", error)
    uni.showToast({
      title: "创建会话失败",
      icon: "none",
    })
  }
}

// 连续播放当前页面的所有音频
function playCurrentPage() {
  const currentPageData = bookPages.value[currentPage.value]
  if (!currentPageData?.track_info) return

  isPlaying.value = true
  let currentTrackIndex = 0

  const playNext = () => {
    if (!isPlaying.value) {
      stopCurrentAudio()
      return
    }

    if (currentTrackIndex < currentPageData.track_info.length) {
      const track = currentPageData.track_info[currentTrackIndex]
      const audio = uni.createInnerAudioContext()
      currentAudio.value = audio
      audio.src = track.track_url_source
      audio.onEnded(() => {
        currentTrackIndex++
        playNext()
      })
      audio.play()
    } else {
      isPlaying.value = false
    }
  }
  playNext()
}

// 暂停当前页面的音频
function pauseCurrentPage() {
  if (currentAudio.value) {
    currentAudio.value.pause()
    isPlaying.value = false
  }
}

// 切换播放状态
function togglePlayCurrentPage() {
  if (isPlaying.value) {
    pauseCurrentPage()
  } else {
    playCurrentPage()
  }
}

// 开始复读模式
function startRepeatMode() {
  showRepeatSelection.value = true
  console.log("开始复读模式"+currentPage.value, bookPages.value[currentPage.value])
  // 生成复读段落选项
  repeatOptions.value = bookPages.value[currentPage.value].track_info.map(
    (track) => track.track_text || `段落 ${track.track_id}`
  )
}
// 开始测评
function goToassess() {
  showAssessSelection.value = true
  console.log("开始测评模式")
  // 生成测评段落选项
  repeatOptions.value = bookPages.value[currentPage.value].track_info.map(
    (track) => track.track_text || `段落 ${track.track_id}`
  )
}

// 处理复读段落选择
function handleRepeatSelection(e) {
  const selectedIndex = e.detail.value
  repeatStartIndex.value = selectedIndex
  repeatEndIndex.value = selectedIndex
}

// 确认复读
function confirmRepeat() {
  showRepeatSelection.value = false
  isRepeatMode.value = true
  playRepeat()
}

// 取消复读
function cancelRepeat() {
  showRepeatSelection.value = false
}

function cancelRepeatByMask() {
    // 防止点击穿透到下层元素
      cancelRepeat();
    
}

// 播放复读段落
function playRepeat() {
  const currentPageData = bookPages.value[currentPage.value]
  if (!currentPageData?.track_info) return

  isPlaying.value = true
  let currentTrackIndex = repeatStartIndex.value

  const playNext = () => {
    if (!isPlaying.value || !isRepeatMode.value) {
      stopCurrentAudio()
      return
    }

    if (currentTrackIndex <= repeatEndIndex.value) {
      const track = currentPageData.track_info[currentTrackIndex]
      const audio = uni.createInnerAudioContext()
      currentAudio.value = audio
      audio.src = track.track_url_source
      audio.onEnded(() => {
        currentTrackIndex++
        if (currentTrackIndex > repeatEndIndex.value) {
          currentTrackIndex = repeatStartIndex.value // 循环播放
        }
        playNext()
      })
      audio.play()
    }
  }
  playNext()
}

// 退出复读模式
function exitRepeatMode() {
  isRepeatMode.value = false
  stopCurrentAudio()
  isPlaying.value = false
}

// 页面销毁时清理音频
onBeforeUnmount(() => {
  stopCurrentAudio()
  isPlaying.value = false
})

//-----测评用的方法-----开始------
// 方法

  const assessPopupHide = () => {
    showAssessSelection.value = false;
  }


  //-----测评用的方法-----结束------

</script>

<style>
.container {
  font-size: 16px;
}

.page-container {
  margin-bottom: 20px;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: auto;
}

.page-image {
  width: 100%;
  height: auto;
  display: block;
}

.track-area {
  position: absolute;
  background-color: rgba(0, 0, 255, 0.1);
  border: 1px solid rgba(0, 0, 255, 0.3);
  cursor: pointer;
  transition: background-color 0.3s;
}

.track-area:hover {
  background-color: rgba(0, 0, 255, 0.2);
}

.track-text {
  position: absolute;
  bottom: -20px;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: #666;
}

/* 移除之前的音频容器样式 */
.audio-container,
.audio-item {
  display: none;
}

.swiper-container {
  width: 100%;
  height: calc(100vh - 100px); /* 减去工具栏高度 */
}

.catalog-drawer {
  position: fixed;
  left: -80%;
  top: 0;
  width: 80%;
  height: 100vh;
  background-color: #fff;
  z-index: 999;
  transition: all 0.3s;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.drawer-open {
  left: 0;
}

.catalog-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.catalog-title {
  flex: 1;
  font-size: 14px;
}

.catalog-page {
  color: #666;
  font-size: 12px;
  margin-left: 10px;
}

.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background-color: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #eee;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.tool-item text {
  font-size: 14px;
  margin-top: 5px;
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 998;
}

.catalog-header {
  padding: 20px 15px;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
  background-color: #f8f8f8;
}

.catalog-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.catalog-title {
  flex: 1;
  font-size: 14px;
}

.catalog-page {
  color: #666;
  font-size: 12px;
  margin-left: 10px;
}

/* 蒙版样式 */
.fdmask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明黑色 */
  z-index: 999; /* 确保蒙版在最上层 */
}

.repeat-selection {
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.repeat-header {
  padding: 10px 10px 0px 10px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.repeat-picker {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 10px;
}

.repeat-actions button {
  margin: 5px;
}

.repeat-mode-indicator {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  z-index: 1000;
}

.repeat-options {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.repeat-option {
  padding: 12px;
  border: 1px solid #eee;
  margin: 5px 0;
  border-radius: 5px;
  background-color: #f8f8f8;
}

.repeat-option-active {
  background-color: #007AFF;
  color: white;
  border-color: #007AFF;
}

/* 添加悬浮目录按钮样式 */
.floating-catalog-btn {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px 10px;
  border-radius: 0 20px 20px 0;
  z-index: 997;
  cursor: pointer;
  font-size: 14px;
}

/* 修改工具栏样式以适应5个按钮 */
.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background-color: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #eee;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

/* 加载动画样式 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  color: #666;
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>
