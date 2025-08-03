<template>
  <view class="container">
    <CommonHeader :left-icon="true" :back-fn="handleBack">
      <template v-slot:content>
        <text>任务详情</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <LoadingRound v-if="loading" />
      
      <view v-else class="task-detail">
        <!-- 任务基本信息 -->
        <view class="task-info">
          <view class="task-header">
            <text class="task-title">{{ task.title || '英语作业 - Unit 1' }}</text>
            <view class="task-status" :class="getTaskStatusClass()">
              {{ getTaskStatusText() }}
            </view>
          </view>
          
          <text class="task-desc">{{ task.description || '完成Unit 1的单词练习和语法题' }}</text>
          
          <view class="task-meta">
            <view class="meta-item">
              <text class="meta-label">学科:</text>
              <text class="meta-value">{{ getSubjectLabel(task.subject) || '英语' }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">类型:</text>
              <text class="meta-value">{{ getTaskTypeLabel(task.task_type) || '作业' }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">总分:</text>
              <text class="meta-value">{{ task.total_points || 100 }}分</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">截止时间:</text>
              <text class="meta-value">{{ formatDate(task.deadline) || '2025/1/10 18:00' }}</text>
            </view>
            <view v-if="task.allow_late_submission" class="meta-item">
              <text class="meta-label">迟交:</text>
              <text class="meta-value">允许</text>
            </view>
            <view v-if="task.max_attempts > 0" class="meta-item">
              <text class="meta-label">最大尝试次数:</text>
              <text class="meta-value">{{ task.max_attempts }}</text>
            </view>
          </view>
        </view>
        
        <!-- 学生视图：任务内容和提交 -->
        <view v-if="mode === 'student'" class="student-content">
          <view class="section-title">任务内容</view>
          

          
          <view 
            v-for="(content, index) in taskContents" 
            :key="content.id || index"
            class="content-item"
          >
            <view class="content-header">
              <text class="content-title">{{ index + 1 }}. {{ getContentTypeLabel(content.content_type) }}</text>
              <text class="content-points">{{ content.points }}分</text>
            </view>
            
            <!-- 任务说明 -->
            <view v-if="content.meta_data?.instructions" class="instructions">
              <text class="instruction-text">{{ content.meta_data.instructions }}</text>
            </view>
            
            <!-- 显示具体的单词和句子内容 -->
            <view class="content-details">
              <!-- 单词列表 -->
              <view v-if="content.selected_words && content.selected_words.length > 0" class="words-section">
                <text class="detail-title">📚 练习单词</text>
                <view class="words-grid">
                  <view 
                    v-for="(word, wordIndex) in content.selected_words" 
                    :key="wordIndex"
                    class="word-item"
                  >
                    <text class="word-text">{{ word.word || word }}</text>
                    <text v-if="word.phonetic || word.uk_phonetic" class="word-phonetic">{{ word.phonetic || word.uk_phonetic }}</text>
                    <text v-if="word.translation || word.chinese" class="word-translation">{{ word.translation || word.chinese }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 如果有单词ID但没有单词数据，显示占位符 -->
              <view v-else-if="content.selected_word_ids && content.selected_word_ids.length > 0" class="words-section">
                <text class="detail-title">📚 练习单词</text>
                <view class="loading-placeholder">
                  <text style="color: #999; font-size: 26rpx;">
                    共 {{ content.selected_word_ids.length }} 个单词，正在加载详情...
                  </text>
                  <view class="word-ids-display" style="margin-top: 10rpx;">
                    <text style="color: #666; font-size: 24rpx;">单词IDs: {{ content.selected_word_ids.join(', ') }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 句子列表 -->
              <view v-if="content.selected_sentences && content.selected_sentences.length > 0" class="sentences-section">
                <text class="detail-title">📝 练习句子</text>
                <view class="sentences-list">
                  <view 
                    v-for="(sentence, sentenceIndex) in content.selected_sentences" 
                    :key="sentenceIndex"
                    class="sentence-item"
                  >
                    <text class="sentence-text">{{ sentence.content || sentence.english || sentence }}</text>
                    <text v-if="sentence.translation || sentence.chinese" class="sentence-translation">{{ sentence.translation || sentence.chinese }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 如果有句子ID但没有句子数据，显示占位符 -->
              <view v-else-if="content.selected_sentence_ids && content.selected_sentence_ids.length > 0" class="sentences-section">
                <text class="detail-title">📝 练习句子</text>
                <view class="loading-placeholder">
                  <text style="color: #999; font-size: 26rpx;">
                    共 {{ content.selected_sentence_ids.length }} 个句子，正在加载详情...
                  </text>
                  <view class="sentence-ids-display" style="margin-top: 10rpx;">
                    <text style="color: #666; font-size: 24rpx;">句子IDs: {{ content.selected_sentence_ids.join(', ') }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 课文内容 -->
              <view v-if="content.lesson_content" class="lesson-section">
                <text class="detail-title">📖 课文内容</text>
                <view class="lesson-content">
                  <text class="lesson-text">{{ content.lesson_content }}</text>
                </view>
              </view>
            </view>
            
            <!-- 听写内容 -->
            <view v-if="content.content_type === 'dictation'" class="dictation-input">
              <view class="instructions">
                <text class="instruction-text">
                  请听音频后输入听到的内容
                  <text v-if="content.selected_words && content.selected_words.length > 0">
                    （共{{ content.selected_words.length }}个单词）
                  </text>
                  <text v-else-if="content.selected_word_ids && content.selected_word_ids.length > 0">
                    （共{{ content.selected_word_ids.length }}个单词）
                  </text>
                </text>
              </view>
              <textarea 
                v-model="submissions[content.id]" 
                class="submission-textarea"
                placeholder="请输入听写内容..."
              />
            </view>
            
            <!-- 拼写内容 -->
            <view v-else-if="content.content_type === 'spelling'" class="spelling-input">
              <view class="instructions">
                <text class="instruction-text">
                  请正确拼写单词
                  <text v-if="content.selected_words && content.selected_words.length > 0">
                    （共{{ content.selected_words.length }}个单词）
                  </text>
                  <text v-else-if="content.selected_word_ids && content.selected_word_ids.length > 0">
                    （共{{ content.selected_word_ids.length }}个单词）
                  </text>
                </text>
              </view>
              <input 
                v-model="submissions[content.id]" 
                class="spelling-input-field"
                placeholder="请输入单词拼写..."
              />
            </view>
            
            <!-- 发音内容 -->
            <view v-else-if="content.content_type === 'pronunciation'" class="pronunciation-input">
              <view class="instructions">
                <text class="instruction-text">
                  请朗读以下内容并录音
                  <text v-if="content.selected_words && content.selected_words.length > 0">
                    （{{ content.selected_words.length }}个单词）
                  </text>
                  <text v-if="content.selected_sentences && content.selected_sentences.length > 0">
                    （{{ content.selected_sentences.length }}个句子）
                  </text>
                </text>
              </view>
              <view class="record-section">
                <view 
                  class="record-btn" 
                  :class="{ recording: recording[content.id] }" 
                  @click="toggleRecording(content.id)"
                >
                  <text class="record-icon">{{ recording[content.id] ? '⏹️' : '🎤' }}</text>
                  <text class="record-text">{{ recording[content.id] ? '停止录音' : '开始录音' }}</text>
                </view>
                <view v-if="audioFiles[content.id]" class="audio-preview">
                  <text class="preview-text">✅ 录音完成</text>
                  <text class="replay-btn" @click="playAudio(content.id)">播放</text>
                </view>
              </view>
            </view>
            
            <!-- 句子跟读内容 -->
            <view v-else-if="content.content_type === 'sentence_repeat'" class="sentence-repeat-input">
              <view class="instructions">
                <text class="instruction-text">
                  请跟读句子并录音
                  <text v-if="content.selected_sentences && content.selected_sentences.length > 0">
                    （共{{ content.selected_sentences.length }}个句子）
                  </text>
                </text>
              </view>
              <view class="record-section">
                <view 
                  class="record-btn" 
                  :class="{ recording: recording[content.id] }" 
                  @click="toggleRecording(content.id)"
                >
                  <text class="record-icon">{{ recording[content.id] ? '⏹️' : '🎤' }}</text>
                  <text class="record-text">{{ recording[content.id] ? '停止录音' : '开始录音' }}</text>
                </view>
                <view v-if="audioFiles[content.id]" class="audio-preview">
                  <text class="preview-text">✅ 录音完成</text>
                  <text class="replay-btn" @click="playAudio(content.id)">播放</text>
                </view>
              </view>
            </view>
            
            <!-- 测验内容 -->
            <view v-else-if="content.content_type === 'quiz'" class="quiz-input">
              <textarea 
                v-model="submissions[content.id]" 
                class="submission-textarea"
                placeholder="请输入你的答案..."
              />
            </view>
            
            <!-- 提交状态和评分结果 -->
            <view class="submission-status">
              <view v-if="submissionStatuses[content.id]" class="submitted-info">
                <view class="status-row">
                  <text class="status-label">状态:</text>
                  <text class="status-value submitted">已提交</text>
                </view>
                <view v-if="submissionStatuses[content.id].teacher_score !== null" class="score-row">
                  <text class="score-label">得分:</text>
                  <text class="score-value">{{ submissionStatuses[content.id].teacher_score }}/{{ content.points }}</text>
                </view>
                <view v-if="submissionStatuses[content.id].feedback" class="feedback-row">
                  <text class="feedback-label">评语:</text>
                  <text class="feedback-value">{{ submissionStatuses[content.id].feedback }}</text>
                </view>
              </view>
              <view v-else class="submit-actions">
                <view class="submit-btn" @click="submitContent(content.id)">
                  <text>提交答案</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 进度显示 -->
          <view class="progress-info">
            <text class="progress-text">完成进度: {{ getProgressText() }}</text>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: getProgressPercentage() + '%' }"></view>
            </view>
          </view>
        </view>
        
        <!-- 教师视图：管理按钮 -->
        <view v-else class="teacher-content">
          <!-- 教师也可以看到任务内容 -->
          <view class="section-title">任务内容</view>
          
          
          
          <view 
            v-for="(content, index) in taskContents" 
            :key="content.id || index"
            class="content-item teacher-content-item"
          >
            <view class="content-header">
              <text class="content-title">{{ index + 1 }}. {{ getContentTypeLabel(content.content_type) }}</text>
              <text class="content-points">{{ content.points }}分</text>
            </view>
            
            <!-- 任务说明 -->
            <view v-if="content.meta_data?.instructions" class="instructions">
              <text class="instruction-text">{{ content.meta_data.instructions }}</text>
            </view>
            
            <!-- 显示具体的单词和句子内容 -->
            <view class="content-details">
              <!-- 单词列表 -->
              <view v-if="content.selected_words && content.selected_words.length > 0" class="words-section">
                <text class="detail-title">📚 练习单词</text>
                <view class="words-grid">
                  <view 
                    v-for="(word, wordIndex) in content.selected_words" 
                    :key="wordIndex"
                    class="word-item"
                  >
                    <text class="word-text">{{ word.word || word }}</text>
                    <text v-if="word.phonetic || word.uk_phonetic" class="word-phonetic">{{ word.phonetic || word.uk_phonetic }}</text>
                    <text v-if="word.translation || word.chinese" class="word-translation">{{ word.translation || word.chinese }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 如果有单词ID但没有单词数据，显示占位符 -->
              <view v-else-if="content.selected_word_ids && content.selected_word_ids.length > 0" class="words-section">
                <text class="detail-title">📚 练习单词</text>
                <view class="loading-placeholder">
                  <text style="color: #999; font-size: 26rpx;">
                    共 {{ content.selected_word_ids.length }} 个单词，正在加载详情...
                  </text>
                  <view class="word-ids-display" style="margin-top: 10rpx;">
                    <text style="color: #666; font-size: 24rpx;">单词IDs: {{ content.selected_word_ids.join(', ') }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 句子列表 -->
              <view v-if="content.selected_sentences && content.selected_sentences.length > 0" class="sentences-section">
                <text class="detail-title">📝 练习句子</text>
                <view class="sentences-list">
                  <view 
                    v-for="(sentence, sentenceIndex) in content.selected_sentences" 
                    :key="sentenceIndex"
                    class="sentence-item"
                  >
                    <text class="sentence-text">{{ sentence.content || sentence.english || sentence }}</text>
                    <text v-if="sentence.translation || sentence.chinese" class="sentence-translation">{{ sentence.translation || sentence.chinese }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 如果有句子ID但没有句子数据，显示占位符 -->
              <view v-else-if="content.selected_sentence_ids && content.selected_sentence_ids.length > 0" class="sentences-section">
                <text class="detail-title">📝 练习句子</text>
                <view class="loading-placeholder">
                  <text style="color: #999; font-size: 26rpx;">
                    共 {{ content.selected_sentence_ids.length }} 个句子，正在加载详情...
                  </text>
                  <view class="sentence-ids-display" style="margin-top: 10rpx;">
                    <text style="color: #666; font-size: 24rpx;">句子IDs: {{ content.selected_sentence_ids.join(', ') }}</text>
                  </view>
                </view>
              </view>
              
              <!-- 课文内容 -->
              <view v-if="content.lesson_content" class="lesson-section">
                <text class="detail-title">📖 课文内容</text>
                <view class="lesson-content">
                  <text class="lesson-text">{{ content.lesson_content }}</text>
                </view>
              </view>
            </view>
            
            <!-- 教师视图的任务类型说明 -->
            <view class="teacher-task-instructions">
              <view v-if="content.content_type === 'dictation'" class="task-instruction">
                <text class="instruction-label">📝 听写任务：</text>
                <text class="instruction-content">学生需要听音频后输入听到的内容</text>
              </view>
              <view v-else-if="content.content_type === 'spelling'" class="task-instruction">
                <text class="instruction-label">🔤 拼写任务：</text>
                <text class="instruction-content">学生需要正确拼写单词</text>
              </view>
              <view v-else-if="content.content_type === 'pronunciation'" class="task-instruction">
                <text class="instruction-label">🎤 发音任务：</text>
                <text class="instruction-content">学生需要朗读内容并录音</text>
              </view>
              <view v-else-if="content.content_type === 'sentence_repeat'" class="task-instruction">
                <text class="instruction-label">📢 句子跟读：</text>
                <text class="instruction-content">学生需要跟读句子并录音</text>
              </view>
              <view v-else-if="content.content_type === 'quiz'" class="task-instruction">
                <text class="instruction-label">📋 测验任务：</text>
                <text class="instruction-content">学生需要完成相关测验</text>
              </view>
            </view>
          </view>
          
          <view class="section-title" style="margin-top: 40rpx;">任务管理</view>
          
          <view class="stats-card">
            <text class="stats-title">提交统计</text>
            <view class="stats-grid">
              <view class="stat-item">
                <text class="stat-number">{{ taskStats.total_submissions || 0 }}</text>
                <text class="stat-label">总提交</text>
              </view>
              <view class="stat-item">
                <text class="stat-number">{{ taskStats.graded_submissions || 0 }}</text>
                <text class="stat-label">已评分</text>
              </view>
              <view class="stat-item">
                <text class="stat-number">{{ taskStats.pending_submissions || 0 }}</text>
                <text class="stat-label">待评分</text>
              </view>
            </view>
          </view>
          
          <view class="teacher-actions">
            <view class="action-btn" @click="editTask">编辑任务</view>
            <view class="action-btn" @click="viewAllSubmissions">查看提交</view>
            <view class="action-btn delete" @click="deleteTask">删除任务</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import LoadingRound from "@/components/LoadingRound.vue";
import taskRequest from "@/api/task";
import textbook from "@/api/textbook";

const taskId = ref('');
const mode = ref('student');
const task = ref<any>({});
const taskContents = ref<any[]>([]);
const loading = ref(false);
const submissions = ref<any>({});
const submissionStatuses = ref<any>({});
const recording = ref<any>({});
const audioFiles = ref<any>({});
const taskStats = ref<any>({});

const taskTypes = [
  { value: 'dictation', label: '听写' },
  { value: 'spelling', label: '拼写' },
  { value: 'pronunciation', label: '发音' },
  { value: 'sentence_repeat', label: '句子跟读' },
  { value: 'quiz', label: '测验' }
];

const subjects = [
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'science', label: '科学' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'art', label: '美术' },
  { value: 'music', label: '音乐' },
  { value: 'physical_education', label: '体育' },
  { value: 'other', label: '其他' }
];

onLoad((options: any) => {
  taskId.value = options.taskId || '1';
  mode.value = options.mode || 'student';
  loadTask();
  if (mode.value === 'student') {
    loadSubmissions();
  } else {
    loadTaskStats();
  }
});

const handleBack = () => {
  uni.navigateBack({
    delta: 1
  });
};

const loadTask = async () => {
  loading.value = true;
  try {
    const res = await taskRequest.getTaskById(taskId.value);
    task.value = res.data;
    const contents = res.data.contents || [];
    
    // 为每个任务内容获取详细的单词和句子数据
    const enrichedContents = await Promise.all(contents.map(async (content: any) => {
      const enrichedContent = { ...content };
      
      // 如果是自动生成模式且没有选择具体的单词ID，获取整个单元的单词
      if (content.generate_mode === 'auto' && 
          (!content.selected_word_ids || content.selected_word_ids.length === 0) &&
          (content.content_type === 'dictation' || content.content_type === 'spelling' || content.content_type === 'pronunciation')) {
        try {
          const bookId = content.ref_book_id || task.value.textbook_id?.toString();
          const lessonId = content.ref_lesson_id || task.value.lesson_id;
          
          if (bookId && lessonId) {
            console.log('自动模式：获取单元所有单词', bookId, lessonId);
            const wordsRes = await textbook.getLessonWords(bookId, String(lessonId));
            
            if (wordsRes.code === 1000 && wordsRes.data) {
              enrichedContent.selected_words = Array.isArray(wordsRes.data) ? wordsRes.data : wordsRes.data.words || [];
              console.log('获取到单词数量:', enrichedContent.selected_words.length);
            } else {
              console.error('获取单元单词失败:', wordsRes);
              enrichedContent.selected_words = [];
            }
          }
        } catch (error) {
          console.error('获取单元单词失败:', error);
          enrichedContent.selected_words = [];
        }
      }
      // 获取指定的单词详情
      else if (content.selected_word_ids && content.selected_word_ids.length > 0) {
        try {
          const bookId = content.ref_book_id || task.value.textbook_id?.toString();
          if (bookId) {
            const wordsRes = await textbook.getWordsDetail(bookId, content.selected_word_ids.map(String));
            
            // 检查API响应格式
            if (wordsRes.code === 1000 && wordsRes.data) {
              enrichedContent.selected_words = wordsRes.data.words || wordsRes.data || [];
              console.log('获取到单词数据:', enrichedContent.selected_words);
            } else {
              console.error('API响应格式不正确:', wordsRes);
              enrichedContent.selected_words = [];
            }
          } else {
            // 尝试使用任务ID获取单词
            if (task.value.id) {
              console.log('使用任务ID获取单词详情，task_id:', task.value.id);
              try {
                const wordsRes = await textbook.getTaskWords(task.value.id);
                if (wordsRes.code === 1000 && wordsRes.data) {
                  enrichedContent.selected_words = wordsRes.data.words || wordsRes.data || [];
                  console.log('获取到单词数据（通过任务ID）:', enrichedContent.selected_words);
                } else {
                  enrichedContent.selected_words = [];
                }
              } catch (taskError) {
                console.error('通过任务ID获取单词失败:', taskError);
                enrichedContent.selected_words = [];
              }
            } else {
              console.error('缺少bookId和taskId，无法获取单词详情');
              enrichedContent.selected_words = [];
            }
          }
        } catch (error: any) {
          console.error('获取单词详情失败:', error);
          enrichedContent.selected_words = [];
        }
      }
      
      // 如果是自动生成模式且没有选择具体的句子ID，获取整个单元的句子
      if (content.generate_mode === 'auto' && 
          (!content.selected_sentence_ids || content.selected_sentence_ids.length === 0) &&
          content.content_type === 'sentence_repeat') {
        try {
          const bookId = content.ref_book_id || task.value.textbook_id?.toString();
          const lessonId = content.ref_lesson_id || task.value.lesson_id;
          
          if (bookId && lessonId) {
            console.log('自动模式：获取单元所有句子', bookId, lessonId);
            const sentencesRes = await textbook.getLessonSentences(bookId, String(lessonId));
            
            if (sentencesRes.code === 1000 && sentencesRes.data) {
              enrichedContent.selected_sentences = Array.isArray(sentencesRes.data) ? sentencesRes.data : sentencesRes.data.sentences || [];
              console.log('获取到句子数量:', enrichedContent.selected_sentences.length);
            } else {
              console.error('获取单元句子失败:', sentencesRes);
              enrichedContent.selected_sentences = [];
            }
          }
        } catch (error) {
          console.error('获取单元句子失败:', error);
          enrichedContent.selected_sentences = [];
        }
      }
      // 获取指定的句子详情
      else if (content.selected_sentence_ids && content.selected_sentence_ids.length > 0) {
        try {
          // 优先使用 task_id 获取句子（推荐方式）
          if (task.value.id) {
            console.log('使用任务ID获取句子详情，task_id:', task.value.id);
            const sentencesRes = await textbook.getTaskSentences(task.value.id);
            if (sentencesRes.code === 1000 && sentencesRes.data) {
              enrichedContent.selected_sentences = sentencesRes.data.sentences || sentencesRes.data || [];
              console.log('获取到句子数据（通过任务ID）:', enrichedContent.selected_sentences);
            } else {
              enrichedContent.selected_sentences = [];
            }
          } else {
            // 降级方案：使用句子ID列表
            const bookId = content.ref_book_id || task.value.textbook_id?.toString();
            if (bookId) {
              // 有bookId时使用原API
              const sentencesRes = await textbook.getSentencesDetail(bookId, content.selected_sentence_ids);
              if (sentencesRes.code === 1000 && sentencesRes.data) {
                enrichedContent.selected_sentences = sentencesRes.data.sentences || sentencesRes.data || [];
                console.log('获取到句子数据（通过bookId）:', enrichedContent.selected_sentences);
              } else {
                enrichedContent.selected_sentences = [];
              }
            } else {
              // 没有bookId时使用新API
              console.log('使用句子IDs获取句子详情，句子IDs:', content.selected_sentence_ids);
              const sentencesRes = await textbook.getSentencesDetailByIds(content.selected_sentence_ids);
              if (sentencesRes.code === 1000 && sentencesRes.data) {
                enrichedContent.selected_sentences = sentencesRes.data.sentences || sentencesRes.data || [];
                console.log('获取到句子数据（通过IDs）:', enrichedContent.selected_sentences);
              } else {
                enrichedContent.selected_sentences = [];
              }
            }
          }
        } catch (error: any) {
          console.error('获取句子详情失败:', error);
          
          // 如果没有专门的句子详情API，尝试从课程句子中过滤
          if (content.ref_lesson_id) {
            try {
              const bookId = content.ref_book_id || task.value.textbook_id?.toString();
              const lessonSentencesRes = await textbook.getLessonSentences(bookId, content.ref_lesson_id.toString());
              const allSentences = lessonSentencesRes.data.sentences || [];
              enrichedContent.selected_sentences = allSentences.filter((sentence: any) => 
                content.selected_sentence_ids.includes(sentence.id)
              );
            } catch (lessonError: any) {
              console.error('获取课程句子失败:', lessonError);
              enrichedContent.selected_sentences = [];
            }
          } else {
            enrichedContent.selected_sentences = [];
          }
        }
      }
      
      return enrichedContent;
    }));
    
    taskContents.value = enrichedContents;
    loading.value = false;
  } catch (error) {
    console.error('加载任务失败:', error);
    uni.showToast({
      title: '加载任务失败',
      icon: 'error'
    });
    loading.value = false;
  }
};

const loadSubmissions = async () => {
  if (mode.value !== 'student') return;
  
  try {
    const res = await taskRequest.getTaskSubmissions(taskId.value, {
      page: 1,
      page_size: 50
    });
    
    // 处理提交数据
    const submissionsData = res.data.submissions || [];
    submissionsData.forEach((submission: any) => {
      submissionStatuses.value[submission.content_id] = {
        id: submission.id,
        response: submission.response,
        teacher_score: submission.teacher_score,
        feedback: submission.feedback,
        is_correct: submission.is_correct,
        submitted_at: submission.created_at
      };
    });
  } catch (error) {
    console.error('加载提交记录失败:', error);
  }
};

const loadTaskStats = async () => {
  if (mode.value !== 'teacher') return;
  
  try {
    // 分页获取所有提交记录
    let allSubmissions: any[] = [];
    let currentPage = 1;
    let hasMore = true;
    
    while (hasMore) {
      const res = await taskRequest.getTaskSubmissions(taskId.value, {
        page: currentPage,
        page_size: 100 // 使用服务器允许的最大值
      });
      
      const submissions = res.data.submissions || [];
      allSubmissions = allSubmissions.concat(submissions);
      
      // 如果返回的数据少于100条，说明已经是最后一页
      hasMore = submissions.length === 100;
      currentPage++;
      
      // 防止无限循环，最多获取1000条记录
      if (currentPage > 10) break;
    }
    
    taskStats.value = {
      total_submissions: allSubmissions.length,
      graded_submissions: allSubmissions.filter((s: any) => s.teacher_score !== null).length,
      pending_submissions: allSubmissions.filter((s: any) => s.teacher_score === null).length
    };
  } catch (error) {
    console.error('加载任务统计失败:', error);
    // 使用模拟数据
    taskStats.value = {
      total_submissions: 15,
      graded_submissions: 12,
      pending_submissions: 3
    };
  }
};

const getTaskTypeLabel = (type: string) => {
  const taskType = taskTypes.find(t => t.value === type);
  return taskType ? taskType.label : type;
};

const getSubjectLabel = (subject: string) => {
  const subjectItem = subjects.find(s => s.value === subject);
  return subjectItem ? subjectItem.label : subject;
};

const getTaskStatusClass = () => {
  const deadline = task.value.deadline || '2025-01-10T18:00:00Z';
  if (new Date(deadline) < new Date()) {
    return 'overdue';
  }
  return 'active';
};

const getTaskStatusText = () => {
  const deadline = task.value.deadline || '2025-01-10T18:00:00Z';
  if (new Date(deadline) < new Date()) {
    return '已过期';
  }
  return '进行中';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getContentTypeLabel = (type: string) => {
  const contentTypes = [
    { value: 'dictation', label: '听写内容' },
    { value: 'spelling', label: '拼写内容' },
    { value: 'pronunciation', label: '发音内容' },
    { value: 'sentence_repeat', label: '跟读内容' },
    { value: 'quiz', label: '测验内容' }
  ];
  const contentType = contentTypes.find(t => t.value === type);
  return contentType ? contentType.label : type;
};

const toggleRecording = (contentId: string) => {
  if (recording.value[contentId]) {
    // 停止录音
    recording.value[contentId] = false;
    // 模拟录音完成
    audioFiles.value[contentId] = { url: 'temp_audio_file' };
    submissions.value[contentId] = 'audio_recording_' + Date.now();
  } else {
    // 开始录音
    recording.value[contentId] = true;
  }
};

const playAudio = (contentId: string) => {
  uni.showToast({ title: '播放录音', icon: 'none' });
};

const submitContent = async (contentId: string) => {
  let response = '';
  
  if (submissions.value[contentId]) {
    response = submissions.value[contentId];
  } else if (audioFiles.value[contentId]) {
    response = audioFiles.value[contentId].url;
  }
  
  if (!response) {
    uni.showToast({ title: '请完成答题', icon: 'none' });
    return;
  }
  
  try {
    uni.showLoading({ title: '提交中...' });
    
    const res = await taskRequest.createSubmission(taskId.value, {
      content_id: contentId,
      response: response,
      media_files: audioFiles.value[contentId] ? [audioFiles.value[contentId].url] : []
    });
    
    // 更新提交状态
    submissionStatuses.value[contentId] = {
      id: res.data.id,
      response: response,
      teacher_score: null,
      feedback: null,
      is_correct: null,
      submitted_at: new Date().toISOString()
    };
    
    uni.hideLoading();
    uni.showToast({ title: '提交成功' });
  } catch (error: any) {
    uni.hideLoading();
    console.error('提交失败:', error);
    uni.showToast({ 
      title: error.message || '提交失败', 
      icon: 'none' 
    });
  }
};

const getProgressText = () => {
  const total = taskContents.value.length;
  const completed = Object.keys(submissionStatuses.value).length;
  return `${completed}/${total}`;
};

const getProgressPercentage = () => {
  const total = taskContents.value.length;
  const completed = Object.keys(submissionStatuses.value).length;
  return total > 0 ? (completed / total) * 100 : 0;
};

const editTask = () => {
  uni.navigateTo({
    url: `/pages/task/create?taskId=${taskId.value}&mode=edit`
  });
};

const viewAllSubmissions = () => {
  uni.navigateTo({
    url: `/pages/task/submissions?taskId=${taskId.value}`
  });
};

const deleteTask = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个任务吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await taskRequest.deleteTask(taskId.value);
          uni.showToast({ title: '删除成功' });
          uni.navigateBack();
        } catch (error) {
          console.error('删除失败:', error);
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
}

.task-info {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  
  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16rpx;
    
    .task-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
      flex: 1;
    }
    
    .task-status {
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
      
      &.active {
        background: #E8F5E8;
        color: #52C41A;
      }
      
      &.overdue {
        background: #FFF2F0;
        color: #FF4D4F;
      }
    }
  }
  
  .task-desc {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
    margin-bottom: 24rpx;
  }
  
  .task-meta {
    .meta-item {
      display: flex;
      margin-bottom: 12rpx;
      
      .meta-label {
        font-size: 26rpx;
        color: #999;
        width: 160rpx;
      }
      
      .meta-value {
        font-size: 26rpx;
        color: #333;
        flex: 1;
      }
    }
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.content-details {
  margin: 24rpx 0;
  
  .detail-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .words-section, .sentences-section, .lesson-section {
    margin-bottom: 24rpx;
    padding: 20rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
  }
  
  .words-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    
    .word-item {
      background: white;
      border-radius: 8rpx;
      padding: 16rpx;
      min-width: 160rpx;
      border: 1px solid #e8e8e8;
      
      .word-text {
        font-size: 30rpx;
        font-weight: 600;
        color: #333;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .word-phonetic {
        font-size: 24rpx;
        color: #666;
        display: block;
        margin-bottom: 4rpx;
        font-style: italic;
      }
      
      .word-translation {
        font-size: 24rpx;
        color: #52C41A;
        display: block;
      }
    }
  }
  
  .sentences-list {
    .sentence-item {
      background: white;
      border-radius: 8rpx;
      padding: 20rpx;
      margin-bottom: 16rpx;
      border: 1px solid #e8e8e8;
      
      .sentence-text {
        font-size: 28rpx;
        color: #333;
        line-height: 1.6;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .sentence-translation {
        font-size: 24rpx;
        color: #52C41A;
        display: block;
        font-style: italic;
      }
    }
  }
  
  .lesson-content {
    background: white;
    border-radius: 8rpx;
    padding: 20rpx;
    border: 1px solid #e8e8e8;
    
    .lesson-text {
      font-size: 28rpx;
      color: #333;
      line-height: 1.8;
         }
   }
   
   .loading-placeholder {
     padding: 20rpx;
     background: #f8f9fa;
     border-radius: 8rpx;
     border: 1px dashed #ddd;
     text-align: center;
     
     .word-ids-display, .sentence-ids-display {
       padding: 10rpx;
       background: white;
       border-radius: 4rpx;
       margin-top: 10rpx;
       font-family: monospace;
       overflow: hidden;
       text-overflow: ellipsis;
       white-space: nowrap;
     }
   }
 }

.student-content {
  .content-item {
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    
    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;
      
      .content-title {
        font-size: 28rpx;
        font-weight: 600;
        color: #333;
      }
      
      .content-points {
        font-size: 24rpx;
        color: #4B7EFE;
        font-weight: 600;
      }
    }
    
    .submission-textarea {
      width: 100%;
      min-height: 200rpx;
      padding: 24rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 24rpx;
    }
    
    .submission-status {
      .submitted-info {
        .status-row {
          margin-bottom: 8rpx;
          
          .status-label {
            font-size: 26rpx;
            color: #999;
          }
          
          .status-value {
            font-size: 26rpx;
            color: #333;
            font-weight: 600;
          }
        }
        
        .score-row {
          margin-bottom: 8rpx;
          
          .score-label {
            font-size: 26rpx;
            color: #999;
          }
          
          .score-value {
            font-size: 26rpx;
            color: #333;
            font-weight: 600;
          }
        }
        
        .feedback-row {
          margin-bottom: 8rpx;
          
          .feedback-label {
            font-size: 26rpx;
            color: #999;
          }
          
          .feedback-value {
            font-size: 26rpx;
            color: #333;
            font-weight: 600;
          }
        }
      }
      
      .submit-actions {
        .submit-btn {
          text-align: center;
          padding: 24rpx;
          background: #4B7EFE;
          color: white;
          border-radius: 12rpx;
          font-size: 28rpx;
          font-weight: 600;
        }
      }
    }
  }
  
  .progress-info {
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    
    .progress-text {
      font-size: 28rpx;
      color: #333;
      margin-bottom: 16rpx;
    }
    
    .progress-bar {
      height: 8rpx;
      background: #f0f0f0;
      border-radius: 4rpx;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: #4B7EFE;
        transition: width 0.3s;
      }
    }
  }
}

.teacher-content {
  .teacher-content-item {
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    border-left: 4rpx solid #722ED1;
    
    .teacher-task-instructions {
      margin-top: 24rpx;
      padding: 16rpx;
      background: #f6f8fa;
      border-radius: 8rpx;
      border-left: 4rpx solid #722ED1;
      
      .task-instruction {
        display: flex;
        align-items: flex-start;
        gap: 8rpx;
        
        .instruction-label {
          font-size: 26rpx;
          font-weight: 600;
          color: #722ED1;
          white-space: nowrap;
        }
        
        .instruction-content {
          font-size: 26rpx;
          color: #333;
          line-height: 1.5;
        }
      }
    }
  }
  
  .stats-card {
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    
    .stats-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 24rpx;
    }
    
    .stats-grid {
      display: flex;
      justify-content: space-around;
      
      .stat-item {
        text-align: center;
        
        .stat-number {
          display: block;
          font-size: 48rpx;
          font-weight: 600;
          color: #4B7EFE;
          margin-bottom: 8rpx;
        }
        
        .stat-label {
          font-size: 24rpx;
          color: #666;
        }
      }
    }
  }
  
  .teacher-actions {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    
    .action-btn {
      background: white;
      text-align: center;
      padding: 32rpx;
      border-radius: 12rpx;
      font-size: 28rpx;
      color: #333;
      
      &.delete {
        background: #FFF2F0;
        color: #FF4D4F;
      }
    }
  }
}

.dictation-input, .spelling-input, .pronunciation-input, .sentence-repeat-input, .quiz-input {
  .instructions {
    margin-bottom: 16rpx;
    padding: 16rpx;
    background: #e6f7ff;
    border-radius: 8rpx;
    
    .instruction-text {
      font-size: 26rpx;
      color: #1890ff;
      font-weight: 500;
    }
  }
  
  .spelling-input-field {
    width: 100%;
    padding: 24rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    font-size: 32rpx;
    color: #333;
    text-align: center;
    font-weight: 600;
    border: 2rpx solid #e8e8e8;
    
    &:focus {
      border-color: #4B7EFE;
    }
  }
}

.audio-input {
  .record-section {
    text-align: center;
    
    .record-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 32rpx;
      background: #4B7EFE;
      color: white;
      border-radius: 50%;
      width: 160rpx;
      height: 160rpx;
      flex-direction: column;
      margin-bottom: 16rpx;
      
      &.recording {
        background: #ff4d4f;
        animation: pulse 1s infinite;
      }
      
      .record-icon {
        font-size: 48rpx;
        margin-bottom: 8rpx;
      }
      
      .record-text {
        font-size: 22rpx;
      }
    }
    
    .audio-preview {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16rpx;
      
      .preview-text {
        font-size: 26rpx;
        color: #52C41A;
      }
      
      .replay-btn {
        font-size: 24rpx;
        color: #4B7EFE;
        padding: 8rpx 16rpx;
        background: #f0f8ff;
        border-radius: 8rpx;
      }
    }
  }
}

.file-input {
  .upload-section {
    .upload-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32rpx;
      border: 2rpx dashed #d9d9d9;
      border-radius: 12rpx;
      background: #fafafa;
      margin-bottom: 16rpx;
      
      .upload-icon {
        font-size: 32rpx;
        margin-right: 12rpx;
      }
      
      .upload-text {
        font-size: 26rpx;
        color: #666;
      }
    }
    
    .file-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16rpx;
      background: #f0f8ff;
      border-radius: 8rpx;
      
      .file-name {
        font-size: 24rpx;
        color: #333;
      }
      
      .file-remove {
        font-size: 22rpx;
        color: #ff4d4f;
        padding: 4rpx 8rpx;
      }
    }
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>