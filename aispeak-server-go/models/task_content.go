package models

import (
	"encoding/json"
	"errors"

	"gorm.io/gorm"
)

// ContentType 内容类型枚举
type ContentType string

const (
	ContentTypeDictation      ContentType = "dictation"        // 单词听写
	ContentTypeSpelling       ContentType = "spelling"         // 单词拼写
	ContentTypePronunciation  ContentType = "pronunciation"    // 发音测评
	ContentTypeSentenceRepeat ContentType = "sentence_repeat"  // 句子跟读
	ContentTypeQuiz           ContentType = "quiz"             // 小测验
)

// ValidContentTypes 返回所有有效的内容类型
func ValidContentTypes() []ContentType {
	return []ContentType{
		ContentTypeDictation,
		ContentTypeSpelling,
		ContentTypePronunciation,
		ContentTypeSentenceRepeat,
		ContentTypeQuiz,
	}
}

// IsValid 检查内容类型是否有效
func (ct ContentType) IsValid() bool {
	for _, validType := range ValidContentTypes() {
		if ct == validType {
			return true
		}
	}
	return false
}

// ValidateTaskTypeAndContentType 验证任务类型和内容类型是否匹配
func ValidateTaskTypeAndContentType(taskType TaskType, contentType ContentType) error {
	// 验证内容类型是否有效
	if !contentType.IsValid() {
		return errors.New("无效的内容类型")
	}

	// 基于任务类型验证内容类型
	switch taskType {
	case Dictation:
		// 听写任务只能包含听写内容
		if contentType != ContentTypeDictation {
			return errors.New("听写任务只能包含听写内容")
		}
	case Pronunciation:
		if contentType != ContentTypePronunciation {
			return errors.New("发音测评任务只能包含发音测评内容")
		}
	case SentenceRepeat:
		// 句子跟读任务只能包含句子跟读内容
		if contentType != ContentTypeSentenceRepeat {
			return errors.New("句子跟读任务只能包含句子跟读内容")
		}
	case Spelling:
		// 拼写任务只能包含拼写内容
		if contentType != ContentTypeSpelling {
			return errors.New("拼写任务只能包含拼写内容")
		}
	case Quiz:
		// 测验任务可以包含多种内容类型
		// 这里不做限制，所有内容类型都被允许
	default:
		// 对于其他任务类型，可以根据需要添加验证规则
		// 如果没有特定规则，则默认允许任何有效的内容类型
	}

	return nil
}

// TaskContent 任务内容模型
type TaskContent struct {
	gorm.Model
	TaskID       uint   `gorm:"index;comment:所属任务ID"` // 必须保留这个字段
	ContentType  string `gorm:"size:50;index;comment:内容类型（dictation/spelling/...）"`
	
	// 增加生成模式标识
	GenerateMode string `gorm:"size:20;default:'auto';comment:生成模式(auto/manual)"`
	
	// 保留教材单元关联用于自动生成
	RefBookID    string `gorm:"size:50;index;comment:关联教材ID"`
	RefLessonID  int    `gorm:"index;comment:关联单元ID"`
	
	// 新增手动选择字段
	SelectedWordIDs    []int32 `gorm:"type:json;serializer:json;comment:手动选择的单词ID列表"`
	SelectedSentenceIDs []int32 `gorm:"type:json;serializer:json;comment:手动选择的句子ID列表"`
	
	Points       int    `gorm:"comment:分值"`
	Metadata     JSON   `gorm:"type:json;comment:元数据"`
	OrderNum     int    `gorm:"comment:排序号"`
}

// 听写任务元数据
type DictationMetadata struct {
	WordIDs    []int32 `json:"word_ids"`    // 单词ID列表
	AudioType  string  `json:"audio_type"`  // 音频类型（如male_voice、female_voice等）
	TimeLimit  int     `json:"time_limit"`  // 时间限制（秒）
	PlayCount  int     `json:"play_count"`  // 播放次数
	Words      []Word  `json:"words,omitempty"` // 单词实体数据（返回给前端但不存储）
}

// SpellingMetadata 拼写任务元数据
type SpellingMetadata struct {
	WordIDs      []int32 `json:"word_ids"`      // 需要拼写的单词ID列表
	TimeLimit    int     `json:"time_limit"`    // 时间限制
	ShowHint     bool    `json:"show_hint"`     // 是否显示提示（如首字母）
	Words        []Word  `json:"words,omitempty"` // 单词实体数据
}

// PronunciationMetadata 发音测评任务元数据
type PronunciationMetadata struct {
	WordIDs       []int32 `json:"word_ids"`       // 需要评测的单词ID列表
	SentenceIDs   []int32 `json:"sentence_ids"`   // 需要评测的句子ID列表
	ScoreThreshold int    `json:"score_threshold"` // 通过分数线
	Words         []Word  `json:"words,omitempty"` // 单词实体数据
	Sentences     []LessonSentence `json:"sentences,omitempty"` // 句子实体数据
}

// 句子跟读任务元数据
type SentenceRepeatMetadata struct {
	SentenceIDs []int32 `json:"sentence_ids"` // 句子ID列表
	RepeatCount int     `json:"repeat_count"` // 重复次数要求
	Sentences   []LessonSentence `json:"sentences,omitempty"` // 句子实体数据
}

// QuizMetadata 测验任务元数据
type QuizMetadata struct {
	Questions     []QuizQuestion `json:"questions"`     // 问题列表
	TimeLimit     int            `json:"time_limit"`    // 时间限制
	ShuffleOrder  bool           `json:"shuffle_order"` // 是否打乱题目顺序
}

type QuizQuestion struct {
	Type          string  `json:"type"`          // 题目类型（单选、多选、填空等）
	Content       string  `json:"content"`       // 题目内容
	Options       []string `json:"options"`      // 选项（选择题）
	CorrectAnswer string  `json:"correct_answer"` // 正确答案
	Score         int     `json:"score"`         // 题目分值
}

// GetDictationMetadata 获取听写任务元数据
func (tc *TaskContent) GetDictationMetadata() (*DictationMetadata, error) {
	if tc.Metadata == nil {
		return &DictationMetadata{}, nil
	}

	// Marshal to JSON, then Unmarshal to meta struct
	data, err := json.Marshal(tc.Metadata)
	if err != nil {
		return nil, err
	}

	var meta DictationMetadata
	if err := json.Unmarshal(data, &meta); err != nil {
		return nil, err
	}

	// 修正 words 字段类型（兼容 map[string]interface{} 反序列化）
	var m map[string]interface{}
	metadataBytes, err := json.Marshal(tc.Metadata)
	if err != nil {
		return nil, errors.New("failed to marshal Metadata to JSON")
	}
	metadataStr := string(metadataBytes)
	if err := json.Unmarshal([]byte(metadataStr), &m); err == nil {
		if rawWords, ok := m["words"]; ok && rawWords != nil {
			if arr, ok := rawWords.([]interface{}); ok {
				// Convert interface{} slice to Word slice
				var words []Word
				for _, item := range arr {
					if word, ok := item.(map[string]interface{}); ok {
						// Convert map to Word struct with safe type assertions
						var term, phonetic string
						if t, ok := word["term"].(string); ok {
							term = t
						}
						if p, ok := word["phonetic"].(string); ok {
							phonetic = p
						}
						
						w := Word{
							WordID:   int32(word["id"].(float64)),
							Word:     &term,      // Convert to string pointer
							Phonetic: &phonetic,  // Convert to string pointer
							// ... add other Word fields as needed ...
						}
						words = append(words, w)
					}
				}
				meta.Words = words  // Now assigning correct type
				// Extract word IDs
				var wordIDs []int32
				for _, item := range arr {
					if wordMap, ok := item.(map[string]interface{}); ok {
						if id, ok := wordMap["id"].(float64); ok {
							wordIDs = append(wordIDs, int32(id))
						}
					}
				}
				meta.WordIDs = wordIDs
			}
		}
	}

	return &meta, nil
}



// SetDictationMetadata 设置听写任务元数据
func (tc *TaskContent) SetDictationMetadata(meta *DictationMetadata) error {
	data, err := json.Marshal(meta)
	if err != nil {
		return err
	}
	
	var jsonMap map[string]interface{}
	if err := json.Unmarshal(data, &jsonMap); err != nil {
		return err
	}
	
	tc.Metadata = jsonMap
	return nil
}

// GetSentenceRepeatMetadata gets sentence repeat metadata
func (tc *TaskContent) GetSentenceRepeatMetadata() (*SentenceRepeatMetadata, error) {
	if tc.Metadata == nil {
		return &SentenceRepeatMetadata{}, nil
	}
	
	data, err := json.Marshal(tc.Metadata)
	if err != nil {
		return nil, err
	}
	
	var meta SentenceRepeatMetadata
	if err := json.Unmarshal(data, &meta); err != nil {
		return nil, err
	}
	
	return &meta, nil
}

// SetSentenceRepeatMetadata sets sentence repeat metadata
func (tc *TaskContent) SetSentenceRepeatMetadata(meta *SentenceRepeatMetadata) error {
	data, err := json.Marshal(meta)
	if err != nil {
		return err
	}
	
	var jsonMap map[string]interface{}
	if err := json.Unmarshal(data, &jsonMap); err != nil {
		return err
	}
	
	tc.Metadata = jsonMap
	return nil
}

// GetPronunciationMetadata 获取发音测评任务元数据
func (tc *TaskContent) GetPronunciationMetadata() (*PronunciationMetadata, error) {
    if tc.Metadata == nil {
        return &PronunciationMetadata{}, nil
    }
    data, err := json.Marshal(tc.Metadata)
    if err != nil {
        return nil, err
    }
    var meta PronunciationMetadata
    if err := json.Unmarshal(data, &meta); err != nil {
        return nil, err
    }
    return &meta, nil
}

// SetPronunciationMetadata 设置发音测评任务元数据
func (tc *TaskContent) SetPronunciationMetadata(meta *PronunciationMetadata) error {
    data, err := json.Marshal(meta)
    if err != nil {
        return err
    }
    var jsonMap map[string]interface{}
    if err := json.Unmarshal(data, &jsonMap); err != nil {
        return err
    }
    tc.Metadata = jsonMap
    return nil
}

// ValidateContentType 验证内容类型
func (tc *TaskContent) ValidateContentType() error {
	contentType := ContentType(tc.ContentType)
	return ValidateContentTypeOnly(contentType)
}

// ValidateContentTypeOnly 只验证内容类型是否有效
func ValidateContentTypeOnly(contentType ContentType) error {
	if !contentType.IsValid() {
		return errors.New("无效的内容类型")
	}
	return nil
}

// CreateTaskContentRequest 结构体
type CreateTaskContentRequest struct {
	// ... 其他字段 ...
	SelectedWordIDs     []int32 `json:"selected_word_ids"`
	SelectedSentenceIDs []int32 `json:"selected_sentence_ids"`
	// ... 其他字段 ...
}

