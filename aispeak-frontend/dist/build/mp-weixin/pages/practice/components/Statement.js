"use strict";const e=require("../../../common/vendor.js"),t=require("../../../api/account.js");require("../../../axios/api.js"),require("../../../config/env.js"),Math||c();const c=()=>"../../../components/AudioPlayer.js",n=e.defineComponent({__name:"Statement",props:{collect:null,cannotCancel:{type:Boolean}},setup(c,{emit:n}){const o=c,l=()=>{e.index.showModal({title:"提示",content:"是否删除该收藏",confirmColor:"#6236ff",success:c=>{c.confirm?t.accountRequest.cancelCollect({type:o.collect.type,message_id:o.collect.message_id,content:o.collect.content}).then((()=>{e.index.showToast({title:"删除成功",icon:"none"}),n("deleteCollect",o.collect)})):c.cancel}})};return(t,n)=>e.e({a:e.t(c.collect.content),b:e.p({messageId:c.collect.message_id,content:c.collect.content}),c:!c.cannotCancel},c.cannotCancel?{}:{d:e.o(l)},{e:e.t(c.collect.translation)})}});wx.createComponent(n);