import { ref, reactive, onUnmounted } from 'vue';
import WebRecorder from "./core/webRecorder";
import SoeNewConnect from "./core/soeSocket";
import LogReport from "./lib/LogReport";
import { guid } from "./lib/credential";
import { LOG_TYPE_MAP } from "./core/constants";

export function useSpeechEvaluation(params: any, isLog: boolean = false) {
  const recorder = ref<any>(null);
  const soeRecognizer = ref<any>(null);
  const isCanSendData = ref(false);
  const audioData = reactive<Array<any>>([]);
  const timer = ref<any>(null);
  const logServer = ref<any>(null);
  const requestId = ref("");
  
  // 回调函数
  const onAudioComplete = ref<(data: Int8Array) => void>(() => {});
  const onEvaluationStart = ref<(res: any) => void>((res) => {
    console.log("OnEvaluationStart", res);
  });
  const onEvaluationResultChange = ref<(res: any) => void>((res) => {
    console.log("OnEvaluationResultChange", res);
  });
  const onEvaluationComplete = ref<(res: any) => void>((res) => {
    console.log("OnEvaluationComplete", res);
  });
  const onError = ref<(err: any) => void>((err) => {
    console.log("error2222", err);
  });
  const onRecorderStop = ref<(res: any) => void>(() => {});

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
  const collectLog = (res: any, type: string) => {
    if (!logServer.value || !isLog) {
      return;
    }
    logServer.value.LogAdd({
      type,
      message:
        (typeof res === "string" || res?.length ? res : res?.message) || res?.reason || "",
      requestId: requestId.value,
      timeStamp: new Date().getTime(),
      error: res,
      code: res?.code || 0,
    });
  };

  // 开始录音和识别
  const start = () => {
    requestId.value = guid();
    try {
      recorder.value = new WebRecorder(
        isLog,
        logServer.value,
        requestId.value
      );
      console.log("录音开始.....", recorder.value);
      recorder.value.OnReceivedData = (data: any) => {
        console.log('收到录音数据...', data, isCanSendData.value);
        if (isCanSendData.value) {
          soeRecognizer.value.write(data);
        }
        collectLog('', LOG_TYPE_MAP.RECORD_DATA);
      };
      
      // 录音失败时
      recorder.value.OnError = async (err: any) => {
        collectLog(err, LOG_TYPE_MAP.RECORD_ERROR);
        soeRecognizer.value && soeRecognizer.value.close();
        stop();
        onError.value(err);
      };
      
      recorder.value.OnStop = (res: any) => {
        collectLog(res, LOG_TYPE_MAP.RECORD_STOP);
        if (soeRecognizer.value) {
          soeRecognizer.value.stop();
        }
        console.log('录音停止...');
        onRecorderStop.value(res);
        
        // 添加数据验证和错误处理
        try {
          if (!recorder.value.allAudioData || recorder.value.allAudioData.length === 0) {
            console.error('No audio data available');
            return;
          }
          const audioDataArray = new Int8Array(recorder.value.allAudioData);
          console.log('Triggering OnAudioComplete with data length:', audioDataArray.length);
          onAudioComplete.value(audioDataArray);
        } catch (e) {
          console.error('Error in OnAudioComplete:', e);
        }
      };
      
      recorder.value.start();

      // 修改soeRecognizer初始化逻辑
      if (!soeRecognizer.value) {
        soeRecognizer.value = new SoeNewConnect(
          { ...params, voice_id: requestId.value },
          isLog,
          logServer.value
        );
      
        // 将事件监听移至构造函数内部
        soeRecognizer.value.OnEvaluationStart = (res: any) => {
          if (recorder.value) {
            collectLog(res, LOG_TYPE_MAP.RECOGNIZER_START);
            onEvaluationStart.value(res);
            isCanSendData.value = true;
            console.log('识别已启动');
          }
        };
      
        soeRecognizer.value.OnEvaluationResultChange = (res: any) => {
          collectLog(res, LOG_TYPE_MAP.RECOGNIZER_RESULT_CHANGE);
          console.log('收到实时结果:', res);
          onEvaluationResultChange.value(res);
        };
      }
      
      // 建立连接前添加超时处理
      soeRecognizer.value.OnConnectTimeout = () => {
        console.error('连接超时');
        onError.value({ code: 'CONNECT_TIMEOUT' });
      };
      
      // 开始识别
      soeRecognizer.value.OnEvaluationStart = (res: any) => {
        if (recorder.value) {
          // 录音正常
          collectLog(res, LOG_TYPE_MAP.RECOGNIZER_START);
          onEvaluationStart.value(res);
          isCanSendData.value = true;
        } else {
          soeRecognizer.value && soeRecognizer.value.close();
        }
      };
      
      // 识别变化时
      soeRecognizer.value.OnEvaluationResultChange = (res: any) => {
        collectLog(res, LOG_TYPE_MAP.RECOGNIZER_RESULT_CHANGE);
        onEvaluationResultChange.value(res);
      };
      
      // 识别结束
      soeRecognizer.value.OnEvaluationComplete = async (res: any) => {
        collectLog(res, LOG_TYPE_MAP.RECOGNIZER_COMPLETE);
        isLog && await logServer.value?.LogInsert();
        soeRecognizer.value && soeRecognizer.value.close();
        onEvaluationComplete.value(res);
        isCanSendData.value = false;
        soeRecognizer.value = null;
      };
      
      // 识别错误
      soeRecognizer.value.OnError = async (res: any) => {
        if (isLog) {
          const type = res?.type;
          collectLog(
            res,
            type === "close"
              ? LOG_TYPE_MAP.SOCKET_CLOSE
              : LOG_TYPE_MAP.SOCKET_ERROR
          );
          type === "close" && (await logServer.value?.LogInsert());
        }
        onError.value(res);
        recorder.value && recorder.value.stop();
        isCanSendData.value = false;
        if (timer.value) {
          clearInterval(timer.value);
          timer.value = null;
        }
      };
      
      // 建立连接
      soeRecognizer.value.start();
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
    if (soeRecognizer.value) {
      soeRecognizer.value.stop();
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
    if (!logServer.value) {
      return;
    }
    const res = await logServer.value.QueryLog();
    return res;
  };

  // 组件卸载时清理资源
  onUnmounted(() => {
    stop();
    destroyStream();
  });

  return {
    // 状态
    recorder,
    soeRecognizer,
    isCanSendData,
    audioData,
    requestId,
    
    // 方法
    start,
    stop,
    destroyStream,
    downloadLogs,
    
    // 回调设置
    onAudioComplete,
    onEvaluationStart,
    onEvaluationResultChange,
    onEvaluationComplete,
    onError,
    onRecorderStop
  };
}

export default useSpeechEvaluation;