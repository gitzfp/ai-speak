"use strict";const e=require("../../common/vendor.js"),o=require("../../api/textbook.js"),t=require("../../api/topic.js");require("../../axios/api.js"),require("../../config/env.js");const l=e.defineComponent({__name:"lesson",setup(l){const a=e.ref({detail:{title:"",sub_title:"",points:[],lesson_id:""},exercise_list:[]}),s=e.ref(!1),n=e.ref(""),i=e.ref(0),r=e.ref(""),u=e.ref(""),d=e.computed((()=>{var e;return console.log("exercise_list:",a.value.exercise_list),(null==(e=a.value.exercise_list)?void 0:e[i.value])||null})),v=()=>{var e;if(!d.value)return void console.error("No current exercise available");console.log("Current Exercise:",d.value);const o=null==(e=d.value.options)?void 0:e.find((e=>"1"===e.is_correct));o?r.value===o.text?(u.value="回答正确！正在进入下一题...",setTimeout((()=>{u.value="",c()}),2e3)):u.value="回答错误，请再试一次！":console.error("No correct option found")},c=()=>{r.value="",u.value="",i.value<a.value.exercise_list.length-1?i.value++:(i.value=a.value.exercise_list.length,u.value="🎉 恭喜完成所有练习！")};e.onLoad((e=>{console.log("Lesson onLoad options:",e),e.lessonId?(async e=>{s.value=!0,n.value="";try{const t=await o.textbookRequest.getLessonDetail(e);if(console.log("API Response:",t),!t.data)throw new Error("No data returned from server");a.value={...t.data,exercise_list:t.data.exercise_list||[]},console.log("Loaded lesson data:",a.value)}catch(t){n.value=t.message||"加载失败，请重试",console.error("Load lesson error:",t)}finally{s.value=!1}})(e.lessonId):n.value="缺少必要参数"}));const x=o=>{const t=e.index.createInnerAudioContext();t.src=o,t.autoplay=!0,t.onError((o=>{console.error("音频播放失败：",o),e.index.showToast({title:"音频播放失败",icon:"none"})}))},f=e.computed((()=>i.value>=a.value.exercise_list.length)),p=async()=>{var o,l,s,n,i;const r=null==(l=null==(o=a.value)?void 0:o.detail)?void 0:l.lesson_id;let u=null==(s=(await t.topicRequest.getSessionByLessonId({lesson_id:r})).data)?void 0:s.id;u?e.index.navigateTo({url:`/pages/chat/index?sessionId=${u}&type=LESSON&lessonId=${r}`}):t.topicRequest.createLessonSession({lesson_id:null==(i=null==(n=a.value)?void 0:n.detail)?void 0:i.lesson_id}).then((o=>{console.log(o.data.id),e.index.navigateTo({url:`/pages/chat/index?sessionId=${o.data.id}&type=LESSON&lessonId=${r}`})}))};return(o,t)=>e.e({a:a.value.detail},a.value.detail?e.e({b:a.value.detail.pic,c:e.t(a.value.detail.title),d:e.t(a.value.detail.sub_title),e:e.f(a.value.detail.points,((o,t,l)=>({a:e.t(o.word),b:e.t(o.meaning),c:e.o((e=>x(o.audio)),o.word),d:o.word}))),f:!e.unref(f)},e.unref(f)?{}:e.e({g:e.unref(d)},e.unref(d)?e.e({h:e.t(i.value+1),i:e.t(e.unref(d).title),j:e.f(e.unref(d).options,((o,t,l)=>({a:e.t(o.text),b:e.o((e=>x(o.audio)),o.text),c:o.text,d:r.value===o.text?1:"",e:u.value&&r.value===o.text&&"1"!==o.is_correct?1:"",f:e.o((e=>(e=>{r.value=e.text,console.log("Selected answer:",r.value)})(o)),o.text)}))),k:e.o(v),l:!r.value,m:u.value},u.value?{n:e.t(u.value)}:{}):{}),{o:e.unref(f)},e.unref(f)?{p:e.o(p)}:{}):e.e({q:n.value},n.value?{r:e.t(n.value)}:{}))}}),a=e._export_sfc(l,[["__scopeId","data-v-8e0bf56b"]]);wx.createPage(a);