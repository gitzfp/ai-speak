from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.db.study_entities import StudyPlan, StudyWordProgress, StudyRecord  # 假设实体类在 study_entities.py 中
from app.db.words_entities import Word  # 假设 Word 是单词表实体


class StudyService:
    def __init__(self, db: Session):
        self.db = db

    # StudyPlan 表的增删改查
    def create_study_plan(self, user_id: str, book_id: str, daily_words: int) -> StudyPlan:
        """创建学习计划"""
        study_plan = StudyPlan(
            user_id=user_id,
            book_id=book_id,
            daily_words=daily_words,
            create_time=datetime.now()
        )
        self.db.add(study_plan)
        self.db.commit()
        self.db.refresh(study_plan)
        return study_plan

    def get_study_plan_by_id(self, plan_id: int) -> Optional[StudyPlan]:
        """根据ID获取学习计划"""
        return self.db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()

    def get_study_plan_by_user_and_book(self, user_id: str, book_id: str) -> Optional[StudyPlan]:
        """根据用户ID和书本ID获取当前书本的学习计划，确保只返回一条数据"""
        study_plan = (
            self.db.query(StudyPlan)
            .filter(StudyPlan.user_id == user_id, StudyPlan.book_id == book_id)
            .first()  # 只返回第一条数据
        )

        # 如果没有找到学习计划，则创建一个默认的学习计划
        if not study_plan:
            default_daily_words = 5  # 默认每天学习5个单词
            study_plan = self.create_study_plan(user_id, book_id, default_daily_words)
        return study_plan

    def update_study_plan(self, plan_id: int, daily_words: Optional[int] = None) -> Optional[StudyPlan]:
        """更新学习计划"""
        study_plan = self.get_study_plan_by_id(plan_id)
        if not study_plan:
            return None

        if daily_words is not None:
            study_plan.daily_words = daily_words

        self.db.commit()
        self.db.refresh(study_plan)
        return study_plan

    def get_study_records_by_user(self, user_id: str, book_id: str, study_date: date) -> StudyRecord:
        """
        根据用户ID、书本ID和日期查询一条学习记录，如果没有则返回默认记录（不插入数据库）
        :param user_id: 用户ID
        :param book_id: 书本ID
        :param study_date: 学习日期
        :return: 学习记录对象
        """
        # 查询学习记录
        study_record = (
            self.db.query(StudyRecord)
            .filter(
                StudyRecord.user_id == user_id,
                StudyRecord.book_id == book_id,
                StudyRecord.study_date == study_date
            )
            .first()
        )

        # 如果没有找到学习记录，则返回默认记录（不插入数据库）
        if not study_record:
            default_new_words = 0  # 默认新学单词数为0
            default_review_words = 0  # 默认复习单词数为0
            default_duration = 0  # 默认学习时长为0

            study_record = StudyRecord(
                user_id=user_id,
                book_id=book_id,
                study_date=study_date,
                new_words=default_new_words,
                review_words=default_review_words,
                duration=default_duration
            )
            return study_record

    def get_user_words(self, user_id: str, book_id: str) -> Dict:
        """
        获取当前用户在当前书本中已学和未学的单词数组
        :param user_id: 用户ID
        :param book_id: 书本ID
        :return: 包含已学和未学单词的字典
        """
        try:
            # 获取当前书本的所有单词
            words = self.db.query(Word).filter(Word.book_id == book_id).all()

            # 获取用户在当前书本的已学单词ID列表
            learned_word_ids = (
                self.db.query(StudyWordProgress.word_id)
                .filter(
                    StudyWordProgress.user_id == user_id,
                    StudyWordProgress.book_id == book_id,
                    StudyWordProgress.type == 3  # 已学单词的条件
                )
                .all()
            )
            learned_word_ids = [word_id for (word_id,) in learned_word_ids]  # 提取单词ID

            # 分离已学和未学单词
            learned_words = []
            unlearned_words = []

            for word in words:
                word_data = {
                    "word_id": word.id,
                    "word": word.word,
                    "lesson_id": word.lesson_id,
                    "chinese": word.chinese,
                    "phonetic": word.phonetic,
                    "sound_path": word.sound_path,
                    "image_path": word.image_path,
                    "has_base": word.has_base
                }

                if word.id in learned_word_ids:
                    learned_words.append(word_data)
                else:
                    unlearned_words.append(word_data)

            # 构建返回数据
            result = {
                "book_id": book_id,
                "user_id": user_id,
                "learned_words": learned_words,
                "unlearned_words": unlearned_words
            }

            return result

        except Exception as e:
            print(f"获取用户单词列表失败: {str(e)}")
            return None