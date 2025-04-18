import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, Float, Boolean
from app.db import Base, engine
from enum import Enum


class Publisher(Enum):
    PEP = "pep"  # 人教版
    FLTRP = "fltrp"  # 外研社


class TextbookEntity(Base):
    """教材表"""

    __tablename__ = "textbook"

    id = Column("id", String(80), primary_key=True)  # 教材ID，对应 book_id
    name = Column("name", String(200), nullable=False)  # 教材名称，如"英语精通"
    subject_id = Column("subject_id", Integer, nullable=False)  # 学科ID，如12表示英语
    version_type = Column("version_type", String(50),
                          nullable=False)  # 版本类型，如"精通"
    publisher = Column("publisher", String(50), nullable=False, default=Publisher.PEP.value)  # 出版社

    grade = Column("grade", String(50), nullable=False)  # 年级名称，如"一年级"
    term = Column("term", String(50), nullable=False)  # 学期，如"上册"

    icon_url = Column("icon_url", String(500), nullable=True)  # 教材图标URL
    ext_id = Column("ext_id", String(200), nullable=True)  # 关联的第三方id

    create_time = Column("create_time", DateTime,
                         default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime,
                         default=datetime.datetime.now)  # 更新时间


class TextbookPageEntity(Base):
    """教材页面表"""

    __tablename__ = "textbook_page"

    id = Column("id", String(80), primary_key=True)  # 页面ID
    book_id = Column("book_id", String(80), nullable=False)  # 关联的书籍ID
    page_name = Column("page_name", String(200), nullable=False)  # 页面名称
    page_no = Column("page_no", Integer, nullable=False)  # 页码
    page_no_v2 = Column("page_no_v2", String(50), nullable=True)  # 页码版本
    page_url = Column("page_url", String(500), nullable=True)  # 页面URL
    page_url_source = Column(
        "page_url_source", String(500), nullable=True)  # 页面源URL
    version = Column("version", String(50), nullable=True)  # 版本
    create_time = Column("create_time", DateTime,
                         default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now,
                         onupdate=datetime.datetime.now)  # 更新时间


class TextbookSentence(Base):
    """教材句子表"""

    __tablename__ = "textbook_sentences"

    id = Column("id", Integer, primary_key=True, autoincrement=True)  # 句子ID
    book_id = Column("book_id", String(80), nullable=False)  # 关联的书籍ID
    page_no = Column("page_no", Integer, nullable=False)  # 页码
    sentence = Column("sentence", Text, nullable=False)  # 句子内容

    # 新增字段
    is_recite = Column("is_recite", Integer, default=0)  # 是否背诵
    is_ai_dub = Column("is_ai_dub", Boolean, default=False)  # 是否AI配音
    track_continue_play_id = Column(
        "track_continue_play_id", String(80), nullable=True)  # 继续播放ID
    track_url_source = Column(
        "track_url_source", String(500), nullable=True)  # 音频源URL
    track_right = Column("track_right", Float, nullable=True)  # 右侧位置
    track_top = Column("track_top", Float, nullable=True)  # 顶部位置
    track_left = Column("track_left", Float, nullable=True)  # 左侧位置
    track_url = Column("track_url", String(500), nullable=True)  # 音频URL
    track_id = Column("track_id", Integer, nullable=True)  # 音频ID
    is_evaluation = Column("is_evaluation", Integer, default=0)  # 是否评估
    track_name = Column("track_name", String(200), nullable=True)  # 音频名称
    track_genre = Column("track_genre", Text, nullable=True)  # 音频类型
    track_duration = Column("track_duration", Float, nullable=True)  # 音频时长
    track_index = Column("track_index", Integer, nullable=False)  # 音频索引
    track_text = Column("track_text", Text, nullable=True)  # 音频文本
    track_evaluation = Column(
        "track_evaluation", Text, nullable=True)  # 音频评估
    track_bottom = Column("track_bottom", Float, nullable=True)  # 底部位置


class TaskTargetsEntity(Base):
    """任务目标表"""

    __tablename__ = "task_target"

    id = Column("id", Integer, primary_key=True)  # 任务目标ID
    info_cn = Column("info_cn", String(200), nullable=False)  # 中文描述
    info_en = Column("info_en", String(200), nullable=True)  # 英文描述
    lesson_id = Column("lesson_id", String(500), nullable=False)  # 所属课程ID
    info_en_audio = Column("info_en_audio", String(500),
                           nullable=True)  # 英文音频链接
    match_type = Column("match_type", Integer, nullable=False)  # 匹配类型
    status = Column("status", Integer, default=1)  # 状态
    create_time = Column("create_time", DateTime,
                         default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime,
                         default=datetime.datetime.now)  # 更新时间


class LessonEntity(Base):
    """课程单元表"""

    __tablename__ = "lesson"

    id = Column("id", Integer, primary_key=True, autoincrement=True)  # 课程ID
    lesson_id = Column("lesson_id", String(80), nullable=False)
    book_id = Column("book_id", String(80), nullable=False)  # 关联的教材ID
    title = Column("title", String(200), nullable=False)  # 单元标题
    parent_id = Column("parent_id", String(80), nullable=True)  # 父级ID，顶级单元为null

    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间


class LessonSentenceEntity(Base):
    """课程句子表"""

    __tablename__ = "lesson_sentence"

    id = Column("id", Integer, primary_key=True, autoincrement=True)  # 句子ID
    lesson_id = Column("lesson_id", Integer, nullable=False)  # 关联的课程ID
    english = Column("english", Text, nullable=False)  # 英文内容
    chinese = Column("chinese", Text, nullable=False)  # 中文内容

    # 音频相关
    audio_url = Column("audio_url", String(500), nullable=True)  # 音频URL
    audio_start = Column("audio_start", Integer, nullable=True)  # 音频开始时间（毫秒）
    audio_end = Column("audio_end", Integer, nullable=True)  # 音频结束时间（毫秒）
    is_lock = Column("is_lock", Integer, default=0)  # 是否锁定

    create_time = Column("create_time", DateTime,
                         default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime,
                         default=datetime.datetime.now)  # 更新时间
    
class ChapterEntity(Base):
    """章节目录表"""
    
    __tablename__ = "textbook_chapter"
    
    id = Column("id", Integer, primary_key=True, autoincrement=True)  # 章节ID
    title = Column("title", String(200), nullable=False)  # 章节标题
    book_id = Column("book_id", String(100), nullable=False)  # 关联的教材ID
    parent_id = Column("parent_id", Integer, nullable=True)  # 父章节ID，顶级章节为null
    
    page_id = Column("page_id", Integer, nullable=True)  # 页面ID
    page_no = Column("page_no", Integer, nullable=True)  # 页码

    create_time = Column("create_time", DateTime, default=datetime.datetime.now)  # 创建时间
    update_time = Column("update_time", DateTime, default=datetime.datetime.now)  # 更新时间

