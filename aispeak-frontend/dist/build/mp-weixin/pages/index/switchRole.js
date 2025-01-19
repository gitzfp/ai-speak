"use strict";const e=require("../../common/vendor.js"),a=require("../../api/chat.js"),t=require("../../api/account.js"),n=require("../../api/sys.js");require("../../axios/api.js"),require("../../config/env.js"),Math||(l+o)();const l=()=>"../../components/CommonHeader.js",o=()=>"../../components/AudioPlayer.js",s=e.defineComponent({__name:"switchRole",setup(l){const o=e.ref([]),s=e.ref(500),r=e.ref(2e3),u=e.ref(0),i=e.ref(""),c=e.ref(""),d=e.ref(null),v=e.ref(0);e.onLoad((a=>{e.index.setNavigationBarTitle({title:"AISPeak"}),a.redirectType&&(d.value=a.redirectType)})),e.onShow((()=>{t.accountRequest.getSettings().then((e=>{c.value=e.data.target_language,f(),g()}))}));const f=()=>{a.chatRequest.languageExampleGet({language:c.value}).then((e=>{i.value=e.data}))},g=()=>{n.sysRequest.getRoles({locale:c.value}).then((a=>{o.value=a.data,t.accountRequest.getSettings().then((a=>{let t=a.data.speech_role_name;if(t){let e=o.value.findIndex((e=>e.short_name==t));e>-1&&(u.value=e)}e.nextTick$1((()=>{v.value=u.value}))}))}))},h=e=>{u.value=e.detail.current},p=()=>{let a=o.value[u.value];t.accountRequest.setSettings({speech_role_name:a.short_name}).then((a=>{e.index.showToast({title:"切换成功",icon:"none",duration:2e3}),e.index.navigateBack()}))},m=()=>{e.index.switchTab({url:"/pages/index/index"})};return(a,t)=>({a:e.o(m),b:e.p({"left-icon":!0,"back-fn":m,title:"聊天"}),c:e.f(o.value,((a,t,n)=>e.e({a:e.t(a.local_name),b:a.avatar},a.avatar?{c:a.avatar}:(a.gender,{}),{d:"2"==a.gender,e:e.f(a.styles,((t,l,o)=>({a:e.t(t.label||"默认"),b:t,c:"5651fe05-1-"+n+"-"+o,d:e.p({content:i.value,speechRoleName:a.short_name,speechRoleStyle:t.value})}))),f:a.id}))),d:r.value,e:s.value,f:e.o(h),g:v.value,h:e.o(p)})}}),r=e._export_sfc(s,[["__scopeId","data-v-5651fe05"]]);wx.createPage(r);