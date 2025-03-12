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
        return ApiResponse.success(record)
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/user-words", response_model=ApiResponse)
def get_user_words(
    book_id: str = Query(..., description="书本ID"),  # 修改为 str 类型
    plan_id: int = Query(..., description="计划ID"),
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    获取当前用户在当前书本中已学和未学的单词
    """
    try:
        service = StudyService(db)
        result = service.get_user_words(account_id, book_id,plan_id)  # 使用 account_id
        if not result:
            return ApiResponse.error("获取用户单词列表失败")
        return ApiResponse.success(result)
    except Exception as e:
        return ApiResponse.system_error(str(e))
    



#学习进度上报
    # 定义请求体模型
class WordProgressData(BaseModel):
    word: str
    word_id: int
    correct_count: int
    incorrect_count: int

class UpsertStudyWordProgressRequest(BaseModel):
    book_id: str  # 书籍ID
    type_num: int  # 类型字段
    plan_id: int 
    words_data: List[WordProgressData]  # 单词数据列表
@router.post("/word-progress", response_model=ApiResponse)
def upsert_study_word_progress(
    request: UpsertStudyWordProgressRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    批量插入或更新用户单词学习进度（存在则更新，不存在则插入）
    """
    try:
        service = StudyService(db)
        # 调用 StudyService 中的 upsert_study_word_progress 方法
        success = service.upsert_study_word_progress(
            user_id=account_id,
            book_id=request.book_id,
            type_num=request.type_num,
            plan_id=request.plan_id, 
            words_data=request.words_data,
        )
        if success:
            return ApiResponse.success("操作成功")  # 返回成功消息
        else:
            return ApiResponse.fail("操作失败")  # 返回失败消息
    except Exception as e:
        return ApiResponse.system_error(str(e))  # 捕获异常并返回系统错误
    

@router.post("/review-word-progress", response_model=ApiResponse)
def upsert_review_word_progress(
    request: UpsertStudyWordProgressRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    批量更新用户复习单词的学习进度（仅更新，不插入）
    """
    try:
        service = StudyService(db)
        # 调用 StudyService 中的 upsert_review_word_progress 方法
        success = service.upsert_review_word_progress(
            user_id=account_id,
            book_id=request.book_id,
            type_num=request.type_num,
            plan_id=request.plan_id, 
            words_data=request.words_data,
        )
        if success:
            return ApiResponse.success("操作成功")  # 返回成功消息
        else:
            return ApiResponse.fail("操作失败")  # 返回失败消息
    except Exception as e:
        return ApiResponse.system_error(str(e))  # 捕获异常并返回系统错误

    
    
 
 
 # 更新或创建学习记录
class StudyRecordUpdateRequest(BaseModel):
    book_id: str  # 书籍ID
    study_date: date  # 学习日期
    new_words: Optional[int] = None  # 今日新学单词数（可选，累加）
    review_words: Optional[int] = None  # 今日复习单词数（可选，累加）
    duration: Optional[int] = None  # 今日学习时长（分钟）（可选，累加）

@router.post("/record", response_model=ApiResponse)
def update_or_create_study_record(
    request: StudyRecordUpdateRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    更新或创建学习记录
    - 如果记录存在，则累加 new_words、review_words 和 duration 字段。
    - 如果记录不存在，则插入新记录。
    """
    try:
        service = StudyService(db)
        # 调用 StudyService 中的 update_or_create_study_record 方法
        record = service.update_or_create_study_record(
            user_id=account_id,
            book_id=request.book_id,
            study_date=request.study_date,
            new_words=request.new_words,
            review_words=request.review_words,
            duration=request.duration,
        )
        return ApiResponse.success(jsonable_encoder(record))  # 返回成功消息
    except Exception as e:
        return ApiResponse.system_error(str(e))  # 捕获异常并返回系统错误


# 定义请求体模型
class StudyCompletionRecordsRequest(BaseModel):
    book_id: str  # 书本ID
    dates: List[date]  # 日期数组

@router.post("/completion-records", response_model=ApiResponse)
def get_study_completion_records(
    request: StudyCompletionRecordsRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    根据用户ID、书本ID和日期数组查询学习完成记录，并返回与日期数组顺序一致的字典列表
    """
    try:
        service = StudyService(db)
        # 调用 StudyService 中的 get_study_completion_records 方法
        records = service.get_study_completion_records(
            user_id=account_id,
            book_id=request.book_id,
            dates=request.dates
        )
        return ApiResponse.success(records)  # 返回成功消息
    except Exception as e:
        return ApiResponse.system_error(str(e))  # 捕获异常并返回系统错误
    

# 定义请求体模型
class StudyCompletionRecordRequest(BaseModel):
    book_id: str  # 书本ID
@router.post("/completion-record", response_model=ApiResponse)
def create_or_update_study_completion_record(
    request: StudyCompletionRecordRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    创建或更新学习完成记录
    - 如果当前日期的记录已存在，直接返回该记录。
    - 如果不存在，则插入一条新记录，并根据昨天的记录计算 continuous_days。
    """
    try:
        service = StudyService(db)
        # 调用 StudyService 中的 create_or_update_study_completion_record 方法
        record = service.create_or_update_study_completion_record(
            user_id=account_id,
            book_id=request.book_id
        )
        return ApiResponse.success(jsonable_encoder(record))  # 返回成功消息
    except Exception as e:
        return ApiResponse.system_error(str(e))  # 捕获异常并返回系统错误


class StudyProgressReportItem(BaseModel):
    word: str  # 单词
    content_type: int  # 类型（0: 单词发音, 1: 单词读, 2: 单词写, 3: 单独拼写按钮进去的那边提交, 4:句子）
    error_count: int  # 错误次数
    points: int  # 积分
class StudyProgressReportRequest(BaseModel):
    book_id: str  # 书籍ID
    lesson_id: int  # 课程ID
    reports: List[StudyProgressReportItem]  # 报告数据列表
@router.post("/progress-report", response_model=ApiResponse)
def submit_study_progress_report(
    request: StudyProgressReportRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    提交学习进度报告表数据，并为用户加上积分
    """
    try:
        service = StudyService(db)
        # 调用 StudyService 中的 submit_study_progress_report 方法
        success = service.submit_study_progress_report(
            user_id=account_id,  # 使用 account_id
            book_id=request.book_id,
            lesson_id=request.lesson_id,
            reports=request.reports,
        )
        if success:
            return ApiResponse.success("学习进度报告提交成功！")
        else:
            return ApiResponse.fail("学习进度报告提交失败！")
    except Exception as e:
        return ApiResponse.system_error(str(e))  # 捕获异常并返回系统错误