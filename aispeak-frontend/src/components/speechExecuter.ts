import __config from "@/config/env";
import utils from "@/utils/utils";

// #ifdef H5
import Recorder from "recorder-core";
import "recorder-core/src/engine/wav";
// #endif

const MAXIMUM_RECORDING_TIME = 60;

class Speech {
  private utils = utils;
  private recorder = {
    start: false,
    processing: false,
    remainingTime: 0,
    rec: null as any | null,
    wxRecorderManager: null as UniApp.RecorderManager | null,
  };
  private intervalId: any = null;
  private listener = {
    success: null as Function | null,
    cancel: null as Function | null,
    error: null as Function | null,
    interval: null as Function | null,
    processing: null as Function | null,
  };

  constructor() {
    // Constructor logic
  }

  handleVoiceStart({
    success,
    cancel,
    error,
    interval,
    processing,
  }: {
    success: Function;
    cancel: Function;
    error: Function;
    interval: Function;
    processing: Function;
  }) {
    let self = this;
    self.listener.success = success;
    self.listener.cancel = cancel;
    self.listener.error = error;
    self.listener.interval = interval;
    self.listener.processing = processing;

    // #ifndef H5
    self.mpWeixinVoiceStart();
    // #endif

    // #ifdef H5
    self.h5VoiceStart();
    // #endif
  }

  mpWeixinVoiceStart() {
    let self = this;
    let recorderManager = uni.getRecorderManager();
    
    if (!recorderManager) {
      console.error("Failed to get recorder manager");
      if (self.listener.error) {
        self.listener.error("Failed to initialize recorder");
      }
      return;
    }

    let format = "wav";
    // #ifdef APP-PLUS
    if (uni.getSystemInfoSync().platform === "android") {
      format = "mp3";
    }
    // #endif

    self.recorder.wxRecorderManager = recorderManager;
    
    try {
      recorderManager.start({
        duration: MAXIMUM_RECORDING_TIME * 1000,
        sampleRate: 44100,
        encodeBitRate: 192000,
        format: format,
      });

      self.recorder.start = true;
      self.recorder.remainingTime = MAXIMUM_RECORDING_TIME;
      
      self.intervalId = setInterval(() => {
        if (self.recorder.remainingTime === 0) {
          self.handleEndVoice();
        } else {
          if (self.listener.interval) {
            self.listener.interval(self.recorder.remainingTime);
          }
          self.recorder.remainingTime--;
        }
      }, 1000);

      recorderManager.onStop((res: any) => {
        if (!res || !res.tempFilePath) {
          console.error("No tempFilePath in stop result", res);
          return;
        }
        console.log("停止微信录音回调。。。", res);
        self.handleProcessWxEndVoice({
          filePath: res.tempFilePath,
        });
        console.log("停止微信录音回调成功", res);
      });

      recorderManager.onError((err: any) => {
        console.error("Recorder error:", err);
        if (self.listener.error) {
          self.listener.error(err);
        }
      });
    } catch (err) {
      console.error("Error starting recorder:", err);
      if (self.listener.error) {
        self.listener.error(err);
      }
    }
  }

  h5VoiceStart() {
    let self = this;
    self.recorder.rec = Recorder({
      type: "wav",
      bitRate: 32,
      sampleRate: 32000,
    });

    self.recorder.rec.open(
      () => {
        self.recorder.start = true;
        self.recorder.rec.start();
        self.recorder.remainingTime = MAXIMUM_RECORDING_TIME;
        
        self.intervalId = setInterval(() => {
          if (self.recorder.remainingTime === 0) {
            clearInterval(self.intervalId);
            self.handleEndVoice();
          } else {
            if (self.listener.interval) {
              self.listener.interval(self.recorder.remainingTime);
            }
            self.recorder.remainingTime--;
          }
        }, 1000);
      },
      (msg: string) => {
        uni.showToast({
          title: "请开启录音权限",
          icon: "none",
        });
        if (self.listener.error) {
          self.listener.error(msg);
        }
      }
    );
  }

  handleEndVoice() {
    let self = this;
    self.clearInterval();

    if (self.recorder.processing) {
      return;
    }

    if (self.utils.isWechat()) {
      self.handleWxEndVoice();
    } else {
      self.handleH5EndVoice();
    }
  }

  handleWxEndVoice() {
    console.log("停止微信录音：handleWxEndVoice")
    let self = this;
    if (!self.recorder.wxRecorderManager) {
      console.error("wxRecorderManager is null");
      if (self.listener.error) {
        self.listener.error("Recorder manager not initialized");
      }
      return;
    }

    try {
      self.recorder.wxRecorderManager.stop();
    } catch (err) {
      console.error("Error stopping recorder:", err);
      if (self.listener.error) {
        self.listener.error(err);
      }
    }
  }

  handleProcessWxEndVoice({ filePath }: { filePath: string }) {
    let self = this;
    if (self.listener.processing) {
      self.listener.processing();
    }

    uni.uploadFile({
      url: __config.basePath + "/voices/upload",
      filePath: filePath,
      header: {
        "X-Token": uni.getStorageSync("x-token"),
      },
      name: "file",
      success: (res: any) => {
        self.handleUploadResult({ resData: res });
      },
      fail: (e: any) => {
        console.error(e, "失败原因");
        uni.showToast({
          title: "上传失败",
          icon: "none",
        });
        if (self.listener.error) {
          self.listener.error(e);
        }
      },
      complete: () => {
        self.recorder.start = false;
        self.recorder.processing = false;
        self.recorder.rec = null;
      },
    });
  }

  handleH5EndVoice() {
    console.log("停止h5录音：handleWxEndVoice")
    let self = this;
    if (self.listener.processing) {
      self.listener.processing();
    }

    self.recorder.rec?.stop(
      (blob: any) => {
        uni.uploadFile({
          file: blob,
          header: {
            "X-Token": uni.getStorageSync("x-token"),
          },
          name: "file",
          formData: { file: blob },
          url: __config.basePath + "/voices/upload",
          success: (res) => {
            self.handleUploadResult({ resData: res });
          },
          fail: (e) => {
            console.error(e, "失败原因");
            uni.showToast({
              title: "上传失败",
              icon: "none",
            });
          },
          complete: () => {
            self.recorder.start = false;
            self.recorder.processing = false;
            self.recorder.rec = null;
          },
        });
      },
      (err: any) => {
        if (self.listener.error) {
          self.listener.error(err);
        }
      }
    );
  }

  handleUploadResult({ resData }: { resData: any }) {
    const self = this;
    if (resData.statusCode == 200) {
      let resultJson = JSON.parse(resData.data);
      if (resultJson.code != 1000) {
        uni.showToast({
          title: resultJson.message,
          icon: "none",
        });
        if (self.listener.error) {
          self.listener.error(resultJson);
        }
        return;
      }
      if (self.listener.success) {
        self.listener.success({
          inputValue: resultJson.data.result,
          voiceFileName: resultJson.data.file,
        });
      }
    }
  }

  clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  handleCancleVoice() {
    this.clearInterval();

    // #ifndef H5
    if (this.recorder.wxRecorderManager) {
      this.recorder.wxRecorderManager.stop();
      this.recorder.start = false;
      this.recorder.processing = false;
      this.recorder.wxRecorderManager = null;
    }
    // #endif

    // #ifdef H5
    if (this.recorder.rec) {
      this.recorder.rec.stop(() => {
        this.recorder.start = false;
        this.recorder.processing = false;
        this.recorder.rec = null;
      });
    }
    // #endif

    if (this.listener.cancel) {
      this.listener.cancel();
    }
  }
}

const speech = new Speech();
export default speech;
