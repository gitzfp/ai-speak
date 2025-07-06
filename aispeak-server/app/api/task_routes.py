from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db
from app.services.task_service import TaskService
from app.models.task_models import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    SubmissionCreate, SubmissionUpdate, SubmissionGrade, SubmissionResponse, SubmissionListResponse,
    ClassCreate, ClassUpdate, ClassResponse,
    ClassStudentAdd, ClassTeacherAdd,
    TaskQueryParams, SubmissionQueryParams,
    TaskType, TaskStatus, SubmissionStatus
)
from app.models.response import ApiResponse
from app.core.logging import logging
from app.core import get_current_account

router = APIRouter()

def get_task_service(db: Session = Depends(get_db)) -> TaskService:
    return TaskService(db)

# 班级管理路由
@router.post("/classes", response_model=ApiResponse, tags=["班级管理"])
async def create_class(
    class_data: ClassCreate,
    service: TaskService = Depends(get_task_service)
):
    """创建班级"""
    try:
        result = await service.create_class(class_data)
        return ApiResponse.success(result)
    except Exception as e:
        logging.error(f"创建班级失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/classes/{class_id}", response_model=ApiResponse, tags=["班级管理"])
async def get_class(
    class_id: str = Path(..., description="班级ID"),
    service: TaskService = Depends(get_task_service)
):
    """获取班级详情"""
    result = await service.get_class_by_id(class_id)
    if not result:
        raise HTTPException(status_code=404, detail="班级不存在")
    return ApiResponse.success(result)

@router.put("/classes/{class_id}", response_model=ApiResponse, tags=["班级管理"])
async def update_class(
    class_id: str = Path(..., description="班级ID"),
    class_data: ClassUpdate = None,
    service: TaskService = Depends(get_task_service)
):
    """更新班级"""
    try:
        result = await service.update_class(class_id, class_data)
        if not result:
            raise HTTPException(status_code=404, detail="班级不存在")
        return ApiResponse.success(result)
    except Exception as e:
        logging.error(f"更新班级失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/classes/{class_id}", response_model=ApiResponse, tags=["班级管理"])
async def delete_class(
    class_id: str = Path(..., description="班级ID"),
    service: TaskService = Depends(get_task_service)
):
    """删除班级"""
    try:
        result = await service.delete_class(class_id)
        if not result:
            raise HTTPException(status_code=404, detail="班级不存在")
        return ApiResponse.success(True)
    except Exception as e:
        logging.error(f"删除班级失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# 班级成员管理
@router.post("/classes/{class_id}/students", response_model=ApiResponse, tags=["班级管理"])
async def add_student_to_class(
    class_id: str = Path(..., description="班级ID"),
    student_data: ClassStudentAdd = None,
    service: TaskService = Depends(get_task_service)
):
    """添加学生到班级"""
    try:
        result = await service.add_student_to_class(class_id, student_data)
        if not result:
            raise HTTPException(status_code=400, detail="学生已在班级中或添加失败")
        return ApiResponse.success(True)
    except Exception as e:
        logging.error(f"添加学生到班级失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/classes/{class_id}/students/{student_id}", response_model=ApiResponse, tags=["班级管理"])
async def remove_student_from_class(
    class_id: str = Path(..., description="班级ID"),
    student_id: str = Path(..., description="学生ID"),
    service: TaskService = Depends(get_task_service)
):
    """从班级移除学生"""
    try:
        result = await service.remove_student_from_class(class_id, student_id)
        if not result:
            raise HTTPException(status_code=404, detail="学生不在班级中")
        return ApiResponse.success(True)
    except Exception as e:
        logging.error(f"从班级移除学生失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/classes/{class_id}/teachers", response_model=ApiResponse, tags=["班级管理"])
async def add_teacher_to_class(
    class_id: str = Path(..., description="班级ID"),
    teacher_data: ClassTeacherAdd = None,
    service: TaskService = Depends(get_task_service)
):
    """添加教师到班级"""
    try:
        result = await service.add_teacher_to_class(class_id, teacher_data)
        if not result:
            raise HTTPException(status_code=400, detail="教师已在班级中或添加失败")
        return ApiResponse.success(True)
    except Exception as e:
        logging.error(f"添加教师到班级失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/classes/{class_id}/teachers/{teacher_id}", response_model=ApiResponse, tags=["班级管理"])
async def remove_teacher_from_class(
    class_id: str = Path(..., description="班级ID"),
    teacher_id: str = Path(..., description="教师ID"),
    service: TaskService = Depends(get_task_service)
):
    """从班级移除教师"""
    try:
        result = await service.remove_teacher_from_class(class_id, teacher_id)
        if not result:
            raise HTTPException(status_code=404, detail="教师不在班级中")
        return ApiResponse.success(True)
    except Exception as e:
        logging.error(f"从班级移除教师失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/teacher/{teacher_id}/classes", response_model=ApiResponse, tags=["班级管理"])
async def get_teacher_classes(
    teacher_id: str = Path(..., description="教师ID"),
    service: TaskService = Depends(get_task_service)
):
    """获取教师的班级列表"""
    try:
        result = await service.get_teacher_classes(teacher_id)
        return ApiResponse.success(result)
    except Exception as e:
        logging.error(f"获取教师班级失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student/classes", response_model=ApiResponse, tags=["班级管理"])
async def get_student_classes(
    service: TaskService = Depends(get_task_service),
    account_id: str = Depends(get_current_account)
):
    """获取学生的班级列表"""
    try:
        result = await service.get_student_classes(account_id)
        return ApiResponse.success(result)
    except Exception as e:
        logging.error(f"获取学生班级失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 任务管理路由
@router.post("/tasks", response_model=ApiResponse, tags=["任务管理"])
async def create_task(
    task_data: TaskCreate,
    service: TaskService = Depends(get_task_service)
):
    """创建任务"""
    try:
        result = await service.create_task(task_data)
        return ApiResponse.success(result)
    except Exception as e:
        logging.error(f"创建任务失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tasks/{task_id}", response_model=ApiResponse, tags=["任务管理"])
async def get_task(
    task_id: int = Path(..., description="任务ID"),
    service: TaskService = Depends(get_task_service)
):
    """获取任务详情"""
    result = await service.get_task_by_id(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="任务不存在")
    return ApiResponse.success(result)

@router.put("/tasks/{task_id}", response_model=ApiResponse, tags=["任务管理"])
async def update_task(
    task_id: int = Path(..., description="任务ID"),
    task_data: TaskUpdate = None,
    service: TaskService = Depends(get_task_service)
):
    """更新任务"""
    try:
        result = await service.update_task(task_id, task_data)
        if not result:
            raise HTTPException(status_code=404, detail="任务不存在")
        return ApiResponse.success(result)
    except Exception as e:
        logging.error(f"更新任务失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/tasks/{task_id}", response_model=ApiResponse, tags=["任务管理"])
async def delete_task(
    task_id: int = Path(..., description="任务ID"),
    service: TaskService = Depends(get_task_service)
):
    """删除任务"""
    try:
        result = await service.delete_task(task_id)
        if not result:
            raise HTTPException(status_code=404, detail="任务不存在")
        return ApiResponse.success(True)
    except Exception as e:
        logging.error(f"删除任务失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tasks", response_model=ApiResponse, tags=["任务管理"])
async def list_tasks(
    teacher_id: Optional[str] = Query(None, description="教师ID"),
    student_id: Optional[str] = Query(None, description="学生ID"),
    class_id: Optional[str] = Query(None, description="班级ID"),
    status: Optional[TaskStatus] = Query(None, description="任务状态"),
    task_type: Optional[TaskType] = Query(None, description="任务类型"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    service: TaskService = Depends(get_task_service)
):
    """获取任务列表"""
    params = TaskQueryParams(
        teacher_id=teacher_id,
        student_id=student_id,
        class_id=class_id,
        status=status,
        task_type=task_type,
        page=page,
        page_size=page_size
    )
    result = await service.list_tasks(params)
    return ApiResponse.success(result)

# 提交管理路由
@router.post("/tasks/{task_id}/submissions", response_model=ApiResponse, tags=["提交管理"])
async def submit_task(
    task_id: int = Path(..., description="任务ID"),
    submission_data: SubmissionCreate = None,
    service: TaskService = Depends(get_task_service)
):
    """提交任务"""
    try:
        result = await service.create_submission(task_id, submission_data)
        return ApiResponse.success(result)
    except Exception as e:
        logging.error(f"提交任务失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/submissions/{submission_id}", response_model=ApiResponse, tags=["提交管理"])
async def get_submission(
    submission_id: int = Path(..., description="提交ID"),
    service: TaskService = Depends(get_task_service)
):
    """获取提交详情"""
    result = await service.get_submission_by_id(submission_id)
    if not result:
        raise HTTPException(status_code=404, detail="提交不存在")
    return ApiResponse.success(result)

@router.post("/submissions/{submission_id}/grade", response_model=ApiResponse, tags=["提交管理"])
async def grade_submission(
    submission_id: int = Path(..., description="提交ID"),
    grade_data: SubmissionGrade = None,
    service: TaskService = Depends(get_task_service)
):
    """评分提交"""
    try:
        result = await service.grade_submission(submission_id, grade_data)
        if not result:
            raise HTTPException(status_code=404, detail="提交不存在")
        return ApiResponse.success(result)
    except Exception as e:
        logging.error(f"评分提交失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tasks/{task_id}/submissions", response_model=ApiResponse, tags=["提交管理"])
async def list_task_submissions(
    task_id: int = Path(..., description="任务ID"),
    content_id: Optional[int] = Query(None, description="内容ID"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    service: TaskService = Depends(get_task_service)
):
    """获取任务的提交列表"""
    params = SubmissionQueryParams(
        content_id=content_id,
        page=page,
        page_size=page_size
    )
    result = await service.list_submissions(task_id, params)
    return ApiResponse.success(result)

@router.get("/submissions", response_model=ApiResponse, tags=["提交管理"])
async def list_submissions(
    task_id: Optional[int] = Query(None, description="任务ID"),
    student_id: Optional[str] = Query(None, description="学生ID"),
    status: Optional[SubmissionStatus] = Query(None, description="提交状态"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    service: TaskService = Depends(get_task_service)
):
    """获取提交列表"""
    params = SubmissionQueryParams(
        task_id=task_id,
        student_id=student_id,
        status=status,
        page=page,
        page_size=page_size
    )
    result = await service.list_submissions(params)
    return ApiResponse.success(result)