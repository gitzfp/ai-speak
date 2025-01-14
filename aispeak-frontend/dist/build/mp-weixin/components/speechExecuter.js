"use strict";var e=Object.defineProperty,r=(r,n,o)=>(((r,n,o)=>{n in r?e(r,n,{enumerable:!0,configurable:!0,writable:!0,value:o}):r[n]=o})(r,"symbol"!=typeof n?n+"":n,o),o);const n=require("../common/vendor.js"),o=require("../config/env.js");const t=new class{constructor(){r(this,"recorder",{start:!1,processing:!1,remainingTime:0,rec:null,wxRecorderManager:null}),r(this,"intervalId",null),r(this,"listener",{success:null,cancel:null,error:null,interval:null,processing:null})}handleVoiceStart({success:e,cancel:r,error:n,interval:o,processing:t}){let i=this;i.listener.success=e,i.listener.cancel=r,i.listener.error=n,i.listener.interval=o,i.listener.processing=t,i.mpWeixinVoiceStart()}mpWeixinVoiceStart(){let e=this,r=n.index.getRecorderManager();console.log(r);e.recorder.wxRecorderManager=r,r.start({duration:6e4,sampleRate:44100,encodeBitRate:192e3,format:"wav"}),console.log("speech start.."),e.recorder.start=!0,e.recorder.remainingTime=60,e.intervalId=setInterval((()=>{0===e.recorder.remainingTime?e.handleEndVoice():(e.listener.interval&&e.listener.interval(e.recorder.remainingTime),e.recorder.remainingTime--)}),1e3),r.onStop((r=>{console.log("speech on stop.."+r.tempFilePath),e.handleProcessWxEndVoice({filePath:r.tempFilePath})}))}clearInterval(){const e=this;e.intervalId&&clearInterval(e.intervalId)}h5VoiceStart(){let e=this;e.recorder.rec=Recorder({type:"wav",bitRate:32,sampleRate:32e3}),e.recorder.rec.open((()=>{e.recorder.start=!0,e.recorder.rec.start(),e.recorder.remainingTime=60,e.intervalId=setInterval((()=>{e.listener.interval&&e.listener.interval(e.recorder.remainingTime),0===e.recorder.remainingTime?(clearInterval(e.intervalId),e.handleEndVoice()):e.recorder.remainingTime--}),1e3)}),((r,o)=>{n.index.showToast({title:"请开启录音权限",icon:"none"}),e.listener.error&&e.listener.error(r)}))}handleCancleVoice(){let e=this;e.clearInterval(),e.recorder.wxRecorderManager&&(e.recorder.wxRecorderManager.stop(),e.recorder.start=!1,e.recorder.processing=!1,e.recorder.wxRecorderManager=null),e.listener.cancel&&e.listener.cancel()}handleEndVoice(){let e=this;e.clearInterval(),e.recorder.processing||(console.log("speech trigger end.."),e.handleWxEndVoice())}handleWxEndVoice(){console.log("execute stop1"),console.log(this.recorder),this.recorder.wxRecorderManager.stop(),console.log("execute stop")}handleProcessWxEndVoice({filePath:e}){console.log("speech end...");let r=this;r.listener.processing&&r.listener.processing(),n.index.uploadFile({url:o.__config.basePath+"/voices/upload",filePath:e,header:{"X-Token":n.index.getStorageSync("x-token")},name:"file",success:e=>{var n=e;r.handleUploadResult({resData:n})},fail(e){console.error(e,"失败原因"),n.index.showToast({title:"上传失败",icon:"none"}),r.listener.error&&r.listener.error(e)},complete:()=>{r.recorder.start=!1,r.recorder.processing=!1,r.recorder.rec=null}})}handleH5EndVoice(){let e=this;e.listener.processing&&e.listener.processing(),e.recorder.rec.stop(((r,t)=>{e.recorder.processing=!0;var i=new FileReader;i.addEventListener("load",(function(){}),!1),i.readAsDataURL(r),window.URL.createObjectURL(r),n.index.uploadFile({file:r,header:{"X-Token":n.index.getStorageSync("x-token")},name:"file",formData:{file:r},url:o.__config.basePath+"/voices/upload",success:r=>{var n=r;e.handleUploadResult({resData:n})},fail(e){console.error(e,"失败原因"),n.index.showToast({title:"上传失败",icon:"none"})},complete:()=>{e.recorder.start=!1,e.recorder.processing=!1,e.recorder.rec=null}})}),(function(r){e.listener.error&&e.listener.error(r),console.error("结束出错")}),!0)}handleUploadResult({resData:e}){const r=this;if(200==e.statusCode){let o=JSON.parse(e.data);if(1e3!=o.code)return n.index.showToast({title:o.message,icon:"none"}),void(r.listener.error&&r.listener.error(o));let t=o.data;r.listener.success&&r.listener.success({inputValue:t.result,voiceFileName:t.file})}}};exports.speech=t;