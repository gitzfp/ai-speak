import request from "@/axios/api";

export default {
  // 获取教材列表
  getTextbooks(version = "全部", grade = "全部", term = "全部", publisher = "全部") {
    return request(`/textbooks?version=${version}&grade=${grade}&term=${term}&publisher=${publisher}`, "GET");
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

  // 获取课程单元的单词列表
  getLessonWords(bookId: string, lessonId?: string) {
    const url = lessonId 
      ? `/textbook/${bookId}/lesson/${lessonId}/words`
      : `/textbook/${bookId}/words`;
    return request(url, "GET");
  },

  // 创建教材页面和句子
  createTextbookPages(book_id: string, pages: Array<object>) {
    return request(`/textbook/${book_id}/pages`, "POST", pages);
  },

  // 创建教材目录
  createTextbookChapters(book_id: string, chapters: Array<object>) {
    return request(`/textbook/${book_id}/chapters`, "POST", chapters);
  },

  // 获取教材详情
  getTextbookDetails(book_id: string) {
    return request(`/textbook/${book_id}/details`, "GET");
  },

  // 获取教材下的所有课程和句子
  getTextbookLessonsAndSentences(book_id: string) {
    return request(`/textbook/${book_id}/lessons/sentences`, "GET");
  },

  // 获取课程单元的单词列表
  getWordsDetail(bookId: string, words: string[]) {
    const url = `/textbook/${bookId}/words/details`;
    // 打印请求 URL 和请求体，方便调试
    // console.log("请求URL:", url);
    // console.log("请求体:", requestBody);

    return request(url, "POST", { words }); // 传递 words 作为请求体
   },
   

};
