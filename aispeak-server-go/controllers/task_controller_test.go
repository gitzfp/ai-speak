package controllers

import (
	"bytes"
	"encoding/json"
	"errors"
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
			TaskType: models.Dictation, 
			Subject:  models.English,
			Deadline: &deadline,
			Status:   models.Published,
			Contents: []CreateTaskContentRequest{
				{
					ContentType:         "speaking_assessment",
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