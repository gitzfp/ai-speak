from sqlalchemy import Column, String, DateTime, Integer, Index, Text, Boolean, func, ForeignKey, Date
from app.db import Base, engine
import datetime


class StudyPlan(Base):
    """学习计划表"""
    __tablename__ = "study_plans"

    plan_id = Column(Integer, primary_key=True, autoincrement=True, comment="计划唯一标识")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    book_id = Column(Integer, nullable=False, comment="书籍ID")
    daily_words = Column(Integer, default=0, comment="计划每天学多少个单词")
    total_words = Column(Integer, default=0, comment="这本书总共多少单词")
    total_days = Column(Integer, default=0, comment="总计划天数")
    create_time = Column(DateTime, default=datetime.datetime.now, comment="创建时间")


class UserWordProgress(Base):
    """用户单词学习进度表"""
    __tablename__ = "user_word_progress"

    progress_id = Column(Integer, primary_key=True, autoincrement=True, comment="进度唯一标识")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    word_id = Column(Integer, nullable=False, comment="单词ID")
    book_id = Column(Integer, nullable=False, comment="书籍ID")
    learning_count = Column(Integer, default=0, comment="累计学习次数")
    correct_count = Column(Integer, default=0, comment="正确次数（用户答对次数）")
    incorrect_count = Column(Integer, default=0, comment="错误次数（用户答错次数）")
    last_study_time = Column(DateTime, comment="最后一次学习时间")
    next_review_time = Column(DateTime, comment="下次复习时间（未掌握时有效）")
    memory_stage = Column(Integer, default=0, comment="记忆阶段（0=未学，1=短期记忆，2=长期记忆）")
    is_mastered = Column(Integer, default=0, comment="是否已掌握（0=未掌握，1=已掌握）")
    study_date = Column(Date, comment="学习日期")
    is_new = Column(Integer, default=1, comment="是否为新学单词（1=新学，0=复习）")

    # 创建联合索引提高查询效率
    __table_args__ = (
        Index('idx_user_word', 'user_id', 'word_id'),
    )


class StudyRecord(Base):
    """学习记录表"""
    __tablename__ = "study_records"

    record_id = Column(Integer, primary_key=True, autoincrement=True, comment="记录唯一标识")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    book_id = Column(Integer, nullable=False, comment="书籍ID")
    study_date = Column(Date, nullable=False, comment="学习日期")
    new_words = Column(Integer, default=0, comment="今日新学单词数")
    review_words = Column(Integer, default=0, comment="今日复习单词数")
    duration = Column(Integer, default=0, comment="今日学习时长（分钟）")


# 如果数据库未创建表，则自动创建表
Base.metadata.create_all(engine)