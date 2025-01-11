"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const common_vendor = require("../common/vendor.js");
const config_env = require("../config/env.js");
const MAXIMUM_RECORDING_TIME = 60;
class Speech {
  constructor() {
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
    console.log(recorderManager);
    let format = "wav";
    self.recorder.wxRecorderManager = recorderManager;
    recorderManager.start({
      duration: MAXIMUM_RECORDING_TIME * 1e3,
      sampleRate: 44100,
      encodeBitRate: 192e3,
      format
    });
    console.log("speech start..");
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
      console.log("speech on stop.." + res.tempFilePath);
      self.handleProcessWxEndVoice({
        filePath: res.tempFilePath
      });
    });
  }
  clearInterval() {
    const self = this;
    if (self.intervalId) {
      clearInterval(self.intervalId);
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
          if (self.listener.interval) {
            self.listener.interval(self.recorder.remainingTime);
          }
          if (self.recorder.remainingTime === 0) {
            clearInterval(self.intervalId);
            self.handleEndVoice();
          } else {
            self.recorder.remainingTime--;
          }
        }, 1e3);
      },
      (msg, isUserNotAllow) => {
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
  handleCancleVoice() {
    let self = this;
    self.clearInterval();
    if (self.recorder.wxRecorderManager) {
      self.recorder.wxRecorderManager.stop();
      self.recorder.start = false;
      self.recorder.processing = false;
      self.recorder.wxRecorderManager = null;
    }
    if (self.listener.cancel) {
      self.listener.cancel();
    }
  }
  handleEndVoice() {
    let self = this;
    self.clearInterval();
    if (self.recorder.processing) {
      return;
    }
    console.log("speech trigger end..");
    self.handleWxEndVoice();
  }
  handleWxEndVoice() {
    let self = this;
    console.log("execute stop1");
    console.log(self.recorder);
    self.recorder.wxRecorderManager.stop();
    console.log("execute stop");
  }
  handleProcessWxEndVoice({ filePath }) {
    console.log("speech end...");
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
        var resData = res;
        self.handleUploadResult({
          resData
        });
      },
      fail(e) {
        console.error(e, "失败原因");
        common_vendor.index.showToast({
          title: "上传失败",
          icon: "none"
        });
        if (self.listener.error) {
          self.listener.error(e);
        }
      },
      complete: () => {
        self.recorder.start = false;
        self.recorder.processing = false;
        self.recorder.rec = null;
      }
    });
  }
  handleH5EndVoice() {
    let self = this;
    if (self.listener.processing) {
      self.listener.processing();
    }
    self.recorder.rec.stop(
      (blob, duration) => {
        self.recorder.processing = true;
        var reader = new FileReader();
        reader.addEventListener("load", function() {
        }, false);
        reader.readAsDataURL(blob);
        window.URL.createObjectURL(blob);
        common_vendor.index.uploadFile({
          file: blob,
          header: {
            "X-Token": common_vendor.index.getStorageSync("x-token")
          },
          name: "file",
          formData: {
            file: blob
          },
          url: config_env.__config.basePath + "/voices/upload",
          success: (res) => {
            var resData = res;
            self.handleUploadResult({
              resData
            });
          },
          fail(e) {
            console.error(e, "失败原因");
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
      function(s) {
        if (self.listener.error) {
          self.listener.error(s);
        }
        console.error("结束出错");
      },
      true
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
      let dataJson = resultJson.data;
      if (self.listener.success) {
        self.listener.success({
          inputValue: dataJson.result,
          voiceFileName: dataJson.file
        });
      }
    }
  }
}
const speech = new Speech();
exports.speech = speech;
