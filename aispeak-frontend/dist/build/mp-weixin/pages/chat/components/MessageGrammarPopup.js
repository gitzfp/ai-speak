"use strict";const e=require("../../../common/vendor.js");if(!Array){e.resolveComponent("uni-popup")()}Math||(n+a+u+(()=>"../../../uni_modules/uni-popup/components/uni-popup/uni-popup.js"))();const a=()=>"./MessageGrammar.js",u=()=>"./MessagePronunciation.js",n=()=>"./WordDetail.js",o=e.defineComponent({__name:"MessageGrammarPopup",setup(a,{expose:u}){const n=e.ref(null),o=e.ref(""),l=e.ref(""),r=e.ref(""),t=e.ref(""),i=e.ref("grammar");e.ref(null),e.ref(null);const s=e.ref(!1),v=e.ref(null),m=e.ref(null),p=e.ref(null),c=e.ref("");e.onMounted((()=>{c.value="#fff"}));const f=()=>{s.value=!1,k()},d=({show:e,type:a})=>{},g=e=>{i.value=e,k()},k=()=>{setTimeout((()=>{"pronunciation"===i.value?e.nextTick$1((()=>{m.value.initData()})):e.nextTick$1((()=>{v.value.initData()}))}),100)},x=()=>{n.value.close(),i.value="grammar",s.value=!1},D=a=>{(a=>{s.value=!0,e.nextTick$1((()=>{setTimeout((()=>{p.value.initData(a,o.value)}),100)}))})(a)};return u({open:(a,u,s,p,c)=>{l.value=a,o.value=p,r.value=u,t.value=s,i.value=c&&"pronunciation"===c?"pronunciation":"grammar",n.value.open(),e.nextTick$1((()=>{setTimeout((()=>{"pronunciation"===i.value?m.value.initData():v.value.initData()}),100)}))},handleClose:x}),(a,u)=>e.e({a:e.o(x),b:s.value},s.value?{c:e.o(f)}:{},{d:!s.value},s.value?{}:{e:e.o((e=>g("grammar"))),f:"grammar"===i.value?1:"",g:e.o((e=>g("pronunciation"))),h:"pronunciation"===i.value?1:""},{i:s.value},s.value?{j:e.sr(p,"dc87f123-1,dc87f123-0",{k:"wordDetailRef"})}:{},{k:"grammar"===i.value&&!s.value},"grammar"!==i.value||s.value?{}:{l:e.sr(v,"dc87f123-2,dc87f123-0",{k:"messageGrammarRef"}),m:e.p({"message-id":l.value,"session-id":o.value})},{n:"pronunciation"===i.value&&!s.value},"pronunciation"!==i.value||s.value?{}:{o:e.sr(m,"dc87f123-3,dc87f123-0",{k:"messagePronunciationRef"}),p:e.o(D),q:e.p({"message-id":l.value,"session-id":o.value,"message-content":r.value,"file-name":t.value})},{r:e.sr(n,"dc87f123-0",{k:"grammarPopup"}),s:e.o(d),t:e.p({type:"bottom","background-color":c.value})})}}),l=e._export_sfc(o,[["__scopeId","data-v-dc87f123"]]);wx.createComponent(l);
