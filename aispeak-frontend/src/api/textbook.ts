import request from "@/axios/api";

export default {
  // 获取教材列表
  getTextbooks(version = "全部", grade = "全部", term = "全部") {
    return request(`/textbooks?version=${version}&grade=${grade}&term=${term}`, "GET");
  },
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

  // 获取课程单元的单词列表
  getLessonWords(bookId: string, lessonId?: string) {
    const url = lessonId 
      ? `/textbook/${bookId}/lesson/${lessonId}/words`
      : `/textbook/${bookId}/words`;
    return request(url, "GET");
  },
};
