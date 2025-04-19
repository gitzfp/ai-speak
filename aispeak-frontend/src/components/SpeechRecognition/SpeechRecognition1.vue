<template>
  <view>
    <button @click="handleOpen">开始识别1</button>
    <button @click="handleClose">停止识别2</button>
    <view v-if="resultText">识别结果: {{ resultText }}</view>
    <view v-if="statusMessage" style="color: #666; font-size: 14px;">{{ statusMessage }}</view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import CryptoJS from 'crypto-js'

// 配置参数
const config = reactive({
  secretid: 'AKIDMgrqiT1MVhLrCJQWTF1f8VhkcMtGQTNY',
  secretkey: '286rX8avCLMD1fBWeeR3881nOcjgRzkx',
  appId: '1321827414',
  engineModelType: '16k_zh',
  url: 'asr.cloud.tencent.com/asr/v2/'
})

// 状态管理
const socket = ref(null)
const recorder = ref(null)
const resultText = ref('')
const lastResult = ref('')
const isProcessing = ref(false)
const statusMessage = ref('')
const heartbeatTimer = ref(null)
const noResultTimeout = ref(null)
const isSentenceComplete = ref(true)
let framesCount = 0
let totalAudioSize = 0

// 生成签名
const generateSignature = (url) => {
  const hmac = CryptoJS.HmacSHA1(url, config.secretkey)
  return CryptoJS.enc.Base64.stringify(hmac)
}

// 连接WebSocket
const connectWebSocket = (url) => {
  if (socket.value) {
    socket.value.close()
    socket.value = null
  }
  
  statusMessage.value = '正在连接服务器...'
  framesCount = 0
  totalAudioSize = 0
  
  try {
    socket.value = uni.connectSocket({
      url: `wss://${url}`,
      success: () => {
        console.log('WebSocket连接成功')
      },
      fail: (err) => {
        console.error('WebSocket连接失败:', err)
        statusMessage.value = '连接失败: ' + (err.errMsg || JSON.stringify(err))
      }
    })
    
    initSocketEvents()
  } catch (err) {
    console.error('创建WebSocket失败:', err)
    statusMessage.value = '创建WebSocket失败: ' + JSON.stringify(err)
  }
}

// 发送心跳保持连接
const startHeartbeat = () => {
  if (heartbeatTimer.value) clearInterval(heartbeatTimer.value)
  
  heartbeatTimer.value = setInterval(() => {
    if (socket.value && isProcessing.value) {
      try {
        socket.value.send({
          data: JSON.stringify({ type: 'ping' }),
          fail: (err) => console.error('发送心跳失败:', err)
        })
        console.log('发送心跳')
      } catch (err) {
        console.error('心跳发送错误:', err)
      }
    }
  }, 15000) // 每15秒发送一次心跳
}

// 设置无结果超时
const startNoResultTimeout = () => {
  if (noResultTimeout.value) clearTimeout(noResultTimeout.value)
  
  noResultTimeout.value = setTimeout(() => {
    if (isProcessing.value && !resultText.value) {
      statusMessage.value = '识别超时，尝试停止并重新开始...'
      console.log('识别超时，自动停止')
      handleClose()
    }
  }, 30000) // 30秒后如果没有结果则停止
}

// WebSocket事件处理
const initSocketEvents = () => {
  if (!socket.value) {
    console.error('Socket is null, cannot initialize events')
    return
  }
  
  socket.value.onOpen(() => {
    console.log('WebSocket已连接')
    statusMessage.value = '连接成功，开始录音...'
    startRecording()
    startHeartbeat()
    startNoResultTimeout()
  })

  socket.value.onMessage((res) => {
    try {
      console.log('收到消息:', res.data)
      const data = JSON.parse(res.data)
      if (data.code === 0) {
        if (data.result && data.result.voice_text_str) {
          const newText = data.result.voice_text_str.trim()
          
          // 如果上一次结果为空，或者新文本与上一次不同
          if (!lastResult.value || newText !== lastResult.value) {
            // 检测到静音超过阈值，标记句子完成
            if (data.result.voice_text_str.endsWith('。') || 
                data.result.voice_text_str.endsWith('？') || 
                data.result.voice_text_str.endsWith('！')) {
              isSentenceComplete.value = true
            }
            
            // 如果句子已完成且有新内容，作为新句子处理
            if (isSentenceComplete.value) {
              resultText.value = resultText.value 
                ? `${resultText.value} ${newText}`
                : newText
              isSentenceComplete.value = false
            } else {
              // 否则更新当前句子
              const sentences = resultText.value.split(' ')
              sentences[sentences.length - 1] = newText
              resultText.value = sentences.join(' ')
            }
            
            lastResult.value = newText
            statusMessage.value = '正在识别: ' + resultText.value
          }
          
          // 收到结果后重置超时
          if (noResultTimeout.value) {
            clearTimeout(noResultTimeout.value)
            startNoResultTimeout()
          }
        }
      } else {
        console.error('识别错误:', data)
        statusMessage.value = '识别错误: ' + data.message
      }
    } catch (e) {
      console.error('解析响应失败:', e, res.data)
    }
  })

  socket.value.onError((err) => {
    console.error('WebSocket错误:', err)
    statusMessage.value = 'WebSocket错误: ' + (err.errMsg || JSON.stringify(err))
    clearTimers()
    handleClose()
  })

  socket.value.onClose(() => {
    console.log('WebSocket已关闭')
    statusMessage.value = 'WebSocket连接已关闭，共发送' + framesCount + '帧，' + totalAudioSize + '字节'
    clearTimers()
    if (isProcessing.value) {
      handleClose()
    }
  })
}

// 清除定时器
const clearTimers = () => {
  if (heartbeatTimer.value) {
    clearInterval(heartbeatTimer.value)
    heartbeatTimer.value = null
  }
  if (noResultTimeout.value) {
    clearTimeout(noResultTimeout.value)
    noResultTimeout.value = null
  }
}

// 初始化录音
const initRecorder = () => {
  if (recorder.value) {
    return
  }
  
  recorder.value = uni.getRecorderManager()

  recorder.value.onFrameRecorded(({ isLastFrame, frameBuffer }) => {
    framesCount++
    totalAudioSize += frameBuffer.byteLength
    console.log('录音帧大小:', frameBuffer.byteLength, '总帧数:', framesCount)
    
    if (socket.value && isProcessing.value) {
      try {
        // 检查socketState并确保连接
        socket.value.send({
          data: frameBuffer,
          success: () => {
            console.log('音频帧发送成功')
          },
          fail: (err) => {
            console.error('发送音频帧失败:', err)
            statusMessage.value = '发送音频失败'
          }
        })
        
        if (isLastFrame) {
          console.log('发送结束标记')
          sendEndSignal()
        }
      } catch (err) {
        console.error('发送数据错误:', err)
      }
    }
  })

  recorder.value.onError((err) => {
    console.error('录音错误:', err)
    statusMessage.value = '录音错误: ' + (err.errMsg || JSON.stringify(err))
    isProcessing.value = false
    clearTimers()
  })
  
  recorder.value.onStop(() => {
    console.log('录音已停止')
    isProcessing.value = false
    statusMessage.value = '录音已停止'
    
    // 确保在录音停止时发送结束信号
    if (socket.value) {
      sendEndSignal()
    }
  })
}

// 发送结束信号
const sendEndSignal = () => {
  if (!socket.value) return
  
  try {
    socket.value.send({
      data: JSON.stringify({ type: 'end' }),
      success: () => console.log('结束标记发送成功'),
      fail: (err) => console.error('发送结束标记失败:', err)
    })
  } catch (err) {
    console.error('发送结束信号失败:', err)
  }
}

// 开始录音
const startRecording = () => {
  if (!recorder.value) {
    initRecorder()
  }
  
  try {
    recorder.value.start({
      format: 'pcm',
      sampleRate: 16000,
      frameSize: 0.2, // 降低帧大小，更频繁地发送数据
      numberOfChannels: 1,
      encodeBitRate: 48000
    })
    isProcessing.value = true
    console.log('开始录音')
    statusMessage.value = '正在录音...'
  } catch (err) {
    console.error('启动录音失败:', err)
    statusMessage.value = '启动录音失败: ' + (err.errMsg || JSON.stringify(err))
  }
}

// 处理开始识别
const handleOpen = async () => {
  if (isProcessing.value) return
  
  resultText.value = ''
  lastResult.value = ''
  isSentenceComplete.value = true
  statusMessage.value = '准备中...'
  
  const timestamp = Math.floor(Date.now() / 1000)
  const params = {
    secretid: config.secretid,
    timestamp,
    expired: timestamp + 3600,
    nonce: timestamp,
    engine_model_type: config.engineModelType,
    voice_id: timestamp.toString(),
    voice_format: 1, // PCM格式
    convert_num_mode: 1,
    needvad: 1, // 开启VAD
    vad_silence_time: 500, // 静音检测时间500ms，避免太快断开
    filter_dirty: 0, // 不过滤脏话
    filter_modal: 0, // 不过滤语气词
    filter_punc: 0, // 不过滤标点
    filter_empty: 0 // 保留空值结果
  }

  const queryString = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  const signature = generateSignature(`${config.url}${config.appId}?${queryString}`)
  const fullUrl = `${config.url}${config.appId}?${queryString}&signature=${encodeURIComponent(signature)}`

  console.log('请求URL:', fullUrl)
  
  initRecorder()
  connectWebSocket(fullUrl)
}

// 停止识别
const handleClose = () => {
  clearTimers()
  
  if (recorder.value) {
    recorder.value.stop()
  }
  
  if (socket.value) {
    sendEndSignal() // 确保发送结束标记
    isSentenceComplete.value = true // 标记句子完成
    setTimeout(() => {
      if (socket.value) {
        socket.value.close()
        socket.value = null
      }
    }, 1000)
  }
  
  isProcessing.value = false
  statusMessage.value = '已停止，共发送' + framesCount + '帧，' + totalAudioSize + '字节'
}
</script>