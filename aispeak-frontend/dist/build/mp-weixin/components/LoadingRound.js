"use strict";const e=require("../common/vendor.js"),n=e.defineComponent({__name:"LoadingRound",props:{minHeight:null},setup(n){const t=n,o=e.computed((()=>t.minHeight?`min-height:${t.minHeight}rpx;`:""));return(n,t)=>({a:e.s(e.unref(o))})}}),t=e._export_sfc(n,[["__scopeId","data-v-a2ad2114"]]);wx.createComponent(t);