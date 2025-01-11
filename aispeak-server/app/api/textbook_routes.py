from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.textbook_service import TextbookService
from app.db import get_db
from app.models.response import ApiResponse

router = APIRouter()

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
    lesson_id: int,
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