package repositories

import (
	"errors"

	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"gorm.io/gorm"
)

type ContentRepository struct {
    DB *gorm.DB
}

// NewContentRepository 创建新的 ContentRepository 实例
func NewContentRepository(db *gorm.DB) *ContentRepository {
    return &ContentRepository{DB: db}
}

// IsValidForLesson 检查所选单词 ID 是否与给定的教材和单元匹配
func (r *ContentRepository) IsValidForLesson(refBookID string, refLessonID int, selectedWordIDs []int32) bool {
    // 实现逻辑来检查所选单词 ID 是否有效
    // 这里可以根据你的业务逻辑进行查询
    // 例如，检查单词是否属于指定的教材和单元
    return true // 占位符返回值，替换为实际逻辑
}

// GetSentencesByIDs 根据句子 ID 获取句子
func (r *ContentRepository) GetSentencesByIDs(ids []int32) ([]models.LessonSentence, error) {
    var sentences []models.LessonSentence
    err := r.DB.Where("id IN ?", ids).Find(&sentences).Error
    return sentences, err
}

// GetSentencesByLesson 根据教材 ID 和单元 ID 获取句子
func (r *ContentRepository) GetSentencesByLesson(bookID string, lessonID int) ([]models.LessonSentence, error) {
    var sentences []models.LessonSentence
    err := r.DB.Where("book_id = ? AND lesson_id = ?", bookID, lessonID).Find(&sentences).Error
    return sentences, err
}

// GetLessons 获取所有教材
func (r *ContentRepository) GetLessons() ([]models.Lesson, error) {
    var lessons []models.Lesson
    err := r.DB.Find(&lessons).Error
    return lessons, err
}

// validateWordIDs 验证单词 ID 是否存在并检查重复
func (r *ContentRepository) validateWordIDs(wordIDs []int32) error {
    seen := make(map[int32]bool)
    for _, id := range wordIDs {
        if seen[id] {
            return errors.New("单词ID重复")
        }
        seen[id] = true

        var word models.Word
        err := r.DB.Where("id = ?", id).First(&word).Error
        if err != nil {
            return err
        }
        if word.ID == 0 {
            return errors.New("单词ID不存在")
        }
    }
    return nil
}      