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
  getUserWords(bookId: string, planId: number) {
    return request("/study/user-words", "GET", { book_id: bookId, plan_id: planId });
  },
  
  // 批量插入或更新用户单词学习进度
    upsertStudyWordProgress(bookId: string, typeNum: number, planId: number, wordsData: Array<{
      word: string;
      word_id: number;
      correct_count: number;
      incorrect_count: number;
    }>) {
      return request("/study/word-progress", "POST", {
        book_id: bookId,
        type_num: typeNum,
		plan_id: planId,
        words_data: wordsData,
      });
    },
	
   // 批量更新用户复习单词的学习进度（仅更新，不插入）
	upsertReviewWordProgress(bookId: string, typeNum: number, planId: number,wordsData: Array<{
	    word: string;
	    word_id: number;
	    correct_count: number;
	    incorrect_count: number;
	  }>
	) {
	  return request("/study/review-word-progress", "POST", {
	    book_id: bookId,
	    type_num: typeNum,
	    plan_id: planId,
	    words_data: wordsData,
	  });
	},
  
  // 更新或创建学习记录
    updateOrCreateStudyRecord(
	  bookId: string,
      studyDate: string,
      newWords?: number,
      reviewWords?: number,
      duration?: number
    ) {
      return request("/study/record", "POST", {
        book_id: bookId,
        study_date: studyDate,
        new_words: newWords,
        review_words: reviewWords,
        duration: duration,
      });
    },
  
  // 获取用户的学习完成记录
    getStudyCompletionRecords(bookId: string, dates: string[]) {
      return request("/study/completion-records", "POST", {
        book_id: bookId,
        dates: dates,
      });
    },
  
  // 创建或更新学习完成记录
    createOrUpdateStudyCompletionRecord(bookId: string) {
      return request("/study/completion-record", "POST", {
        book_id: bookId,
      });
    },
  
  
	// 提交学习进度报告
	  submitStudyProgressReport(
	    bookId: string,
	    lessonId: number,
	    reports: Array<{
	      word: string;
	      content_type: number;
	      error_count: number;
	      points: number;
	    }>
	  ) {
	    return request("/study/progress-report", "POST", {
	      book_id: bookId,
	      lesson_id: lessonId,
	      reports: reports,
	    });
	  },
  
};