"use strict";const e=require("../../../common/vendor.js"),t=require("../../../api/account.js");require("../../../axios/api.js"),require("../../../config/env.js"),Math||c();const c=()=>"../../../components/AudioPlayer.js",o=e.defineComponent({__name:"Single",props:{collect:null},setup(c,{emit:o}){const n=c,l=()=>{e.index.showModal({title:"提示",content:"是否删除该收藏",confirmColor:"#6236ff",success:c=>{c.confirm?t.accountRequest.cancelCollect({type:n.collect.type,message_id:n.collect.message_id,content:n.collect.content}).then((()=>{e.index.showToast({title:"删除成功",icon:"none"}),o("deleteCollect",n.collect)})):c.cancel}})};return(t,o)=>({a:e.t(c.collect.content),b:e.t(c.collect.translation),c:e.p({messageId:c.collect.message_id,content:c.collect.content}),d:e.o(l)})}});wx.createComponent(o);