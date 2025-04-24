// ... existing code ...

type CreateTaskContentRequest struct {
    ContentType         string          `json:"content_type"`
    ContentID           *uint           `json:"content_id"`
    CustomContent       string          `json:"custom_content"`
    Points              int             `json:"points"`
    Difficulty          string          `json:"difficulty" binding:"omitempty,oneof=easy medium hard"`
    Metadata            models.JSON     `json:"metadata"`
    OrderNum            int             `json:"order_num"`
    RefBookID           string          `json:"ref_book_id"`
    RefLessonID         int             `json:"ref_lesson_id"`
    SelectedWordIDs     []int32         `json:"selected_word_ids"`      // Changed from interface{} to []int32
    SelectedSentenceIDs []int32         `json:"selected_sentence_ids"` // Changed from interface{} to []int32
}

// ... existing code ...

// In the CreateTask handler function:
for _, reqContent := range req.Contents {
    content := &models.TaskContent{
        ContentType:  reqContent.ContentType,
        GenerateMode: "manual",
        RefBookID:    reqContent.RefBookID,
        RefLessonID:  reqContent.RefLessonID,
        Points:       reqContent.Points,
        Metadata:     reqContent.Metadata, // Direct assignment now works
        OrderNum:     reqContent.OrderNum,
    }

    // Simplified field assignments
    content.SelectedWordIDs = reqContent.SelectedWordIDs
    content.SelectedSentenceIDs = reqContent.SelectedSentenceIDs

    modelContents = append(modelContents, content)
}

// ... rest of the existing code ...