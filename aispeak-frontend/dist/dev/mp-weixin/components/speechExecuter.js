"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const common_vendor = require("../common/vendor.js");
const config_env = require("../config/env.js");
const utils_utils = require("../utils/utils.js");
const MAXIMUM_RECORDING_TIME = 60;
class Speech {
  constructor() {
    __publicField(this, "utils", utils_utils.utils);
    __publicField(this, "recorder", {
      start: false,
      processing: false,
      remainingTime: 0,
      rec: null,
      wxRecorderManager: null
    });
    __publicField(this, "intervalId", null);
    __publicField(this, "listener", {
      success: null,
      cancel: null,
      error: null,
      interval: null,
      processing: null
    });
  }
  handleVoiceStart({
    success,
    cancel,
    error,
    interval,
    processing
  }) {
    let self = this;
    self.listener.success = success;
    self.listener.cancel = cancel;
    self.listener.error = error;
    self.listener.interval = interval;
    self.listener.processing = processing;
    self.mpWeixinVoiceStart();
  }
  mpWeixinVoiceStart() {
    let self = this;
    let recorderManager = common_vendor.index.getRecorderManager();
    if (!recorderManager) {
      console.error("Failed to get recorder manager");
      if (self.listener.error) {
        self.listener.error("Failed to initialize recorder");
      }
      return;
    }
    let format = "wav";
    self.recorder.wxRecorderManager = recorderManager;
    try {
      recorderManager.start({
        duration: MAXIMUM_RECORDING_TIME * 1e3,
        sampleRate: 44100,
        encodeBitRate: 192e3,
        format
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
      }, 1e3);
      recorderManager.onStop((res) => {
        if (!res || !res.tempFilePath) {
          console.error("No tempFilePath in stop result", res);
          return;
        }
        console.log("停止微信录音回调。。。", res);
        self.handleProcessWxEndVoice({
          filePath: res.tempFilePath
        });
        console.log("停止微信录音回调成功", res);
      });
      recorderManager.onError((err) => {
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
      sampleRate: 32e3
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
        }, 1e3);
      },
      (msg) => {
        common_vendor.index.showToast({
          title: "请开启录音权限",
          icon: "none"
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
  clearRecorder() {
    let self = this;
    self.recorder.start = false;
    self.recorder.processing = false;
    self.recorder.rec = null;
    self.recorder.remainingTime = 0;
  }
  handleWxEndVoice() {
    console.log("停止微信录音：handleWxEndVoice");
    let self = this;
    if (!self.recorder.wxRecorderManager) {
      console.error("wxRecorderManager is null");
      if (self.listener.error) {
        self.listener.error("Recorder manager not initialized");
      }
      return;
    }
    try {
      if (self.recorder.start) {
        self.recorder.wxRecorderManager.stop();
        this.clearRecorder();
      }
    } catch (err) {
      console.error("Error stopping recorder:", err);
      if (self.listener.error) {
        self.listener.error(err);
      }
    }
  }
  handleProcessWxEndVoice({ filePath }) {
    let self = this;
    if (self.listener.processing) {
      self.listener.processing();
    }
    common_vendor.index.uploadFile({
      url: config_env.__config.basePath + "/voices/upload",
      filePath,
      header: {
        "X-Token": common_vendor.index.getStorageSync("x-token")
      },
      name: "file",
      success: (res) => {
        console.log("success，微信录音上传成功", res);
        self.handleUploadResult({ resData: res });
      },
      fail: (e) => {
        console.error(e, "微信上传失败原因");
        common_vendor.index.showToast({
          title: "上传失败",
          icon: "none"
        });
        if (self.listener.error) {
          self.listener.error(e);
        }
      },
      complete: () => {
        console.log("complete，微信录音上传成功");
      }
    });
  }
  handleH5EndVoice() {
    var _a;
    console.log("停止h5录音：handleWxEndVoice");
    let self = this;
    if (self.listener.processing) {
      self.listener.processing();
    }
    (_a = self.recorder.rec) == null ? void 0 : _a.stop(
      (blob) => {
        common_vendor.index.uploadFile({
          file: blob,
          header: {
            "X-Token": common_vendor.index.getStorageSync("x-token")
          },
          name: "file",
          formData: { file: blob },
          url: config_env.__config.basePath + "/voices/upload",
          success: (res) => {
            self.handleUploadResult({ resData: res });
          },
          fail: (e) => {
            console.error(e, "h5录音上传失败原因");
            common_vendor.index.showToast({
              title: "上传失败",
              icon: "none"
            });
          },
          complete: () => {
            self.recorder.start = false;
            self.recorder.processing = false;
            self.recorder.rec = null;
          }
        });
      },
      (err) => {
        if (self.listener.error) {
          self.listener.error(err);
        }
      }
    );
  }
  handleUploadResult({ resData }) {
    const self = this;
    if (resData.statusCode == 200) {
      let resultJson = JSON.parse(resData.data);
      if (resultJson.code != 1e3) {
        common_vendor.index.showToast({
          title: resultJson.message,
          icon: "none"
        });
        if (self.listener.error) {
          self.listener.error(resultJson);
        }
        return;
      }
      if (self.listener.success) {
        self.listener.success({
          inputValue: resultJson.data.result,
          voiceFileName: resultJson.data.file
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
    if (this.recorder.wxRecorderManager) {
      this.recorder.wxRecorderManager.stop();
      this.recorder.start = false;
      this.recorder.processing = false;
      this.recorder.wxRecorderManager = null;
    }
    if (this.listener.cancel) {
      this.listener.cancel();
    }
  }
}
const speech = new Speech();
exports.speech = speech;
