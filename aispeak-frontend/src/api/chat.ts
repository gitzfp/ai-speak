import request from "@/axios/api";

// 定义任务目标的接口
interface TaskTarget {
  id: string;
  info_cn: string;
  info_en: string;
}

export default {
  sessionCreate: (data: any) => {
    return request("/sessions", "POST", data, true);
  },
  sessionDefaultGet: (data: any) => {
    return request("/sessions/default", "GET", data, true);
  },
  sessionDetailsGet: (data: any) => {
    return request("/sessions/" + data.sessionId, "GET", data, true);
  },
  sessionInitGreeting: (sessionId: string, taskTargets: any) => {
    const data = taskTargets ? { task_targets: taskTargets } : {};
    console.log('Sending greeting request:', { sessionId, data });
    return request(
      `/sessions/${sessionId}/greeting`,
      "POST",
      data,
      false
    ).catch(error => {
      console.error('Greeting request failed:', error);
      throw error;
    });
  },
  sessionChatInvoke: (data: any) => {
    return request(`/sessions/${data.sessionId}/chat`, "POST", data, false);
  },
  transformText: (data: any) => {
    return request(
      `/sessions/${data.sessionId}/voice-translate`,
      "POST",
      data,
      false
    );
  },
  messagesLatestDelete: (sessionId: string) => {
    return request(
      `/sessions/${sessionId}/messages/latest`,
      "DELETE",
      null,
      false
    );
  },
  messagesAllDelete: (sessionId: string) => {
    return request(`/sessions/${sessionId}/messages`, "DELETE", null, false);
  },
  translateInvoke: (data: any) => {
    return request(
      `/messages/${data.message_id}/translate`,
      "POST",
      data,
      false
    );
  },
  messagePractice: (data: any) => {
    return request(
      `/messages/${data.message_id}/practice`,
      "POST",
      data,
      false
    );
  },
  speechContent: (data: any) => {
    return request("/message/speech-content", "POST", data, false);
  },
  speechDemo: (data: any) => {
    return request("/message/speech-demo", "POST", data, false);
  },
  grammarInvoke: (data: any) => {
    return request("/message/grammar", "POST", data, false);
  },
  pronunciationInvoke: (data: any) => {
    return request("/message/pronunciation", "POST", data, false);
  },
  pronunciationByFileInvoke: (data: {file_name: string, content: string}) => {
    return request("/message/file-pronunciation", "POST", data, false);
  },
  translateSettingLanguage: (data: any) => {
    return request("/message/translate-setting-language", "POST", data, false);
  },
  translateSourceLanguage: (data: any) => {
    return request("/message/translate-source-language", "POST", data, false);
  },
  transferSpeech: (data: any) => {
    return request("/message/speech", "POST", data, false);
  },
  wordDetail: (data: any) => {
    return request("/message/word/detail", "POST", data, false);
  },
  wordPractice: (data: any) => {
    return request("/message/word/practice", "POST", data, false);
  },
  promptInvoke: (data: any) => {
    return request("/message/prompt", "POST", data, false);
  },
  languageExampleGet: (data?: any) => {
    return request("/languages/example", "GET", data, false);
  },
  rolesGet: (data?: any) => {
    return request("/roles", "GET", data, false);
  },
};
