"use strict";const e=require("../../../common/vendor.js"),o=require("../../../api/chat.js");if(require("../../../axios/api.js"),require("../../../config/env.js"),!Array){e.resolveComponent("uni-popup")()}Math||(a+t+n+(()=>"../../../uni_modules/uni-popup/components/uni-popup/uni-popup.js"))();const t=()=>"../../../components/FunctionalText.js",n=()=>"./MessageSpeech.js",a=()=>"../../../components/LoadingRound.js",s=e.defineComponent({__name:"PromptPopup",setup(t,{expose:n}){var a;const s=e.ref(null),u=e.ref(null),p=e.ref(!0),l=e.ref([]),r=null==(a=e.getCurrentInstance())?void 0:a.appContext.config.globalProperties.$bus,c=e.ref("");e.onMounted((()=>{c.value="#fff"}));const i=()=>{d()},v=()=>{d()},d=()=>{console.log("closePopup"),u.value="",l.value=[],s.value.close()};return n({open:e=>{u.value=e,s.value.open(),p.value=!0,o.chatRequest.promptInvoke({session_id:e}).then((e=>{l.value=[{text:e.data,translateShow:!1}]})).finally((()=>{p.value=!1}))}}),(o,t)=>e.e({a:e.o(i),b:p.value},(p.value,{}),{c:e.f(l.value,((o,t,n)=>({a:"e7d28c05-2-"+n+",e7d28c05-0",b:e.p({"session-id":u.value,text:o.text,"translate-show":o.translateShow}),c:e.o((e=>(e=>{e.translateShow=!e.translateShow})(o)),o.text),d:o.translateShow?1:"",e:e.o((e=>(e=>{r.emit("SendMessage",{text:e.text}),d()})(o)),o.text),f:o.text}))),d:e.o(v),e:e.p({sessionId:u.value}),f:e.sr(s,"e7d28c05-0",{k:"promotPopup"}),g:e.p({type:"bottom","background-color":c.value})})}}),u=e._export_sfc(s,[["__scopeId","data-v-e7d28c05"]]);wx.createComponent(u);
