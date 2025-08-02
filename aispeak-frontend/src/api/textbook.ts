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
    // 如果bookId为空，使用不需要bookId的API
    const url = bookId ? `/textbook/${bookId}/words/details` : `/words/details`;
    // 打印请求 URL 和请求体，方便调试
    // console.log("请求URL:", url);
    // console.log("请求体:", { words });

    return request(url, "POST", { words }); // 传递 words 作为请求体
   },
   
   // 获取教材章节列表
     getTextbookChapters(bookId: string) {
       return request(`/textbook/${bookId}/chapters`, "GET");
     },
   
    // 获取指定 书本的单元的 句子
     getLessonSentences(bookId: string, lessonId: string) {
       return request(`/textbook/${bookId}/lesson/${lessonId}/sentences`, "GET");
     },

    // 获取特定句子的详情
    getSentencesDetail(bookId: string, sentenceIds: number[]) {
      const url = `/textbook/${bookId}/sentences/details`;
      return request(url, "POST", { sentence_ids: sentenceIds });
    },

    // 获取句子详情（不需要bookId，用于任务跟读等场景）
    getSentencesDetailByIds(sentenceIds: number[]) {
      return request("/sentences/details", "POST", { sentence_ids: sentenceIds });
    },

    // 根据任务ID获取句子（推荐使用）
    getTaskSentences(taskId: number) {
      return request(`/task/${taskId}/sentences`, "GET");
    },

    // 根据任务ID获取单词（用于单词跟读任务）
    getTaskWords(taskId: number) {
      return request(`/task/${taskId}/words`, "GET");
    },

};
