"use strict";
const axios_api = require("../axios/api.js");
const accountRequest = {
  visitorLogin: (data) => {
    return axios_api.request("/account/visitor-login", "POST", data, true);
  },
  phoneLogin: (data) => {
    return axios_api.request("/account/phone-login", "POST", data, true);
  },
  wechatLogin: (data) => {
    return axios_api.request("/account/wechat-login", "POST", data, true);
  },
  accountInfoGet: () => {
    return axios_api.request("/account/info", "GET");
  },
  setSettings: (data) => {
    return axios_api.request("/account/settings", "POST", data);
  },
  getSettings: () => {
    return axios_api.request("/account/settings", "GET");
  },
  setRole: (data) => {
    return axios_api.request("/account/role", "POST", data);
  },
  getRole: () => {
    return axios_api.request("/account/role", "GET", null);
  },
  setLearningLanguage: (data) => {
    return axios_api.request("/account/language", "POST", data);
  },
  getLearningLanguage: () => {
    return axios_api.request("/account/language", "GET", null);
  },
  collectGet: (data) => {
    return axios_api.request("/account/collect", "GET", data, false);
  },
  collect: (data) => {
    return axios_api.request("/account/collect", "POST", data, false);
  },
  cancelCollect: (data) => {
    return axios_api.request("/account/collect", "DELETE", data, false);
  },
  collectsGet: (data) => {
    return axios_api.request("/account/collects", "GET", data, false);
  }
};
exports.accountRequest = accountRequest;
