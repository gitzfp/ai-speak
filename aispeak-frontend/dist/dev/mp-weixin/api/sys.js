"use strict";
const axios_api = require("../axios/api.js");
const sysRequest = {
  feedbackAdd: (data) => {
    return axios_api.request("/sys/feedback", "POST", data, false);
  },
  getLanguages: () => {
    return axios_api.request("/sys/languages", "GET", null);
  },
  getRoles: (data) => {
    return axios_api.request("/sys/roles", "GET", data);
  },
  setLearningLanguage: (data) => {
    return axios_api.request("/sys/language", "POST", data);
  },
  settingsPost: (data) => {
    return axios_api.request("/sys/settings", "POST", data);
  },
  settingsGet: () => {
    return axios_api.request("/sys/settings", "GET");
  }
};
exports.sysRequest = sysRequest;
