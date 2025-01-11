"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const common_vendor = require("../common/vendor.js");
class AudioPlayer {
  constructor() {
    __publicField(this, "audioContext", null);
  }
  /**
   * 录音的时候使用，录音前要先关闭所有音频播放
   */
  stopAudio() {
    if (this.audioContext) {
      this.audioContext.stop();
    }
  }
  playAudio({ audioUrl, listener }) {
    let audioSrc = audioUrl;
    if (this.audioContext)
      ;
    if (this.audioContext) {
      const oldSrc = this.audioContext.src;
      this.audioContext.stop();
      if (oldSrc === audioSrc) {
        this.audioContext = null;
        return;
      }
    }
    let innerAudioContext = this.createInnerAudioContext(audioUrl, listener);
    this.audioContext = innerAudioContext;
    innerAudioContext.play();
  }
  createInnerAudioContext(src, listener) {
    let innerAudioContext = null;
    innerAudioContext = common_vendor.wx$1.createInnerAudioContext({
      useWebAudioImplement: true
    });
    innerAudioContext.src = src;
    innerAudioContext.onPlay(() => {
      if (listener.playing) {
        listener.playing();
      }
    });
    innerAudioContext.onStop(() => {
      if (listener.success) {
        listener.success();
      }
      innerAudioContext.destory && innerAudioContext.destory();
      this.audioContext = null;
    });
    innerAudioContext.onEnded(() => {
      if (listener.success) {
        listener.success();
      }
      innerAudioContext.destory && innerAudioContext.destory();
      this.audioContext = null;
    });
    innerAudioContext.onError((res) => {
      if (listener.error) {
        listener.error();
      }
    });
    return innerAudioContext;
  }
}
const audioPlayer = new AudioPlayer();
exports.audioPlayer = audioPlayer;
