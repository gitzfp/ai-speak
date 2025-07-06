<template>
  <view class="container">
    <CommonHeader :leftIcon="true">
      <template v-slot:content>
        <text>{{ mode === 'edit' ? '编辑任务' : '创建任务' }}</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 创建模式选择 -->
      <view v-if="mode === 'create'" class="mode-selection">
        <view class="mode-tabs">
          <view 
            class="mode-tab"
            :class="{ active: createMode === 'quick' }"
            @click="createMode = 'quick'"
          >
            快速创建
          </view>
          <view 
            class="mode-tab"
            :class="{ active: createMode === 'template' }"
            @click="createMode = 'template'"
          >
            使用模板
          </view>
          <view 
            class="mode-tab"
            :class="{ active: createMode === 'advanced' }"
            @click="createMode = 'advanced'"
          >
            高级设置
          </view>
        </view>
      </view>

      <!-- 快速创建模式 -->
      <view v-if="createMode === 'quick'" class="card">
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
            <input 
              v-model="form.title" 
              class="form-input"
              placeholder="如：Unit 1 听写练习"
              maxlength="50"
            />
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

          <!-- 教材快选 -->
          <view class="form-group">
            <text class="form-label">关联教材（可选）</text>
            <picker 
              :value="textbookIndex" 
              :range="allBooks" 
              range-key="display_name"
              @change="onQuickTextbookChange"
            >
              <view class="picker-display">
                <text>{{ allBooks[textbookIndex]?.display_name || '选择教材（可选）' }}</text>
                <text class="picker-icon">▼</text>
              </view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 模板创建模式 -->
      <view v-if="createMode === 'template'" class="card">
        <view class="p-6">
          <text class="text-xl font-bold text-gray-900 mb-6 block">选择任务模板</text>
          
          <view class="space-y-4">
            <view 
              v-for="template in taskTemplates" 
              :key="template.id"
              class="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-start gap-4 transition-all duration-300 hover:shadow-md hover:bg-primary-50 hover:border-primary-300"
              @click="selectTemplate(template)"
            >
              <view class="bg-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm">
                <text class="text-2xl">{{ template.icon }}</text>
              </view>
              <view class="flex-1">
                <text class="text-lg font-semibold text-gray-900 block mb-2">{{ template.name }}</text>
                <text class="text-sm text-gray-600 leading-relaxed block mb-3">{{ template.description }}</text>
                <view class="flex gap-2 flex-wrap">
                  <text 
                    v-for="tag in template.tags" 
                    :key="tag"
                    class="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium"
                  >
                    {{ tag }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 模板配置 -->
        <view v-if="selectedTemplate" class="mt-6 card">
          <view class="p-6">
            <text class="text-xl font-bold text-gray-900 mb-6 block">配置模板</text>
            
            <view class="space-y-6">
              <view>
                <text class="block text-sm font-medium text-gray-700 mb-3">班级 *</text>
                <picker 
                  :value="classIndex" 
                  :range="classes" 
                  range-key="name"
                  @change="onClassChange"
                >
                  <view class="form-input flex items-center justify-between">
                    <text class="text-gray-700">{{ classes[classIndex]?.name || '请选择班级' }}</text>
                    <text class="text-gray-400">▼</text>
                  </view>
                </picker>
              </view>

              <view>
                <text class="block text-sm font-medium text-gray-700 mb-3">任务标题 *</text>
                <input 
                  v-model="form.title" 
                  class="form-input"
                  :placeholder="selectedTemplate.title"
                />
              </view>

              <view>
                <text class="block text-sm font-medium text-gray-700 mb-3">截止时间 *</text>
                <view class="flex gap-3">
                  <picker 
                    mode="date" 
                    :value="deadlineDate"
                    @change="onDeadlineDateChange"
                    class="flex-1"
                  >
                    <view class="form-input flex items-center justify-between">
                      <text class="text-gray-700">{{ deadlineDate || '选择日期' }}</text>
                      <text class="text-gray-400">📅</text>
                    </view>
                  </picker>
                  <picker 
                    mode="time" 
                    :value="deadlineTime"
                    @change="onDeadlineTimeChange"
                    class="flex-1"
                  >
                    <view class="form-input flex items-center justify-between">
                      <text class="text-gray-700">{{ deadlineTime || '选择时间' }}</text>
                      <text class="text-gray-400">🕐</text>
                    </view>
                  </picker>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 高级设置模式 -->
      <view v-if="createMode === 'advanced'" class="card">
        <view class="p-6">
          <text class="text-xl font-bold text-gray-900 mb-6 block">基本信息</text>
          
          <view class="space-y-6">
            <view>
              <text class="block text-sm font-medium text-gray-700 mb-3">班级 *</text>
              <picker 
                :value="classIndex" 
                :range="classes" 
                range-key="name"
                @change="onClassChange"
              >
                <view class="form-input flex items-center justify-between">
                  <text class="text-gray-700">{{ classes[classIndex]?.name || '请选择班级' }}</text>
                  <text class="text-gray-400">▼</text>
                </view>
              </picker>
            </view>

            <view>
              <text class="block text-sm font-medium text-gray-700 mb-3">任务类型 *</text>
              <picker 
                :value="taskTypeIndex" 
                :range="taskTypes" 
                range-key="label"
                @change="onTaskTypeChange"
              >
                <view class="form-input flex items-center justify-between">
                  <text class="text-gray-700">{{ taskTypes[taskTypeIndex]?.label || '请选择任务类型' }}</text>
                  <text class="text-gray-400">▼</text>
                </view>
              </picker>
            </view>

            <view>
              <text class="block text-sm font-medium text-gray-700 mb-3">任务标题 *</text>
              <input 
                v-model="form.title" 
                class="form-input"
                placeholder="请输入任务标题"
              />
            </view>

            <view>
              <text class="block text-sm font-medium text-gray-700 mb-3">任务描述</text>
              <textarea 
                v-model="form.description" 
                class="form-input resize-none"
                style="height: 100px;"
                placeholder="请输入任务描述（可选）"
              />
            </view>

            <view>
              <text class="block text-sm font-medium text-gray-700 mb-3">截止时间 *</text>
              <view class="flex gap-3">
                <picker 
                  mode="date" 
                  :value="deadlineDate"
                  @change="onDeadlineDateChange"
                  class="flex-1"
                >
                  <view class="form-input flex items-center justify-between">
                    <text class="text-gray-700">{{ deadlineDate || '选择日期' }}</text>
                    <text class="text-gray-400">📅</text>
                  </view>
                </picker>
                <picker 
                  mode="time" 
                  :value="deadlineTime"
                  @change="onDeadlineTimeChange"
                  class="flex-1"
                >
                  <view class="form-input flex items-center justify-between">
                    <text class="text-gray-700">{{ deadlineTime || '选择时间' }}</text>
                    <text class="text-gray-400">🕐</text>
                  </view>
                </picker>
              </view>
            </view>

            <view>
              <text class="block text-sm font-medium text-gray-700 mb-3">教材选择</text>
              <picker 
                :value="textbookIndex" 
                :range="allBooks" 
                range-key="display_name"
                @change="onQuickTextbookChange"
              >
                <view class="form-input flex items-center justify-between bg-gray-50 border-gray-200">
                  <text class="text-gray-600">{{ getSelectedTextbookDisplay() }}</text>
                  <text class="text-gray-400">▼</text>
                </view>
              </picker>
            </view>

            <view>
              <view class="flex items-center gap-3">
                <checkbox 
                  :checked="form.allow_late_submission" 
                  @change="onAllowLateSubmissionChange"
                  class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <text class="text-sm text-gray-700">允许迟交</text>
              </view>
            </view>

            <view>
              <text class="block text-sm font-medium text-gray-700 mb-3">最大尝试次数</text>
              <input 
                v-model="form.max_attempts" 
                class="form-input"
                type="number"
                placeholder="0表示无限制"
              />
            </view>
          </view>
        </view>
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
import { onLoad } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import taskRequest from "@/api/task";
import useTextbookSelector from "@/hooks/useTextbookSelector";

// 使用教材选择器
const {
  versions,
  grades,
  terms,
  selectedVersion,
  selectedGrade,
  selectedTerm,
  filteredBooks,
  fetchBooks
} = useTextbookSelector();

const mode = ref('create');
const taskId = ref('');
const createMode = ref('quick'); // 'quick', 'template', 'advanced'
const selectedTemplate = ref<any>(null);

const form = ref({
  title: '',
  description: '',
  task_type: '',
  subject: 'english',
  class_id: '',
  deadline: '',
  allow_late_submission: false,
  max_attempts: 0,
  grading_criteria: '',
  textbook_id: '',
  lesson_id: '',
  attachments: [] as string[],
  contents: [] as any[]
});

const taskTypes = ref([
  { 
    value: 'dictation', 
    label: '听写', 
    icon: '✍️',
    description: '听音频写单词'
  },
  { 
    value: 'spelling', 
    label: '拼写', 
    icon: '🔤',
    description: '根据提示拼写单词'
  },
  { 
    value: 'pronunciation', 
    label: '发音', 
    icon: '🎤',
    description: '朗读单词或句子'
  },
  { 
    value: 'sentence_repeat', 
    label: '跟读', 
    icon: '🔄',
    description: '跟读句子练习'
  },
  { 
    value: 'quiz', 
    label: '测验', 
    icon: '❓',
    description: '选择题测验'
  }
]);

const subjects = ref([
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' }
]);

// 任务模板
const taskTemplates = ref([
  {
    id: 'weekly_dictation',
    name: '每周听写',
    description: '标准听写任务，包含10-15个单词',
    icon: '📝',
    tags: ['听写', '常用'],
    title: '第{{week}}周听写',
    task_type: 'dictation',
    contents: [
      {
        content_type: 'dictation',
        generate_mode: 'auto',
        points: 100,
        meta_data: { word_count: 15 },
        order_num: 1
      }
    ]
  },
  {
    id: 'unit_test',
    name: '单元测试',
    description: '综合测试，包含听写、拼写、发音',
    icon: '📋',
    tags: ['测试', '综合'],
    title: '{{unit}}单元测试',
    task_type: 'quiz',
    contents: [
      {
        content_type: 'dictation',
        generate_mode: 'auto',
        points: 40,
        meta_data: {},
        order_num: 1
      },
      {
        content_type: 'spelling',
        generate_mode: 'auto',
        points: 30,
        meta_data: {},
        order_num: 2
      },
      {
        content_type: 'pronunciation',
        generate_mode: 'auto',
        points: 30,
        meta_data: {},
        order_num: 3
      }
    ]
  },
  {
    id: 'pronunciation_practice',
    name: '发音练习',
    description: '专注发音训练的任务',
    icon: '🎙️',
    tags: ['发音', '口语'],
    title: '发音练习 - {{topic}}',
    task_type: 'pronunciation',
    contents: [
      {
        content_type: 'pronunciation',
        generate_mode: 'auto',
        points: 100,
        meta_data: { sentence_count: 5 },
        order_num: 1
      }
    ]
  }
]);

const taskTypeIndex = ref(-1);
const subjectIndex = ref(0);
const classIndex = ref(-1);
const textbookIndex = ref(-1);
const deadlineDate = ref('');
const deadlineTime = ref('');
const classes = ref<any[]>([]);

// 简化的教材列表
const allBooks = computed(() => {
  return filteredBooks.value.map(book => ({
    ...book,
    display_name: `${book.book_name} (${book.grade}年级)`
  }));
});

const canSubmit = computed(() => {
  return form.value.title && form.value.class_id && form.value.deadline;
});

onLoad((options: any) => {
  if (options.taskId) {
    taskId.value = options.taskId;
    mode.value = options.mode || 'edit';
    loadTask();
  }
  
  // 处理从教材页面跳转过来的预填充参数
  if (options.textbook_id) {
    form.value.textbook_id = options.textbook_id;
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
    form.value.class_id = options.class_id;
  }
  if (options.title) {
    form.value.title = decodeURIComponent(options.title);
  }
  
  // 初始化数据
  fetchBooks();
  loadClasses();
  
  // 设置默认截止时间（明天18:00）
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  deadlineDate.value = tomorrow.toISOString().split('T')[0];
  deadlineTime.value = '18:00';
  updateDeadline();
});

// 监听教材列表加载完成后设置预选择的教材
watch(() => filteredBooks.value, (newBooks) => {
  if (newBooks.length > 0 && form.value.textbook_id) {
    const selectedIndex = newBooks.findIndex(book => book.book_id === form.value.textbook_id);
    if (selectedIndex !== -1) {
      textbookIndex.value = selectedIndex;
    }
  }
}, { immediate: true });

const loadClasses = async () => {
  try {
    const userInfo = uni.getStorageSync('userInfo');
    const teacherId = userInfo?.teacherId || 'teacher001';
    
    const res = await taskRequest.getTeacherClasses(teacherId);
    classes.value = res.data || [];
    
    // 预选择班级（从教材页面跳转过来或编辑模式）
    if (form.value.class_id) {
      const index = classes.value.findIndex((c: any) => c.id === form.value.class_id);
      if (index !== -1) {
        classIndex.value = index;
      }
    }
  } catch (error) {
    console.error('加载班级列表失败:', error);
    classes.value = [];
  }
};

const loadTask = async () => {
  try {
    const res = await taskRequest.getTaskById(taskId.value);
    const task = res.data;
    
    form.value = {
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      subject: task.subject,
      class_id: task.class_id,
      deadline: task.deadline,
      allow_late_submission: task.allow_late_submission,
      max_attempts: task.max_attempts,
      grading_criteria: task.grading_criteria,
      textbook_id: task.textbook_id || '',
      lesson_id: task.lesson_id || '',
      attachments: task.attachments || [],
      contents: task.contents || []
    };
    
    taskTypeIndex.value = taskTypes.value.findIndex(t => t.value === task.task_type);
    subjectIndex.value = subjects.value.findIndex(s => s.value === task.subject);
    
    if (task.deadline) {
      const date = new Date(task.deadline);
      deadlineDate.value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      deadlineTime.value = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('加载任务失败:', error);
    uni.showToast({ title: '加载任务失败', icon: 'none' });
  }
};

// 事件处理
const selectTaskType = (index: number) => {
  taskTypeIndex.value = index;
  form.value.task_type = taskTypes.value[index].value;
  
  // 自动生成标题
  if (!form.value.title || form.value.title.includes(taskTypes.value.find(t => t.value !== form.value.task_type)?.label || '')) {
    form.value.title = `${taskTypes.value[index].label}练习`;
  }
};

const onTaskTypeChange = (e: any) => {
  taskTypeIndex.value = e.detail.value;
  form.value.task_type = taskTypes.value[e.detail.value].value;
};

const onClassChange = (e: any) => {
  classIndex.value = e.detail.value;
  form.value.class_id = classes.value[e.detail.value].id;
};

const onQuickTextbookChange = (e: any) => {
  textbookIndex.value = e.detail.value;
  if (allBooks.value[e.detail.value]) {
    form.value.textbook_id = allBooks.value[e.detail.value].book_id;
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

const getSelectedTextbookDisplay = () => {
  if (form.value.textbook_id && allBooks.value.length > 0) {
    const selectedBook = allBooks.value.find(book => book.book_id === form.value.textbook_id);
    if (selectedBook) {
      return selectedBook.display_name || selectedBook.book_name;
    }
  }
  return allBooks.value[textbookIndex.value]?.display_name || '选择教材（可选）';
};

const selectTemplate = (template: any) => {
  selectedTemplate.value = template;
  form.value.task_type = template.task_type;
  form.value.title = template.title.replace('{{week}}', '1').replace('{{unit}}', 'Unit 1').replace('{{topic}}', '单词');
  form.value.contents = [...template.contents];
  
  taskTypeIndex.value = taskTypes.value.findIndex(t => t.value === template.task_type);
};

const goToCreateClass = () => {
  uni.navigateTo({ url: '/pages/class/create' });
};

const cancel = () => {
  uni.navigateBack();
};

const submit = async () => {
  if (!canSubmit.value) {
    uni.showToast({ title: '请完善必填信息', icon: 'none' });
    return;
  }
  
  // 如果没有内容，根据任务类型自动生成
  if (form.value.contents.length === 0) {
    form.value.contents = [{
      content_type: form.value.task_type || 'dictation',
      generate_mode: 'auto',
      ref_book_id: String(form.value.textbook_id || ''),
      ref_lesson_id: form.value.lesson_id,
      selected_word_ids: [],
      selected_sentence_ids: [],
      points: 100,
      meta_data: {},
      order_num: 1
    }];
  }
  
  const userInfo = uni.getStorageSync('userInfo');
  const submitData = {
    ...form.value,
    teacher_id: userInfo?.teacherId || userInfo?.id || 'teacher001',
    class_id: parseInt(form.value.class_id) || 0,
    max_attempts: Number(form.value.max_attempts) || 0,
    // 确保contents中的数据类型正确
    contents: form.value.contents.map(content => ({
      ...content,
      ref_book_id: String(content.ref_book_id || '')
    }))
  };
  
  try {
    uni.showLoading({ title: '提交中...' });
    
    if (mode.value === 'edit') {
      await taskRequest.updateTask(taskId.value, submitData);
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

/* 模式选择样式 */
.mode-selection {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
}

.mode-tabs {
  display: flex;
  background: #f8fafc;
  border-radius: 12rpx;
  padding: 6rpx;
  gap: 4rpx;
}

.mode-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 12rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #64748b;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.mode-tab.active {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  font-weight: 600;
  box-shadow: 0 4rpx 14rpx rgba(59, 130, 246, 0.4);
  transform: translateY(-1rpx);
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

/* 模板样式 */
.template-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 16rpx;
}

.template-card {
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  transition: all 0.3s;
  cursor: pointer;
}

.template-card:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 25rpx rgba(59, 130, 246, 0.15);
}

.template-icon {
  width: 80rpx;
  height: 80rpx;
  background: white;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.template-info {
  flex: 1;
}

.template-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8rpx;
}

.template-desc {
  font-size: 24rpx;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.template-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.template-tag {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  font-size: 20rpx;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  font-weight: 500;
}

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