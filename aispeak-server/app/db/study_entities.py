from sqlalchemy import Column, String, DateTime, Integer, Index, Text, Boolean, func, ForeignKey, Date
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
    book_id = Column(Integer, nullable=False, comment="书籍ID")
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