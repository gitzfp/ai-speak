import { ref, reactive, onUnmounted } from 'vue';
import WebRecorder from "../SpeechEvaluation/core/webRecorder";
import WebAudioSpeechRecognizer from './asr/webaudiospeechrecognizer';
import LogReport from "../SpeechEvaluation/lib/LogReport";
import { guid } from "../SpeechEvaluation/lib/credential";
import { LOG_TYPE_MAP } from "../SpeechEvaluation/core/constants";

export function useSpeechRecognition(params: any, isLog: boolean = false) {
  const recorder = ref<any>(null);
  const asrRecognizer = ref<any>(null);
  const isCanSendData = ref(false);
  const audioData = reactive<Array<any>>([]);
  const timer = ref<any>(null);
  const logServer = ref<any>(null);
  const requestId = ref("");
  
  // 回调函数
  const OnAudioComplete = ref<(data: Int8Array) => void>(() => {});
  const OnRecognitionStart = ref<(res: any) => void>((res) => {
    console.log("OnRecognitionStart", res);
  });
  const OnRecognitionResultChange = ref<(res: any) => void>((res) => {
    console.log("OnRecognitionResultChange", res);
  });
  const OnRecognitionComplete = ref<(res: any) => void>((res) => {
    console.log("OnRecognitionComplete", res);
  });
  const OnError = ref<(err: any) => void>((err) => {
    console.log("error", err);
  });
  const OnRecorderStop = ref<(res: any) => void>(() => {});

  // 初始化日志服务
  if (isLog) {
    (async () => {
      try {
        logServer.value = new LogReport(isLog);
        await logServer.value.LogInit();
      } catch (error) {}
    })();
  }

  // 收集用户轨迹日志
  // 在收集日志处增加类型检查
  const collectLog = (res: any, type: string) => {
    if (!logServer.value || !isLog) return;
    
    // 过滤不可序列化的数据
    const safeRes = JSON.parse(JSON.stringify(res, (key, value) => {
      return typeof value === 'symbol' ? value.toString() : value;
    }));
  
    logServer.value.LogAdd({
      type,
      message: (typeof safeRes === "string" || safeRes?.length) 
        ? safeRes 
        : safeRes?.message || safeRes?.reason || "",
      requestId: requestId.value,
      timeStamp: new Date().getTime(),
      error: safeRes,
      code: safeRes?.code || 0,
    });
  };

  // 开始录音和识别
  const start = (successCallback?: () => void) => {
    requestId.value = guid();
    try {
      // 初始化录音器
      recorder.value = new WebRecorder(isLog, logServer.value, requestId.value);
      
      recorder.value.OnReceivedData = (data: any) => {
        if (isCanSendData.value && asrRecognizer.value) {
          asrRecognizer.value.write(data);
        }
        collectLog('', LOG_TYPE_MAP.RECORD_DATA);
      };
      
      // 录音错误处理
      recorder.value.OnError = async (err: any) => {
        collectLog(err, LOG_TYPE_MAP.RECORD_ERROR);
        asrRecognizer.value && asrRecognizer.value.stop();
        stop();
        OnError.value(err);
      };

      // 识别结束
      recorder.value.OnRecognitionComplete = async (res: any) => {
        collectLog(res, LOG_TYPE_MAP.RECOGNIZER_COMPLETE);
        isLog && await logServer.value?.LogInsert();
        recorder.value && recorder.value.close();
        OnRecognitionComplete.value(res);
        isCanSendData.value = false;
        recorder.value = null;
      };
      
      
      // 录音停止处理
      recorder.value.OnStop = (res: any) => {
        collectLog(res, LOG_TYPE_MAP.RECORD_STOP);
        if (asrRecognizer.value) {
          asrRecognizer.value.stop();
        }
        OnRecorderStop.value(res);
        try {
          if (!recorder.value.allAudioData || recorder.value.allAudioData.length === 0) {
            console.error('No audio data available');
            return;
          }
          const audioDataArray = new Int8Array(recorder.value.allAudioData);
          OnAudioComplete.value(audioDataArray);
          console.log('录音停止>>>>执行了', audioDataArray); 
        } catch (e) {
          console.error('Error in OnAudioComplete:', e);
        }
      };
      
      // 开始录音
      recorder.value.start();
  
      // 初始化语音识别器
      if (!asrRecognizer.value) {
        asrRecognizer.value = new WebAudioSpeechRecognizer({
          ...params,
          requestId: requestId.value
        });
        
        // 识别开始回调
        asrRecognizer.value.onStart = () => {
          if (recorder.value) {
            console.log('识别器准备就绪');
            successCallback?.();
            collectLog({}, LOG_TYPE_MAP.RECOGNIZER_START);
            OnRecognitionStart.value({});
            isCanSendData.value = true;
          }
        };
        
        // 识别结果变化回调
        // 修改识别结果回调部分
        asrRecognizer.value.OnSentenceEnd = (res: any) => {
          console.log("上层收到识别结果 - 原始数据:", res);
          
          // 确保数据结构正确
          const resultText = res?.result?.voice_text_str 
            || res?.FinalResult?.voice_text_str
            || res?.voice_text_str
            || '';
            
          const validRes = {
            result: {
              voice_text_str: resultText,
              ...res.result
            },
            ...res
          };
          
          console.log("上层处理后的识别结果:", validRes);
          collectLog(validRes, LOG_TYPE_MAP.RECOGNIZER_RESULT_CHANGE);
          OnRecognitionResultChange.value(validRes);
        };

        // asrRecognizer.value.OnRecognitionResultChange = (res: any) => {
        //   console.log("上层收到识别结果 - 原始数据:", res);
          
        //   // 确保数据结构正确
        //   const resultText = res?.result?.voice_text_str 
        //     || res?.FinalResult?.voice_text_str
        //     || res?.voice_text_str
        //     || '';
            
        //   const validRes = {
        //     result: {
        //       voice_text_str: resultText,
        //       ...res.result
        //     },
        //     ...res
        //   };
          
        //   console.log("上层处理后的识别结果:", validRes);
        //   collectLog(validRes, LOG_TYPE_MAP.RECOGNIZER_RESULT_CHANGE);
        //   OnRecognitionResultChange.value(validRes);
        // };
  
        // 识别完成
        asrRecognizer.value.OnRecognitionComplete = async (res: any) => {
          console.log("index.ts OnRecognitionComplete 完整处理后的识别结果:", res);
          collectLog(res, LOG_TYPE_MAP.RECOGNIZER_COMPLETE);
          isLog && await logServer.value?.LogInsert();
          OnRecognitionComplete.value(res);
          isCanSendData.value = false;
          asrRecognizer.value = null;
        };
        
        // 识别错误
        asrRecognizer.value.OnError = async (err: any) => {
          collectLog(err, LOG_TYPE_MAP.RECOGNIZER_ERROR);
          OnError.value(err);
          recorder.value && recorder.value.stop();
          isCanSendData.value = false;
          if (timer.value) {
            clearInterval(timer.value);
            timer.value = null;
          }
        };
      }
      
      // 开始识别
      asrRecognizer.value.start();
  
    } catch (error) {
      collectLog(error, LOG_TYPE_MAP.SDK_INIT_ERROR);
    }
  };

  // 停止录音和识别
  const stop = () => {
    if (recorder.value) {
      recorder.value.stop();
      recorder.value = null;
    }
    if (asrRecognizer.value) {
      asrRecognizer.value.stop();
    }
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  };

  // 销毁录音流
  const destroyStream = () => {
    if (recorder.value) {
      recorder.value.destroyStream();
    }
  };

  // 下载日志
  const downloadLogs = async () => {
    if (!logServer.value) return;
    return await logServer.value.QueryLog();
  };

  // 组件卸载时清理资源
  onUnmounted(() => {
    stop();
    destroyStream();
  });

  return {
    // 状态
    recorder,
    asrRecognizer,
    isCanSendData,
    audioData,
    requestId,
    
    // 方法
    start,
    stop,
    destroyStream,
    downloadLogs,
    
    // 回调设置
    OnAudioComplete,
    OnRecognitionStart,
    OnRecognitionResultChange,
    OnRecognitionComplete,
    OnError,
    OnRecorderStop
  };
}

export default useSpeechRecognition;