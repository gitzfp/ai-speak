from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.services.textbook_service import TextbookService
from app.db import get_db
from app.models.response import ApiResponse
from typing import List
from pydantic import BaseModel

router = APIRouter()


@router.get("/textbooks", response_model=ApiResponse)
def get_textbooks(
    version: str = Query("全部"),
    grade: str = Query("全部"),
    term: str = Query("全部"),
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = TextbookService(db)
        result = service.get_all_textbooks(version, grade, term)
        if result is None:
            return ApiResponse.error("未找到教材列表")
        return ApiResponse.success(result)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/textbook/{textbook_id}", response_model=ApiResponse)
def get_textbook_detail(
    textbook_id: str,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = TextbookService(db)
        result = service.get_textbook_detail(textbook_id)
        
        if result is None:
            return ApiResponse.error("教材不存在")

        return ApiResponse.success(result)

    except Exception as e:
        return ApiResponse.system_error(str(e))
    

@router.get("/textbook/{textbook_id}/category/{category_id}/courses", response_model=ApiResponse)
def get_course_detail(
    textbook_id: str,
    category_id: str,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = TextbookService(db)
        result = service.get_course_detail(textbook_id, category_id)
        
        if result is None:
            return ApiResponse.error("未找到相关课程")

        return ApiResponse.success(result)

    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/textbook/{textbook_id}/category/{category_id}/lessons", response_model=ApiResponse)
def get_course_detail(
    textbook_id: str,
    category_id: str,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = TextbookService(db)
        result = service.get_all_lessions(textbook_id, category_id)
        
        if result is None:
            return ApiResponse.error("未找到相关课程")

        return ApiResponse.success(result)

    except Exception as e:
        return ApiResponse.system_error(str(e))
    
@router.get("/textbook/lesson/{lesson_id}", response_model=ApiResponse)
def get_lesson_detail(
    lesson_id: str,
    db: Session = Depends(get_db)
) -> ApiResponse:
    """
    获取课程单元详细信息
    """
    try:
        service = TextbookService(db)
        result = service.get_lesson_detail(lesson_id)
        
        if result is None:
            return ApiResponse.error("课程单元不存在")

        return ApiResponse.success(result)

    except Exception as e:
        return ApiResponse.system_error(str(e))


@router.get("/textbook/{book_id}/words", response_model=ApiResponse)
@router.get("/textbook/{book_id}/lesson/{lesson_id}/words", response_model=ApiResponse)
def get_lesson_words(
    book_id: str,
    lesson_id: str = None,
    db: Session = Depends(get_db)
) -> ApiResponse:
    """
    获取课程单元的单词列表，如果不传 lesson_id 则返回所有单元的单词
    """
    try:
        service = TextbookService(db)
        result = service.get_lesson_words(book_id, lesson_id)

        if result is None:
            return ApiResponse.error("未找到单词列表")

        return ApiResponse.success(result)

    except Exception as e:
        return ApiResponse.system_error(str(e))

class WordListRequest(BaseModel):
    words: List[str]

@router.post("/textbook/{book_id}/words/details", response_model=ApiResponse)
def get_words_details(
    book_id: str,
    word_list: WordListRequest,
    db: Session = Depends(get_db)
) -> ApiResponse:
    """
    获取指定单词列表的详细信息和音节信息
    """
    try:
        service = TextbookService(db)
        result = service.get_words_with_syllables(book_id, word_list.words)

        if result is None:
            return ApiResponse.error("未找到单词信息")

        return ApiResponse.success(result)

    except Exception as e:
        return ApiResponse.system_error(str(e))
