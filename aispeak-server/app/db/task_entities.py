from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from typing import List, Optional
from app.db import Base

# 任务类型枚举 - 与Go模型保持一致
class TaskType(str, Enum):
    DICTATION = "dictation"  # 听写
    SPELLING = "spelling"    # 拼写
    PRONUNCIATION = "pronunciation"  # 发音
    SENTENCE_REPEAT = "sentence_repeat"  # 句子跟读
    QUIZ = "quiz"  # 测验

# 学科类型枚举 - 新增，与Go模型保持一致
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

# 任务状态枚举 - 更新与Go模型保持一致
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

# 班级表
class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, comment="班级名称")
    grade_level = Column(String(50), nullable=False, index=True, comment="年级")
    subject = Column(String(50), index=True, comment="主教学科")
    school_name = Column(String(200), nullable=True, index=True, comment="学校名称(可选)")
    teacher_id = Column(String(80), nullable=False, index=True, comment="班主任ID")
    status = Column(String(20), default="active", index=True, comment="状态")
    description = Column(Text, comment="班级描述")
    max_students = Column(Integer, nullable=False, default=50, comment="最大学生人数")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # 移除关系定义，因为class_id类型不匹配
    # tasks = relationship("Task", back_populates="class_obj")
    # students = relationship("ClassStudent", back_populates="class_obj")
    # teachers = relationship("ClassTeacher", back_populates="class_obj")

# 班级学生关系表
class ClassStudent(Base):
    __tablename__ = "class_students"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, nullable=False, index=True, comment="班级ID")
    student_id = Column(String(80), nullable=False, index=True, comment="学生ID")
    join_date = Column(DateTime, nullable=False, default=datetime.utcnow, comment="加入日期")
    leave_date = Column(DateTime, nullable=True, comment="离开日期")
    status = Column(String(20), default="active", index=True, comment="状态")
    role = Column(String(50), comment="班级角色")  # 新增：与Go模型保持一致
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # 关系
    # class_obj = relationship("Class", back_populates="students")

# 班级教师关系表
class ClassTeacher(Base):
    __tablename__ = "class_teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, nullable=False, index=True, comment="班级ID")
    teacher_id = Column(String(80), nullable=False, index=True, comment="教师ID")
    join_date = Column(DateTime, nullable=False, default=datetime.utcnow, comment="加入日期")
    leave_date = Column(DateTime, nullable=True, comment="离开日期")
    status = Column(String(20), default="active", index=True, comment="状态")
    role = Column(String(50), comment="教师角色")  # 修改：与Go模型保持一致
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # 关系
    # class_obj = relationship("Class", back_populates="teachers")

# 任务表 - 修改以匹配Go模型
class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(String(80), nullable=False, index=True, comment="教师ID")
    class_id = Column(Integer, nullable=False, index=True, comment="班级ID")
    title = Column(String(200), nullable=False, comment="任务标题")
    description = Column(Text, comment="任务描述")
    task_type = Column(SQLEnum(TaskType), nullable=False, comment="任务类型")
    subject = Column(SQLEnum(SubjectType), nullable=False, index=True, comment="所属学科")  # 新增
    deadline = Column(DateTime, comment="截止时间")  # 替换start_time和end_time
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.DRAFT, comment="任务状态")
    allow_late_submission = Column(Boolean, default=False, comment="允许迟交")  # 新增
    max_attempts = Column(Integer, comment="最大尝试次数")  # 新增
    grading_criteria = Column(Text, comment="评分标准")  # 新增
    total_points = Column(Integer, nullable=False, default=100, comment="总分")
    attachments = Column(JSON, comment="附件信息")  # 新增
    textbook_id = Column(Integer, index=True, comment="关联教材ID")  # 新增
    lesson_id = Column(Integer, index=True, comment="关联教学单元ID")  # 新增
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # 关系
    contents = relationship("TaskContent", back_populates="task")
    # 移除submissions关系，因为新的Submission表结构不再直接关联task_id

# 任务内容表 - 修改以匹配Go模型
class TaskContent(Base):
    __tablename__ = "task_contents"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True, comment="任务ID")
    content_type = Column(String(50), nullable=False, index=True, comment="内容类型")
    generate_mode = Column(String(20), default="auto", comment="生成模式")  # 新增
    ref_book_id = Column(String(50), index=True, comment="关联教材ID")  # 新增
    ref_lesson_id = Column(Integer, index=True, comment="关联单元ID")  # 新增
    selected_word_ids = Column(JSON, comment="手动选择的单词ID列表")  # 新增
    selected_sentence_ids = Column(JSON, comment="手动选择的句子ID列表")  # 新增
    points = Column(Integer, nullable=False, default=10, comment="分值")
    meta_data = Column('metadata', JSON, comment="元数据")  # 属性名用meta_data，但数据库列名仍为metadata 
    order_num = Column(Integer, nullable=False, comment="排序号")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # 关系
    task = relationship("Task", back_populates="contents")

# 重新设计提交表以与Go模型保持一致
class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    # 关联的学生任务ID (对应Go的StudentTaskID)
    student_task_id = Column(Integer, nullable=False, index=True, comment="学生任务ID")
    # 关联的任务内容ID (对应Go的ContentID)
    content_id = Column(Integer, nullable=False, index=True, comment="内容ID")
    # 文本回答内容 (对应Go的Response)
    response = Column(Text, comment="回答内容")
    # 统一的媒体文件字段 (对应Go的MediaFiles)
    media_files = Column(JSON, comment="统一媒体文件")
    # 自动评分是否正确 (对应Go的IsCorrect)
    is_correct = Column(Boolean, nullable=True, index=True, comment="是否正确")
    # 自动评分得分 (对应Go的AutoScore)
    auto_score = Column(Integer, nullable=True, comment="自动评分")  # 改为Integer以匹配分数系统
    # 教师评分得分 (对应Go的TeacherScore)
    teacher_score = Column(Integer, nullable=True, comment="教师评分")  # 改为Integer以匹配分数系统
    # 单项反馈内容 (对应Go的Feedback)
    feedback = Column(Text, comment="单项反馈")
    # 尝试次数 (对应Go的AttemptCount)
    attempt_count = Column(Integer, default=1, comment="尝试次数")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

# 移除原来的SubmissionDetail表，因为Go模型中没有对应的表