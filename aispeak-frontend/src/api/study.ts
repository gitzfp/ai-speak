import request from "@/axios/api";

export default {
  // 创建学习计划
  createStudyPlan(userId: number, bookId: number, dailyWords: number, totalWords: number, totalDays: number) {
    return request("/study/plans", "POST", {
      user_id: userId,
      book_id: bookId,
      daily_words: dailyWords,
      total_words: totalWords,
      total_days: totalDays,
    });
  },

  // 根据ID获取学习计划
  getStudyPlanById(planId: number) {
    return request(`/study/plans/${planId}`, "GET");
  },

  // 获取用户的所有学习计划
  getStudyPlansByUser(userId: number) {
    return request(`/study/users/${userId}/plans`, "GET");
  },

  // 更新学习计划
  updateStudyPlan(planId: number, dailyWords?: number, totalWords?: number, totalDays?: number) {
    return request(`/study/plans/${planId}`, "PUT", {
      daily_words: dailyWords,
      total_words: totalWords,
      total_days: totalDays,
    });
  },

  // 删除学习计划
  deleteStudyPlan(planId: number) {
    return request(`/study/plans/${planId}`, "DELETE");
  },

  // 创建单词学习进度
  createStudyWordProgress(userId: number, wordId: number, bookId: number, studyDate: string) {
    return request("/study/word-progress", "POST", {
      user_id: userId,
      word_id: wordId,
      book_id: bookId,
      study_date: studyDate,
    });
  },

  // 根据ID获取单词学习进度
  getStudyWordProgressById(progressId: number) {
    return request(`/study/word-progress/${progressId}`, "GET");
  },

  // 更新单词学习进度
  updateStudyWordProgress(progressId: number, learningCount?: number, correctCount?: number, incorrectCount?: number, isMastered?: number) {
    return request(`/study/word-progress/${progressId}`, "PUT", {
      learning_count: learningCount,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      is_mastered: isMastered,
    });
  },

  // 删除单词学习进度
  deleteStudyWordProgress(progressId: number) {
    return request(`/study/word-progress/${progressId}`, "DELETE");
  },

  // 创建学习记录
  createStudyRecord(userId: number, bookId: number, studyDate: string, newWords: number, reviewWords: number, duration: number) {
    return request("/study/records", "POST", {
      user_id: userId,
      book_id: bookId,
      study_date: studyDate,
      new_words: newWords,
      review_words: reviewWords,
      duration: duration,
    });
  },

  // 根据ID获取学习记录
  getStudyRecordById(recordId: number) {
    return request(`/study/records/${recordId}`, "GET");
  },

  // 获取用户的所有学习记录
  getStudyRecordsByUser(userId: number) {
    return request(`/study/users/${userId}/records`, "GET");
  },

  // 更新学习记录
  updateStudyRecord(recordId: number, newWords?: number, reviewWords?: number, duration?: number) {
    return request(`/study/records/${recordId}`, "PUT", {
      new_words: newWords,
      review_words: reviewWords,
      duration: duration,
    });
  },

  // 删除学习记录
  deleteStudyRecord(recordId: number) {
    return request(`/study/records/${recordId}`, "DELETE");
  },
};