import request from "@/axios/api";

export default {
  // 创建学习计划
  createStudyPlan(bookId: string, dailyWords: number) {
    return request("/study/plans", "POST", {
      book_id: bookId,
      daily_words: dailyWords,
    });
  },

  // 获取用户指定书本的学习计划
  getStudyPlan(bookId: string) {
    return request("/study/plans", "GET", { book_id: bookId });
  },

  // 更新学习计划
  updateStudyPlan(planId: number, dailyWords?: number) {
    return request(`/study/plans/${planId}`, "PUT", {
      daily_words: dailyWords,
    });
  },


  // 获取用户的学习记录
  getStudyRecords(bookId: string, studyDate: string) {
    return request("/study/records", "GET", { 
      book_id: bookId, 
      study_date: studyDate 
    });
  },

  // 获取用户在当前书本中已学和未学的单词
  getUserWords(bookId: string) {
    return request("/study/user-words", "GET", { book_id: bookId });
  },
};