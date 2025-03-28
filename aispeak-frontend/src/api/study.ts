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
		  content_id: number;
	      content_type: number;
	      error_count: number;
	      points: number;
	      speak_count: number; // 新增开口次数字段
	      json_data?: string; // 修改为字符串类型，与后端一致
		  voice_file?: string; // 语音文件路径或 URL
		  chinese?: string;
		  audio_url?: string;
		  audio_start?: number; // 改为可选的 int 字段
		  audio_end?: number; // 改为可选的 int 字段
	    }>,
	    statusNum?: number // 新增 statusNum 参数，可选
	  ) {
	    return request("/study/progress-report", "POST", {
	      book_id: bookId,
	      lesson_id: lessonId,
	      reports: reports.map(report => ({
	        word: report.word,
	        content_type: report.content_type,
			content_id: report.content_id,
	        error_count: report.error_count,
	        points: report.points,
	        speak_count: report.speak_count, // 新增字段
	        json_data: report.json_data ? JSON.stringify(report.json_data) : null, // 将 JSON 对象转为字符串
			voice_file: report.voice_file || null, // 默认值为 null
			chinese: report.chinese || null, // 默认值为 null
			audio_url: report.audio_url || null, // 默认值为 null
			audio_start: report.audio_start || null, // 默认值为 null
			audio_end: report.audio_end || null, // 默认值为 null
	      })),
	      statusNum: statusNum ,
	    });
	  },
	  
	  
	  // 获取单元进度摘要
	  getUnitSummaryReport(bookId: string, lessonId: number) {
	      return request("/study/unit-summary-report", "GET", {
	        book_id: bookId,
	        lesson_id: lessonId,
	      });
	    },
		
		
		// 获取 content_type 为 0, 1, 2 的学习进度报告
		getStudyProgressReports(bookId: string, lessonId: number,contentType: number = 0) {
		  return request("/study/progress-reports", "GET", {
			book_id: bookId,
			lesson_id: lessonId,
			content_type: contentType // 传递content_type参数
		  });
		},
  
};