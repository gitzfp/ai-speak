from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.services.study_service import StudyService  # 假设 StudyService 在 study_service.py 中
from app.db import get_db
from app.models.response import ApiResponse
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from app.core import get_current_account  # 从依赖项中获取 account_id

from fastapi.encoders import jsonable_encoder

router = APIRouter(prefix="/study", tags=["study"])

# StudyPlan 路由
class StudyPlanCreateRequest(BaseModel):
    book_id: str  # 修改为 str 类型
    daily_words: int

class StudyPlanUpdateRequest(BaseModel):
    daily_words: Optional[int] = None

@router.post("/plans", response_model=ApiResponse)
def create_study_plan(
    request: StudyPlanCreateRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    try:
        service = StudyService(db)
        # 创建学习计划
        plan = service.create_study_plan(
            user_id=account_id,  # 使用 account_id
            book_id=request.book_id,
            daily_words=request.daily_words,
        )
        return ApiResponse.success(jsonable_encoder(plan))
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/plans", response_model=ApiResponse)
def get_study_plan(
    book_id: str = Query(..., description="书本ID"),  # 修改为 str 类型
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    try:
        service = StudyService(db)
        # 使用 account_id 和 book_id 获取学习计划
        plan = service.get_study_plan_by_user_and_book(user_id=account_id, book_id=book_id)
        if plan:
            return ApiResponse.success(jsonable_encoder(plan))
        else:
            return ApiResponse.error("未找到学习计划")
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.put("/plans/{plan_id}", response_model=ApiResponse)
def update_study_plan(
    plan_id: int,
    request: StudyPlanUpdateRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    try:
        service = StudyService(db)
        updated_plan = service.update_study_plan(
            plan_id=plan_id,
            daily_words=request.daily_words,
        )
        if not updated_plan:
            return ApiResponse.error("学习计划不存在")
        return ApiResponse.success(jsonable_encoder(updated_plan))
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/records", response_model=ApiResponse)
def get_study_records(
    book_id: str,  # 书本ID
    study_date: date,  # 新增 study_date 参数
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    try:
        service = StudyService(db)
        # 调用修改后的方法，传入 account_id、book_id 和 study_date
        record = service.get_study_records_by_user(account_id, book_id, study_date)
        return ApiResponse.success(jsonable_encoder(record))
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/user-words", response_model=ApiResponse)
def get_user_words(
    book_id: str = Query(..., description="书本ID"),  # 修改为 str 类型
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    获取当前用户在当前书本中已学和未学的单词
    """
    try:
        service = StudyService(db)
        result = service.get_user_words(account_id, book_id)  # 使用 account_id
        if not result:
            return ApiResponse.error("获取用户单词列表失败")
        return ApiResponse.success(result)
    except Exception as e:
        return ApiResponse.system_error(str(e))