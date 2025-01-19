"use strict";const e=require("../../common/vendor.js"),o=require("../../api/account.js"),n=require("../../utils/utils.js");require("../../axios/api.js"),require("../../config/env.js");const a=e.defineComponent({__name:"index",setup(a){const t=e.ref(!1),i=e.ref(!1),l=e.ref(""),u=e.ref("");e.onMounted((()=>{e.index.setNavigationBarTitle({title:"AISPeak"}),i.value=n.utils.isWechat(),console.log("isWeixin:",i.value);let o=e.index.getStorageSync("x-token");o&&v(o)}));const s=n=>{t.value||(t.value=!0,e.index.login({provider:"weixin",success:e=>{const n=e.code;o.accountRequest.wechatLogin({code:n}).then((e=>{c(e)})).finally((()=>{t.value=!1}))},fail:e=>{console.error("微信登录失败",e),t.value=!1}}))},r=()=>{console.log("手机号登录"),t.value||(t.value=!0,o.accountRequest.phoneLogin({phone_number:l.value,password:u.value}).then((e=>{c(e)})).finally((()=>{t.value=!1})))},c=o=>{if(1e3!==o.code)return void e.index.showToast({title:o.message,icon:"none"});let n=o.data.token;v(n)},v=o=>{e.index.setStorageSync("x-token",o),e.index.switchTab({url:"/pages/textbook/index"})};return(o,n)=>e.e({a:i.value},i.value?{b:e.o(s)}:{c:l.value,d:e.o((e=>l.value=e.detail.value)),e:u.value,f:e.o((e=>u.value=e.detail.value)),g:e.o(r)})}}),t=e._export_sfc(a,[["__scopeId","data-v-162e08d0"]]);wx.createPage(t);
