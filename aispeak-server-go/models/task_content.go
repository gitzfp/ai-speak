package models

import (
	"encoding/json"
	"gorm.io/gorm"
)

// TaskContent 任务内容模型
type TaskContent struct {
    gorm.Model
    TaskID       uint   `gorm:"index;comment:所属任务ID"`
    ContentType  string `gorm:"size:50;index;comment:内容类型（dictation/spelling/...）"`
    
    // 增加生成模式标识
    GenerateMode string `gorm:"size:20;default:'auto';comment:生成模式(auto/manual)"`
    
    // 保留教材单元关联用于自动生成
    RefBookID    string `gorm:"size:50;index;comment:关联教材ID"`
    RefLessonID  int    `gorm:"index;comment:关联单元ID"`
    
    // 新增手动选择字段
    SelectedWordIDs    JSON `gorm:"type:json;comment:手动选择的单词ID列表"`
    SelectedSentenceIDs JSON `gorm:"type:json;comment:手动选择的句子ID列表"`
    
    Points       int    `gorm:"comment:分值"`
    Metadata     JSON   `gorm:"type:json;comment:元数据"`
    OrderNum     int    `gorm:"comment:排序号"`
}

// 更新元数据结构
type DictationMetadata struct {
    // 改为存储单词ID代替文本
    WordIDs    []int32 `json:"word_ids"`    // 单词ID列表
    AudioType  string  `json:"audio_type"`  // 音频类型
    TimeLimit  int     `json:"time_limit"`
    PlayCount  int     `json:"play_count"`
}

type SentenceRepeatMetadata struct {
    SentenceIDs []int32 `json:"sentence_ids"` // 句子ID列表
    RepeatCount int     `json:"repeat_count"`
}

// GetDictationMetadata 获取听写任务元数据
func (tc *TaskContent) GetDictationMetadata() (*DictationMetadata, error) {
	if tc.Metadata == nil {
		return &DictationMetadata{}, nil
	}
	
	data, err := json.Marshal(tc.Metadata)
	if err != nil {
		return nil, err
	}
	
	var meta DictationMetadata
	if err := json.Unmarshal(data, &meta); err != nil {
		return nil, err
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

