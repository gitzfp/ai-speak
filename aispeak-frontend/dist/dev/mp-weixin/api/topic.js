"use strict";
const axios_api = require("../axios/api.js");
const topicRequest = {
  getTopicData: (params) => {
    return axios_api.request("/topics", "GET", params, false);
  },
  getTopicDetail: (id) => {
    return axios_api.request(`/topics/${id}`, "GET", null, false);
  },
  getTopicHistory: (id) => {
    return axios_api.request(`/topics/${id}/history`, "GET", null, false);
  },
  createSession: (data) => {
    return axios_api.request(`/topics/${data.topic_id}/session`, "POST", data, true);
  },
  createLessonSession: (data) => {
    return axios_api.request(`/topics/${data.lesson_id}/lesson_session`, "POST", data, true);
  },
  getSessionByLessonId: (data) => {
    return axios_api.request(`/topics/lesson/${data.lesson_id}/session/`, "GET", data, true);
  },
  completeTopic: (data) => {
    return axios_api.request(`/topics/sessions/${data.session_id}/complete`, "POST", data, true);
  },
  getTopicCompletation: (data) => {
    return axios_api.request(`/topics/${data.topic_id}/session/${data.session_id}/completion`, "GET", null, false);
  },
  getPhrase: (data) => {
    return axios_api.request(`/topics/${data.topic_id}/phrases`, "GET", null, false);
  },
  deleteTopicHistory: (data) => {
    return axios_api.request(`/topics/${data.topic_id}/session/${data.session_id}`, "DELETE", null, false);
  }
};
exports.topicRequest = topicRequest;
