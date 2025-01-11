"use strict";
const axios_api = require("../axios/api.js");
const textbookRequest = {
  // 获取教材详情
  getTextbookDetail(textbookId) {
    return axios_api.request(`/textbook/${textbookId}`, "GET");
  },
  // 获取课程列表
  getCourseDetail(textbookId, categoryId) {
    return axios_api.request(
      `/textbook/${textbookId}/category/${categoryId}/lessons`,
      "GET"
    );
  },
  getLessonDetail(lessonId) {
    return axios_api.request(
      `/textbook/lesson/${lessonId}`,
      "GET"
    );
  }
};
exports.textbookRequest = textbookRequest;
