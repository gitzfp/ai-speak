package repositories

import (
	"fmt"

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
    // Import fmt package at the top of the file to fix undefined fmt error
    fmt.Printf("Executing SQL query: SELECT * FROM words WHERE id IN (%v)\n", ids)
    err := r.DB.Where("id IN ?", ids).Find(&words).Error
    return words, err
}

func (r *WordRepository) GetByLesson(bookID string, lessonID int) ([]models.Word, error) {
	var words []models.Word
	err := r.DB.Where("book_id = ? AND lesson_id = ?", bookID, lessonID).Find(&words).Error
	return words, err
}

func (r *WordRepository) Exists(id int32) (bool, error) {
    var count int64
    err := r.DB.Model(&models.Word{}).Where("id = ?", id).Count(&count).Error
    return count > 0, err
}