from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc
from datetime import datetime
import random
import string

from app.db.task_entities import (
    Task, TaskContent, Class, ClassStudent, ClassTeacher,
    Submission, TaskType, TaskStatus, SubmissionStatus
)
from app.models.task_models import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    SubmissionCreate, SubmissionUpdate, SubmissionGrade, SubmissionResponse, SubmissionListResponse,
    ClassCreate, ClassUpdate, ClassResponse,
    ClassStudentAdd, ClassTeacherAdd,
    TaskQueryParams, SubmissionQueryParams
)
from app.core.exceptions import UserAccessDeniedException
from app.core.logging import logging

class TaskService:
    def __init__(self, db: Session):
        self.db = db
    
    def _generate_class_code(self) -> str:
        """生成唯一的6位班级码"""
        while True:
            # 生成6位随机字母数字组合（大写）
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            # 检查是否已存在
            existing = self.db.query(Class).filter(
                Class.class_code == code,
                Class.deleted_at.is_(None)
            ).first()
            if not existing:
                return code
    
    # 班级管理
    async def create_class(self, class_data: ClassCreate) -> ClassResponse:
        """创建班级"""
        try:
            # 生成唯一班级码
            class_code = self._generate_class_code()
            
            db_class = Class(
                name=class_data.name,
                grade_level=class_data.grade_level,
                subject=class_data.subject,
                school_name=class_data.school_name,
                teacher_id=class_data.teacher_id,
                class_code=class_code,
                description=class_data.description,
                max_students=class_data.max_students
            )
            self.db.add(db_class)
            self.db.commit()
            self.db.refresh(db_class)
            
            # 创建响应并设置学生人数为0
            response = ClassResponse.from_orm(db_class)
            response.student_count = 0
            return response
        except Exception as e:
            self.db.rollback()
            logging.error(f"创建班级失败: {e}")
            raise e
    
    async def get_class_by_id(self, class_id: int) -> Optional[ClassResponse]:
        """根据ID获取班级"""
        db_class = self.db.query(Class).filter(
            Class.id == class_id,
            Class.deleted_at.is_(None)
        ).first()
        
        if not db_class:
            return None
            
        # 创建响应并添加学生人数和学生列表
        response = ClassResponse.from_orm(db_class)
        
        # 获取学生数量
        student_count = self.db.query(ClassStudent).filter(
            ClassStudent.class_id == class_id,
            ClassStudent.status == "active"
        ).count()
        response.student_count = student_count
        
        # 获取学生列表
        from app.db.account_entities import AccountEntity
        students = self.db.query(AccountEntity).join(
            ClassStudent, AccountEntity.id == ClassStudent.student_id
        ).filter(
            ClassStudent.class_id == class_id,
            ClassStudent.status == "active"
        ).all()
        
        # 转换学生信息为字典列表
        student_list = []
        for student in students:
            student_list.append({
                "id": student.id,
                "user_id": student.id,
                "name": student.user_name or student.phone_number or "未设置",
                "username": student.user_name or student.phone_number or "未设置",
                "phone": student.phone_number,
                "role": student.user_role
            })
        
        response.students = student_list
        return response
    
    async def update_class(self, class_id: int, class_data: ClassUpdate) -> Optional[ClassResponse]:
        """更新班级"""
        try:
            db_class = self.db.query(Class).filter(
                Class.id == class_id,
                Class.deleted_at.is_(None)
            ).first()
            
            if not db_class:
                return None
            
            update_data = class_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_class, field, value)
            
            db_class.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(db_class)
            
            # 创建响应并添加学生人数
            response = ClassResponse.from_orm(db_class)
            student_count = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == class_id,
                ClassStudent.status == "active"
            ).count()
            response.student_count = student_count
            return response
        except Exception as e:
            self.db.rollback()
            logging.error(f"更新班级失败: {e}")
            raise e
    
    async def delete_class(self, class_id: int) -> bool:
        """删除班级（软删除）"""
        try:
            db_class = self.db.query(Class).filter(
                Class.id == class_id,
                Class.deleted_at.is_(None)
            ).first()
            
            if not db_class:
                return False
            
            db_class.deleted_at = datetime.utcnow()
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logging.error(f"删除班级失败: {e}")
            raise e
    
    async def class_exists(self, class_id: int) -> bool:
        """检查班级是否存在"""
        return self.db.query(Class).filter(
            Class.id == class_id,
            Class.deleted_at.is_(None)
        ).first() is not None
    
    # 班级成员管理
    async def add_student_to_class(self, class_id: int, student_data: ClassStudentAdd) -> bool:
        """添加学生到班级"""
        try:
            # 检查是否已存在
            existing = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == class_id,
                ClassStudent.student_id == student_data.student_id,
                ClassStudent.status == "active"
            ).first()
            
            if existing:
                return False
            
            db_student = ClassStudent(
                class_id=class_id,
                student_id=student_data.student_id
            )
            self.db.add(db_student)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logging.error(f"添加学生到班级失败: {e}")
            raise e
    
    async def remove_student_from_class(self, class_id: int, student_id: str) -> bool:
        """从班级移除学生"""
        try:
            db_student = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == class_id,
                ClassStudent.student_id == student_id,
                ClassStudent.status == "active"
            ).first()
            
            if not db_student:
                return False
            
            db_student.status = "inactive"
            db_student.leave_date = datetime.utcnow()
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logging.error(f"从班级移除学生失败: {e}")
            raise e
    
    async def add_teacher_to_class(self, class_id: int, teacher_data: ClassTeacherAdd) -> bool:
        """添加教师到班级"""
        try:
            # 检查是否已存在
            existing = self.db.query(ClassTeacher).filter(
                ClassTeacher.class_id == class_id,
                ClassTeacher.teacher_id == teacher_data.teacher_id,
                ClassTeacher.status == "active"
            ).first()
            
            if existing:
                return False
            
            db_teacher = ClassTeacher(
                class_id=class_id,
                teacher_id=teacher_data.teacher_id,
                role=teacher_data.role
            )
            self.db.add(db_teacher)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logging.error(f"添加教师到班级失败: {e}")
            raise e
    
    async def remove_teacher_from_class(self, class_id: int, teacher_id: str) -> bool:
        """从班级移除教师"""
        try:
            db_teacher = self.db.query(ClassTeacher).filter(
                ClassTeacher.class_id == class_id,
                ClassTeacher.teacher_id == teacher_id,
                ClassTeacher.status == "active"
            ).first()
            
            if not db_teacher:
                return False
            
            db_teacher.status = "inactive"
            db_teacher.leave_date = datetime.utcnow()
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logging.error(f"从班级移除教师失败: {e}")
            raise e
    
    async def get_teacher_classes(self, teacher_id: str) -> List[ClassResponse]:
        """获取教师的班级列表"""
        try:
            # 查询教师担任班主任的班级
            main_classes = self.db.query(Class).filter(
                Class.teacher_id == teacher_id,
                Class.deleted_at.is_(None)
            ).all()
            
            # 查询教师担任其他角色的班级
            additional_classes_query = self.db.query(Class).join(
                ClassTeacher, Class.id == ClassTeacher.class_id
            ).filter(
                ClassTeacher.teacher_id == teacher_id,
                ClassTeacher.status == "active",
                Class.deleted_at.is_(None)
            ).all()
            
            # 合并并去重
            all_classes = {}
            for cls in main_classes:
                all_classes[cls.id] = cls
            for cls in additional_classes_query:
                all_classes[cls.id] = cls
            
            # 转换为响应模型并添加学生人数
            result = []
            for cls in all_classes.values():
                class_response = ClassResponse.from_orm(cls)
                # 查询该班级的活跃学生人数
                student_count = self.db.query(ClassStudent).filter(
                    ClassStudent.class_id == cls.id,
                    ClassStudent.status == "active"
                ).count()
                class_response.student_count = student_count
                result.append(class_response)
            
            return result
        except Exception as e:
            logging.error(f"获取教师班级失败: {e}")
            raise e
    
    async def get_student_classes(self, student_id: str) -> List[ClassResponse]:
        """获取学生的班级列表"""
        try:
            # 查询学生加入的班级
            student_classes = self.db.query(Class).join(
                ClassStudent, Class.id == ClassStudent.class_id
            ).filter(
                ClassStudent.student_id == student_id,
                ClassStudent.status == "active",
                Class.deleted_at.is_(None)
            ).all()
            
            # 转换为响应模型并添加学生人数
            result = []
            for cls in student_classes:
                response = ClassResponse.from_orm(cls)
                # 查询该班级的活跃学生人数
                student_count = self.db.query(ClassStudent).filter(
                    ClassStudent.class_id == cls.id,
                    ClassStudent.status == "active"
                ).count()
                response.student_count = student_count
                result.append(response)
            
            return result
        except Exception as e:
            logging.error(f"获取学生班级失败: {e}")
            raise e
    
    async def join_class_by_code(self, class_code: str, student_id: str) -> ClassResponse:
        """通过班级码加入班级"""
        try:
            # 查找班级
            db_class = self.db.query(Class).filter(
                Class.class_code == class_code,
                Class.status == "active",
                Class.deleted_at.is_(None)
            ).first()
            
            if not db_class:
                raise UserAccessDeniedException("班级码无效或班级不存在")
            
            # 检查是否已加入
            existing = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == db_class.id,
                ClassStudent.student_id == student_id,
                ClassStudent.status == "active"
            ).first()
            
            if existing:
                raise UserAccessDeniedException("您已经加入了该班级")
            
            # 检查班级人数是否已满
            current_count = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == db_class.id,
                ClassStudent.status == "active"
            ).count()
            
            if current_count >= db_class.max_students:
                raise UserAccessDeniedException("班级人数已满")
            
            # 加入班级
            db_student = ClassStudent(
                class_id=db_class.id,
                student_id=student_id,
                status="active"
            )
            self.db.add(db_student)
            self.db.commit()
            self.db.refresh(db_class)
            
            # 创建响应并添加学生人数
            response = ClassResponse.from_orm(db_class)
            student_count = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == db_class.id,
                ClassStudent.status == "active"
            ).count()
            response.student_count = student_count
            return response
        except UserAccessDeniedException:
            raise
        except Exception as e:
            self.db.rollback()
            logging.error(f"加入班级失败: {e}")
            raise UserAccessDeniedException("加入班级失败")
    
    async def join_class_by_id(self, class_id: int, student_id: str) -> ClassResponse:
        """通过班级ID加入班级"""
        try:
            # 查找班级
            db_class = self.db.query(Class).filter(
                Class.id == class_id,
                Class.status == "active",
                Class.deleted_at.is_(None)
            ).first()
            
            if not db_class:
                raise UserAccessDeniedException("班级不存在")
            
            # 检查是否已加入
            existing = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == class_id,
                ClassStudent.student_id == student_id,
                ClassStudent.status == "active"
            ).first()
            
            if existing:
                raise UserAccessDeniedException("您已经加入了该班级")
            
            # 检查班级人数是否已满
            current_count = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == class_id,
                ClassStudent.status == "active"
            ).count()
            
            if current_count >= db_class.max_students:
                raise UserAccessDeniedException("班级人数已满")
            
            # 加入班级
            db_student = ClassStudent(
                class_id=class_id,
                student_id=student_id,
                status="active"
            )
            self.db.add(db_student)
            self.db.commit()
            self.db.refresh(db_class)
            
            # 创建响应并添加学生人数
            response = ClassResponse.from_orm(db_class)
            student_count = self.db.query(ClassStudent).filter(
                ClassStudent.class_id == db_class.id,
                ClassStudent.status == "active"
            ).count()
            response.student_count = student_count
            return response
        except UserAccessDeniedException:
            raise
        except Exception as e:
            self.db.rollback()
            logging.error(f"加入班级失败: {e}")
            raise UserAccessDeniedException("加入班级失败")
    
    # 任务管理
    async def create_task(self, task_data: TaskCreate) -> TaskResponse:
        """创建任务"""
        try:
            # 检查班级是否存在 - 现在class_id是字符串类型
            if not await self.class_exists(task_data.class_id):
                raise UserAccessDeniedException("班级不存在")
            
            # 计算总分
            total_points = sum(content.points for content in task_data.contents)
            
            db_task = Task(
                teacher_id=task_data.teacher_id,
                class_id=task_data.class_id,
                title=task_data.title,
                description=task_data.description,
                task_type=task_data.task_type,
                subject=task_data.subject,  # 新增
                deadline=task_data.deadline,  # 使用deadline而不是start_time/end_time
                allow_late_submission=task_data.allow_late_submission,  # 新增
                max_attempts=task_data.max_attempts,  # 新增
                grading_criteria=task_data.grading_criteria,  # 新增
                total_points=total_points,
                attachments=task_data.attachments,  # 新增
                textbook_id=task_data.textbook_id,  # 新增
                lesson_id=task_data.lesson_id  # 新增
            )
            self.db.add(db_task)
            self.db.flush()  # 获取task_id
            
            # 创建任务内容
            for content_data in task_data.contents:
                db_content = TaskContent(
                    task_id=db_task.id,
                    content_type=content_data.content_type,
                    generate_mode=content_data.generate_mode,  # 新增
                    ref_book_id=content_data.ref_book_id,  # 新增
                    ref_lesson_id=content_data.ref_lesson_id,  # 新增
                    selected_word_ids=content_data.selected_word_ids,  # 新增
                    selected_sentence_ids=content_data.selected_sentence_ids,  # 新增
                    points=content_data.points,
                    meta_data=content_data.meta_data,  # 使用meta_data字段名
                    order_num=content_data.order_num
                )
                self.db.add(db_content)
            
            self.db.commit()
            self.db.refresh(db_task)
            
            # 加载关联数据
            db_task = self.db.query(Task).options(
                joinedload(Task.contents)
            ).filter(Task.id == db_task.id).first()
            
            return TaskResponse.from_orm(db_task)
        except Exception as e:
            self.db.rollback()
            logging.error(f"创建任务失败: {e}")
            raise e
    
    async def get_task_by_id(self, task_id: int) -> Optional[TaskResponse]:
        """根据ID获取任务"""
        db_task = self.db.query(Task).options(
            joinedload(Task.contents)
        ).filter(
            Task.id == task_id,
            Task.deleted_at.is_(None)
        ).first()
        
        if not db_task:
            return None
            
        task_response = TaskResponse.from_orm(db_task)
        
        # 查询该任务的提交数量
        submission_count = self.db.query(Submission).filter(
            Submission.student_task_id == task_id,
            Submission.deleted_at.is_(None)
        ).count()
        task_response.submission_count = submission_count
        
        return task_response
    
    async def update_task(self, task_id: int, task_data: TaskUpdate) -> Optional[TaskResponse]:
        """更新任务"""
        try:
            db_task = self.db.query(Task).filter(
                Task.id == task_id,
                Task.deleted_at.is_(None)
            ).first()
            
            if not db_task:
                return None
            
            update_data = task_data.dict(exclude_unset=True)
            
            # 处理 contents 更新
            if 'contents' in update_data:
                contents_data = update_data.pop('contents')
                
                # 更新现有的 contents
                for content_data in contents_data:
                    if 'id' in content_data:
                        # 更新现有内容
                        db_content = self.db.query(TaskContent).filter(
                            TaskContent.id == content_data['id'],
                            TaskContent.task_id == task_id
                        ).first()
                        
                        if db_content:
                            for key, value in content_data.items():
                                if key != 'id':
                                    setattr(db_content, key, value)
                            db_content.updated_at = datetime.utcnow()
                    else:
                        # 创建新内容
                        new_content = TaskContent(
                            task_id=task_id,
                            **content_data
                        )
                        self.db.add(new_content)
            
            # 更新任务主体信息
            for field, value in update_data.items():
                setattr(db_task, field, value)
            
            db_task.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(db_task)
            
            # 返回包含 contents 的完整响应
            return await self.get_task_by_id(task_id)
        except Exception as e:
            self.db.rollback()
            logging.error(f"更新任务失败: {e}")
            raise e
    
    async def delete_task(self, task_id: int) -> bool:
        """删除任务（软删除）"""
        try:
            db_task = self.db.query(Task).filter(
                Task.id == task_id,
                Task.deleted_at.is_(None)
            ).first()
            
            if not db_task:
                return False
            
            db_task.deleted_at = datetime.utcnow()
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logging.error(f"删除任务失败: {e}")
            raise e
    
    async def list_tasks(self, params: TaskQueryParams) -> TaskListResponse:
        """获取任务列表"""
        query = self.db.query(Task).filter(Task.deleted_at.is_(None))
        
        # 添加过滤条件
        if params.teacher_id:
            # 教师查看自己创建的任务
            query = query.filter(Task.teacher_id == params.teacher_id)
        elif params.student_id:
            # 学生只能查看已加入班级的任务
            # 先获取学生加入的班级ID列表
            student_class_ids = self.db.query(ClassStudent.class_id).filter(
                ClassStudent.student_id == params.student_id,
                ClassStudent.status == "active"
            ).subquery()
            
            # 只查询这些班级的任务
            query = query.filter(Task.class_id.in_(student_class_ids))
            
            # 如果指定了特定班级，进一步过滤
            if params.class_id:
                query = query.filter(Task.class_id == params.class_id)
        else:
            # 如果没有指定身份，返回空结果
            return TaskListResponse(
                tasks=[],
                total=0,
                page=params.page,
                page_size=params.page_size
            )
        
        if params.status:
            query = query.filter(Task.status == params.status)
        if params.task_type:
            query = query.filter(Task.task_type == params.task_type)
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (params.page - 1) * params.page_size
        tasks = query.order_by(desc(Task.created_at)).offset(offset).limit(params.page_size).all()
        
        # 为每个任务添加提交统计
        task_responses = []
        for task in tasks:
            task_response = TaskResponse.from_orm(task)
            
            # 如果是教师查询，添加提交数量
            if params.teacher_id:
                # 查询该任务的提交数量
                submission_count = self.db.query(Submission).filter(
                    Submission.student_task_id == task.id,
                    Submission.deleted_at.is_(None)
                ).count()
                task_response.submission_count = submission_count
            
            # 如果是学生查询，添加学生的提交信息
            elif params.student_id:
                # 查询学生对该任务的提交
                student_submission = self.db.query(Submission).filter(
                    Submission.student_task_id == task.id,
                    Submission.student_id == params.student_id,
                    Submission.deleted_at.is_(None)
                ).first()
                
                if student_submission:
                    task_response.student_submission = {
                        "id": student_submission.id,
                        "submitted_at": student_submission.created_at,
                        "is_correct": student_submission.is_correct,
                        "auto_score": student_submission.auto_score,
                        "teacher_score": student_submission.teacher_score,
                        "feedback": student_submission.feedback,
                        "attempt_count": student_submission.attempt_count,
                        "status": "graded" if student_submission.teacher_score is not None else "submitted"
                    }
            
            task_responses.append(task_response)
        
        return TaskListResponse(
            tasks=task_responses,
            total=total,
            page=params.page,
            page_size=params.page_size
        )
    
    # 提交管理
    async def create_submission(self, task_id: int, submission_data: SubmissionCreate, student_id: str) -> SubmissionResponse:
        """创建提交 - 与Go版本兼容"""
        try:
            # 检查任务是否存在
            task = self.db.query(Task).filter(
                Task.id == task_id,
                Task.deleted_at.is_(None)
            ).first()
            
            if not task:
                raise UserAccessDeniedException("任务不存在")
            
            # 检查是否已提交
            existing = self.db.query(Submission).filter(
                Submission.student_task_id == task_id,
                Submission.content_id == submission_data.content_id,
                Submission.deleted_at.is_(None)
            ).first()
            
            # 如果已存在提交
            if existing:
                # 检查任务是否允许多次尝试
                if task.max_attempts and existing.attempt_count >= task.max_attempts:
                    raise UserAccessDeniedException(f"已达到最大尝试次数({task.max_attempts}次)")
                
                # 检查是否已过截止时间
                if task.deadline and datetime.utcnow() > task.deadline:
                    if not task.allow_late_submission:
                        raise UserAccessDeniedException("任务已过截止时间，不允许再次提交")
                
                # 更新现有提交
                existing.student_id = student_id  # 更新学生ID
                existing.response = submission_data.response
                existing.media_files = submission_data.media_files
                existing.attempt_count = existing.attempt_count + 1
                existing.updated_at = datetime.utcnow()
                self.db.commit()
                self.db.refresh(existing)
                
                return SubmissionResponse.from_orm(existing)
            
            db_submission = Submission(
                student_task_id=task_id,  # 直接使用task_id作为student_task_id
                student_id=student_id,  # 保存学生ID
                content_id=submission_data.content_id,
                response=submission_data.response,
                media_files=submission_data.media_files,
                attempt_count=1
            )
            self.db.add(db_submission)
            self.db.commit()
            self.db.refresh(db_submission)
            return SubmissionResponse.from_orm(db_submission)
        except Exception as e:
            self.db.rollback()
            logging.error(f"创建提交失败: {e}")
            raise e
    
    async def get_submission_by_id(self, submission_id: int) -> Optional[SubmissionResponse]:
        """根据ID获取提交"""
        db_submission = self.db.query(Submission).filter(
            Submission.id == submission_id,
            Submission.deleted_at.is_(None)
        ).first()
        
        if not db_submission:
            return None
            
        # 创建响应对象
        response = SubmissionResponse.from_orm(db_submission)
        
        # 如果有student_id，查询学生真实姓名并更新response中的student_name
        if db_submission.student_id:
            self._update_submission_student_name(response, db_submission.student_id)
        
        return response
    
    async def grade_submission(self, submission_id: int, grade_data: SubmissionGrade) -> Optional[SubmissionResponse]:
        """评分提交 - 简化版本，与Go模型兼容"""
        try:
            db_submission = self.db.query(Submission).filter(
                Submission.id == submission_id,
                Submission.deleted_at.is_(None)
            ).first()
            
            if not db_submission:
                return None
            
            # 使用新的字段名
            if hasattr(grade_data, 'score'):
                db_submission.teacher_score = grade_data.score
            if hasattr(grade_data, 'feedback'):
                db_submission.feedback = grade_data.feedback
            if hasattr(grade_data, 'is_correct'):
                db_submission.is_correct = grade_data.is_correct
            
            db_submission.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(db_submission)
            return SubmissionResponse.from_orm(db_submission)
        except Exception as e:
            self.db.rollback()
            logging.error(f"评分提交失败: {e}")
            raise e
    
    def _update_submission_student_name(self, submission_response: SubmissionResponse, student_id: str) -> None:
        """更新提交响应中的学生姓名"""
        if not student_id:
            return
            
        from app.db.account_entities import AccountEntity
        student = self.db.query(AccountEntity).filter(
            AccountEntity.id == student_id
        ).first()
        
        if student and student.user_name:
            # 尝试解析并更新response中的student_name
            try:
                import json
                if submission_response.response:
                    response_data = json.loads(submission_response.response)
                    if response_data.get('student_name') == '未知学生':
                        response_data['student_name'] = student.user_name
                        # 更新response字段
                        submission_response.response = json.dumps(response_data, ensure_ascii=False)
            except Exception as e:
                logging.error(f"更新student_name失败: {e}")
    
    async def list_submissions(self, task_id: int, params: SubmissionQueryParams) -> SubmissionListResponse:
        """获取任务提交列表 - 与Go版本兼容"""
        query = self.db.query(Submission).filter(Submission.deleted_at.is_(None))
        
        # 添加过滤条件
        query = query.filter(Submission.student_task_id == task_id)
        if params.content_id:
            query = query.filter(Submission.content_id == params.content_id)
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (params.page - 1) * params.page_size
        submissions = query.order_by(desc(Submission.created_at)).offset(offset).limit(params.page_size).all()
        
        # 转换为响应对象并更新学生姓名
        submission_responses = []
        for submission in submissions:
            response = SubmissionResponse.from_orm(submission)
            if submission.student_id:
                self._update_submission_student_name(response, submission.student_id)
            submission_responses.append(response)
        
        return SubmissionListResponse(
            submissions=submission_responses,
            total=total,
            page=params.page,
            page_size=params.page_size
        )