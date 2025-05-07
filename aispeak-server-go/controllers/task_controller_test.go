package controllers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// MockTaskService 模拟任务服务
type MockTaskService struct {
	mock.Mock
}

func (m *MockTaskService) CreateTaskWithContents(task *models.Task, contents []*models.TaskContent) error {
	args := m.Called(task, contents)
	return args.Error(0)
}

func (m *MockTaskService) GetTaskDetails(id uint) (*models.Task, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Task), args.Error(1)
}

// 新增下面这些方法，哪怕测试用不到也要有
func (m *MockTaskService) ListTasks(teacherID, status string, page, pageSize int) ([]models.Task, error) {
    args := m.Called(teacherID, status, page, pageSize)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).([]models.Task), args.Error(1)
}

func (m *MockTaskService) UpdateTask(task *models.Task) error {
    args := m.Called(task)
    return args.Error(0)
}

func (m *MockTaskService) DeleteTask(id uint) error {
    args := m.Called(id)
    return args.Error(0)
}

func (m *MockTaskService) CreateSubmission(submission *models.Submission) error {
    args := m.Called(submission)
    return args.Error(0)
}

func (m *MockTaskService) GetSubmissionDetails(id uint) (*models.Submission, error) {
    args := m.Called(id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*models.Submission), args.Error(1)
}

func (m *MockTaskService) ListSubmissions(taskID uint, page, pageSize int) ([]models.Submission, error) {
    args := m.Called(taskID, page, pageSize)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).([]models.Submission), args.Error(1)
}

func (m *MockTaskService) UpdateSubmission(submission *models.Submission) error {
    args := m.Called(submission)
    return args.Error(0)
}

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	return router
}

// 公共测试环境初始化
func setupTestEnv() (*gin.Engine, *MockTaskService, *TaskController) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	return router, mockService, controller
}

// 测试组：基本验证
func TestCreateTask_BasicValidation(t *testing.T) {
	router, _, controller := setupTestEnv() // Ignore mockService using _
	router.POST("/tasks", controller.CreateTask)

	// 测试用例1: 任务标题为空
	t.Run("EmptyTitle", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "dictation",
					Points:             100,
					OrderNum:           1,
					SelectedWordIDs:    []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例2: 任务标题过长
	t.Run("TitleTooLong", func(t *testing.T) {
		longTitle := make([]byte, 201)
		for i := range longTitle {
			longTitle[i] = 'a'
		}
		reqBody := CreateTaskRequest{
			Title:    string(longTitle),
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "dictation",
					Points:             100,
					OrderNum:           1,
					SelectedWordIDs:    []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 标题正好200字符
	t.Run("TitleAtMaxLength", func(t *testing.T) {
		maxTitle := make([]byte, 200)
		for i := range maxTitle {
			maxTitle[i] = 'a'
		}
		reqBody := CreateTaskRequest{
			Title:    string(maxTitle),
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{{
				ContentType: "dictation", Points: 100, OrderNum: 1, SelectedWordIDs: []int32{1}, GenerateMode: "manual",
			}},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code) // 如果允许200则改为StatusOK
	})

	// 内容数组为空
	t.Run("EmptyContents", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Test Task",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Field validation for 'Contents' failed on the 'min' tag")
	})

	// Points为0
	t.Run("ZeroPoints", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Test Task",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{{
				ContentType: "dictation", Points: 0, OrderNum: 1, SelectedWordIDs: []int32{1}, GenerateMode: "manual",
			}},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "内容分值总和必须为100")
	})

	// Points为负数
	t.Run("NegativePoints", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Test Task",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{{
				ContentType: "dictation", Points: -10, OrderNum: 1, SelectedWordIDs: []int32{1}, GenerateMode: "manual",
			}},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "内容分值总和必须为100")
	})

	// 缺失必填字段 Points
	t.Run("MissingPoints", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"title":    "Test Task",
			"task_type": models.Dictation,
			"subject":  models.English,
			"contents": []map[string]interface{}{{
				"content_type": "dictation",
				"order_num":    1,
				"selected_word_ids": []int32{1},
				"generate_mode": "manual",
			}},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "内容分值总和必须为100")
	})
}

// 测试组：任务状态验证
func TestCreateTask_StatusValidation(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.POST("/tasks", controller.CreateTask)

	// 测试用例1: 已发布任务未设置截止时间
	t.Run("PublishedWithoutDeadline", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "dictation",
					Points:             100,
					OrderNum:           1,
					SelectedWordIDs:    []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例2: 已发布任务截止时间已过
	t.Run("PublishedWithExpiredDeadline", func(t *testing.T) {
		expiredDeadline := time.Now().Add(-24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Status:   models.Published,
			Deadline: &expiredDeadline,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "dictation",
					Points:             100,
					OrderNum:           1,
					SelectedWordIDs:    []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}
		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{}, nil)
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// 测试组：内容验证
func TestCreateTask_ContentValidation(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.POST("/tasks", controller.CreateTask)

	// 测试用例1: 任务类型和内容类型不匹配
	t.Run("MismatchedTaskAndContentType", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "sentence_repeat",
					Points:             100,
					OrderNum:           1,
					SelectedSentenceIDs: []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例2: 自动生成模式缺少必要参数
	t.Run("AutoModeMissingRequiredParams", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:   "dictation",
					Points:       100,
					OrderNum:     1,
					GenerateMode: "auto",
				},
			},
		}

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{}, nil) // Add this line
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例3: 手动选择模式缺少必要参数
	t.Run("ManualModeMissingRequiredParams", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:   "dictation",
					Points:       100,
					OrderNum:     1,
					GenerateMode: "manual",
				},
			},
		}

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例4: 内容分值总和不为100
	t.Run("InvalidTotalPoints", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 综合测验",
			TaskType: models.Quiz,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "dictation",
					Points:             60,
					OrderNum:           1,
					SelectedWordIDs:    []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
				{
					ContentType:         "sentence_repeat",
					Points:             50,
					OrderNum:           2,
					SelectedSentenceIDs: []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例5: SelectedWordIDs包含不存在的单词ID
	t.Run("SelectedWordIDs包含不存在的单词ID", func(t *testing.T) {
		mockService.ExpectedCalls = nil // 重置 Mock 期望
		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).
			Return(errors.New("单词ID不存在")).Once()
		
		deadline := time.Now().Add(24 * time.Hour)
		var reqBody CreateTaskRequest = CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:      "dictation",
					Points:          100,
					OrderNum:        1,
					SelectedWordIDs: []int32{999}, // Using non-existent ID
					GenerateMode:    "manual",
				},
			},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "单词ID不存在")
		mockService.AssertExpectations(t)
	})

	// 测试用例6: SelectedWordIDs为空数组
	t.Run("SelectedWordIDs为空数组", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:      "dictation",
					Points:           100,
					OrderNum:         1,
					SelectedWordIDs:  []int32{}, // 为空
					GenerateMode:     "manual",
				},
			},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "selected_word_ids")
		mockService.AssertExpectations(t)
	})

	// 测试用例7: SelectedWordIDs有重复ID
	t.Run("SelectedWordIDs有重复ID", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:      "dictation",
					Points:           100,
					OrderNum:         1,
					SelectedWordIDs:  []int32{1, 1}, // 有重复ID
					GenerateMode:     "manual",
				},
			},
		}
		// 移除 mockService.On(...) 调用，因为 Controller 层会直接拦截
		// mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).
		// 	Return(errors.New("单词ID重复")).Once()

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "单词ID重复")
		// 移除 mockService.AssertExpectations(t)，因为没有设置期望
		// mockService.AssertExpectations(t)
	})

	// 测试用例8: SelectedWordIDs与教材单元不匹配
	t.Run("SelectedWordIDs与教材单元不匹配", func(t *testing.T) {
		mockService.ExpectedCalls = nil
		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).
			Return(errors.New("单词不属于指定教材单元")).Once()

		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词听写",
			TaskType: models.Dictation,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:      "dictation",
					Points:           100,
					OrderNum:         1,
					SelectedWordIDs:  []int32{1, 2, 3},
					RefBookID:        "bookA",
					RefLessonID:      1,
					GenerateMode:     "manual",
				},
			},
		}
		
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "单词不属于指定教材单元")
		mockService.AssertExpectations(t)
	})

	// 新增测试用例9: 重复的OrderNum (This should be inside the function)
	t.Run("DuplicateOrderNum", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Test Task",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{
				{ContentType: "dictation", Points: 50, OrderNum: 1, SelectedWordIDs: []int32{1}, GenerateMode: "manual"},
				{ContentType: "dictation", Points: 50, OrderNum: 1, SelectedWordIDs: []int32{2}, GenerateMode: "manual"}, // 重复 OrderNum
			},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "内容排序号重复")
	})

	// 新增测试用例10: 无效的GenerateMode (This should also be inside the function)
	t.Run("InvalidGenerateMode", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "Test Task",
			TaskType: models.Dictation,
			Subject:  models.English,
			Contents: []CreateTaskContentRequest{
				{ContentType: "dictation", Points: 100, OrderNum: 1, GenerateMode: "invalid_mode"}, // 无效 GenerateMode
			},
		}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "generate_mode无效")
	})
} // <-- This is the closing brace for TestCreateTask_ContentValidation

// TestCreateTask_SuccessScenarios tests successful task creation scenarios
func TestCreateTask_SuccessScenarios(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.POST("/tasks", controller.CreateTask)

	// 测试用例1: 正常创建听写任务
	t.Run("CreateDictationTask", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:       "Unit 1 单词听写",
			TaskType:    models.Dictation,
			Subject:     models.English,
			Description: "测试听写任务",
			Deadline:    &deadline,
			Status:      models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "dictation",
					Points:             100,
					OrderNum:           1,
					SelectedWordIDs:    []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}

		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{
			Model: gorm.Model{ID: 1},
			Title: reqBody.Title,
		}, nil)

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例2: 创建句子跟读任务
	t.Run("CreateSentenceRepeatTask", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 句子跟读",
			TaskType: models.SentenceRepeat,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "sentence_repeat",
					Points:             100,
					OrderNum:           1,
					SelectedSentenceIDs: []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}

		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{
			Model: gorm.Model{ID: 1},
			Title: reqBody.Title,
		}, nil)

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例3: 创建混合内容类型的测验任务
	t.Run("CreateMixedContentQuizTask", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 综合测验",
			TaskType: models.Quiz,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "dictation",
					Points:             50,
					OrderNum:           1,
					SelectedWordIDs:    []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
				{
					ContentType:         "sentence_repeat",
					Points:             50,
					OrderNum:           2,
					SelectedSentenceIDs: []int32{1, 2, 3},
					GenerateMode:       "manual",
				},
			},
		}

		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{
			Model: gorm.Model{ID: 1},
			Title: reqBody.Title,
		}, nil)

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例4: 创建单词拼写任务
	t.Run("CreateSpellingTask", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 单词拼写",
			TaskType: models.Spelling,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:      "spelling",
					Points:           100,
					OrderNum:         1,
					SelectedWordIDs:  []int32{1, 2, 3, 4, 5},
					GenerateMode:     "manual",
				},
			},
		}

		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{
			Model: gorm.Model{ID: 1},
			Title: reqBody.Title,
		}, nil)

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例5: 创建口语测评任务
	t.Run("CreateSpeakingAssessmentTask", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "Unit 1 口语测评",
			TaskType: models.Pronunciation,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "pronunciation",
					Points:              100,
					OrderNum:            1,
					SelectedSentenceIDs: []int32{10, 11, 12},
					GenerateMode:        "manual",
				},
			},
		}

		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{
			Model: gorm.Model{ID: 1},
			Title: reqBody.Title,
		}, nil)

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例6: 创建草稿状态的任务
	t.Run("CreateDraftTask", func(t *testing.T) {
		reqBody := CreateTaskRequest{
			Title:    "草稿状态的听写任务",
			TaskType: models.Dictation,
			Subject:  models.English,
			Status:   models.Draft, // 草稿状态不需要截止时间
			Contents: []CreateTaskContentRequest{
				{
					ContentType:      "dictation",
					Points:           100,
					OrderNum:         1,
					SelectedWordIDs:  []int32{1, 2, 3},
					GenerateMode:     "manual",
				},
			},
		}

		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{
			Model: gorm.Model{ID: 1},
			Title: reqBody.Title,
		}, nil)

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例7: 使用自动生成模式创建任务
	t.Run("CreateTaskWithAutoMode", func(t *testing.T) {
		deadline := time.Now().Add(24 * time.Hour)
		reqBody := CreateTaskRequest{
			Title:    "自动生成的听写任务",
			TaskType: models.Dictation,
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:   "dictation",
					Points:        100,
					OrderNum:      1,
					GenerateMode:  "auto",
					RefBookID:     "bookA",
					RefLessonID:   1,
				},
			},
		}

		mockService.On("CreateTaskWithContents", mock.Anything, mock.Anything).Return(nil)
		mockService.On("GetTaskDetails", mock.Anything).Return(&models.Task{
			Model: gorm.Model{ID: 1},
			Title: reqBody.Title,
		}, nil)

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockService.AssertExpectations(t)
	})
}


// 新增测试组 TestCreateTask_TypeValidation
func TestCreateTask_TypeValidation(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.POST("/tasks", controller.CreateTask)

	// 测试用例1: 无效任务类型
	t.Run("InvalidTaskType", func(t *testing.T) {
		reqBody := CreateTaskRequest{TaskType: "invalid_type"}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例2: 无效学科类型
	t.Run("InvalidSubjectType", func(t *testing.T) {
		reqBody := CreateTaskRequest{Subject: "invalid_subject"}
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// 新增测试组 TestUpdateTask
func TestUpdateTask(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.PUT("/tasks/:id", controller.UpdateTask)

	// 测试用例1: 成功更新任务
	t.Run("Success", func(t *testing.T) {
		taskID := 1
		reqBody := UpdateTaskRequest{
			Title: "Updated Task Title",
			Description: "Updated description",
			Status: models.Published,
			Deadline: func() *time.Time {
				t := time.Now().Add(24 * time.Hour)
				return &t
			}(),
		}

		mockService.On("UpdateTask", mock.Anything).Return(nil).Once()
		
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", fmt.Sprintf("/tasks/%d", taskID), bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例2: 无效ID格式
	t.Run("InvalidIDFormat", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", "/tasks/invalid", nil)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例3: 任务不存在
	t.Run("TaskNotFound", func(t *testing.T) {
		taskID := 999
		reqBody := UpdateTaskRequest{
			Title: "Updated Task Title",
		}

		mockService.On("UpdateTask", mock.Anything).Return(gorm.ErrRecordNotFound).Once()
		
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", fmt.Sprintf("/tasks/%d", taskID), bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例4: 已发布任务缺少截止时间
	t.Run("PublishedWithoutDeadline", func(t *testing.T) {
		taskID := 1
		reqBody := UpdateTaskRequest{
			Title: "Updated Task Title",
			Status: models.Published,
			Deadline: nil, // 故意不设置截止时间
		}
		
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("PUT", fmt.Sprintf("/tasks/%d", taskID), bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// 新增测试组 TestDeleteTask
func TestDeleteTask(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.DELETE("/tasks/:id", controller.DeleteTask)

	// 测试用例1: 成功删除任务
	t.Run("Success", func(t *testing.T) {
		taskID := 1
		mockService.On("DeleteTask", uint(taskID)).Return(nil).Once()
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", fmt.Sprintf("/tasks/%d", taskID), nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
		mockService.AssertExpectations(t)
	})

	// 测试用例2: 无效ID格式
	t.Run("InvalidIDFormat", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", "/tasks/invalid", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例3: 任务不存在
	t.Run("TaskNotFound", func(t *testing.T) {
		taskID := 999
		mockService.On("DeleteTask", uint(taskID)).Return(gorm.ErrRecordNotFound).Once()
		
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("DELETE", fmt.Sprintf("/tasks/%d", taskID), nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		mockService.AssertExpectations(t)
	})
}

// TestSubmitTask tests the functionality of submitting task responses
func TestSubmitTask(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.POST("/tasks/:id/submissions", controller.SubmitTask)

	// 测试用例1: 成功提交任务
	t.Run("SuccessfulSubmission", func(t *testing.T) {
		reqBody := SubmitTaskRequest{
			ContentID: 1,
			Response:  "This is my response",
			AudioURL:  "https://example.com/audio.mp3",
			FileURL:   "https://example.com/file.pdf",
		}

		// 设置模拟服务的行为
		mockService.On("CreateSubmission", mock.AnythingOfType("*models.Submission")).Return(nil).Once()
		
		// 通过模拟往返请求
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks/1/submissions", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusCreated, w.Code)
		var response SubmissionResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, uint(1), response.ContentID)
		mockService.AssertExpectations(t)
	})

	// 测试用例2: 无效请求体
	t.Run("InvalidRequestBody", func(t *testing.T) {
		// 发送无效的JSON
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks/1/submissions", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例3: 缺少必填字段
	t.Run("MissingRequiredField", func(t *testing.T) {
		reqBody := map[string]interface{}{
			// 缺少ContentID字段
			"response": "This is my response",
			"audio_url": "https://example.com/audio.mp3",
		}

		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks/1/submissions", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// 测试用例4: 服务层失败
	t.Run("ServiceLayerFailure", func(t *testing.T) {
		reqBody := SubmitTaskRequest{
			ContentID: 1,
			Response:  "This is my response",
		}

		// 设置模拟服务的行为 - 返回错误
		mockService.On("CreateSubmission", mock.AnythingOfType("*models.Submission")).
			Return(errors.New("任务内容不存在")).Once()
		
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/tasks/1/submissions", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "提交失败")
		mockService.AssertExpectations(t)
	})
}

// TestGetSubmission tests the functionality of retrieving submission details
func TestGetSubmission(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.GET("/submissions/:id", controller.GetSubmission)

	// 测试用例1: 成功获取提交记录
	t.Run("SuccessfulRetrieval", func(t *testing.T) {
		// 创建一个模拟的Submission对象
		score := 85.5
		isCorrect := true
		submission := &models.Submission{
			Model: gorm.Model{ID: 1, CreatedAt: time.Now()},
			StudentTaskID: 1,
			ContentID: 2,
			Response: "Test response",
			MediaFiles: models.MediaFiles{
				{
					URL:  "test.mp3",
					Type: "audio",
				},
    		},
			IsCorrect: &isCorrect,
			TeacherScore: &score,
			Feedback: "Good job!",
		}

		// 设置模拟服务的行为
		mockService.On("GetSubmissionDetails", uint(1)).Return(submission, nil).Once()
		
		// 模拟请求
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/submissions/1", nil)
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusOK, w.Code)
		var response SubmissionResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, uint(1), response.ID)
		assert.Equal(t, uint(1), response.StudentTaskID)
		assert.Equal(t, uint(2), response.ContentID)
		assert.Equal(t, "Test response", response.Response)
		assert.Equal(t, "Good job!", response.Feedback)
		mockService.AssertExpectations(t)
	})

	// 测试用例2: 记录不存在
	t.Run("RecordNotFound", func(t *testing.T) {
		// 设置模拟服务的行为 - 返回"记录不存在"错误
		mockService.On("GetSubmissionDetails", uint(999)).
			Return(nil, gorm.ErrRecordNotFound).Once()
		
		// 模拟请求
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/submissions/999", nil)
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusNotFound, w.Code)
		assert.Contains(t, w.Body.String(), "提交记录不存在")
		mockService.AssertExpectations(t)
	})

	// 测试用例3: 服务层错误
	t.Run("ServiceLayerError", func(t *testing.T) {
		// 设置模拟服务的行为 - 返回一般错误
		mockService.On("GetSubmissionDetails", uint(2)).
			Return(nil, errors.New("数据库错误")).Once()
		
		// 模拟请求
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/submissions/2", nil)
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "获取提交记录失败")
		mockService.AssertExpectations(t)
	})
}

// TestListSubmissions tests the functionality of listing submissions for a task
func TestListSubmissions(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.GET("/tasks/:task_id/submissions", controller.ListSubmissions)

	// 测试用例1: 成功获取提交列表
	t.Run("SuccessfulListing", func(t *testing.T) {
		// 创建一些模拟的提交记录
		score1 := 80.0
		score2 := 90.0
		isCorrect1 := true
		isCorrect2 := false
		
		submissions := []models.Submission{
			{
				Model: gorm.Model{ID: 1, CreatedAt: time.Now()},
				StudentTaskID: 5,
				ContentID: 1,
				Response: "Response 1",
				IsCorrect: &isCorrect1,
				TeacherScore: &score1,
			},
			{
				Model: gorm.Model{ID: 2, CreatedAt: time.Now()},
				StudentTaskID: 5,
				ContentID: 2,
				Response: "Response 2",
				IsCorrect: &isCorrect2,
				TeacherScore: &score2,
			},
		}

		// 设置模拟服务的行为
		mockService.On("ListSubmissions", uint(0), 1, 10).
			Return(submissions, nil).Once()
		
		// 模拟请求
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/tasks/5/submissions?page=1&page_size=10", nil)
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusOK, w.Code)
		var response ListSubmissionsResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, 2, response.Total)
		assert.Equal(t, 2, len(response.Submissions))
		assert.Equal(t, uint(1), response.Submissions[0].ID)
		assert.Equal(t, uint(2), response.Submissions[1].ID)
		mockService.AssertExpectations(t)
	})

	// 测试用例2: 空结果
	t.Run("EmptyResult", func(t *testing.T) {
		// 设置模拟服务的行为 - 返回空列表
		mockService.On("ListSubmissions", uint(0), 1, 10).
			Return([]models.Submission{}, nil).Once()
		
		// 模拟请求
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/tasks/6/submissions?page=1&page_size=10", nil)
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusOK, w.Code)
		var response ListSubmissionsResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, 0, response.Total)
		assert.Equal(t, 0, len(response.Submissions))
		mockService.AssertExpectations(t)
	})

	// 测试用例3: 服务层错误
	t.Run("ServiceLayerError", func(t *testing.T) {
		// 设置模拟服务的行为 - 返回错误
		mockService.On("ListSubmissions", uint(0), 1, 10).
			Return(nil, errors.New("数据库错误")).Once()
		
		// 模拟请求
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/tasks/7/submissions?page=1&page_size=10", nil)
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "查询失败")
		mockService.AssertExpectations(t)
	})
}

// TestGradeSubmission tests the functionality of grading a submission
func TestGradeSubmission(t *testing.T) {
	router := setupRouter()
	mockService := new(MockTaskService)
	controller := NewTaskController(mockService)
	router.POST("/submissions/:id/grade", controller.GradeSubmission)

	// 测试用例1: 成功评分
	t.Run("SuccessfulGrading", func(t *testing.T) {
		reqBody := GradeRequest{
			Score: 85.5,
			Feedback: "Good effort but needs improvement.",
		}

		// 创建一个模拟的Submission对象
		initialScore := 0.0
		submission := &models.Submission{
			Model: gorm.Model{ID: 1, CreatedAt: time.Now()},
			StudentTaskID: 1,
			ContentID: 2,
			Response: "Test response",
			TeacherScore: &initialScore,
		}

		// 设置模拟服务的行为
		mockService.On("GetSubmissionDetails", uint(1)).
			Return(submission, nil).Once()
		mockService.On("UpdateSubmission", mock.AnythingOfType("*models.Submission")).
			Return(nil).Once()
		
		// 模拟请求
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/submissions/1/grade", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusOK, w.Code)
		var response SubmissionResponse
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, uint(1), response.ID)
		assert.InDelta(t, 85.5, *response.TeacherScore, 0.01)
		assert.Equal(t, "Good effort but needs improvement.", response.Feedback)
		mockService.AssertExpectations(t)
	})

	// 测试用例2: 分数超范围
	t.Run("ScoreOutOfRange", func(t *testing.T) {
		reqBody := GradeRequest{
			Score: 150.0, // 超过100分
			Feedback: "Too high score.",
		}

		// 模拟请求
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/submissions/1/grade", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "分数必须在0-100之间")
	})

	// 测试用例3: 记录不存在
	t.Run("RecordNotFound", func(t *testing.T) {
		reqBody := GradeRequest{
			Score: 75.0,
			Feedback: "Good job.",
		}

		// 设置模拟服务的行为
		mockService.On("GetSubmissionDetails", uint(999)).
			Return(nil, errors.New("记录不存在")).Once()
		
		// 模拟请求
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/submissions/999/grade", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusNotFound, w.Code)
		assert.Contains(t, w.Body.String(), "提交记录不存在")
		mockService.AssertExpectations(t)
	})

	// 测试用例4: 更新失败
	t.Run("UpdateFailed", func(t *testing.T) {
		reqBody := GradeRequest{
			Score: 70.0,
			Feedback: "Not bad.",
		}

		// 创建一个模拟的Submission对象
		initialScore := 0.0
		submission := &models.Submission{
			Model: gorm.Model{ID: 2, CreatedAt: time.Now()},
			StudentTaskID: 1,
			ContentID: 2,
			TeacherScore: &initialScore,
		}

		// 设置模拟服务的行为
		mockService.On("GetSubmissionDetails", uint(2)).
			Return(submission, nil).Once()
		mockService.On("UpdateSubmission", mock.AnythingOfType("*models.Submission")).
			Return(errors.New("更新失败")).Once()
		
		// 模拟请求
		jsonData, _ := json.Marshal(reqBody)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/submissions/2/grade", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		// 验证结果
		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "评分失败")
		mockService.AssertExpectations(t)
	})
}