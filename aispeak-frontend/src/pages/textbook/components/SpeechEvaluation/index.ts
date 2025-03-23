import WebRecorder from "./core/webRecorder";
import SoeNewConnect from "./core/soeSocket";
import LogReport from "./lib/LogReport";
import { guid } from "./lib/credential";
import { LOG_TYPE_MAP } from "./core/constants";
class SowNewSocketSdk {
  recorder: any;
  soeRecognizer: any;
  params: any;
  isCanSendData: boolean;
  audioData: Array<any>;
  timer: any;
  private logServer: any;
  isLog: boolean;
  requestId: string;
  // 添加录音停止回调
  OnAudioComplete: (data: Int8Array) => void = () => {};
  constructor(params: any, isLog: boolean = false) {
    this.params = params;
    this.recorder = null;
    this.soeRecognizer = null;
    this.isCanSendData = false;
    this.audioData = [];
    this.timer = null;
    this.isLog = isLog;
    this.requestId = "";
    if (isLog) {
      (async () => {
        try {
          const that = this;
          this.logServer = new LogReport(isLog);
          await this.logServer.LogInit();
        } catch (error) {}
      })();
    }
  }
  start() {
    this.requestId = guid();
    try {
      this.recorder = new WebRecorder(
        this.isLog,
        this.logServer,
        this.requestId
      );
      console.log("录音开始.....",this.recorder)
      this.recorder.OnReceivedData = (data: any) => {
        console.log('收到录音数据...', data, this.isCanSendData)
        if (this.isCanSendData) {
          this.soeRecognizer.write(data);
        }
        this._collectLog('', LOG_TYPE_MAP.RECORD_DATA);
      };
      // 录音失败时
      this.recorder.OnError = async (err: any) => {
        this._collectLog(err, LOG_TYPE_MAP.RECORD_ERROR);
        this.soeRecognizer && this.soeRecognizer.close();
        this.stop();
        this.OnError(err);
      };
      this.recorder.OnStop = (res: any) => {
        this._collectLog(res, LOG_TYPE_MAP.RECORD_STOP);
        if (this.soeRecognizer) {
          this.soeRecognizer.stop();
        }
        console.log('录音停止...')
        this.OnRecorderStop(res);
        
        // 添加数据验证和错误处理
        try {
          if (!this.recorder.allAudioData || this.recorder.allAudioData.length === 0) {
            console.error('No audio data available');
            return;
          }
          const audioData = new Int8Array(this.recorder.allAudioData);
          console.log('Triggering OnAudioComplete with data length:', audioData.length);
          this.OnAudioComplete(audioData);
        } catch (e) {
          console.error('Error in OnAudioComplete:', e);
        }
      };
      this.recorder.start();

      // 修改soeRecognizer初始化逻辑
      if (!this.soeRecognizer) {
        this.soeRecognizer = new SoeNewConnect(
          { ...this.params, voice_id: this.requestId },
          this.isLog,
          this.logServer
        );
      
        // 将事件监听移至构造函数内部（关键修改）
        this.soeRecognizer.OnEvaluationStart = (res: any) => {
          if (this.recorder) {
            this._collectLog(res, LOG_TYPE_MAP.RECOGNIZER_START);
            this.OnEvaluationStart(res);
            this.isCanSendData = true;
            console.log('识别已启动'); // 添加调试日志
          }
        };
      
        this.soeRecognizer.OnEvaluationResultChange = (res: any) => {
          this._collectLog(res, LOG_TYPE_MAP.RECOGNIZER_RESULT_CHANGE);
          console.log('收到实时结果:', res); // 添加详细日志
          this.OnEvaluationResultChange(res);
        };
      }
      
      // 建立连接前添加超时处理（新增代码）
      this.soeRecognizer.OnConnectTimeout = () => {
        console.error('连接超时');
        this.OnError({ code: 'CONNECT_TIMEOUT' });
      };
      this.soeRecognizer.start();
      // 开始识别
      this.soeRecognizer.OnEvaluationStart = (res: any) => {
        if (this.recorder) {
          // 录音正常
          this._collectLog(res, LOG_TYPE_MAP.RECOGNIZER_START);
          this.OnEvaluationStart(res);
          this.isCanSendData = true;
        } else {
          this.soeRecognizer && this.soeRecognizer.close();
        }
      };
      // 识别变化时
      this.soeRecognizer.OnEvaluationResultChange = (res: any) => {
        this._collectLog(res, LOG_TYPE_MAP.RECOGNIZER_RESULT_CHANGE);
        this.OnEvaluationResultChange(res);
      };
      // 识别结束
      this.soeRecognizer.OnEvaluationComplete = async (res: any) => {
        this._collectLog(res, LOG_TYPE_MAP.RECOGNIZER_COMPLETE);
        this.isLog && await this.logServer?.LogInsert();
        this.soeRecognizer && this.soeRecognizer.close();
        this.OnEvaluationComplete(res);
        this.isCanSendData = false;
      };
      // 识别错误
      this.soeRecognizer.OnError = async (res: any) => {
        if (this.isLog) {
          const type = res?.type;
          this._collectLog(
            res,
            type === "close"
              ? LOG_TYPE_MAP.SOCKET_CLOSE
              : LOG_TYPE_MAP.SOCKET_ERROR
          );
          type === "close" && (await this.logServer?.LogInsert());
        }
        this.OnError(res);
        this.recorder && this.recorder.stop();
        this.isCanSendData = false;
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      };
      // 建立连接
      this.soeRecognizer.start();
    } catch (error) {
      this._collectLog(error, LOG_TYPE_MAP.SDK_INIT_ERROR);
    }
  }
  destroyStream() {
    if (this.recorder) {
      this.recorder.destroyStream();
    }
  }
  // 开始识别的时候
  OnEvaluationStart(res: any) {
    console.log("OnEvaluationStart", res);
  }
  // 识别结果发生变化的时候
  OnEvaluationResultChange(res: any) {
    console.log("OnEvaluationResultChange", res);
  }
  // 识别结束的时候
  OnEvaluationComplete(res: any) {
    console.log("OnEvaluationComplete", res);
  }
  stop() {
    if (this.recorder) {
      this.recorder.stop();
    }
    if (this.soeRecognizer) {
      this.soeRecognizer.stop();
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  // 识别失败
  OnError(err: any) {
    console.log("error2222", err);
  }
  OnRecorderStop(res: any) {}
  async OndownloadLogs() {
    if (!this.logServer) {
      return;
    }
    const res = await this.logServer.QueryLog();
    return res;
  }
  // 收集用户轨迹日志
  private _collectLog(res: any, type: string) {
    if (!this.logServer || !this.isLog){
      return;
    }
    this.logServer.LogAdd({
      type,
      message:
        (typeof res === "string" || res?.length ? res : res?.message) || res?.reason || "",
      requestId: this.requestId,
      timeStamp: new Date().getTime(),
      error: res,
      code: res?.code || 0,
    });
  }
}

export default SowNewSocketSdk;

window && ((window as any).SowNewSocketSdk = SowNewSocketSdk);