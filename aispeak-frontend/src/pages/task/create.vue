<template>
  <view class="container">
    <CommonHeader :leftIcon="true" :title="mode === 'edit' ? '编辑任务' : '创建任务'" />
    
    <view class="content">
      <!-- 标题区域 -->
      <view class="header-section">
        <text class="page-title">{{ mode === 'edit' ? '编辑任务' : '创建任务' }}</text>
        <text class="page-subtitle">为班级学生创建学习任务</text>
      </view>

      <!-- 任务创建表单 -->
      <view class="card">
        <view class="card-content">
          <text class="card-title">快速创建任务</text>
          
          <!-- 班级选择 -->
          <view class="form-group">
            <text class="form-label">选择班级 *</text>
            <view v-if="classes.length === 0" class="empty-state">
              <view class="empty-icon">🏫</view>
              <view class="empty-title">您还没有创建任何班级</view>
              <view class="empty-desc">创建任务前需要先创建班级</view>
              <view class="empty-action" @click="goToCreateClass">
                <text>+ 创建班级</text>
              </view>
            </view>
            <picker 
              v-else
              :value="classIndex" 
              :range="classes" 
              range-key="name"
              @change="onClassChange"
            >
              <view class="picker-display">
                <text>{{ classes[classIndex]?.name || '请选择班级' }}</text>
                <text class="picker-icon">▼</text>
              </view>
            </picker>
          </view>

          <!-- 任务类型 -->
          <view class="form-group">
            <text class="form-label">任务类型 *</text>
            <view class="task-type-grid">
              <view 
                v-for="(type, index) in taskTypes" 
                :key="type.value"
                class="type-card"
                :class="{ active: taskTypeIndex === index }"
                @click="selectTaskType(index)"
              >
                <text class="type-icon">{{ type.icon }}</text>
                <text class="type-name">{{ type.label }}</text>
                <text class="type-desc">{{ type.description }}</text>
              </view>
            </view>
          </view>

          <!-- 任务标题 -->
          <view class="form-group">
            <text class="form-label">任务标题 *</text>
            <view class="input-wrapper">
              <textarea
                v-model="form.title"
                class="form-input"
                placeholder="如：Unit 1 听写练习"
                placeholder-style="color: #999"
                :maxlength="50"
                auto-height
                :show-confirm-bar="false"
                @focus="onTitleFocus"
              />
            </view>
          </view>

          <!-- 截止时间 -->
          <view class="form-group">
            <text class="form-label">截止时间 *</text>
            <view class="datetime-row">
              <view class="datetime-item">
                <picker 
                  mode="date" 
                  :value="deadlineDate"
                  @change="onDeadlineDateChange"
                >
                  <view class="picker-display">
                    <text>{{ deadlineDate || '选择日期' }}</text>
                    <text class="picker-icon">📅</text>
                  </view>
                </picker>
              </view>
              <view class="datetime-item">
                <picker 
                  mode="time" 
                  :value="deadlineTime"
                  @change="onDeadlineTimeChange"
                >
                  <view class="picker-display">
                    <text>{{ deadlineTime || '选择时间' }}</text>
                    <text class="picker-icon">🕐</text>
                  </view>
                </picker>
              </view>
            </view>
          </view>

          <!-- 内容输入方式选择（只有教材模块开启时才显示） -->
          <view v-if="showTextbookModule" class="form-group">
            <text class="form-label">内容来源 *</text>
            <view class="input-mode-tabs">
              <view 
                class="mode-tab"
                :class="{ active: inputMode === 'search' }"
                @click="inputMode = 'search'"
              >
                <text class="mode-icon">🔍</text>
                <text>搜索内容</text>
              </view>
              <view 
                class="mode-tab"
                :class="{ active: inputMode === 'textbook' }"
                @click="inputMode = 'textbook'"
              >
                <text class="mode-icon">📚</text>
                <text>选择教材</text>
              </view>
            </view>
          </view>

          <!-- 关键词搜索区域 -->
          <view v-if="inputMode === 'search' || !showTextbookModule" class="form-group">
            <text class="form-label">搜索{{ needsWordContent ? '单词' : '句子' }}</text>
            <view class="search-container">
              <view class="search-input-wrapper">
                <input
                  v-model="searchKeyword"
                  class="search-input"
                  :placeholder="`输入关键词搜索${needsWordContent ? '单词' : '句子'}`"
                  @confirm="performSearch"
                />
                <view v-if="searchLoading" class="search-loading-icon">
                  <text>⏳</text>
                </view>
              </view>
              
              <!-- 搜索提示 -->
              <view v-if="searchKeyword && searchResults.length === 0 && !searchLoading" class="search-empty">
                <text class="empty-icon">🔍</text>
                <text class="empty-text">没有找到"{{ searchKeyword }}"相关的{{ needsWordContent ? '单词' : '句子' }}</text>
                <text class="empty-hint">请尝试其他关键词</text>
              </view>
              
              <!-- 搜索结果 -->
              <view v-if="searchResults.length > 0" class="search-results">
                <text class="results-title">搜索结果</text>
                <scroll-view class="results-scroll" scroll-y>
                  <view 
                    v-for="(item, index) in searchResults" 
                    :key="index"
                    class="result-item"
                    @click="toggleItemSelection(item)"
                  >
                    <view class="result-content">
                      <text class="result-main">{{ needsWordContent ? item.word : item.english }}</text>
                      <text class="result-sub">{{ needsWordContent ? item.chinese_meaning : item.chinese }}</text>
                    </view>
                    <view v-if="isItemSelected(item)" class="selected-mark">✓</view>
                  </view>
                </scroll-view>
              </view>
              
              <!-- 已选择的内容 -->
              <view v-if="selectedItems.length > 0" class="selected-section">
                <text class="selected-title">已选择 ({{ selectedItems.length }})</text>
                <view class="selected-list">
                  <view 
                    v-for="(item, index) in selectedItems" 
                    :key="index"
                    class="selected-item"
                  >
                    <text class="selected-text">{{ needsWordContent ? item.word : item.english }}</text>
                    <view class="remove-btn" @click="removeSelectedItem(index)">×</view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 教材选择 -->
          <view v-if="inputMode === 'textbook' && showTextbookModule" class="form-group">
            <text class="form-label">关联教材 *</text>
            <view class="textbook-selector" @click="showTextbookSelector">
              <view class="selector-display">
                <text v-if="selectedTextbook">{{ selectedTextbook.book_name }} ({{ selectedTextbook.grade }}年级)</text>
                <text v-else class="placeholder">点击选择教材</text>
                <text class="selector-icon">📚</text>
              </view>
            </view>
          </view>
          
          <!-- 单元选择 -->
          <view v-if="chapters.length > 0 && inputMode === 'textbook' && showTextbookModule" class="form-group">
            <text class="form-label">选择单元 *</text>
            <picker 
              :value="chapterIndex" 
              :range="chapters" 
              range-key="title"
              @change="onChapterChange"
            >
              <view class="picker-display">
                <text>{{ chapters[chapterIndex]?.title || '请选择单元' }}</text>
                <text class="picker-icon">▼</text>
              </view>
            </picker>
          </view>
          
          <!-- 内容预览区域 -->
          <view v-if="form.lesson_id && needsWordContent && inputMode === 'textbook' && showTextbookModule" class="form-group">
            <text class="form-label">单词预览 ({{ lessonWords.length }}个)</text>
            <view class="content-preview">
              <view v-if="loadingWords" class="preview-loading">
                <text>加载中...</text>
              </view>
              <view v-else-if="lessonWords.length > 0" class="word-list">
                <view v-for="(word, index) in lessonWords" :key="index" class="word-item">
                  <text class="word-text">{{ word.word }}</text>
                  <text class="word-meaning">{{ word.chinese || word.chinese_meaning || word.translation }}</text>
                </view>
              </view>
              <view v-else class="preview-empty">
                <text class="empty-icon">📝</text>
                <text>该单元暂无单词，无法创建{{ taskTypes[taskTypeIndex].label }}任务</text>
              </view>
            </view>
          </view>
          
          <view v-if="form.lesson_id && needsSentenceContent && inputMode === 'textbook' && showTextbookModule" class="form-group">
            <text class="form-label">句子预览 ({{ lessonSentences.length }}个)</text>
            <view class="content-preview">
              <view v-if="loadingSentences" class="preview-loading">
                <text>加载中...</text>
              </view>
              <view v-else-if="lessonSentences.length > 0" class="sentence-list">
                <view v-for="(sentence, index) in lessonSentences" :key="index" class="sentence-item">
                  <text class="sentence-text">{{ sentence.english }}</text>
                  <text class="sentence-meaning">{{ sentence.chinese }}</text>
                </view>
              </view>
              <view v-else class="preview-empty">
                <text class="empty-icon">💬</text>
                <text>该单元暂无句子，无法创建{{ taskTypes[taskTypeIndex].label }}任务</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 教材选择器弹窗 -->
      <view v-if="showTextbookPopup" class="textbook-popup">
        <BookSelector 
          :books="allTextbooks"
          :numType="2"
          @switchbookSuccess="onTextbookSelect" 
          @closePopup="closeTextbookSelector"
        />
      </view>
      
      <!-- 底部按钮 -->
      <view class="bottom-actions">
        <view class="button-row">
          <view class="btn btn-secondary" @click="cancel">取消</view>
          <view 
            class="btn btn-primary"
            :class="{ disabled: !canSubmit }"
            @click="submit"
          >
            {{ mode === 'edit' ? '更新任务' : '创建任务' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import BookSelector from "@/pages/textbook/bookSelector.vue";
import taskRequest from "@/api/task";
import textbookRequest from "@/api/textbook";
import { isFeatureEnabled, loadFeatures } from "@/config/features";

// 移除了教材选择器hook，改用BookSelector组件

const mode = ref('create');
const inputMode = ref<'textbook' | 'search'>('search'); // 默认搜索模式
const showTextbookModule = ref(false); // 是否显示教材模块
const taskId = ref('');
const showTextbookPopup = ref(false);
const selectedTextbook = ref<any>(null);
const allTextbooks = ref<any[]>([]);
const loadingTextbooks = ref(false);

// 创建一个独立的标题响应式变量
const titleInput = ref('');


// 搜索相关数据
const searchKeyword = ref('');
const searchResults = ref<any[]>([]);
const selectedItems = ref<any[]>([]);
const searchLoading = ref(false);
const searchType = ref<'word' | 'sentence'>('word');
let searchTimer: any = null;

const form = ref({
  title: '',
  description: '',
  task_type: '',
  subject: 'english',
  class_id: 0,
  deadline: '',
  allow_late_submission: false,
  max_attempts: 0,
  grading_criteria: '',
  textbook_id: '',
  lesson_id: '',
  attachments: null as any,  // 应该是对象或null，不是数组
  contents: [] as any[]
});

const taskTypes = ref([
  { 
    value: 'dictation', 
    label: '听写', 
    icon: '✍️',
    description: '听音频写单词',
    contentType: 'word'  // 需要单词
  },
  { 
    value: 'spelling', 
    label: '背单词', 
    icon: '🔤',
    description: '学、练、拼背单词',
    contentType: 'word'  // 需要单词
  },
  { 
    value: 'pronunciation', 
    label: '发音', 
    icon: '🎤',
    description: '朗读单词或句子',
    contentType: 'word'  // 主要是单词
  },
  { 
    value: 'sentence_repeat', 
    label: '跟读', 
    icon: '🔄',
    description: '跟读句子练习',
    contentType: 'sentence'  // 需要句子
  }
]);

const subjects = ref([
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' }
]);

// 移除了任务模板相关代码

const taskTypeIndex = ref(-1);
const subjectIndex = ref(0);
const classIndex = ref(-1);
const textbookIndex = ref(-1);
const deadlineDate = ref('');
const deadlineTime = ref('');
const classes = ref<any[]>([]);
const chapters = ref<any[]>([]);
const chapterIndex = ref(-1);

// 内容预览相关
const lessonWords = ref<any[]>([]);
const lessonSentences = ref<any[]>([]);
const loadingWords = ref(false);
const loadingSentences = ref(false);

// 移除了allBooks计算属性，改用BookSelector组件处理

// 根据任务类型判断需要的内容
const needsWordContent = computed(() => {
  if (taskTypeIndex.value < 0) return false;
  return taskTypes.value[taskTypeIndex.value].contentType === 'word';
});

const needsSentenceContent = computed(() => {
  if (taskTypeIndex.value < 0) return false;
  return taskTypes.value[taskTypeIndex.value].contentType === 'sentence';
});

// 根据任务类型自动设置搜索类型
watch(taskTypeIndex, (newIndex) => {
  if (newIndex >= 0) {
    const taskType = taskTypes.value[newIndex];
    searchType.value = taskType.contentType === 'sentence' ? 'sentence' : 'word';
    // 切换任务类型时清空已选择的项目和搜索
    selectedItems.value = [];
    searchKeyword.value = '';
    searchResults.value = [];
  }
});

// 判断内容是否有效（有单词或句子）
const hasValidContent = computed(() => {
  if (needsWordContent.value) {
    return lessonWords.value.length > 0;
  }
  if (needsSentenceContent.value) {
    return lessonSentences.value.length > 0;
  }
  return true;
});

const canSubmit = computed(() => {
  const baseValid = form.value.title && 
                    form.value.class_id && 
                    form.value.deadline &&
                    taskTypeIndex.value >= 0;
  
  if (inputMode.value === 'search' || !showTextbookModule.value) {
    // 搜索模式
    return baseValid && selectedItems.value.length > 0;
  } else {
    // 教材模式
    return baseValid && 
           form.value.textbook_id &&
           form.value.lesson_id &&
           hasValidContent.value;
  }
});

// 添加监控来调试标题变化
watch(() => form.value.title, (newTitle, oldTitle) => {
  console.log('form.title changed from:', oldTitle, 'to:', newTitle);
  // 同步到 titleInput
  if (titleInput.value !== newTitle) {
    titleInput.value = newTitle;
  }
}, { immediate: true });

// 监控 titleInput 变化并同步到 form.title
watch(titleInput, (newValue, oldValue) => {
  console.log('titleInput changed from:', oldValue, 'to:', newValue);
  if (form.value.title !== newValue) {
    form.value.title = newValue;
  }
}, { immediate: true });

onLoad((options: any) => {
  // 加载功能开关配置
  loadFeatures();
  showTextbookModule.value = isFeatureEnabled('showTextbookModule');
  
  // 如果教材模块被禁用，强制使用搜索模式
  if (!showTextbookModule.value) {
    inputMode.value = 'search';
  }
  // 编辑模式
  if (options.taskId) {
    taskId.value = options.taskId;
    mode.value = options.mode || 'edit';
    // 编辑模式下，loadTask 会负责加载所有数据
    loadTask();
    return; // 编辑模式直接返回，不执行后续初始化
  }
  
  // 创建模式 - 处理从教材页面跳转过来的预填充参数
  if (options.textbook_id) {
    form.value.textbook_id = options.textbook_id;
    // 加载章节信息
    loadChapters(options.textbook_id, options.lesson_id);
  }
  if (options.lesson_id) {
    form.value.lesson_id = options.lesson_id;
  }
  if (options.task_type) {
    form.value.task_type = options.task_type;
    const typeIndex = taskTypes.value.findIndex(t => t.value === options.task_type);
    if (typeIndex !== -1) {
      taskTypeIndex.value = typeIndex;
    }
  }
  if (options.class_id) {
    form.value.class_id = parseInt(options.class_id) || 0;
  }
  if (options.title) {
    form.value.title = decodeURIComponent(options.title);
  }
  
  // 初始化数据
  loadClasses();
  loadTextbooks();
  
  // 设置默认截止时间（明天18:00）
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  deadlineDate.value = tomorrow.toISOString().split('T')[0];
  deadlineTime.value = '18:00';
  updateDeadline();
});

// 页面显示时刷新班级列表
onShow(() => {
  // 重新加载班级列表，以获取最新创建的班级
  loadClasses();
});

// 监听输入模式切换
watch(inputMode, (newMode) => {
  if (newMode === 'search') {
    // 切换到搜索模式时清空教材相关数据
    form.value.textbook_id = '';
    form.value.lesson_id = '';
    lessonWords.value = [];
    lessonSentences.value = [];
  } else {
    // 切换到教材模式时清空搜索相关数据
    searchKeyword.value = '';
    searchResults.value = [];
    selectedItems.value = [];
  }
});

const loadClasses = async () => {
  try {
    const teacherId = uni.getStorageSync('user_id');
    const res = await taskRequest.getTeacherClasses(teacherId);
    classes.value = res.data || [];
    
    // 预选择班级（从教材页面跳转过来或编辑模式）
    if (form.value.class_id && form.value.class_id > 0) {
      const index = classes.value.findIndex((c: any) => c.id === form.value.class_id);
      if (index !== -1) {
        classIndex.value = index;
      }
    } else if (classes.value.length > 0 && mode.value === 'create') {
      // 创建模式下，如果没有预设班级，默认选中第一个班级
      classIndex.value = 0;
      form.value.class_id = classes.value[0].id;
    }
  } catch (error) {
    console.error('加载班级列表失败:', error);
    classes.value = [];
  }
};

const loadTextbooks = async () => {
  if (loadingTextbooks.value) return;
  
  loadingTextbooks.value = true;
  try {
    // 调用API时传入"全部"参数获取所有教材
    const res = await textbookRequest.getTextbooks("全部", "全部", "全部", "全部");
    console.log('教材API返回数据:', res);
    
    // 处理特殊的数据结构：res.data.booklist[0].versions
    if (res && res.data && res.data.booklist && res.data.booklist.length > 0) {
      const versions = res.data.booklist[0].versions || [];
      const textbooks: any[] = [];
      
      // 遍历所有版本，提取教材
      versions.forEach((version: any) => {
        if (version.textbooks && Array.isArray(version.textbooks)) {
          version.textbooks.forEach((book: any) => {
            // 添加版本信息到教材对象
            textbooks.push({
              ...book,
              version_type: version.version_type
            });
          });
        }
      });
      
      allTextbooks.value = textbooks;
      console.log('处理后的教材列表:', allTextbooks.value);
      console.log('教材数量:', allTextbooks.value.length);
    } else {
      console.error('教材数据格式不正确:', res);
      allTextbooks.value = [];
    }
  } catch (error) {
    console.error('加载教材列表失败:', error);
    allTextbooks.value = [];
  } finally {
    loadingTextbooks.value = false;
  }
};

const loadChapters = async (bookId: string, lessonId?: string) => {
  try {
    const res = await textbookRequest.getTextbookChapters(bookId);
    console.log('章节数据:', res);
    chapters.value = res.data.chapters || [];
    
    // 如果有预设的 lesson_id，找到对应的索引
    if (lessonId) {
      const index = chapters.value.findIndex(ch => ch.lesson_id === lessonId);
      if (index !== -1) {
        chapterIndex.value = index;
      }
    }
    
    // 如果默认选中第一个章节，加载内容
    if (chapters.value.length > 0 && chapterIndex.value === -1) {
      chapterIndex.value = 0;
      form.value.lesson_id = String(chapters.value[0].lesson_id);
      console.log('默认选中第一个章节，lesson_id:', form.value.lesson_id);
      // 如果已选择任务类型，加载内容
      if (taskTypeIndex.value >= 0) {
        loadLessonContent();
      }
    }
  } catch (error) {
    console.error('加载章节失败:', error);
  }
};

const loadTask = async () => {
  try {
    const res = await taskRequest.getTaskById(taskId.value);
    const task = res.data;
    console.log('加载任务数据:', task);
    
    // 检查并修正 contents 中的 ref_book_id 不一致问题
    let contents = task.contents || [];
    if (contents.length > 0 && task.textbook_id) {
      contents = contents.map((content: any) => {
        // 如果 ref_book_id 与 textbook_id 不一致，修正它
        if (content.ref_book_id !== task.textbook_id) {
          console.warn(`修正不一致的教材ID: ref_book_id ${content.ref_book_id} -> ${task.textbook_id}`);
          return {
            ...content,
            ref_book_id: task.textbook_id
          };
        }
        return content;
      });
    }
    
    form.value = {
      title: task.title,
      description: task.description || '',
      task_type: task.task_type,
      subject: task.subject,
      class_id: task.class_id,
      deadline: task.deadline,
      allow_late_submission: task.allow_late_submission || false,
      max_attempts: task.max_attempts || 0,
      grading_criteria: task.grading_criteria || '',
      textbook_id: task.textbook_id || '',
      lesson_id: task.lesson_id ? String(task.lesson_id) : '',
      attachments: task.attachments || null,
      contents: contents
    };
    
    // 设置任务类型
    taskTypeIndex.value = taskTypes.value.findIndex(t => t.value === task.task_type);
    subjectIndex.value = subjects.value.findIndex(s => s.value === task.subject);
    
    // 根据任务类型设置搜索类型
    if (taskTypeIndex.value >= 0) {
      searchType.value = taskTypes.value[taskTypeIndex.value].contentType === 'sentence' ? 'sentence' : 'word';
    }
    
    // 设置截止时间
    if (task.deadline) {
      const date = new Date(task.deadline);
      deadlineDate.value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      deadlineTime.value = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 等待班级列表加载完成
    await loadClasses();
    
    // 设置班级索引
    if (task.class_id) {
      const index = classes.value.findIndex((c: any) => c.id === task.class_id);
      if (index !== -1) {
        classIndex.value = index;
      }
    }
    
    // 如果有教材信息，加载教材和章节
    if (task.textbook_id) {
      // 先加载教材列表
      await loadTextbooks();
      
      // 查找并设置教材
      const textbook = allTextbooks.value.find((book: any) => book.book_id === task.textbook_id);
      if (textbook) {
        selectedTextbook.value = textbook;
        
        // 加载章节
        const chaptersRes = await textbookRequest.getTextbookChapters(task.textbook_id);
        chapters.value = chaptersRes.data.chapters || [];
        
        // 设置章节索引
        if (task.lesson_id) {
          const chapterIdx = chapters.value.findIndex(ch => String(ch.lesson_id) === String(task.lesson_id));
          if (chapterIdx !== -1) {
            chapterIndex.value = chapterIdx;
          }
        }
        
        // 加载单元内容（单词或句子）
        if (task.lesson_id && taskTypeIndex.value >= 0) {
          await loadLessonContent();
        }
      }
    }
  } catch (error) {
    console.error('加载任务失败:', error);
    uni.showToast({ title: '加载任务失败', icon: 'none' });
  }
};

// 事件处理
const onTitleInput = (e: any) => {
  console.log('onTitleInput event:', e);
  const value = e.detail?.value || e.target?.value || '';
  console.log('Input value:', value);
  form.value.title = value;
  console.log('form.value.title updated to:', form.value.title);
};

const onTitleInputChange = (value: string) => {
  console.log('onTitleInputChange called with value:', value);
  form.value.title = value;
  console.log('form.value.title updated to:', form.value.title);
};

const onTitleInputChange2 = (e: any) => {
  console.log('onTitleInputChange2 called with event:', e);
  const value = e.detail.value;
  console.log('Input value from event:', value);
  form.value.title = value;
  console.log('form.value.title updated to:', form.value.title);
};

const onTitleFocus = (e: any) => {
  console.log('Title input focused');
};

const onTitleBlur = (e: any) => {
  console.log('Title input blurred, value:', e.detail.value);
  if (e.detail.value) {
    form.value.title = e.detail.value;
  }
};

const onDescriptionInput = (e: any) => {
  form.value.description = e.detail.value;
};

const onMaxAttemptsInput = (e: any) => {
  form.value.max_attempts = parseInt(e.detail.value) || 0;
};

const selectTaskType = (index: number) => {
  console.log('selectTaskType called with index:', index);
  taskTypeIndex.value = index;
  form.value.task_type = taskTypes.value[index].value;
  
  // 自动生成标题（与高级设置模式保持一致）
  const selectedType = taskTypes.value[index];
  console.log('Selected type:', selectedType);
  
  // 如果标题为空或者是其他任务类型的默认标题，则生成新标题
  const isDefaultTitle = form.value.title && form.value.title.endsWith('练习');
  if (!form.value.title || form.value.title === '' || isDefaultTitle) {
    const newTitle = `${selectedType.label}练习`;
    console.log('Generating new title:', newTitle);

    // 同时设置两个变量
    form.value.title = newTitle;
    titleInput.value = newTitle;

    console.log('Generated title assigned to form.value.title:', form.value.title);
    console.log('Generated title assigned to titleInput:', titleInput.value);
  } else {
    console.log('Title already exists, not generating new one:', form.value.title);
  }
  
  // 如果已选择单元，重新加载内容
  if (form.value.lesson_id) {
    loadLessonContent();
  }
};

const onTaskTypeChange = (e: any) => {
  console.log('onTaskTypeChange called with value:', e.detail.value);
  console.log('Current form.title before change:', form.value.title);
  console.log('Current titleInput before change:', titleInput.value);

  taskTypeIndex.value = e.detail.value;
  form.value.task_type = taskTypes.value[e.detail.value].value;

  // 自动生成标题（与快速创建模式保持一致）
  const selectedType = taskTypes.value[e.detail.value];
  console.log('Selected type:', selectedType);

  // 如果标题为空或者是其他任务类型的默认标题，则生成新标题
  const isDefaultTitle = form.value.title && form.value.title.endsWith('练习');
  if (!form.value.title || form.value.title === '' || isDefaultTitle) {
    const newTitle = `${selectedType.label}练习`;
    console.log('Generating new title:', newTitle);

    // 同时设置两个变量
    form.value.title = newTitle;
    titleInput.value = newTitle;

    console.log('Generated title assigned to form.value.title:', form.value.title);
    console.log('Generated title assigned to titleInput:', titleInput.value);
  } else {
    console.log('Title already exists, not generating new one:', form.value.title);
  }
};

const onClassChange = (e: any) => {
  classIndex.value = e.detail.value;
  form.value.class_id = classes.value[e.detail.value].id;
};

// 移除了快速教材选择方法，改用教材选择器组件

const onChapterChange = (e: any) => {
  chapterIndex.value = e.detail.value;
  if (chapters.value[e.detail.value]) {
    // 确保 lesson_id 是字符串类型
    const lessonId = chapters.value[e.detail.value].lesson_id;
    form.value.lesson_id = String(lessonId);
    console.log('选中章节:', chapters.value[e.detail.value], 'lesson_id:', form.value.lesson_id);
    
    // 重置之前的内容
    lessonWords.value = [];
    lessonSentences.value = [];
    
    // 加载单元内容
    if (taskTypeIndex.value >= 0) {
      loadLessonContent();
    }
  }
};

// 加载单元内容（单词和句子）
const loadLessonContent = async () => {
  if (!form.value.textbook_id || !form.value.lesson_id) return;
  
  // 根据任务类型加载相应内容
  if (needsWordContent.value) {
    loadLessonWords();
  }
  
  if (needsSentenceContent.value) {
    loadLessonSentences();
  }
};

// 加载单词
const loadLessonWords = async () => {
  if (!form.value.textbook_id || !form.value.lesson_id) {
    console.log('缺少教材ID或单元ID，无法加载单词');
    return;
  }
  
  loadingWords.value = true;
  try {
    console.log('正在加载单词，教材ID:', form.value.textbook_id, '单元ID:', form.value.lesson_id);
    const res = await textbookRequest.getLessonWords(form.value.textbook_id, form.value.lesson_id);
    console.log('单词数据响应:', res);
    
    if (res.data) {
      // 处理可能的不同数据结构
      if (Array.isArray(res.data)) {
        lessonWords.value = res.data;
      } else if (res.data.words && Array.isArray(res.data.words)) {
        lessonWords.value = res.data.words;
      } else {
        lessonWords.value = [];
      }
    } else {
      lessonWords.value = [];
    }
    console.log('加载到的单词数量:', lessonWords.value.length);
    console.log('单词示例:', lessonWords.value[0]); // 查看单词对象结构
    // 打印所有单词的ID信息，用于调试
    if (lessonWords.value.length > 0) {
      console.log('单词ID字段调试:');
      lessonWords.value.forEach((word: any, index: number) => {
        console.log(`单词${index}:`, {
          id: word.id,
          word_id: word.word_id,
          word: word.word,
          全部字段: Object.keys(word)
        });
      });
    }
  } catch (error) {
    console.error('加载单词失败:', error);
    lessonWords.value = [];
  } finally {
    loadingWords.value = false;
  }
};

// 加载句子
const loadLessonSentences = async () => {
  if (!form.value.textbook_id || !form.value.lesson_id) {
    console.log('缺少教材ID或单元ID，无法加载句子');
    return;
  }
  
  loadingSentences.value = true;
  try {
    console.log('正在加载句子，教材ID:', form.value.textbook_id, '单元ID:', form.value.lesson_id);
    const res = await textbookRequest.getLessonSentences(form.value.textbook_id, form.value.lesson_id);
    console.log('句子数据响应:', res);
    
    if (res.data) {
      // 处理可能的不同数据结构
      if (Array.isArray(res.data)) {
        lessonSentences.value = res.data;
      } else if (res.data.sentences && Array.isArray(res.data.sentences)) {
        lessonSentences.value = res.data.sentences;
      } else {
        lessonSentences.value = [];
      }
    } else {
      lessonSentences.value = [];
    }
    console.log('加载到的句子数量:', lessonSentences.value.length);
  } catch (error) {
    console.error('加载句子失败:', error);
    lessonSentences.value = [];
  } finally {
    loadingSentences.value = false;
  }
};

const onDeadlineDateChange = (e: any) => {
  deadlineDate.value = e.detail.value;
  updateDeadline();
};

const onDeadlineTimeChange = (e: any) => {
  deadlineTime.value = e.detail.value;
  updateDeadline();
};

const onAllowLateSubmissionChange = (e: any) => {
  form.value.allow_late_submission = e.detail.value.length > 0;
};

const updateDeadline = () => {
  if (deadlineDate.value && deadlineTime.value) {
    const datetime = `${deadlineDate.value}T${deadlineTime.value}:00`;
    form.value.deadline = new Date(datetime).toISOString();
  }
};

// 教材选择器相关方法
const showTextbookSelector = async () => {
  // 如果教材列表为空，先加载
  if (allTextbooks.value.length === 0 && !loadingTextbooks.value) {
    await loadTextbooks();
  }
  
  // 确保有数据后再显示选择器
  if (allTextbooks.value.length > 0) {
    showTextbookPopup.value = true;
  } else {
    uni.showToast({ title: '暂无教材数据', icon: 'none' });
  }
};

const closeTextbookSelector = () => {
  showTextbookPopup.value = false;
};

const onTextbookSelect = async (book: any) => {
  console.log('选中的教材:', book);
  selectedTextbook.value = book;
  form.value.textbook_id = book.book_id;
  
  // 重置章节和内容
  chapters.value = [];
  chapterIndex.value = -1;
  form.value.lesson_id = '';
  lessonWords.value = [];
  lessonSentences.value = [];
  
  // 加载章节信息
  try {
    const res = await textbookRequest.getTextbookChapters(book.book_id);
    console.log('教材章节数据:', res);
    chapters.value = res.data.chapters || [];
    
    // 默认选择第一个章节
    if (chapters.value.length > 0) {
      chapterIndex.value = 0;
      form.value.lesson_id = String(chapters.value[0].lesson_id);
      console.log('教材选择后默认选中第一个章节，lesson_id:', form.value.lesson_id);
      
      // 如果已选择任务类型，加载对应内容
      if (taskTypeIndex.value >= 0) {
        await loadLessonContent();
      }
    }
  } catch (error) {
    console.error('加载章节失败:', error);
    uni.showToast({ title: '加载章节失败', icon: 'none' });
  }
  
  closeTextbookSelector();
};

// 移除了模板选择方法

const goToCreateClass = () => {
  uni.navigateTo({ url: '/pages/class/create' });
};

// 搜索相关方法
const performSearch = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    return;
  }
  
  searchLoading.value = true;
  try {
    const res = await taskRequest.searchContent({
      keyword: searchKeyword.value,
      type: searchType.value
    });
    searchResults.value = res.data || [];
  } catch (error) {
    console.error('搜索失败:', error);
    searchResults.value = [];
  } finally {
    searchLoading.value = false;
  }
};

// 节流搜索函数
const throttledSearch = () => {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  // 如果输入框为空，立即清空结果
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    return;
  }
  
  // 设置新的定时器，延迟500ms执行搜索
  searchTimer = setTimeout(() => {
    performSearch();
  }, 500);
};

// 监听搜索关键词变化，实现自动搜索
watch(searchKeyword, () => {
  throttledSearch();
});

// 监听搜索类型变化，重新搜索
watch(searchType, () => {
  if (searchKeyword.value.trim()) {
    throttledSearch();
  }
});

const toggleItemSelection = (item: any) => {
  const index = selectedItems.value.findIndex(selected => selected.id === item.id);
  
  if (index > -1) {
    // 取消选择时不清空搜索
    selectedItems.value.splice(index, 1);
  } else {
    // 选择新项目
    selectedItems.value.push(item);
  }
};

const isItemSelected = (item: any) => {
  return selectedItems.value.some(selected => selected.id === item.id);
};

const removeSelectedItem = (index: number) => {
  selectedItems.value.splice(index, 1);
};


const cancel = () => {
  uni.navigateBack();
};

const submit = async () => {
  if (!canSubmit.value) {
    uni.showToast({ title: '请完善必填信息', icon: 'none' });
    return;
  }
  
  // 调试：检查当前加载的单词和句子数据
  console.log('提交时的单词数据:', lessonWords.value);
  console.log('提交时的单词数量:', lessonWords.value.length);
  console.log('提交时的句子数据:', lessonSentences.value);
  console.log('提交时的句子数量:', lessonSentences.value.length);
  console.log('任务类型:', form.value.task_type);
  console.log('需要单词内容:', needsWordContent.value);
  console.log('需要句子内容:', needsSentenceContent.value);
  
  // 准备内容数据
  if (inputMode.value === 'search') {
    // 搜索模式：使用选择的内容
    const searchWords = searchType.value === 'word' ? selectedItems.value : [];
    const searchSentences = searchType.value === 'sentence' ? selectedItems.value : [];
    
    form.value.contents = [{
      content_type: form.value.task_type || 'dictation',
      generate_mode: 'search',
      ref_book_id: null,
      ref_lesson_id: null,
      selected_word_ids: searchWords.map(w => w.id),
      selected_sentence_ids: searchSentences.map(s => s.id),
      manual_content: {
        words: searchWords,
        sentences: searchSentences
      },
      points: 100,
      meta_data: {},
      order_num: 1
    }];
  } else if (form.value.contents.length === 0) {
    // 教材模式：从选择的教材中生成内容
    // 如果需要单词或句子但还没加载，先加载
    if ((needsWordContent.value && lessonWords.value.length === 0) || 
        (needsSentenceContent.value && lessonSentences.value.length === 0)) {
      console.log('需要加载内容...');
      await loadLessonContent();
      // 等待一下让数据加载完成
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 根据任务类型准备单词或句子ID
    let wordIds: number[] = [];
    let sentenceIds: number[] = [];
    
    // 如果是需要单词的任务类型，提取单词ID
    if (needsWordContent.value) {
      // 如果没有单词数据，可能需要先加载
      if (lessonWords.value.length === 0) {
        console.warn('警告：需要单词内容但没有加载单词数据');
        // 尝试加载单词
        await loadLessonWords();
      }
      
      if (lessonWords.value.length > 0) {
        // 从API返回的数据中，word_id字段实际上是Word表的主键id
        wordIds = lessonWords.value.map((word: any) => {
          // API返回的word_id字段对应Word表的id
          const id = word.word_id || word.id;
          console.log('单词:', word.word, 'word_id(实际是Word.id):', id, '所有字段:', Object.keys(word));
          return id;
        }).filter((id: any) => id !== undefined && id !== null);
        console.log('提取的单词IDs:', wordIds);
        
        // 如果没有找到ID，记录错误
        if (wordIds.length === 0) {
          console.error('错误：无法从单词数据中提取ID');
          console.error('第一个单词的完整数据:', lessonWords.value[0]);
        }
      }
    }
    
    // 如果是需要句子的任务类型，提取句子ID
    if (needsSentenceContent.value) {
      // 如果没有句子数据，可能需要先加载
      if (lessonSentences.value.length === 0) {
        console.warn('警告：需要句子内容但没有加载句子数据');
        // 尝试加载句子
        await loadLessonSentences();
      }
      
      if (lessonSentences.value.length > 0) {
        sentenceIds = lessonSentences.value.map((sentence: any) => {
          const id = sentence.sentence_id || sentence.id;
          console.log('句子:', sentence.content || sentence.english, 'ID:', id);
          return id;
        }).filter((id: any) => id !== undefined && id !== null);
        console.log('提取的句子IDs:', sentenceIds);
      }
    }
    
    form.value.contents = [{
      content_type: form.value.task_type || 'dictation',
      generate_mode: 'auto',
      ref_book_id: String(form.value.textbook_id || ''),  // 确保使用正确的教材ID
      ref_lesson_id: form.value.lesson_id ? parseInt(form.value.lesson_id) : null,
      selected_word_ids: wordIds,
      selected_sentence_ids: sentenceIds,
      points: 100,
      meta_data: {},
      order_num: 1
    }];
    
    // 最终验证
    console.log('最终生成的contents:', form.value.contents);
    console.log('包含的单词IDs:', form.value.contents[0]?.selected_word_ids);
    console.log('包含的句子IDs:', form.value.contents[0]?.selected_sentence_ids);
  }
  
  // 确保 contents 中的 ref_book_id 与 textbook_id 一致
  const processedContents = form.value.contents.map(content => {
    const processed: any = {
      content_type: content.content_type || form.value.task_type,
      generate_mode: content.generate_mode || 'auto',
      ref_book_id: String(form.value.textbook_id || ''),  // 强制使用 textbook_id
      ref_lesson_id: form.value.lesson_id ? parseInt(form.value.lesson_id) : null,
      selected_word_ids: content.selected_word_ids || [],
      selected_sentence_ids: content.selected_sentence_ids || [],
      points: content.points || 100,
      meta_data: content.meta_data || {},
      order_num: content.order_num || 1
    };
    
    // 编辑模式下保留 content 的 ID
    if (mode.value === 'edit' && content.id) {
      processed.id = content.id;
    }
    
    return processed;
  });
  
  const user_id = uni.getStorageSync('user_id');
  const submitData = {
    title: form.value.title,
    description: form.value.description,
    task_type: form.value.task_type,
    subject: form.value.subject,
    class_id: form.value.class_id || 0,
    deadline: form.value.deadline,
    allow_late_submission: form.value.allow_late_submission,
    max_attempts: Number(form.value.max_attempts) || 0,
    grading_criteria: form.value.grading_criteria,
    teacher_id: user_id,
    // 修复字段类型 - attachments 应该是对象或null
    attachments: form.value.attachments && form.value.attachments.length > 0 ? {} : null,
    textbook_id: form.value.textbook_id || null,
    lesson_id: form.value.lesson_id ? parseInt(form.value.lesson_id) : null,
    // 使用处理过的 contents
    contents: processedContents
  };
  
  console.log('提交的任务数据:', JSON.stringify(submitData, null, 2));
  console.log('特别注意 textbook_id:', submitData.textbook_id);
  console.log('contents 中的 ref_book_id:', submitData.contents.map(c => c.ref_book_id));
  
  try {
    uni.showLoading({ title: '提交中...' });
    
    if (mode.value === 'edit') {
      console.log('更新任务，任务ID:', taskId.value);
      console.log('更新的数据:', submitData);
      const updateRes = await taskRequest.updateTask(taskId.value, submitData);
      console.log('更新结果:', updateRes);
    } else {
      await taskRequest.createTask(submitData);
    }
    
    uni.hideLoading();
    uni.showToast({ 
      title: mode.value === 'edit' ? '更新成功' : '创建成功'
    });
    
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error: any) {
    uni.hideLoading();
    console.error('提交失败:', error);
    uni.showToast({ 
      title: error.message || '操作失败', 
      icon: 'none' 
    });
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20rpx;
}

.content {
  padding-bottom: 120rpx;
}

/* 页面标题样式 */
.header-section {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
}

.page-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12rpx;
  display: block;
}

.page-subtitle {
  font-size: 26rpx;
  color: #64748b;
  display: block;
}

/* 卡片样式 */
.card {
  background: white;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
  overflow: hidden;
  margin-bottom: 24rpx;
}

.card-content {
  padding: 32rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 24rpx;
}

/* 表单样式 */
.form-group {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  padding: 20rpx 24rpx;
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #1e293b;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 4rpx rgba(59, 130, 246, 0.1);
}

.input-wrapper {
  width: 100%;
}

.single-line {
  height: 88rpx;
  line-height: 44rpx;
  white-space: nowrap;
  overflow: hidden;
  resize: none;
}

.picker-wrapper {
  position: relative;
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 20rpx 24rpx;
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #1e293b;
  transition: all 0.2s;
}

.picker-icon {
  color: #9ca3af;
  font-size: 24rpx;
}

/* 任务类型网格 */
.task-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-top: 16rpx;
}

.type-card {
  background: #f8fafc;
  border: 3rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 32rpx 20rpx;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.type-card:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.15);
}

.type-card.active {
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border-color: #3b82f6;
  box-shadow: 0 8rpx 30rpx rgba(59, 130, 246, 0.3);
  transform: translateY(-2rpx);
}

.type-card.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.type-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
  display: block;
}

.type-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8rpx;
  display: block;
}

.type-desc {
  font-size: 22rpx;
  color: #64748b;
  line-height: 1.5;
}

/* 日期时间选择器 */
.datetime-row {
  display: flex;
  gap: 16rpx;
}

.datetime-item {
  flex: 1;
}

/* 教材选择器样式 */
.textbook-selector {
  cursor: pointer;
}

.selector-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 20rpx 24rpx;
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #1e293b;
  transition: all 0.2s;
}

.selector-display:active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.selector-display .placeholder {
  color: #9ca3af;
}

.selector-icon {
  font-size: 24rpx;
}

.textbook-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

/* 移除了模板相关样式 */

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60rpx 40rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  border: 3rpx dashed #cbd5e1;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
  opacity: 0.5;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 24rpx;
}

.empty-action {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 16rpx 32rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 4rpx 14rpx rgba(59, 130, 246, 0.4);
  transition: all 0.2s;
}

.empty-action:active {
  transform: translateY(1rpx);
  box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.4);
}

/* 复选框样式 */
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.checkbox-label {
  font-size: 28rpx;
  color: #374151;
}

/* 底部按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 24rpx;
  border-top: 1rpx solid #e5e7eb;
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.button-row {
  display: flex;
  gap: 16rpx;
}

.btn {
  flex: 1;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:active {
  background: #e2e8f0;
  transform: translateY(1rpx);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  box-shadow: 0 4rpx 14rpx rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(1rpx);
  box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.4);
}

.btn-primary.disabled {
  background: #cbd5e1;
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

/* 内容预览样式 */
.content-preview {
  background: #f8fafc;
  border-radius: 12rpx;
  padding: 24rpx;
  max-height: 400rpx;
  overflow-y: auto;
}

.preview-loading {
  text-align: center;
  padding: 40rpx;
  color: #64748b;
}

.preview-empty {
  text-align: center;
  padding: 40rpx;
  
  .empty-icon {
    font-size: 48rpx;
    display: block;
    margin-bottom: 16rpx;
    opacity: 0.5;
  }
  
  text {
    color: #ef4444;
    font-size: 26rpx;
  }
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: white;
  border-radius: 8rpx;
  border: 1rpx solid #e2e8f0;
}

.word-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e293b;
}

.word-meaning {
  font-size: 26rpx;
  color: #64748b;
}

.sentence-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.sentence-item {
  padding: 20rpx;
  background: white;
  border-radius: 8rpx;
  border: 1rpx solid #e2e8f0;
}

.sentence-text {
  display: block;
  font-size: 28rpx;
  color: #1e293b;
  margin-bottom: 8rpx;
  line-height: 1.5;
}

.sentence-meaning {
  display: block;
  font-size: 26rpx;
  color: #64748b;
  line-height: 1.4;
}

/* 内容输入方式切换 */
.input-mode-tabs {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.mode-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 16rpx;
  background: #f8fafc;
  border: 3rpx solid #e2e8f0;
  border-radius: 16rpx;
  transition: all 0.3s;
  cursor: pointer;
}

.mode-tab:active {
  transform: scale(0.98);
}

.mode-tab.active {
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border-color: #3b82f6;
  box-shadow: 0 4rpx 20rpx rgba(59, 130, 246, 0.2);
}

.mode-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

/* 搜索相关样式 */
.search-container {
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 24rpx;
}


.search-input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 24rpx;
}

.search-input {
  flex: 1;
  padding: 16rpx 24rpx;
  padding-right: 60rpx;
  background: white;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.search-loading-icon {
  position: absolute;
  right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.search-results {
  margin-bottom: 24rpx;
}

.results-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16rpx;
  display: block;
}

.results-scroll {
  max-height: 300rpx;
  background: white;
  border-radius: 12rpx;
  border: 2rpx solid #e2e8f0;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f1f5f9;
  transition: background 0.2s;
}

.result-item:active {
  background: #f8fafc;
}

.result-item:last-child {
  border-bottom: none;
}

.result-content {
  flex: 1;
}

.result-main {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e293b;
  display: block;
  margin-bottom: 4rpx;
}

.result-sub {
  font-size: 24rpx;
  color: #64748b;
  display: block;
}

.selected-mark {
  width: 40rpx;
  height: 40rpx;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
}

.selected-section {
  margin-top: 24rpx;
}

.selected-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16rpx;
  display: block;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: white;
  border: 2rpx solid #e2e8f0;
  border-radius: 24rpx;
}

.selected-text {
  font-size: 26rpx;
  color: #1e293b;
}

.remove-btn {
  width: 32rpx;
  height: 32rpx;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: bold;
}

.search-empty {
  text-align: center;
  padding: 60rpx 40rpx;
  background: white;
  border-radius: 16rpx;
  margin-top: 24rpx;
}

.search-empty .empty-icon {
  font-size: 48rpx;
  display: block;
  margin-bottom: 16rpx;
  opacity: 0.5;
}

.search-empty .empty-text {
  font-size: 28rpx;
  color: #374151;
  display: block;
  margin-bottom: 8rpx;
}

.search-empty .empty-hint {
  font-size: 24rpx;
  color: #9ca3af;
  display: block;
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .task-type-grid {
    grid-template-columns: 1fr;
  }
  
  .datetime-row {
    flex-direction: column;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 0.5s ease-out;
}

.type-card:nth-child(1) { animation-delay: 0.1s; }
.type-card:nth-child(2) { animation-delay: 0.2s; }
.type-card:nth-child(3) { animation-delay: 0.3s; }
.type-card:nth-child(4) { animation-delay: 0.4s; }
.type-card:nth-child(5) { animation-delay: 0.5s; }
</style>