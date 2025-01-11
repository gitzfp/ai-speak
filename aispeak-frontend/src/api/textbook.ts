import request from "@/axios/api";

export default {
  // 获取教材详情
  getTextbookDetail(textbookId: string) {
    return request(`/textbook/${textbookId}`, "GET");
  },

  // 获取课程列表
  getCourseDetail(textbookId: string, categoryId: string) {
    return request(
      `/textbook/${textbookId}/category/${categoryId}/lessons`,
      "GET"
    );
  },

  getLessonDetail(lessonId: string) {
    return request(
      `/textbook/lesson/${lessonId}`,
      "GET"
    );
  },
};
