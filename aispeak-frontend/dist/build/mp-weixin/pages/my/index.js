"use strict";const e=require("../../common/vendor.js"),n=require("../../api/account.js");require("../../axios/api.js"),require("../../config/env.js"),Math||t();const t=()=>"../../components/CommonHeader.js",a=e.defineComponent({__name:"index",setup(t){const a=e.ref({account_id:"",today_chat_count:0,total_chat_count:0,target_language_label:""});e.onMounted((()=>{e.index.setNavigationBarTitle({title:"AI-Speak"})})),e.onShow((()=>{n.accountRequest.accountInfoGet().then((e=>{a.value=e.data}))}));const o=()=>{e.index.navigateTo({url:"/pages/contact/index"})},i=()=>{e.index.showModal({title:"提示",content:"确定退出登录吗？",confirmColor:"#6236ff",success:function(n){n.confirm?(e.index.removeStorageSync("x-token"),e.index.reLaunch({url:"/pages/login/index"})):n.cancel&&console.log("用户点击取消")}})},c=()=>{e.index.removeStorageSync("x-token"),e.index.reLaunch({url:"/pages/login/index"})},u=()=>{e.index.navigateTo({url:"/pages/feedback/index"})},r=()=>{e.index.navigateTo({url:"/pages/my/learnLanguage"})};return(n,t)=>e.e({a:e.p({title:"AISPeak"}),b:0===a.value.account_id.indexOf("visitor")},0===a.value.account_id.indexOf("visitor")?{c:e.o(c)}:{d:e.t(a.value.account_id)},{e:e.t(a.value.today_chat_count),f:e.t(a.value.total_chat_count),g:e.t(a.value.target_language_label),h:e.o(r),i:e.o(u),j:e.o(o),k:a.value.account_id.indexOf("visitor")<0},a.value.account_id.indexOf("visitor")<0?{l:e.o(i)}:{})}}),o=e._export_sfc(a,[["__scopeId","data-v-b520fff0"]]);wx.createPage(o);
