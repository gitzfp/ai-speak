from sqlalchemy import JSON,Column, String, DateTime, Integer, Index, Text, Boolean, func, ForeignKey, Date
from app.db import Base, engine
import datetime


class StudyPlan(Base):
    """学习计划表"""
    __tablename__ = "study_plans"

    id = Column("id", Integer, primary_key=True, autoincrement=True)  
    user_id = Column(String(50), nullable=False, comment="用户ID")  # 指定长度
    book_id = Column(String(50), nullable=False, comment="书籍ID")  # 指定长度
    daily_words = Column(Integer, default=0, comment="计划每天学多少个单词")
    create_time = Column(DateTime, default=datetime.datetime.now, comment="创建时间")
    update_time = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now, comment="更新时间")


class StudyWordProgress(Base):
    """用户单词学习进度表"""
    __tablename__ = "study_word_progress"

    id = Column("id", Integer, primary_key=True, autoincrement=True)  
    user_id = Column(String(50), nullable=False, comment="用户ID")  # 指定长度
    word_id = Column(Integer, nullable=False, comment="单词ID")
    book_id = Column(String(50), nullable=False, comment="书籍ID")  # 指定长度
    plan_id = Column(Integer, nullable=False, comment="计划ID")  # 新增 plan_id 字段
    learning_count = Column(Integer, default=0, comment="累计学习次数")
    correct_count = Column(Integer, default=0, comment="正确次数（用户答对次数）")
    incorrect_count = Column(Integer, default=0, comment="错误次数（用户答错次数）")
    last_study_time = Column(DateTime, comment="最后一次学习时间")
    next_review_time = Column(DateTime, comment="下次复习时间（未掌握时有效）")
    is_mastered = Column(Integer, default=0, comment="是否已掌握（0=未掌握，1=已掌握）")
    study_date = Column(Date, comment="学习日期")
    type = Column(Integer, default=0, comment="单词类型（0=没全部学完模式，1=全部学完三种模式）")
    create_time = Column(DateTime, default=datetime.datetime.now, comment="创建时间")
    update_time = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now, comment="更新时间")

    # 创建联合索引提高查询效率
    __table_args__ = (
        Index('idx_user_word', 'user_id', 'word_id'),
    )


class StudyRecord(Base):
    """学习记录表"""
    __tablename__ = "study_records"
    id = Column(Integer, primary_key=True, autoincrement=True, comment="记录唯一标识")
    user_id = Column(String(50), nullable=False, comment="用户ID")  # 指定长度
    book_id = Column(String(50), nullable=False, comment="书籍ID")  # 指定长度
    study_date = Column(Date, nullable=False, comment="学习日期")
    new_words = Column(Integer, default=0, comment="今日新学单词数")
    review_words = Column(Integer, default=0, comment="今日复习单词数")
    duration = Column(Integer, default=0, comment="今日学习时长（分钟）")
    create_time = Column(DateTime, default=datetime.datetime.now, comment="创建时间")
    update_time = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now, comment="更新时间")


class StudyCompletionRecord(Base):
    """学习完成记录表针对每一单元的"""
    __tablename__ = "study_completion_records"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="完成记录唯一标识")
    user_id = Column(String(50), nullable=False, comment="用户ID")  # 指定长度
    book_id = Column(String(50), nullable=False, comment="书籍ID")  # 指定长度
    lesson_id = Column(Integer, nullable=True, comment="课程ID")  # 新增 lesson_id 字段
    date = Column(Date, nullable=False, comment="完成日期")
    status = Column(Integer, default=0, comment="完成状态（0: 未完成, 1: 已完成）")  # 改为 Integer 类型
    type = Column(Integer, default=0, comment="类型（0: 单词, 1: 句子,2.背词计划用了, 3:真正的单词拼写）")  # 新增 type 字段
    continuous_days = Column(Integer, default=0, comment="连续完成天数")
    points = Column(Integer, default=0, comment="积分")  # 新增 points 字段
    speak_count = Column(Integer, default=0, comment="开口次数")  # 新增 speak_count 字段
    create_time = Column(DateTime, default=datetime.datetime.now, comment="创建时间")
    update_time = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now, comment="更新时间")

    # 新增 progress_data 字段，用于存储类似 study_progress_reports 表的数据，默认可以为空
    progress_data = Column(Text, nullable=True, comment="存储类似 study_progress_reports 表的数据")


    # 创建联合索引提高查询效率
    __table_args__ = (
        Index('idx_user_date', 'user_id', 'date'),
        Index('idx_user_book_date', 'user_id', 'book_id', 'lesson_id', 'type'),  # 新增联合索引
    )


class StudyProgressReport(Base):
    """学习进度报告表针对每一单元的"""
    __tablename__ = "study_progress_reports"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="报告唯一标识")
    user_id = Column(String(50), nullable=False, comment="用户ID")  # 指定长度
    book_id = Column(String(50), nullable=False, comment="书籍ID")  # 指定长度
    lesson_id = Column(Integer, nullable=True, comment="课程ID")  # 新增 lesson_id 字段
    content_id = Column(Integer, nullable=False, comment="内容ID（单词ID或句子ID等）")  # 新增 content_id 字段
    content = Column(String(255), nullable=False, comment="学习内容（单词或句子）")  # 修改为 content，存储具体内容
    content_type = Column(Integer, nullable=False, comment="类型（0: 单词发音, 1: 单词读, 2: 单词写, 3: 单独拼写按钮进去的那边提交, 4:句子）")  # 新增 content_type 字段
    error_count = Column(Integer, default=0, comment="错误次数（仅对单词的读和写有效）")  # 新增 error_count 字段
    points = Column(Integer, default=0, comment="积分")  # 新增 points 字段
    create_time = Column(DateTime, default=datetime.datetime.now, comment="创建时间")
    update_time = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now, comment="更新时间")
   # 将 JSON 类型改为 TEXT 类型
    json_data = Column(Text, nullable=True, default=None, comment="TEXT 数据 的评分数据")
    # 新增 voice_file 字段，长度为 300
    voice_file = Column(String(300), nullable=True, default=None, comment="语音文件路径或 URL")
    # 新增 chinese 字段，长度为 300
    chinese = Column(String(300), nullable=True, default=None, comment="中文翻译")
    # 新增 audio_url 字段，长度为 300
    audio_url = Column(String(300), nullable=True, default=None, comment="音频文件路径或 URL")

    # 创建联合索引提高查询效率
    __table_args__ = (
        Index('idx_user_book_date', 'user_id', 'book_id', 'lesson_id','content_type'),
    )