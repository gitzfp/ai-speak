from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# 任务类型枚举
class TaskType(str, Enum):
    DICTATION = "dictation"  # 听写
    SPELLING = "spelling"    # 拼写
    PRONUNCIATION = "pronunciation"  # 发音
    SENTENCE_REPEAT = "sentence_repeat"  # 句子跟读
    QUIZ = "quiz"  # 测验

# 学科类型枚举 - 新增
class SubjectType(str, Enum):
    ENGLISH = "english"  # 英语
    CHINESE = "chinese"  # 语文
    MATH = "math"  # 数学
    SCIENCE = "science"  # 科学
    HISTORY = "history"  # 历史
    GEOGRAPHY = "geography"  # 地理
    ART = "art"  # 美术
    MUSIC = "music"  # 音乐
    PHYSICAL_EDUCATION = "physical_education"  # 体育
    OTHER = "other"  # 其他

# 任务状态枚举 - 更新
class TaskStatus(str, Enum):
    DRAFT = "draft"  # 草稿
    PUBLISHED = "published"  # 已发布
    IN_PROGRESS = "in_progress"  # 进行中
    COMPLETED = "completed"  # 已完成
    ARCHIVED = "archived"  # 已归档

# 提交状态枚举
class SubmissionStatus(str, Enum):
    PENDING = "pending"  # 待提交
    SUBMITTED = "submitted"  # 已提交
    GRADED = "graded"  # 已评分
    RETURNED = "returned"  # 已返回

# 媒体文件模型
class MediaFile(BaseModel):
    url: str = Field(..., description="文件URL")
    type: str = Field(..., description="文件类型: audio, image, file 等")
    name: Optional[str] = Field(None, description="文件名")
    size: Optional[int] = Field(None, description="文件大小")
    mime_type: Optional[str] = Field(None, description="MIME类型")

# 班级相关模型
class ClassBase(BaseModel):
    name: str = Field(..., max_length=200, description="班级名称")
    grade_level: str = Field(..., max_length=50, description="年级")
    subject: Optional[str] = Field(None, max_length=50, description="主教学科")
    school_name: Optional[str] = Field(None, max_length=200, description="学校名称(可选)")
    teacher_id: str = Field(..., max_length=80, description="班主任ID")
    description: Optional[str] = Field(None, description="班级描述")
    max_students: int = Field(50, description="最大学生人数")

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200, description="班级名称")
    grade_level: Optional[str] = Field(None, max_length=50, description="年级")
    subject: Optional[str] = Field(None, max_length=50, description="主教学科")
    school_name: Optional[str] = Field(None, max_length=200, description="学校名称(可选)")
    description: Optional[str] = Field(None, description="班级描述")
    max_students: Optional[int] = Field(None, description="最大学生人数")

class ClassResponse(ClassBase):
    id: int
    class_code: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    student_count: Optional[int] = 0  # 学生人数
    
    class Config:
        from_attributes = True

# 班级学生管理
class ClassStudentAdd(BaseModel):
    student_id: str = Field(..., max_length=80, description="学生ID")
    role: Optional[str] = Field(None, max_length=50, description="班级角色")

class ClassStudentResponse(BaseModel):
    id: int
    class_id: int
    student_id: str
    join_date: datetime
    leave_date: Optional[datetime]
    status: str
    role: Optional[str]
    
    class Config:
        from_attributes = True

# 班级教师管理
class ClassTeacherAdd(BaseModel):
    teacher_id: str = Field(..., max_length=80, description="教师ID")
    role: Optional[str] = Field(None, max_length=50, description="教师角色")

class ClassTeacherResponse(BaseModel):
    id: int
    class_id: int
    teacher_id: str
    role: Optional[str]
    join_date: datetime
    leave_date: Optional[datetime]
    status: str
    
    class Config:
        from_attributes = True

# 班级加入请求模型
class ClassJoinRequest(BaseModel):
    class_code: Optional[str] = Field(None, min_length=6, max_length=6, description="班级码")
    class_id: Optional[int] = Field(None, description="班级ID")
    student_id: str = Field(..., max_length=80, description="学生ID")
    
    @validator('class_code', 'class_id')
    def validate_join_method(cls, v, values):
        if not v and not values.get('class_id') and not values.get('class_code'):
            raise ValueError('必须提供班级码或班级ID')
        return v

# 任务内容模型 - 更新以匹配Go模型
class TaskContentBase(BaseModel):
    content_type: str = Field(..., max_length=50, description="内容类型")
    generate_mode: str = Field("auto", max_length=20, description="生成模式")
    ref_book_id: Optional[str] = Field(None, max_length=50, description="关联教材ID")
    ref_lesson_id: Optional[int] = Field(None, description="关联单元ID")
    selected_word_ids: Optional[List[int]] = Field(None, description="手动选择的单词ID列表")
    selected_sentence_ids: Optional[List[int]] = Field(None, description="手动选择的句子ID列表")
    points: int = Field(10, description="分值")
    meta_data: Optional[Dict[str, Any]] = Field(None, description="元数据")
    order_num: int = Field(..., description="排序号")

class TaskContentCreate(TaskContentBase):
    pass

class TaskContentResponse(TaskContentBase):
    id: int
    task_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# 任务模型 - 更新以匹配Go模型
class TaskBase(BaseModel):
    title: str = Field(..., max_length=200, description="任务标题")
    description: Optional[str] = Field(None, description="任务描述")
    task_type: TaskType = Field(..., description="任务类型")
    subject: SubjectType = Field(..., description="所属学科")
    deadline: Optional[datetime] = Field(None, description="截止时间")
    allow_late_submission: bool = Field(False, description="允许迟交")
    max_attempts: Optional[int] = Field(None, description="最大尝试次数")
    grading_criteria: Optional[str] = Field(None, description="评分标准")
    total_points: int = Field(100, description="总分")
    attachments: Optional[Dict[str, Any]] = Field(None, description="附件信息")
    textbook_id: Optional[str] = Field(None, max_length=80, description="关联教材ID")
    lesson_id: Optional[int] = Field(None, description="关联教学单元ID")

class TaskCreate(TaskBase):
    teacher_id: str = Field(..., max_length=80, description="教师ID")
    class_id: int = Field(..., description="班级ID")
    contents: List[TaskContentCreate] = Field(..., description="任务内容")
    
    @validator('contents')
    def validate_contents(cls, v):
        if not v:
            raise ValueError('任务内容不能为空')
        
        # 检查排序号是否重复
        order_nums = [content.order_num for content in v]
        if len(order_nums) != len(set(order_nums)):
            raise ValueError('任务内容排序号不能重复')
        
        # 检查分值总和
        total_points = sum(content.points for content in v)
        if total_points <= 0:
            raise ValueError('任务总分必须大于0')
        
        return v

    @validator('task_type', pre=True, allow_reuse=True)
    def task_type_to_lower(cls, v):
        if isinstance(v, str):
            return v.lower()
        return v

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200, description="任务标题")
    description: Optional[str] = Field(None, description="任务描述")
    task_type: Optional[TaskType] = Field(None, description="任务类型")
    subject: Optional[SubjectType] = Field(None, description="所属学科")
    deadline: Optional[datetime] = Field(None, description="截止时间")
    status: Optional[TaskStatus] = Field(None, description="任务状态")
    allow_late_submission: Optional[bool] = Field(None, description="允许迟交")
    max_attempts: Optional[int] = Field(None, description="最大尝试次数")
    grading_criteria: Optional[str] = Field(None, description="评分标准")
    total_points: Optional[int] = Field(None, description="总分")
    attachments: Optional[Dict[str, Any]] = Field(None, description="附件信息")
    textbook_id: Optional[str] = Field(None, max_length=80, description="关联教材ID")
    lesson_id: Optional[int] = Field(None, description="关联教学单元ID")

class TaskResponse(TaskBase):
    id: int
    teacher_id: str
    class_id: int
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    contents: Optional[List[TaskContentResponse]] = None
    submission_count: Optional[int] = 0  # 提交数量
    # 学生相关字段
    student_submission: Optional[Dict[str, Any]] = None  # 学生的提交信息
    
    class Config:
        from_attributes = True

class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]
    total: int
    page: int
    page_size: int

# 查询参数模型
class TaskQueryParams(BaseModel):
    teacher_id: Optional[str] = None
    student_id: Optional[str] = None  # 添加学生ID字段
    class_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    task_type: Optional[TaskType] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(10, ge=1, le=100)

class SubmissionQueryParams(BaseModel):
    student_task_id: Optional[int] = None  # 更新字段名
    content_id: Optional[int] = None  # 更新字段名
    page: int = Field(1, ge=1)
    page_size: int = Field(10, ge=1, le=100)

# 提交相关模型 - 与Go版本兼容
class SubmissionCreate(BaseModel):
    content_id: int = Field(..., description="内容ID")
    response: Optional[str] = Field(None, description="文本回答内容")
    media_files: Optional[List[Dict[str, Any]]] = Field(None, description="媒体文件列表")

class SubmissionUpdate(BaseModel):
    response: Optional[str] = Field(None, description="文本回答内容")
    media_files: Optional[List[Dict[str, Any]]] = Field(None, description="媒体文件列表")

class SubmissionGrade(BaseModel):
    score: float = Field(..., ge=0, le=100, description="评分")
    feedback: Optional[str] = Field(None, description="反馈内容")
    is_correct: Optional[bool] = Field(None, description="是否正确")

class SubmissionResponse(BaseModel):
    id: int
    student_task_id: int  # 与Go版本对应
    student_id: Optional[str] = None  # 学生ID
    content_id: int
    response: Optional[str] = None
    media_files: Optional[List[Dict[str, Any]]] = None
    is_correct: Optional[bool] = None
    auto_score: Optional[float] = None
    teacher_score: Optional[float] = None
    feedback: Optional[str] = None
    attempt_count: int = 1
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SubmissionListResponse(BaseModel):
    submissions: List[SubmissionResponse]
    total: int
    page: int
    page_size: int