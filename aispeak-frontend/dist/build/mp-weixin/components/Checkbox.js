"use strict";const e=require("../common/vendor.js"),o=e.defineComponent({__name:"Checkbox",props:{checked:{type:Boolean}},emits:["input"],setup(o,{emit:c}){const n=o,t=e.ref("Hello"),u=e.ref(!1);setTimeout((()=>{t.value="首页"}),3e3);const h=e=>{e.stopPropagation(),u.value=!u.value,c("input",u.value)};return e.watch((()=>n.checked),(e=>{console.log("props.checked",n.checked),u.value=!!n.checked})),e.onMounted((()=>{console.log("props.checked",n.checked),u.value=!!n.checked})),(o,c)=>({a:e.n(u.value?"checkbox-box-ico":"checkbox-box-ico un-checkbox-box-ico"),b:e.n(u.value?"checkbox-box-ico un-checkbox-box-ico":"checkbox-box-ico"),c:e.o(h)})}});wx.createComponent(o);