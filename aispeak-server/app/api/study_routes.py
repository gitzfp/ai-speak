from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.services.study_service import StudyService  # 假设 StudyService 在 study_service.py 中
from app.db import get_db
from app.models.response import ApiResponse
from typing import List, Optional
from datetime import date
from pydantic import BaseModel

router = APIRouter(prefix="/study", tags=["study"])

# StudyPlan 路由
class StudyPlanCreateRequest(BaseModel):
    user_id: int
    book_id: int
    daily_words: int
    total_words: int
    total_days: int

class StudyPlanUpdateRequest(BaseModel):
    daily_words: Optional[int] = None
    total_words: Optional[int] = None
    total_days: Optional[int] = None

@router.post("/plans", response_model=ApiResponse)
def create_study_plan(
    request: StudyPlanCreateRequest,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        plan = service.create_study_plan(
            user_id=request.user_id,
            book_id=request.book_id,
            daily_words=request.daily_words,
            total_words=request.total_words,
            total_days=request.total_days
        )
        return ApiResponse.success(plan)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/plans/{plan_id}", response_model=ApiResponse)
def get_study_plan_by_id(
    plan_id: int,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        plan = service.get_study_plan_by_id(plan_id)
        if not plan:
            return ApiResponse.error("学习计划不存在")
        return ApiResponse.success(plan)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/users/{user_id}/plans", response_model=ApiResponse)
def get_study_plans_by_user(
    user_id: int,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        plans = service.get_study_plans_by_user(user_id)
        return ApiResponse.success(plans)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.put("/plans/{plan_id}", response_model=ApiResponse)
def update_study_plan(
    plan_id: int,
    request: StudyPlanUpdateRequest,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        updated_plan = service.update_study_plan(
            plan_id=plan_id,
            daily_words=request.daily_words,
            total_words=request.total_words,
            total_days=request.total_days
        )
        if not updated_plan:
            return ApiResponse.error("学习计划不存在")
        return ApiResponse.success(updated_plan)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.delete("/plans/{plan_id}", response_model=ApiResponse)
def delete_study_plan(
    plan_id: int,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        deleted = service.delete_study_plan(plan_id)
        if not deleted:
            return ApiResponse.error("学习计划不存在")
        return ApiResponse.success("删除成功")
    except Exception as e:
        return ApiResponse.system_error(str(e))

# StudyWordProgress 路由
class StudyWordProgressCreateRequest(BaseModel):
    user_id: int
    word_id: int
    book_id: int
    study_date: date

class StudyWordProgressUpdateRequest(BaseModel):
    learning_count: Optional[int] = None
    correct_count: Optional[int] = None
    incorrect_count: Optional[int] = None
    is_mastered: Optional[int] = None

@router.post("/word-progress", response_model=ApiResponse)
def create_study_word_progress(
    request: StudyWordProgressCreateRequest,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        progress = service.create_study_word_progress(
            user_id=request.user_id,
            word_id=request.word_id,
            book_id=request.book_id,
            study_date=request.study_date
        )
        return ApiResponse.success(progress)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/word-progress/{progress_id}", response_model=ApiResponse)
def get_study_word_progress_by_id(
    progress_id: int,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        progress = service.get_study_word_progress_by_id(progress_id)
        if not progress:
            return ApiResponse.error("单词学习进度不存在")
        return ApiResponse.success(progress)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.put("/word-progress/{progress_id}", response_model=ApiResponse)
def update_study_word_progress(
    progress_id: int,
    request: StudyWordProgressUpdateRequest,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        updated_progress = service.update_study_word_progress(
            progress_id=progress_id,
            learning_count=request.learning_count,
            correct_count=request.correct_count,
            incorrect_count=request.incorrect_count,
            is_mastered=request.is_mastered
        )
        if not updated_progress:
            return ApiResponse.error("单词学习进度不存在")
        return ApiResponse.success(updated_progress)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.delete("/word-progress/{progress_id}", response_model=ApiResponse)
def delete_study_word_progress(
    progress_id: int,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        deleted = service.delete_study_word_progress(progress_id)
        if not deleted:
            return ApiResponse.error("单词学习进度不存在")
        return ApiResponse.success("删除成功")
    except Exception as e:
        return ApiResponse.system_error(str(e))

# StudyRecord 路由
class StudyRecordCreateRequest(BaseModel):
    user_id: int
    book_id: int
    study_date: date
    new_words: int
    review_words: int
    duration: int

class StudyRecordUpdateRequest(BaseModel):
    new_words: Optional[int] = None
    review_words: Optional[int] = None
    duration: Optional[int] = None

@router.post("/records", response_model=ApiResponse)
def create_study_record(
    request: StudyRecordCreateRequest,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        record = service.create_study_record(
            user_id=request.user_id,
            book_id=request.book_id,
            study_date=request.study_date,
            new_words=request.new_words,
            review_words=request.review_words,
            duration=request.duration
        )
        return ApiResponse.success(record)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/records/{record_id}", response_model=ApiResponse)
def get_study_record_by_id(
    record_id: int,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        record = service.get_study_record_by_id(record_id)
        if not record:
            return ApiResponse.error("学习记录不存在")
        return ApiResponse.success(record)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/users/{user_id}/records", response_model=ApiResponse)
def get_study_records_by_user(
    user_id: int,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        records = service.get_study_records_by_user(user_id)
        return ApiResponse.success(records)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.put("/records/{record_id}", response_model=ApiResponse)
def update_study_record(
    record_id: int,
    request: StudyRecordUpdateRequest,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        updated_record = service.update_study_record(
            record_id=record_id,
            new_words=request.new_words,
            review_words=request.review_words,
            duration=request.duration
        )
        if not updated_record:
            return ApiResponse.error("学习记录不存在")
        return ApiResponse.success(updated_record)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.delete("/records/{record_id}", response_model=ApiResponse)
def delete_study_record(
    record_id: int,
    db: Session = Depends(get_db)
) -> ApiResponse:
    try:
        service = StudyService(db)
        deleted = service.delete_study_record(record_id)
        if not deleted:
            return ApiResponse.error("学习记录不存在")
        return ApiResponse.success("删除成功")
    except Exception as e:
        return ApiResponse.system_error(str(e))