"use strict";var e=Object.defineProperty,r=(r,n,o)=>(((r,n,o)=>{n in r?e(r,n,{enumerable:!0,configurable:!0,writable:!0,value:o}):r[n]=o})(r,"symbol"!=typeof n?n+"":n,o),o);const n=require("../common/vendor.js"),o=require("../config/env.js"),i=require("../utils/utils.js");const t=new class{constructor(){r(this,"utils",i.utils),r(this,"recorder",{start:!1,processing:!1,remainingTime:0,rec:null,wxRecorderManager:null}),r(this,"intervalId",null),r(this,"listener",{success:null,cancel:null,error:null,interval:null,processing:null})}handleVoiceStart({success:e,cancel:r,error:n,interval:o,processing:i}){let t=this;t.listener.success=e,t.listener.cancel=r,t.listener.error=n,t.listener.interval=o,t.listener.processing=i,t.mpWeixinVoiceStart()}mpWeixinVoiceStart(){let e=this,r=n.index.getRecorderManager();if(!r)return console.error("Failed to get recorder manager"),void(e.listener.error&&e.listener.error("Failed to initialize recorder"));e.recorder.wxRecorderManager=r;try{r.start({duration:6e4,sampleRate:44100,encodeBitRate:192e3,format:"wav"}),e.recorder.start=!0,e.recorder.remainingTime=60,e.intervalId=setInterval((()=>{0===e.recorder.remainingTime?e.handleEndVoice():(e.listener.interval&&e.listener.interval(e.recorder.remainingTime),e.recorder.remainingTime--)}),1e3),r.onStop((r=>{r&&r.tempFilePath?(console.log("停止微信录音回调。。。",r),e.handleProcessWxEndVoice({filePath:r.tempFilePath}),console.log("停止微信录音回调成功",r)):console.error("No tempFilePath in stop result",r)})),r.onError((r=>{console.error("Recorder error:",r),e.listener.error&&e.listener.error(r)}))}catch(o){console.error("Error starting recorder:",o),e.listener.error&&e.listener.error(o)}}h5VoiceStart(){let e=this;e.recorder.rec=Recorder({type:"wav",bitRate:32,sampleRate:32e3}),e.recorder.rec.open((()=>{e.recorder.start=!0,e.recorder.rec.start(),e.recorder.remainingTime=60,e.intervalId=setInterval((()=>{0===e.recorder.remainingTime?(clearInterval(e.intervalId),e.handleEndVoice()):(e.listener.interval&&e.listener.interval(e.recorder.remainingTime),e.recorder.remainingTime--)}),1e3)}),(r=>{n.index.showToast({title:"请开启录音权限",icon:"none"}),e.listener.error&&e.listener.error(r)}))}handleEndVoice(){let e=this;e.clearInterval(),e.recorder.processing||(e.utils.isWechat()?e.handleWxEndVoice():e.handleH5EndVoice())}handleWxEndVoice(){console.log("停止微信录音：handleWxEndVoice");let e=this;if(!e.recorder.wxRecorderManager)return console.error("wxRecorderManager is null"),void(e.listener.error&&e.listener.error("Recorder manager not initialized"));try{e.recorder.wxRecorderManager.stop()}catch(r){console.error("Error stopping recorder:",r),e.listener.error&&e.listener.error(r)}}handleProcessWxEndVoice({filePath:e}){let r=this;r.listener.processing&&r.listener.processing(),n.index.uploadFile({url:o.__config.basePath+"/voices/upload",filePath:e,header:{"X-Token":n.index.getStorageSync("x-token")},name:"file",success:e=>{r.handleUploadResult({resData:e})},fail:e=>{console.error(e,"微信上传失败原因"),n.index.showToast({title:"上传失败",icon:"none"}),r.listener.error&&r.listener.error(e)},complete:()=>{r.recorder.start=!1,r.recorder.processing=!1,r.recorder.rec=null}})}handleH5EndVoice(){var e;console.log("停止h5录音：handleWxEndVoice");let r=this;r.listener.processing&&r.listener.processing(),null==(e=r.recorder.rec)||e.stop((e=>{n.index.uploadFile({file:e,header:{"X-Token":n.index.getStorageSync("x-token")},name:"file",formData:{file:e},url:o.__config.basePath+"/voices/upload",success:e=>{r.handleUploadResult({resData:e})},fail:e=>{console.error(e,"h5录音上传失败原因"),n.index.showToast({title:"上传失败",icon:"none"})},complete:()=>{r.recorder.start=!1,r.recorder.processing=!1,r.recorder.rec=null}})}),(e=>{r.listener.error&&r.listener.error(e)}))}handleUploadResult({resData:e}){const r=this;if(200==e.statusCode){let o=JSON.parse(e.data);if(1e3!=o.code)return n.index.showToast({title:o.message,icon:"none"}),void(r.listener.error&&r.listener.error(o));r.listener.success&&r.listener.success({inputValue:o.data.result,voiceFileName:o.data.file})}}clearInterval(){this.intervalId&&clearInterval(this.intervalId)}handleCancleVoice(){this.clearInterval(),this.recorder.wxRecorderManager&&(this.recorder.wxRecorderManager.stop(),this.recorder.start=!1,this.recorder.processing=!1,this.recorder.wxRecorderManager=null),this.listener.cancel&&this.listener.cancel()}};exports.speech=t;