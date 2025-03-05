from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.db.study_entities import StudyPlan, StudyWordProgress, StudyRecord  # 假设实体类在 study_entities.py 中

class StudyService:
    def __init__(self, db: Session):
        self.db = db

    # StudyPlan 表的增删改查
    def create_study_plan(self, user_id: int, book_id: int, daily_words: int, total_words: int, total_days: int) -> StudyPlan:
        """创建学习计划"""
        study_plan = StudyPlan(
            user_id=user_id,
            book_id=book_id,
            daily_words=daily_words,
            total_words=total_words,
            total_days=total_days,
            create_time=datetime.now()
        )
        self.db.add(study_plan)
        self.db.commit()
        self.db.refresh(study_plan)
        return study_plan

    def get_study_plan_by_id(self, plan_id: int) -> Optional[StudyPlan]:
        """根据ID获取学习计划"""
        return self.db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()

    def get_study_plans_by_user(self, user_id: int) -> List[StudyPlan]:
        """获取用户的所有学习计划"""
        return self.db.query(StudyPlan).filter(StudyPlan.user_id == user_id).all()

    def update_study_plan(self, plan_id: int, daily_words: Optional[int] = None, total_words: Optional[int] = None, total_days: Optional[int] = None) -> Optional[StudyPlan]:
        """更新学习计划"""
        study_plan = self.get_study_plan_by_id(plan_id)
        if not study_plan:
            return None

        if daily_words is not None:
            study_plan.daily_words = daily_words
        if total_words is not None:
            study_plan.total_words = total_words
        if total_days is not None:
            study_plan.total_days = total_days

        self.db.commit()
        self.db.refresh(study_plan)
        return study_plan

    def delete_study_plan(self, plan_id: int) -> bool:
        """删除学习计划"""
        study_plan = self.get_study_plan_by_id(plan_id)
        if not study_plan:
            return False

        self.db.delete(study_plan)
        self.db.commit()
        return True

    # StudyWordProgress 表的增删改查
    def create_study_word_progress(self, user_id: int, word_id: int, book_id: int, study_date: date) -> StudyWordProgress:
        """创建单词学习进度"""
        word_progress = StudyWordProgress(
            user_id=user_id,
            word_id=word_id,
            book_id=book_id,
            study_date=study_date,
            last_study_time=datetime.now()
        )
        self.db.add(word_progress)
        self.db.commit()
        self.db.refresh(word_progress)
        return word_progress

    def get_study_word_progress_by_id(self, progress_id: int) -> Optional[StudyWordProgress]:
        """根据ID获取单词学习进度"""
        return self.db.query(StudyWordProgress).filter(StudyWordProgress.id == progress_id).first()

    def get_study_word_progress_by_user_and_word(self, user_id: int, word_id: int) -> Optional[StudyWordProgress]:
        """根据用户ID和单词ID获取单词学习进度"""
        return self.db.query(StudyWordProgress).filter(
            StudyWordProgress.user_id == user_id,
            StudyWordProgress.word_id == word_id
        ).first()

    def update_study_word_progress(self, progress_id: int, learning_count: Optional[int] = None, correct_count: Optional[int] = None, incorrect_count: Optional[int] = None, is_mastered: Optional[int] = None) -> Optional[StudyWordProgress]:
        """更新单词学习进度"""
        word_progress = self.get_study_word_progress_by_id(progress_id)
        if not word_progress:
            return None

        if learning_count is not None:
            word_progress.learning_count = learning_count
        if correct_count is not None:
            word_progress.correct_count = correct_count
        if incorrect_count is not None:
            word_progress.incorrect_count = incorrect_count
        if is_mastered is not None:
            word_progress.is_mastered = is_mastered

        self.db.commit()
        self.db.refresh(word_progress)
        return word_progress

    def delete_study_word_progress(self, progress_id: int) -> bool:
        """删除单词学习进度"""
        word_progress = self.get_study_word_progress_by_id(progress_id)
        if not word_progress:
            return False

        self.db.delete(word_progress)
        self.db.commit()
        return True

    # StudyRecord 表的增删改查
    def create_study_record(self, user_id: int, book_id: int, study_date: date, new_words: int, review_words: int, duration: int) -> StudyRecord:
        """创建学习记录"""
        study_record = StudyRecord(
            user_id=user_id,
            book_id=book_id,
            study_date=study_date,
            new_words=new_words,
            review_words=review_words,
            duration=duration
        )
        self.db.add(study_record)
        self.db.commit()
        self.db.refresh(study_record)
        return study_record

    def get_study_record_by_id(self, record_id: int) -> Optional[StudyRecord]:
        """根据ID获取学习记录"""
        return self.db.query(StudyRecord).filter(StudyRecord.id == record_id).first()

    def get_study_records_by_user(self, user_id: int) -> List[StudyRecord]:
        """获取用户的所有学习记录"""
        return self.db.query(StudyRecord).filter(StudyRecord.user_id == user_id).all()

    def update_study_record(self, record_id: int, new_words: Optional[int] = None, review_words: Optional[int] = None, duration: Optional[int] = None) -> Optional[StudyRecord]:
        """更新学习记录"""
        study_record = self.get_study_record_by_id(record_id)
        if not study_record:
            return None

        if new_words is not None:
            study_record.new_words = new_words
        if review_words is not None:
            study_record.review_words = review_words
        if duration is not None:
            study_record.duration = duration

        self.db.commit()
        self.db.refresh(study_record)
        return study_record

    def delete_study_record(self, record_id: int) -> bool:
        """删除学习记录"""
        study_record = self.get_study_record_by_id(record_id)
        if not study_record:
            return False

        self.db.delete(study_record)
        self.db.commit()
        return True