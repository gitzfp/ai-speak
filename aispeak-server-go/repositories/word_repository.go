package repositories

import (
	"github.com/gitzfp/ai-speak/aispeak-server-go/models"
	"gorm.io/gorm"
)

type WordRepository struct {
	DB *gorm.DB
}

func NewWordRepository(db *gorm.DB) *WordRepository {
	return &WordRepository{DB: db}
}

func (r *WordRepository) GetByIDs(ids []int32) ([]models.Word, error) {
	var words []models.Word
	err := r.DB.Where("word_id IN ?", ids).Find(&words).Error
	return words, err
}

func (r *WordRepository) GetByLesson(bookID string, lessonID int) ([]models.Word, error) {
	var words []models.Word
	err := r.DB.Where("book_id = ? AND lesson_id = ?", bookID, lessonID).Find(&words).Error
	return words, err
}