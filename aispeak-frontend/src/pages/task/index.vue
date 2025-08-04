<template>
  <view class="container">
    <CommonHeader>
      <template v-slot:content>
        <text>任务</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 多重身份切换 - 只有同时具备教师和学生身份才显示 -->
      <view v-if="hasMultipleRoles" class="role-tabs">
        <view 
          class="role-tab" 
          :class="{ active: currentRole === 'student' }"
          @click="switchRole('student')"
        >
          学生身份
        </view>
        <view 
          class="role-tab" 
          :class="{ active: currentRole === 'teacher' }"
          @click="switchRole('teacher')"
        >
          教师身份
        </view>
      </view>

      <!-- 游客界面 -->
      <view v-if="currentRole === 'visitor'" class="visitor-view">
        <view class="task-list">
          <view 
            v-for="task in tasks" 
            :key="task.id"
            class="task-item visitor-tip-item"
          >
            <view class="visitor-tip-content">
              <text class="tip-title">{{ task.title }}</text>
              <text class="tip-desc">{{ task.description }}</text>
              <button class="tip-login-btn" @click="goToLogin">立即登录</button>
            </view>
          </view>
        </view>
      </view>

      <!-- 学生界面 -->
      <view v-if="currentRole === 'student'" class="student-view">
        <!-- 班级筛选 -->
        <view class="class-filter">
          <picker 
            :value="selectedClassIndex" 
            :range="classPickerRange" 
            range-key="name"
            @change="onClassFilterChange"
          >
            <view class="filter-picker">
              <text class="filter-text">{{ getClassFilterText() }}</text>
              <text class="filter-arrow">▼</text>
            </view>
          </picker>
        </view>
        
        <!-- 任务列表 -->
        <LoadingRound v-if="loading" />
        <view v-else class="task-list">
          <view 
            v-for="task in tasks" 
            :key="task.id"
            class="task-item"
            :class="{ 'visitor-tip-item': task.type === 'tip' }"
            @click="handleStudentTaskClick(task)"
          >
            <view v-if="task.type === 'tip'" class="visitor-tip-content">
              <text class="tip-title">{{ task.title }}</text>
              <text class="tip-desc">{{ task.description }}</text>
              <button class="tip-login-btn" @click.stop="goToLogin">立即登录</button>
            </view>
            <view v-else>
              <view class="task-header">
                <text class="task-title">{{ task.title }}</text>
                <view class="task-status" :class="getTaskStatusClass(task)">
                  {{ getTaskStatusText(task) }}
                </view>
              </view>
              <view class="task-info">
                <text class="task-desc">{{ task.description }}</text>
              <view class="task-meta">
                <text class="task-deadline">截止: {{ formatDate(task.deadline) }}</text>
                <text class="task-points">{{ task.total_points }}分</text>
                <!-- 学生提交状态和评分 -->
                <view v-if="task.student_submission" class="student-submission-info">
                  <text v-if="task.student_submission.status === 'graded'" class="submission-score">
                    得分: {{ task.student_submission.teacher_score }}/{{ task.total_points }}
                  </text>
                  <text v-else class="submission-status submitted">已提交</text>
                </view>
                <text v-else class="submission-status not-submitted">未提交</text>
              </view>
            </view>
            </view>
          </view>
        </view>

        <!-- 学生空状态 -->
        <view v-if="!loading && tasks.length === 0" class="empty-state">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无任务</text>
          <text class="empty-desc" v-if="studentClasses.length <= 1">
            您还没有加入任何班级，请先加入班级查看任务
          </text>
          <text class="empty-desc" v-else>
            当前班级还没有发布任务，请稍后查看
          </text>
          <view v-if="studentClasses.length <= 1" class="empty-action" @click="goToJoinClass">
            <text>加入班级</text>
          </view>
        </view>
      </view>

      <!-- 教师界面 -->
      <view v-if="currentRole === 'teacher'" class="teacher-view">
        <!-- 教师操作区 -->
        <view class="teacher-actions">
          <view class="create-btn" @click="createTask">
            <text class="btn-icon">➕</text>
            <text class="btn-text">创建新任务</text>
          </view>
          <view class="manage-btn" @click="manageClasses">
            <text class="btn-icon">🏫</text>
            <text class="btn-text">班级管理</text>
          </view>
        </view>
        
        <!-- 班级筛选 -->
        <view class="class-filter">
          <picker 
            :value="selectedTeacherClassIndex" 
            :range="teacherClasses" 
            range-key="name"
            @change="onTeacherClassFilterChange"
          >
            <view class="filter-picker">
              <text class="filter-text">{{ selectedTeacherClassIndex === 0 ? '全部班级' : teacherClasses[selectedTeacherClassIndex]?.name }}</text>
              <text class="filter-arrow">▼</text>
            </view>
          </picker>
        </view>
        
        <!-- 教师任务列表 -->
        <LoadingRound v-if="loading" />
        <view v-else class="task-list">
          <view 
            v-for="task in tasks" 
            :key="task.id"
            class="task-item"
            :class="{ 'teacher-task': currentRole === 'teacher', 'student-task': currentRole === 'student' }"
            @click="handleTaskClick(task)"
          >
            <view class="task-header">
              <text class="task-title">{{ task.title }}</text>
              <view v-if="currentRole === 'teacher'" class="task-actions">
                <text class="action-btn" @click.stop="editTask(task)">编辑</text>
                <text class="action-btn delete" @click.stop="deleteTask(task)">删除</text>
              </view>
            </view>
            <view class="task-info">
              <text class="task-desc">{{ task.description }}</text>
              <view class="task-meta">
                <text class="task-deadline">截止: {{ formatDate(task.deadline) }}</text>
                <text class="task-points">{{ task.total_points }}分</text>
                <text v-if="currentRole === 'teacher'" class="submission-count">{{ task.submission_count || 0 }}份提交</text>
                <!-- 学生视图：显示提交状态和评分 -->
                <view v-if="currentRole === 'student' && task.student_submission" class="student-submission-info">
                  <text v-if="task.student_submission.status === 'graded'" class="submission-score">
                    得分: {{ task.student_submission.teacher_score }}/{{ task.total_points }}
                  </text>
                  <text v-else class="submission-status submitted">已提交</text>
                </view>
                <text v-else-if="currentRole === 'student'" class="submission-status not-submitted">未提交</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 教师空状态 -->
        <view v-if="!loading && tasks.length === 0" class="empty-state">
          <text class="empty-icon">📋</text>
          <text class="empty-text">还没有创建任务</text>
          <text class="empty-desc">点击上方按钮创建第一个任务</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import LoadingRound from "@/components/LoadingRound.vue";
import taskRequest from "@/api/task";
import accountRequest from "@/api/account";
import textbookRequest from "@/api/textbook";
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const currentRole = ref('');
const userRoles = ref<string[]>([]); // 用户拥有的所有角色
const tasks = ref<any[]>([]);
const loading = ref(false);
const studentClasses = ref([{ id: 'all', name: '全部班级' }]);
const teacherClasses = ref([{ id: 'all', name: '全部班级' }]);
const selectedClassIndex = ref(0);
const selectedTeacherClassIndex = ref(0);

// 计算是否有多重身份
const hasMultipleRoles = computed(() => {
  return userRoles.value.includes('teacher') && userRoles.value.includes('student');
});

// 班级选择器的显示数据
const classPickerRange = computed(() => {
  const classes = [...studentClasses.value];
  // 在末尾添加"加入班级"选项
  classes.push({ id: 'join', name: '+ 加入班级' });
  return classes;
});

// 获取班级筛选文本
const getClassFilterText = () => {
  if (selectedClassIndex.value === 0) {
    return '全部班级';
  } else if (selectedClassIndex.value < studentClasses.value.length) {
    return studentClasses.value[selectedClassIndex.value]?.name || '全部班级';
  } else {
    return '+ 加入班级';
  }
};

onShow(() => {
  // 从 store 获取用户角色
  const userRole = userStore.userRole || uni.getStorageSync('userRole');
  console.log('任务页面 onShow - userRole:', userRole);
  console.log('任务页面 onShow - token:', uni.getStorageSync('x-token'));
  
  // 如果是游客，显示提示信息
  if (userRole === 'visitor') {
    console.log('检测到游客身份，显示游客提示');
    // 显示游客提示
    tasks.value = [{
      id: 'visitor-tip',
      title: '欢迎体验AISpeak',
      description: '登录后可查看和完成学习任务',
      status: 'locked',
      type: 'tip'
    }];
    loading.value = false;
    currentRole.value = 'visitor';
    console.log('游客提示设置完成，tasks:', tasks.value);
    return;
  }
  
  // 检查是否已登录
  const token = uni.getStorageSync('x-token');
  
  if (!token) {
    // 未登录且非游客，提示用户需要登录
    uni.showModal({
      title: '需要登录',
      content: '查看任务需要登录，是否立即登录？',
      confirmText: '去登录',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/index'
          })
        } else {
          // 返回上一页
          uni.navigateBack({
            delta: 1
          })
        }
      }
    })
    return;
  }
  
  // 已登录且非游客，正常加载
  getUserRoles();
  // 如果是学生角色，重新加载班级列表（可能刚加入了新班级）
  if (currentRole.value === 'student') {
    loadStudentClasses();
  }
  loadTasks();
});

const getUserRoles = () => {
  // 优先从 store 获取用户角色
  const storeRole = userStore.userRole;
  const localRole = storeRole || uni.getStorageSync('userRole');
  const localRoles = uni.getStorageSync('userRoles'); // 可能包含多个角色
  
  if (localRoles && Array.isArray(localRoles)) {
    userRoles.value = localRoles;
    // 使用保存的角色，如果没有则使用第一个角色
    currentRole.value = localRole || localRoles[0];
  } else if (localRole) {
    userRoles.value = [localRole];
    currentRole.value = localRole;
  } else {
    // 从API获取角色信息
    accountRequest.getRole().then((res) => {
      // API 返回的是 {role: "teacher"} 或 {role: "student"}
      const apiRole = res.data.role || 'student';
      userRoles.value = [apiRole];
      
      // 如果本地已经有保存的角色，优先使用本地的；否则使用API返回的角色
      currentRole.value = localRole || apiRole;
      
      // 保存到本地存储和 store
      uni.setStorageSync('userRoles', userRoles.value);
      uni.setStorageSync('userRole', currentRole.value);
      userStore.updateUserRole(currentRole.value);
      
      loadClassData();
    }).catch(() => {
      // 默认为学生角色
      userRoles.value = ['student'];
      currentRole.value = 'student';
      uni.setStorageSync('userRoles', ['student']);
      uni.setStorageSync('userRole', 'student');
      userStore.updateUserRole('student');
    });
  }
  
  loadClassData();
};

const loadClassData = () => {
  if (currentRole.value === 'student' || hasMultipleRoles.value) {
    loadStudentClasses();
  }
  if (currentRole.value === 'teacher' || hasMultipleRoles.value) {
    loadTeacherClasses();
  }
};

const loadStudentClasses = () => {
  taskRequest.getStudentClasses().then(res => {
    const classes = res.data || [];
    studentClasses.value = [{ id: 'all', name: '全部班级' }, ...classes];
  }).catch(() => {
    // 模拟数据作为备选
    studentClasses.value = [
      { id: 'all', name: '全部班级' },
      { id: '1', name: '三年级1班' },
      { id: '2', name: '四年级2班' }
    ];
  });
};

const loadTeacherClasses = () => {
  const teacherId = uni.getStorageSync('user_id');
  
  if (teacherId) {
    taskRequest.getTeacherClasses(teacherId).then(res => {
      const classes = res.data || [];
      teacherClasses.value = [{ id: 'all', name: '全部班级' }, ...classes];
    }).catch(() => {
      teacherClasses.value = [{ id: 'all', name: '全部班级' }];
    });
  }
};

const switchRole = (role: string) => {
  if (userRoles.value.includes(role)) {
    currentRole.value = role;
    userStore.updateUserRole(role);
    uni.setStorageSync('userRole', role);
    loadTasks();
  } else {
    uni.showToast({
      title: `没有${role === 'teacher' ? '教师' : '学生'}权限`,
      icon: 'none'
    });
  }
};

const onClassFilterChange = (e: any) => {
  const index = parseInt(e.detail.value);
  
  // 检查是否点击了"加入班级"选项
  if (index >= studentClasses.value.length) {
    // 跳转到加入班级页面
    uni.navigateTo({
      url: '/pages/class/join'
    });
    // 不更新selectedClassIndex，保持之前的选择
    return;
  }
  
  selectedClassIndex.value = index;
  loadTasks();
};

const onTeacherClassFilterChange = (e: any) => {
  selectedTeacherClassIndex.value = e.detail.value;
  loadTasks();
};

const loadTasks = () => {
  loading.value = true;
  const params: any = {
    page: 1,
    page_size: 20
  };
  
  if (currentRole.value === 'teacher') {
    // 获取教师创建的任务
    const user_id = uni.getStorageSync('user_id');
    if (user_id) {
      params.teacher_id = user_id
    }
    
    // 按班级筛选
    if (selectedTeacherClassIndex.value > 0) {
      params.class_id = teacherClasses.value[selectedTeacherClassIndex.value].id;
    }
  } else {
    // 学生只能看到已加入班级的任务
    const user_id = uni.getStorageSync('user_id');
    if (user_id) {
      params.student_id = user_id
      
      // 如果选择了特定班级，进一步过滤
      if (selectedClassIndex.value > 0) {
        params.class_id = studentClasses.value[selectedClassIndex.value].id;
      }
    } else {
      // 如果没有学生ID，显示空列表
      tasks.value = [];
      loading.value = false;
      return;
    }
  }
  
  taskRequest.listTasks(params).then((res) => {
    tasks.value = res.data.tasks || res.data || [];
    loading.value = false;
  }).catch(() => {
    // 根据角色显示不同的模拟数据
    if (currentRole.value === 'teacher') {
      tasks.value = [
        {
          id: 1,
          title: '英语作业 - Unit 1',
          description: '完成Unit 1的单词练习和语法题',
          total_points: 100,
          deadline: '2025-01-10T18:00:00Z',
          submission_count: 15
        }
      ];
    } else {
      // 学生没有任务时显示空列表
      tasks.value = [];
    }
    loading.value = false;
  });
};

const prepareAndNavigateToTask = (task: any, pageName: string) => {
  // 获取任务内容详情
  uni.showLoading({ title: '加载中...' });
  
  taskRequest.getTaskById(task.id).then(res => {
    const taskDetail = res.data;
    console.log('任务详情:', taskDetail);
    
    if (!taskDetail.contents || taskDetail.contents.length === 0) {
      uni.hideLoading();
      uni.showToast({ title: '任务内容为空', icon: 'none' });
      return;
    }
    
    const content = taskDetail.contents[0]; // 获取第一个内容
    console.log('任务内容:', content);
    console.log('生成模式:', content.generate_mode);
    console.log('选中的单词ID:', content.selected_word_ids);
    
    // 处理自动生成模式
    if (content.generate_mode === 'auto' && (!content.selected_word_ids || content.selected_word_ids.length === 0)) {
      console.log('自动生成模式，需要获取教材单词');
      
      // 确保有 bookId 和 lessonId
      if (!content.ref_book_id || !content.ref_lesson_id) {
        console.log('任务缺少教材信息，跳转到任务详情页');
        uni.hideLoading();
        // 如果没有教材信息，跳转到任务详情页让学生自行选择内容
        uni.navigateTo({
          url: `/pages/task/detail?taskId=${task.id}&mode=student`
        });
        return;
      }
      
      // 获取教材章节信息以获取单词列表
      textbookRequest.getTextbookChapters(content.ref_book_id).then(chaptersRes => {
        const chapters = chaptersRes.data.chapters || [];
        const currentChapter = chapters.find(ch => ch.lesson_id == content.ref_lesson_id);
        
        if (!currentChapter || !currentChapter.words || currentChapter.words.length === 0) {
          uni.hideLoading();
          uni.showToast({ title: '该单元没有单词', icon: 'none' });
          return;
        }
        
        // 提取所有单词ID
        const autoSelectedWords = currentChapter.words.map(word => word.word_id);
        console.log('自动选择的单词:', autoSelectedWords);
        
        // 继续正常的跳转流程
        navigateToLearningPage(autoSelectedWords, content, task, pageName);
      }).catch(error => {
        uni.hideLoading();
        console.error('获取教材章节失败:', error);
        uni.showToast({ title: '获取单词列表失败', icon: 'none' });
      });
      
      return;
    }
    
    const selectedWords = content.selected_word_ids || [];
    
    if (selectedWords.length === 0) {
      console.log('没有选中的单词，显示提示');
      uni.hideLoading();
      uni.showToast({ title: '该任务没有单词', icon: 'none' });
      return;
    }
    
    // 手动模式，直接跳转
    navigateToLearningPage(selectedWords, content, task, pageName);
  }).catch(error => {
    uni.hideLoading();
    console.error('获取任务详情失败:', error);
    uni.showToast({ title: '获取任务详情失败', icon: 'none' });
  });
};

// 统一的跳转逻辑
const navigateToLearningPage = (selectedWords: any[], content: any, task: any, pageName: string) => {
  // 复用教材页面的存储方式：使用 'selectedWords' 作为统一的缓存键
  const sessionKey = 'selectedWords'; // 与教材页面保持一致
  const bookId = content.ref_book_id || '';
  const lessonId = content.ref_lesson_id || '';
  
  uni.setStorage({
    key: sessionKey,
    data: JSON.stringify(selectedWords),
    success: () => {
      uni.hideLoading();
      // 根据页面类型设置不同的参数，与教材页面保持一致
      let url = '';
      if (pageName === 'WordDictation') {
        // 单词听写 - 与 wordListenWrite 方法保持一致
        url = `/pages/textbook/WordDictation?sessionKey=${sessionKey}&bookId=${bookId}&lessonId=${lessonId}&wordmode=4&taskId=${task.id}`;
      } else if (pageName === 'UnitwordConsolidation') {
        // 背单词 - 与 unitwordclick 方法保持一致
        url = `/pages/textbook/UnitwordConsolidation?sessionKey=${sessionKey}&bookId=${bookId}&lessonId=${lessonId}&taskId=${task.id}`;
      }
      uni.navigateTo({ url });
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('数据存储失败', err);
      uni.showToast({ title: '跳转失败', icon: 'none' });
    }
  });
};

const prepareAndNavigateToSentenceTask = (task: any) => {
  // 获取任务内容详情
  uni.showLoading({ title: '加载中...' });
  
  taskRequest.getTaskById(task.id).then(res => {
    const taskDetail = res.data;
    if (!taskDetail.contents || taskDetail.contents.length === 0) {
      uni.hideLoading();
      uni.showToast({ title: '任务内容为空', icon: 'none' });
      return;
    }
    
    const content = taskDetail.contents[0];
    uni.hideLoading();
    
    // 跳转到句子跟读页面
    uni.navigateTo({
      url: `/pages/textbook/UnitSentenceRead?bookId=${content.ref_book_id || ''}&lessonId=${content.ref_lesson_id || ''}&taskId=${task.id}`
    });
  }).catch(error => {
    uni.hideLoading();
    console.error('获取任务详情失败:', error);
    uni.showToast({ title: '获取任务详情失败', icon: 'none' });
  });
};

const prepareAndNavigateToWordReadTask = (task: any) => {
  // 获取任务内容详情
  uni.showLoading({ title: '加载中...' });
  
  taskRequest.getTaskById(task.id).then(res => {
    const taskDetail = res.data;
    if (!taskDetail.contents || taskDetail.contents.length === 0) {
      uni.hideLoading();
      uni.showToast({ title: '任务内容为空', icon: 'none' });
      return;
    }
    
    const content = taskDetail.contents[0];
    uni.hideLoading();
    
    // 跳转到单词跟读页面
    uni.navigateTo({
      url: `/pages/textbook/UnitWordRead?bookId=${content.ref_book_id || ''}&lessonId=${content.ref_lesson_id || ''}&taskId=${task.id}`
    });
  }).catch(error => {
    uni.hideLoading();
    console.error('获取任务详情失败:', error);
    uni.showToast({ title: '获取任务详情失败', icon: 'none' });
  });
};

const handleStudentTaskClick = (task: any) => {
  // 如果是游客提示，不做任何操作
  if (task.type === 'tip') {
    return;
  }
  
  // 学生点击任务，根据提交状态决定行为
  if (task.student_submission) {
    // 已提交，查看提交详情
    uni.navigateTo({
      url: `/pages/task/submission-detail?submissionId=${task.student_submission.id}`
    });
  } else {
    // 未提交，跳转到做任务页面
    viewTask(task);
  }
};

// 跳转到登录页面
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/index'
  });
};

const viewTask = (task: any) => {
  // 根据任务类型跳转到不同的页面
  if (task.task_type === 'dictation') {
    // 听写任务 - 跳转到单词听写页面
    prepareAndNavigateToTask(task, 'WordDictation');
  } else if (task.task_type === 'spelling') {
    // 拼写任务 - 跳转到背单词页面
    prepareAndNavigateToTask(task, 'UnitwordConsolidation');
  } else if (task.task_type === 'sentence_repeat') {
    // 句子跟读任务 - 跳转到句子跟读页面
    prepareAndNavigateToSentenceTask(task);
  } else if (task.task_type === 'pronunciation') {
    // 发音任务 - 跳转到单词跟读页面
    prepareAndNavigateToWordReadTask(task);
  } else if (task.task_type === 'word_pronunciation') {
    // 单词跟读任务 - 跳转到单词跟读页面
    prepareAndNavigateToWordReadTask(task);
  } else {
    // 其他任务类型，跳转到任务详情页
    uni.navigateTo({
      url: `/pages/task/detail?taskId=${task.id}&mode=student`
    });
  }
};

const createTask = () => {
  uni.navigateTo({
    url: '/pages/task/create'
  });
};

const manageClasses = () => {
  uni.navigateTo({
    url: '/pages/class/manage'
  });
};

const goToJoinClass = () => {
  uni.navigateTo({
    url: '/pages/class/join'
  });
};

const handleTaskClick = (task: any) => {
  if (currentRole.value === 'teacher') {
    manageTask(task);
  } else {
    // 学生点击任务，根据提交状态决定行为
    if (task.student_submission) {
      // 已提交，查看提交详情
      uni.navigateTo({
        url: `/pages/task/submission-detail?submissionId=${task.student_submission.id}`
      });
    } else {
      // 未提交，跳转到做任务页面
      viewTask(task);
    }
  }
};

const manageTask = (task: any) => {
  uni.navigateTo({
    url: `/pages/task/detail?taskId=${task.id}&mode=teacher`
  });
};

const editTask = (task: any) => {
  uni.navigateTo({
    url: `/pages/task/create?taskId=${task.id}&mode=edit`
  });
};

const deleteTask = (task: any) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个任务吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        taskRequest.deleteTask(task.id).then(() => {
          uni.hideLoading();
          uni.showToast({ title: '删除成功' });
          // 立即从列表中移除该任务
          const index = tasks.value.findIndex(t => t.id === task.id);
          if (index > -1) {
            tasks.value.splice(index, 1);
          }
          // 延迟后重新加载，确保后端数据同步
          setTimeout(() => {
            loadTasks();
          }, 500);
        }).catch((error) => {
          uni.hideLoading();
          console.error('删除任务失败:', error);
          uni.showToast({ title: '删除失败', icon: 'none' });
        });
      }
    }
  });
};

const getTaskStatusClass = (task: any) => {
  // 对于学生视图，根据提交状态判断
  if (currentRole.value === 'student' && task.student_submission) {
    if (task.student_submission.status === 'graded') {
      return 'completed';  // 已评分，显示为已完成
    }
    return 'submitted';  // 已提交但未评分
  }
  
  // 检查是否过期
  if (new Date(task.deadline) < new Date()) {
    return 'overdue';
  }
  
  return 'active';
};

const getTaskStatusText = (task: any) => {
  // 对于学生视图，根据提交状态判断
  if (currentRole.value === 'student' && task.student_submission) {
    if (task.student_submission.status === 'graded') {
      return '已完成';  // 已评分，显示为已完成
    }
    return '已提交';  // 已提交但未评分
  }
  
  // 检查是否过期
  if (new Date(task.deadline) < new Date()) {
    return '已过期';
  }
  
  return '进行中';
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
}

.role-tabs {
  display: flex;
  background: white;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  padding: 8rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .role-tab {
    flex: 1;
    text-align: center;
    padding: 20rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: #666;
    transition: all 0.3s;
    
    &.active {
      background: #4B7EFE;
      color: white;
      font-weight: 600;
    }
  }
}

.teacher-actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
  
  .create-btn, .manage-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    background: #4B7EFE;
    color: white;
    padding: 24rpx;
    border-radius: 16rpx;
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: 0 4rpx 20rpx rgba(75, 126, 254, 0.3);
    
    &:active {
      transform: scale(0.98);
    }
  }
  
  .manage-btn {
    background: #52C41A;
    box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.3);
  }
  
  .btn-icon {
    font-size: 32rpx;
  }
}

.class-filter {
  margin-bottom: 24rpx;
  
  .filter-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: white;
    padding: 24rpx;
    border-radius: 16rpx;
    border: 1px solid #f0f0f0;
    
    .filter-text {
      font-size: 28rpx;
      color: #333;
    }
    
    .filter-arrow {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.task-list {
  .task-item {
    background: white;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    border: 1px solid #f0f0f0;
    transition: all 0.3s;
    
    &:active {
      transform: scale(0.98);
      background: #fafafa;
    }
    
    &.teacher-task {
      border-left: 4rpx solid #4B7EFE;
    }
    
    .task-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16rpx;
      
      .task-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        flex: 1;
        margin-right: 16rpx;
      }
      
      .task-status {
        padding: 8rpx 16rpx;
        border-radius: 16rpx;
        font-size: 22rpx;
        
        &.active {
          background: #E8F5E8;
          color: #52C41A;
        }
        
        &.overdue {
          background: #FFF2F0;
          color: #FF4D4F;
        }
        
        &.submitted {
          background: #E6F7FF;
          color: #1890FF;
        }
        
        &.completed {
          background: #F6FFED;
          color: #52C41A;
          font-weight: 600;
        }
      }
      
      .task-actions {
        display: flex;
        gap: 16rpx;
        
        .action-btn {
          padding: 8rpx 16rpx;
          border-radius: 12rpx;
          font-size: 24rpx;
          background: #f0f0f0;
          color: #666;
          
          &.delete {
            background: #FFF2F0;
            color: #FF4D4F;
          }
        }
      }
    }
    
    .task-info {
      .task-desc {
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
        margin-bottom: 16rpx;
      }
      
      .task-meta {
        display: flex;
        gap: 24rpx;
        flex-wrap: wrap;
        
        .task-deadline, .task-points, .submission-count {
          font-size: 24rpx;
          color: #999;
        }
        
        .task-points {
          color: #4B7EFE;
          font-weight: 600;
        }
        
        .submission-count {
          color: #52C41A;
        }
        
        // 学生提交信息样式
        .student-submission-info {
          display: flex;
          align-items: center;
          gap: 12rpx;
        }
        
        .submission-status {
          font-size: 24rpx;
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          
          &.submitted {
            background: #E6F7FF;
            color: #1890FF;
          }
          
          &.not-submitted {
            background: #FFF1F0;
            color: #FF4D4F;
          }
        }
        
        .submission-score {
          font-size: 24rpx;
          color: #52C41A;
          font-weight: 600;
          padding: 4rpx 12rpx;
          background: #F6FFED;
          border-radius: 20rpx;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  background: white;
  border-radius: 16rpx;
  
  .empty-icon {
    font-size: 120rpx;
    display: block;
    margin-bottom: 24rpx;
  }
  
  .empty-text {
    font-size: 32rpx;
    color: #333;
    font-weight: 600;
    display: block;
    margin-bottom: 12rpx;
  }
  
  .empty-desc {
    font-size: 26rpx;
    color: #666;
    line-height: 1.4;
    margin-bottom: 32rpx;
  }
  
  .empty-action {
    display: inline-block;
    background: #4B7EFE;
    color: white;
    padding: 20rpx 40rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    font-weight: 600;
  }
}

// 游客提示样式
.visitor-tip-item {
  background: linear-gradient(135deg, #f5f7ff 0%, #e8ecff 100%);
  border: 2rpx solid #d4daff;
  
  .visitor-tip-content {
    text-align: center;
    padding: 40rpx;
    
    .tip-title {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 16rpx;
    }
    
    .tip-desc {
      display: block;
      font-size: 28rpx;
      color: #666;
      margin-bottom: 32rpx;
    }
    
    .tip-login-btn {
      width: 240rpx;
      height: 72rpx;
      background: #5456eb;
      color: #fff;
      font-size: 30rpx;
      font-weight: 500;
      border-radius: 36rpx;
      border: none;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:active {
        background: #4345d9;
      }
    }
  }
}
</style>