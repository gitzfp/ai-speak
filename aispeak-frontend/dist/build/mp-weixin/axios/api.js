"use strict";const e=require("../common/vendor.js"),n=require("../config/env.js");exports.request=(o,t,i,a)=>{let r=n.__config.basePath+o;return new Promise(((n,o)=>{a&&e.index.showLoading(),e.index.request({url:r,method:t,data:i,header:{"Content-Type":"application/json","X-Token":e.index.getStorageSync("x-token")?e.index.getStorageSync("x-token"):""},success(t){200==t.statusCode?n(t.data):401==t.statusCode?(e.index.showToast({title:"登录过期，重新登录",icon:"none",duration:2e3}),e.index.removeStorageSync("x-token"),e.index.navigateTo({url:"/pages/login/index"})):o(t.data)},fail(e){console.error(e),o(e)},complete(n){var o;a&&(null==(o=e.index)||o.hideLoading())}})}))};