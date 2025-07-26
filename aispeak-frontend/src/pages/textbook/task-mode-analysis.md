# 任务模式学习功能分析

## 一、核心差异

### 1. 普通学习模式
- **目的**：自主学习，提升能力
- **进度**：可以随时退出，下次继续
- **评分**：只记录学习进度，不影响成绩
- **完成标准**：没有强制要求

### 2. 任务学习模式
- **目的**：完成教师布置的作业
- **进度**：需要一次性完成或记录中断点
- **评分**：成绩需要提交给教师
- **完成标准**：达到任务要求的标准

## 二、任务模式需要增加的功能

### 1. 任务信息展示
```javascript
// 在学习页面顶部显示任务信息
const taskInfo = ref({
  taskId: '',
  taskTitle: '',
  deadline: '',
  totalPoints: 100,
  maxAttempts: 0,
  currentAttempt: 1
})
```

### 2. 进度跟踪
```javascript
// 记录学习进度
const taskProgress = ref({
  startTime: new Date(),
  endTime: null,
  completedItems: 0,
  totalItems: 0,
  status: 'in_progress' // in_progress, completed, abandoned
})
```

### 3. 成绩计算
```javascript
// 计算任务得分
const calculateTaskScore = () => {
  return {
    correctCount: 0,
    incorrectCount: 0,
    accuracy: 0,
    score: 0,
    timeSpent: 0
  }
}
```

### 4. 结果提交
```javascript
// 提交任务结果
const submitTaskResult = async () => {
  const submission = {
    task_id: taskInfo.value.taskId,
    content_id: currentContent.value.id,
    response: userAnswer.value,
    media_files: audioFiles.value,
    is_correct: isCorrect.value,
    auto_score: calculateScore(),
    attempt_count: taskProgress.value.currentAttempt
  }
  
  await taskRequest.submitTaskResult(submission)
}
```

### 5. 限制功能
- **退出限制**：任务模式下退出需要确认，并记录未完成状态
- **跳过限制**：可能不允许跳过某些题目
- **重试限制**：根据 max_attempts 限制重试次数

## 三、具体实现建议

### 1. WordDictation.vue 修改
```javascript
// 添加任务模式判断
const isTaskMode = computed(() => !!route.query.taskId)

// 任务模式初始化
onLoad(async (options) => {
  if (options.taskId) {
    // 加载任务信息
    await loadTaskInfo(options.taskId)
    // 初始化任务进度
    initTaskProgress()
  }
})

// 完成单词后的处理
const handleWordComplete = async () => {
  if (isTaskMode.value) {
    // 提交单个单词的结果
    await submitWordResult()
    // 更新任务进度
    updateTaskProgress()
  }
  
  // 继续下一个单词或完成任务
  if (isLastWord()) {
    if (isTaskMode.value) {
      await submitTaskCompletion()
      showTaskResult()
    }
  }
}
```

### 2. 添加任务结果页面
```javascript
// 任务完成后跳转到结果页
uni.navigateTo({
  url: `/pages/task/result?taskId=${taskId}&score=${finalScore}`
})
```

### 3. 后退拦截
```javascript
// 任务模式下拦截返回
onBackPress(() => {
  if (isTaskMode.value && !taskCompleted.value) {
    uni.showModal({
      title: '确认退出',
      content: '退出将保存当前进度，是否继续？',
      success: (res) => {
        if (res.confirm) {
          saveTaskProgress()
          uni.navigateBack()
        }
      }
    })
    return true // 阻止默认返回
  }
})
```

## 四、数据流程

1. **进入任务模式** → 加载任务信息 → 初始化进度
2. **学习过程** → 记录每个答题结果 → 实时保存进度
3. **完成任务** → 计算总分 → 提交结果 → 显示成绩
4. **异常退出** → 保存进度 → 下次可继续

## 五、API 需求

1. **获取任务详情**：`GET /api/tasks/{taskId}`
2. **提交任务结果**：`POST /api/tasks/{taskId}/submit`
3. **保存任务进度**：`POST /api/tasks/{taskId}/progress`
4. **获取任务进度**：`GET /api/tasks/{taskId}/progress`