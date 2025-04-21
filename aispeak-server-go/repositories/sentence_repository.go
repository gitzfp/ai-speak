package repositories

import (
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"gorm.io/gorm"
)

type SentenceRepository struct {
	DB *gorm.DB
}

func NewSentenceRepository(db *gorm.DB) *SentenceRepository {
	return &SentenceRepository{DB: db}
}

func (r *SentenceRepository) GetByIDs(ids []int32) ([]models.LessonSentence, error) {
	var sentences []models.LessonSentence
	err := r.DB.Where("id IN ?", ids).Find(&sentences).Error
	return sentences, err
}

func (r *SentenceRepository) GetByLesson(bookID string, lessonID int) ([]models.LessonSentence, error) {
	var sentences []models.LessonSentence
	err := r.DB.Where("book_id = ? AND lesson_id = ?", bookID, lessonID).Find(&sentences).Error
	return sentences, err
}