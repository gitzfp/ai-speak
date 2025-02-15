from sqlalchemy import Column, String, DateTime, Integer, Index, Text, Boolean, func
from app.db import Base, engine
import datetime


class Syllable(Base):
    """音节表"""
    __tablename__ = "syllables"

    id = Column(Integer, primary_key=True, index=True, comment="音节ID")
    letter = Column(String(50), nullable=False, comment="音节对应的字母组合")
    content = Column(String(50), unique=True, nullable=False, comment="音节内容")
    sound_path = Column(String(500), comment="音节发音音频路径")
    phonetic = Column(String(50), comment="音节音标")


class Word(Base):
    """单词表"""
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    word_id = Column(Integer, unique=True, index=True, nullable=False, comment="单词唯一标识ID")
    lesson_id = Column(Integer, nullable=False, comment="所属课时ID")
    book_id = Column(String(50), nullable=False, comment="所属书籍ID")
    word = Column(String(100), comment="单词内容")
    chinese = Column(String(200), comment="单词的中文释义")
    phonetic = Column(String(100), comment="单词的音标")
    uk_phonetic = Column(String(100), comment="英式音标")
    us_phonetic = Column(String(100), comment="美式音标")
    sound_path = Column(String(500), comment="单词音频文件路径")
    uk_sound_path = Column(String(500), comment="英式发音音频路径")
    us_sound_path = Column(String(500), comment="美式发音音频路径")
    image_path = Column(String(500), comment="单词图片文件路径")
    has_base = Column(Boolean, default=False, comment="是否包含基础词信息")
    paraphrase = Column(Text, comment="单词的详细释义")
    phonics = Column(Text, comment="单词的自然拼读信息")
    word_tense = Column(Text, comment="单词的不同词态（如单数、复数、过去式等）")
    example_sentence = Column(Text, comment="包含该单词的例句")
    phrase = Column(Text, comment="包含该单词的常见词组")
    synonym = Column(Text, comment="单词的近义词")
    create_time = Column("create_time", DateTime,
                         default=datetime.datetime.now)
    update_time = Column("update_time", DateTime,
                         default=datetime.datetime.now)


class WordSyllable(Base):
    """单词音节关联表"""
    __tablename__ = "word_syllables"

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    word_id = Column(Integer, index=True, nullable=False, comment="单词ID")
    syllable_id = Column(Integer, index=True, nullable=False, comment="音节ID")
    position = Column(Integer, nullable=False, comment="音节在单词中的位置")
    create_time = Column("create_time", DateTime, default=datetime.datetime.now)

    # 创建联合索引提高查询效率
    __table_args__ = (
        Index('idx_word_syllable', 'word_id', 'syllable_id'),
    )


# 如果数据库未创建表，则自动创建表
Base.metadata.create_all(engine)
