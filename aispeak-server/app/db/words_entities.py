import datetime
from sqlalchemy import Column, String, DateTime, Integer, Index, Text, Boolean
from app.db import Base, engine



class Word(Base):
    __tablename__ = "words"
    
    id = Column(Integer, primary_key=True, index=True)
    word_id = Column(Integer, unique=True, index=True)
    lesson_id = Column(Integer, nullable=False)
    book_id = Column(String(50), nullable=False)
    word = Column(String(100))
    chinese = Column(String(200))
    phonetic = Column(String(100))
    sound_path = Column(String(500))
    image_path = Column(String(500))
    has_base = Column(Boolean, default=False)
    

# 数据库未创建表的话自动创建表
Base.metadata.create_all(engine)
