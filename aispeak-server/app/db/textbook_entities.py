import datetime
from sqlalchemy import Column, String, DateTime, Integer, Index, Text, Float
from app.db import Base, engine

class TextbookEntity(Base):
    """教材表"""
    
    __tablename__ = "textbook"
    
    id = Column("id", String(80), primary_key=True)  # 教材ID，对应 book_id
    name = Column("name", String(200), nullable=False)  # 教材名称，如"英语精通"
    subject_id = Column("subject_id", Integer, nullable=False)  # 学科ID，如12表示英语
    version_type = Column("version_type", String(50), nullable=False)  # 版本类型，如"精通"
    
    grade = Column("grade", String(50), nullable=False)  # 年级名称，如"一年级"
    term = Column("term", String(50), nullable=False)  # 学期，如"上册"
    
    icon_url = Column("icon_url", String(500), nullable=True)  # 教材图标URL
    ext_id = Column("ext_id", String(200), nullable=True)  # 关联的第三方id 
    
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间
    


class TextbookCategoryEntity(Base):
    """教材分类表"""
    
    __tablename__ = "textbook_category"
    id = Column("id", String(80), primary_key=True) 
    category_id = Column("category_id", String(80), primary_key=True)
    textbook_id = Column("textbook_id", String(80), nullable=False)
    pid = Column("pid", String(80), nullable=False)
    title = Column("title", String(200), nullable=False)
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)
    
    # 添加索引
    Index("idx_textbook_id", "textbook_id")
    Index("idx_pid", "pid")

class CourseEntity(Base):
    """课程表"""
    
    __tablename__ = "course"
    
    id = Column("id", Integer, primary_key=True)
    textbook_id = Column("textbook_id", String(80), nullable=False)
    category_id = Column("category_id", String(80), nullable=False)
    title = Column("title", String(200), nullable=False)
    sub_title = Column("sub_title", String(200), nullable=True)
    video = Column("video", String(500), nullable=True)
    srt_text = Column("srt_text", Text, nullable=True)
    pic = Column("pic", String(500), nullable=True)
    info_cn = Column("info_cn", Text, nullable=True)
    info_en = Column("info_en", Text, nullable=True)
    max_score = Column("max_score", String(50), nullable=True)
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)

class StepEntity(Base):
    """步骤表"""
    
    __tablename__ = "step"
    
    id = Column("id", Integer, primary_key=True)
    course_id = Column("course_id", Integer, nullable=False)
    text = Column("text", Text, nullable=True)
    text_cn = Column("text_cn", Text, nullable=True)
    step = Column("step", String(50), nullable=True)
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)

class LessonEntity(Base):
    """课程单元表"""
    
    __tablename__ = "lesson"
    
    id = Column("id", Integer, primary_key=True)  # 课程单元ID
    textbook_id = Column("textbook_id", String(80), nullable=True)  # 所属教材ID
    category_id = Column("category_id", String(80), nullable=True)  # 所属分类ID
    lesson_id = Column("lesson_id", String(80), nullable=False)  #
    title = Column("title", String(200), nullable=False)  # 单元标题
    sub_title = Column("sub_title", String(200), nullable=True)  # 单元副标题
    pic = Column("pic", String(500), nullable=True)  # 单元图片链接
    feature = Column("feature", Integer, default=1)  # 单元特性
    is_audition = Column("is_audition", Integer, default=0)  # 是否试听
    max_score = Column("max_score", Integer, nullable=True)  # 最高得分
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间

    def __repr__(self):
        return f"<LessonEntity(id={self.id}, title={self.title}, sub_title={self.sub_title}, pic={self.pic}, feature={self.feature}, is_audition={self.is_audition}, max_score={self.max_score}, create_time={self.create_time}, update_time={self.update_time})>"


class LessonExplainEntity(Base):
    """课程解释表"""
    
    __tablename__ = "lesson_explain"
    
    id = Column("id", Integer, primary_key=True)  # 解释ID
    lesson_id = Column("lesson_id", String(100), nullable=False)  # 所属课程ID
    teacher_id = Column("teacher_id", Integer, nullable=False)  # 教师ID
    explain_content = Column("explain_content", Text, nullable=False)  # 解释内容
    explain_audio = Column("explain_audio", String(500), nullable=True)  # 解释音频链接
    explain_audio_duration = Column("explain_audio_duration", Float, nullable=True)  # 解释音频时长
    sort = Column("sort", Integer, default=1)  # 排序
    status = Column("status", Integer, default=1)  # 状态
    isai = Column("isai", Integer, default=0)  # 是否AI
    is_edit = Column("is_edit", Integer, default=0)  # 是否可编辑
    type = Column("type", Integer, default=1)  # 类型
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间


class ExerciseEntity(Base):
    """练习题表"""
    
    __tablename__ = "exercise"
    
    id = Column("id", Integer, primary_key=True)  # 练习题ID
    lesson_id = Column("lesson_id", String(100), nullable=False)  # 所属课程ID
    title = Column("title", Text, nullable=False)  # 练习题标题
    exercise_type = Column("exercise_type", Integer, nullable=False)  # 练习题类型
    sort = Column("sort", Integer, default=1)  # 排序
    pic = Column("pic", String(500), nullable=True)  # 练习题图片链接
    main_title = Column("main_title", Text, nullable=True)  # 主标题
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间


class ExerciseOptionEntity(Base):
    """练习题选项表"""
    
    __tablename__ = "exercise_options"
    
    id = Column("id", Integer, primary_key=True)  # 选项ID
    exercise_id = Column("exercise_id", Integer, nullable=False)  # 所属练习题ID
    is_correct = Column("is_correct", Integer, default=0)  # 是否为正确答案
    text = Column("text", Text, nullable=False)  # 选项文本
    audio = Column("audio", String(500), nullable=True)  # 选项音频链接
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间


class TaskTargetsEntity(Base):
    """任务目标表"""
    
    __tablename__ = "task_target"
    
    id = Column("id", Integer, primary_key=True)  # 任务目标ID
    info_cn = Column("info_cn", String(200), nullable=False)  # 中文描述
    info_en = Column("info_en", String(200), nullable=True)  # 英文描述
    lesson_id = Column("lesson_id", String(500), nullable=False)  # 所属课程ID
    info_en_audio = Column("info_en_audio", String(500), nullable=True)  # 英文音频链接
    match_type = Column("match_type", Integer, nullable=False)  # 匹配类型
    status = Column("status", Integer, default=1)  # 状态
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间

class LessonPointEntity(Base):
    """知识点表"""
    
    __tablename__ = "lesson_point"
    
    id = Column("id", Integer, primary_key=True)  # 知识点ID
    lesson_id = Column("lesson_id", String(100), nullable=False)  # 所属课程单元ID
    word = Column("word", String(200), nullable=False)  # 单词
    meaning = Column("meaning", Text, nullable=False)  # 含义
    type = Column("type", Integer, nullable=False)  # 类型
    audio = Column("audio", String(500), nullable=True)  # 音频链接
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间


class LessonPartEntity(Base):
    """教材部分表"""
    
    __tablename__ = "lesson_part"
    
    id = Column("id", Integer, primary_key=True)  # 部分ID
    textbook_id = Column("textbook_id", String(80))  # 所属教材ID
    lesson_id = Column("lesson_id", String(100), nullable=False)  # 课程ID
    type = Column("type", String(50), nullable=False)  # 类型
    title = Column("title", String(200), nullable=False)  # 标题
    subtitle = Column("subtitle", Text, nullable=True)  # 副标题
    pic = Column("pic", String(500), nullable=True)  # 图片链接
    gray_pic = Column("gray_pic", String(500), nullable=True)  # 灰色图片链接
    is_show = Column("is_show", Integer, default=1)  # 是否显示
    rate = Column("rate", Float, nullable=True)  # 比例
    must = Column("must", Integer, default=0)  # 是否必须
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间

class TeacherEntity(Base):
    """教师表"""
    
    __tablename__ = "teacher"
    
    id = Column(Integer, primary_key=True, autoincrement=True)  # 教师ID
    name = Column(String(255), nullable=True)  # 教师姓名
    avatar = Column(String(255), nullable=True)  # 教师头像链接
    description = Column(Text, nullable=True)  # 教师描述
    lesson_id = Column(String(100), nullable=True)  # 所属课程ID
    role_short_name = Column(String(100), nullable=True)  # 角色简称
    prompt = Column(String(1000), nullable=True)  # 提示语
    language = Column(String(50), nullable=True)  # 语言

# 创建表
Base.metadata.create_all(engine)
