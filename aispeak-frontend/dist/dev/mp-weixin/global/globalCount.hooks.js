"use strict";
const common_vendor = require("../common/vendor.js");
const api_chat = require("../api/chat.js");
const globalUserInfo = common_vendor.ref(1);
const globalLoading = common_vendor.ref(false);
function useUserInfo() {
  const localCount = common_vendor.ref(1);
  common_vendor.onMounted(() => {
    globalLoading.value = true;
    api_chat.chatRequest.sessionDefaultGet({}).then((data) => {
      globalUserInfo.value = data.data;
    });
    globalLoading.value = false;
  });
  return {
    globalUserInfo,
    globalLoading,
    localCount
  };
}
exports.useUserInfo = useUserInfo;
