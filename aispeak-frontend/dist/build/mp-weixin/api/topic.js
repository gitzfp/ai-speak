"use strict";const s=require("../axios/api.js"),e={getTopicData:e=>s.request("/topics","GET",e,!1),getTopicDetail:e=>s.request(`/topics/${e}`,"GET",null,!1),getTopicHistory:e=>s.request(`/topics/${e}/history`,"GET",null,!1),createSession:e=>s.request(`/topics/${e.topic_id}/session`,"POST",e,!0),createLessonSession:e=>s.request(`/topics/${e.lesson_id}/lesson_session`,"POST",e,!0),getSessionByLessonId:e=>s.request(`/topics/lesson/${e.lesson_id}/session/`,"GET",e,!0),completeTopic:e=>s.request(`/topics/sessions/${e.session_id}/complete`,"POST",e,!0),getTopicCompletation:e=>s.request(`/topics/${e.topic_id}/session/${e.session_id}/completion`,"GET",null,!1),getPhrase:e=>s.request(`/topics/${e.topic_id}/phrases`,"GET",null,!1),deleteTopicHistory:e=>s.request(`/topics/${e.topic_id}/session/${e.session_id}`,"DELETE",null,!1)};exports.topicRequest=e;
