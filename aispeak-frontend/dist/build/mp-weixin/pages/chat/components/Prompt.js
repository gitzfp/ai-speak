"use strict";const o=require("../../../common/vendor.js");Math||(e+s)();const e=()=>"./PromptPopup.js",s=()=>"./TranslationPopup.js",n=o.defineComponent({__name:"Prompt",props:{sessionId:null},setup(e){const s=e;o.ref("");const n=o.ref(null),p=o.ref(null),t=()=>{n.value.open(s.sessionId)},r=()=>{p.value.open(s.sessionId)};return(e,s)=>({a:o.o(t),b:o.o(r),c:o.sr(n,"31e97b30-0",{k:"promotPopupRef"}),d:o.sr(p,"31e97b30-1",{k:"translationPopupRef"})})}}),p=o._export_sfc(n,[["__scopeId","data-v-31e97b30"]]);wx.createComponent(p);