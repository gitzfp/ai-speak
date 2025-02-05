"use strict";
const axios_api = require("../axios/api.js");
const chatRequest = {
  sessionCreate: (data) => {
    return axios_api.request("/sessions", "POST", data, true);
  },
  sessionDefaultGet: (data) => {
    return axios_api.request("/sessions/default", "GET", data, true);
  },
  sessionDetailsGet: (data) => {
    return axios_api.request("/sessions/" + data.sessionId, "GET", data, true);
  },
  sessionInitGreeting: (sessionId, taskTargets) => {
    const data = taskTargets ? { task_targets: taskTargets } : {};
    console.log("Sending greeting request:", { sessionId, data });
    return axios_api.request(
      `/sessions/${sessionId}/greeting`,
      "POST",
      data,
      false
    ).catch((error) => {
      console.error("Greeting request failed:", error);
      throw error;
    });
  },
  sessionChatInvoke: (data) => {
    return axios_api.request(`/sessions/${data.sessionId}/chat`, "POST", data, false);
  },
  transformText: (data) => {
    return axios_api.request(
      `/sessions/${data.sessionId}/voice-translate`,
      "POST",
      data,
      false
    );
  },
  messagesLatestDelete: (sessionId) => {
    return axios_api.request(
      `/sessions/${sessionId}/messages/latest`,
      "DELETE",
      null,
      false
    );
  },
  messagesAllDelete: (sessionId) => {
    return axios_api.request(`/sessions/${sessionId}/messages`, "DELETE", null, false);
  },
  translateInvoke: (data) => {
    return axios_api.request(
      `/messages/${data.message_id}/translate`,
      "POST",
      data,
      false
    );
  },
  messagePractice: (data) => {
    return axios_api.request(
      `/messages/${data.message_id}/practice`,
      "POST",
      data,
      false
    );
  },
  speechContent: (data) => {
    return axios_api.request("/message/speech-content", "POST", data, false);
  },
  speechDemo: (data) => {
    return axios_api.request("/message/speech-demo", "POST", data, false);
  },
  grammarInvoke: (data) => {
    return axios_api.request("/message/grammar", "POST", data, false);
  },
  pronunciationInvoke: (data) => {
    return axios_api.request("/message/pronunciation", "POST", data, false);
  },
  translateSettingLanguage: (data) => {
    return axios_api.request("/message/translate-setting-language", "POST", data, false);
  },
  translateSourceLanguage: (data) => {
    return axios_api.request("/message/translate-source-language", "POST", data, false);
  },
  transferSpeech: (data) => {
    return axios_api.request("/message/speech", "POST", data, false);
  },
  wordDetail: (data) => {
    return axios_api.request("/message/word/detail", "POST", data, false);
  },
  wordPractice: (data) => {
    return axios_api.request("/message/word/practice", "POST", data, false);
  },
  promptInvoke: (data) => {
    return axios_api.request("/message/prompt", "POST", data, false);
  },
  languageExampleGet: (data) => {
    return axios_api.request("/languages/example", "GET", data, false);
  },
  rolesGet: (data) => {
    return axios_api.request("/roles", "GET", data, false);
  }
};
exports.chatRequest = chatRequest;
