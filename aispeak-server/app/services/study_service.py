from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func  # 导入 func
from datetime import datetime, date
from app.db.study_entities import StudyPlan, StudyWordProgress, StudyRecord  # 假设实体类在 study_entities.py 中
from app.db.words_entities import Word  # 假设 Word 是单词表实体
from datetime import datetime, date, timedelta

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
            create_time=datetime.now(),  # 自动设置创建时间
            update_time=datetime.now()   # 自动设置更新时间
        )
        self.db.add(study_plan)
        self.db.commit()
        self.db.refresh(study_plan)
        return study_plan

    def get_study_plan_by_id(self, plan_id: int) -> Optional[StudyPlan]:
        """根据ID获取学习计划"""
        return self.db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()

    def get_study_plan_by_user_and_book(self, user_id: str, book_id: str) -> Optional[StudyPlan]:
        """根据用户ID和书本ID获取当前书本的学习计划，按创建时间排序，返回最新的一条"""
        study_plan = (
            self.db.query(StudyPlan)
            .filter(StudyPlan.user_id == user_id, StudyPlan.book_id == book_id)
            .order_by(StudyPlan.update_time.desc())  # 按创建时间倒序排列
            .first()  # 只返回最新的一条
        )
        print("study_plan")
        print(study_plan)
        # 如果没有找到学习计划，则创建一个默认的学习计划
        if not study_plan:
            default_daily_words = 3  # 默认每天学习3个单词
            study_plan = self.create_study_plan(user_id, book_id, default_daily_words)
        return study_plan

    def update_study_plan(self, plan_id: int, daily_words: Optional[int] = None) -> Optional[StudyPlan]:
        """更新学习计划"""
        study_plan = self.get_study_plan_by_id(plan_id)
        if not study_plan:
            return None

        if daily_words is not None:
            study_plan.daily_words = daily_words

        study_plan.update_time = datetime.now()  # 自动更新更新时间
        self.db.commit()
        self.db.refresh(study_plan)
        return study_plan

    def get_study_records_by_user(self, user_id: str, book_id: str, study_date: date) -> Dict:
        """
        根据用户ID、书本ID和日期查询一条学习记录，如果没有则返回默认记录（不插入数据库）
        :param user_id: 用户ID
        :param book_id: 书本ID
        :param study_date: 学习日期
        :return: 学习记录的字典格式，包含累计学习时长、累积掌握单词数和累计学习单词数
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
        
        # 一次性查询累计学习时长和累计学习单词数
        total_stats = (
            self.db.query(
                func.sum(StudyRecord.duration).label("total_duration"),
                func.sum(StudyRecord.new_words).label("total_learned_words")
            )
            .filter(
                StudyRecord.user_id == user_id,
                StudyRecord.book_id == book_id
            )
            .first()
        )
        
        # 如果查询结果为 None，则设置为 0
        total_duration = total_stats.total_duration or 0
        total_learned_words = total_stats.total_learned_words or 0
        
        # 计算累积掌握单词数（查询该用户该书本的 StudyWordProgress 中 is_mastered = 1 的总数）
        total_mastered_words = (
            self.db.query(func.count(StudyWordProgress.word_id))
            .filter(
                StudyWordProgress.user_id == user_id,
                StudyWordProgress.book_id == book_id,
                StudyWordProgress.is_mastered == 1
            )
            .scalar() or 0  # 如果结果为 None，则返回 0
        )
        
        # 将 StudyRecord 对象转换为字典，并添加累计学习时长、累积掌握单词数和累计学习单词数
        study_record_dict = {
            "user_id": study_record.user_id,
            "book_id": study_record.book_id,
            "study_date": study_record.study_date.strftime("%Y-%m-%d"),
            "new_words": study_record.new_words,
            "review_words": study_record.review_words,
            "duration": study_record.duration,
            "total_duration": total_duration,  # 累计学习时长
            "total_mastered_words": total_mastered_words,  # 累积掌握单词数
            "total_learned_words": total_learned_words  # 累计学习单词数
        }
        
        return study_record_dict

    def get_user_words(self, user_id: str, book_id: str, plan_id: int) -> Dict:
        """
        获取当前用户在当前书本中已学、未学和需复习的单词数组
        :param user_id: 用户ID
        :param book_id: 书本ID
        :param plan_id: 学习计划ID（整数类型）
        :return: 包含已学、未学和需复习单词的字典
        """
        try:
            # 获取当前书本的所有单词
            words = self.db.query(Word).filter(Word.book_id == book_id).all()

            # 查询已学单词ID列表，直接使用传入的 plan_id
            learned_word_ids = (
                self.db.query(StudyWordProgress.word_id)
                .filter(
                    StudyWordProgress.user_id == user_id,
                    StudyWordProgress.book_id == book_id,
                    StudyWordProgress.type == 1,  # 已学单词的条件
                    StudyWordProgress.plan_id == plan_id  # 使用传入的 plan_id
                )
                .all()
            )
            learned_word_ids = [word_id for (word_id,) in learned_word_ids]  # 提取单词ID

            # 查询需复习的单词ID列表，根据 next_review_time 小于等于当前时间
            current_time = datetime.now().date()  # 获取当前时间的年月日
            review_word_ids = (
                self.db.query(StudyWordProgress.word_id)
                .filter(
                    StudyWordProgress.user_id == user_id,
                    StudyWordProgress.book_id == book_id,
                    StudyWordProgress.plan_id == plan_id,  # 使用传入的 plan_id
                    StudyWordProgress.next_review_time <= current_time  # 需复习单词的条件
                )
                .all()
            )
            review_word_ids = [word_id for (word_id,) in review_word_ids]  # 提取单词ID

            # 分离已学、未学和需复习的单词
            learned_words = []
            unlearned_words = []
            review_words = []

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
                    if word.id in review_word_ids:  # 如果单词在需复习的列表中
                        review_words.append(word_data)
                    else:  # 否则加入已学列表
                        learned_words.append(word_data)
                else:
                    unlearned_words.append(word_data)
            # 按 next_review_time 排序需复习的单词
            review_words.sort(key=lambda x: self.db.query(StudyWordProgress.next_review_time)
                            .filter(StudyWordProgress.word_id == x["word_id"]).scalar())
            # 构建返回数据
            result = {
                "book_id": book_id,
                "user_id": user_id,
                "plan_id": plan_id,
                "learned_words": learned_words,
                "unlearned_words": unlearned_words,
                "review_words": review_words
            }

            return result

        except Exception as e:
            print(f"获取用户单词列表失败: {str(e)}")
            return None

    def calculate_next_review_time(
        self, incorrect_count: int, study_date: date
        ) -> Optional[date]:
            """
            根据 incorrect_count 和 study_date 计算下次复习时间
            :param incorrect_count: 错误次数
            :param study_date: 学习日期
            :return: 下次复习时间，如果时间已经过去则返回 None
            """
            today = datetime.now().date()
            if incorrect_count <= 1:
                next_review = study_date + timedelta(days=30)
            elif 2 <= incorrect_count <= 4:
                next_review = study_date + timedelta(days=15)
            elif 5 <= incorrect_count <= 7:
                next_review = study_date + timedelta(days=7)
            else:
                next_review = study_date + timedelta(days=3)

            # 如果计算出的时间已经过去，则不改变 next_review_time
            return next_review if next_review > today else None
    
    def upsert_study_word_progress(
        self,
        user_id: str,
        book_id: str,
        type_num: int,
        plan_id: int,
        words_data: List[Dict],
    ) -> bool:
        """
        批量插入或更新用户单词学习进度（存在则更新，不存在则插入）
        :param user_id: 用户ID
        :param book_id: 书籍ID
        :param type_num: 类型字段
        :param words_data: 单词数据列表，格式为前端传入的 JSON
        :return: 更新或插入后的 StudyWordProgress 对象列表
        """
        try:
            for word_data in words_data:
                # 提取单词数据
                word_id = word_data.word_id
                correct_count = word_data.correct_count
                incorrect_count = word_data.incorrect_count
                last_study_time = datetime.now().date()  # 默认最后一次学习时间为当前日期

                # 查询是否已存在记录
                existing_record = (
                    self.db.query(StudyWordProgress)
                    .filter(
                        StudyWordProgress.user_id == user_id,
                        StudyWordProgress.word_id == word_id,
                        StudyWordProgress.book_id == book_id,
                        StudyWordProgress.plan_id == plan_id, 
                    )
                    .first()
                )

                if existing_record:
                    # 如果记录存在，则更新字段
                    # 累加 correct_count 和 incorrect_count
                    existing_record.correct_count += correct_count
                    existing_record.incorrect_count += incorrect_count

                    # 根据差值更新是否掌握
                    existing_record.is_mastered = 1 if (
                        existing_record.correct_count - existing_record.incorrect_count
                    ) >= 3 else 0

                    # 更新 last_study_time
                    existing_record.last_study_time = last_study_time

                    # 计算 next_review_time
                    next_review_time = self.calculate_next_review_time(
                        existing_record.incorrect_count, existing_record.study_date
                    )
                    if next_review_time:
                        existing_record.next_review_time = next_review_time

                    # 更新 type 字段
                    existing_record.type = type_num

                    # 提交更新
                    self.db.commit()
                    self.db.refresh(existing_record)
                else:
                    # 如果记录不存在，则插入新记录
                    # 计算是否掌握
                    is_mastered = 1 if (
                        correct_count - incorrect_count
                    ) >= 3 else 0
                    # 计算 next_review_time
                    next_review_time = self.calculate_next_review_time(
                        incorrect_count, last_study_time
                    )

                    new_record = StudyWordProgress(
                        user_id=user_id,
                        word_id=word_id,
                        book_id=book_id,
                        plan_id=plan_id, 
                        correct_count=correct_count,
                        incorrect_count=incorrect_count,
                        last_study_time=last_study_time,
                        next_review_time=next_review_time,  # 根据 incorrect_count 和 study_date 计算
                        is_mastered=is_mastered,  # 动态计算是否掌握
                        study_date=last_study_time,  # 学习日期为当前日期
                        type=type_num,  # 使用传入的 type_num
                    )
                    self.db.add(new_record)
                    self.db.commit()
                    self.db.refresh(new_record)
            return True  # 返回更新或插入后的对象列表
        except Exception as e:
            print(f"操作失败: {str(e)}")
            self.db.rollback()  # 回滚事务
            return False  # 操作失败
        

    def upsert_review_word_progress(
        self,
        user_id: str,
        book_id: str,
        type_num: int,
        plan_id: int,
        words_data: List[Dict],
    ) -> bool:
        """
        批量更新用户复习单词的学习进度（仅更新，不插入）
        :param user_id: 用户ID
        :param book_id: 书籍ID
        :param type_num: 类型字段
        :param words_data: 单词数据列表，格式为前端传入的 JSON
        :return: 是否更新成功
        """
        try:
            for word_data in words_data:
                # 提取单词数据
                word_id = word_data.word_id
                correct_count = word_data.correct_count
                incorrect_count = word_data.incorrect_count
                last_study_time = datetime.now().date()  # 默认最后一次学习时间为当前日期

                # 查询是否已存在记录
                existing_record = (
                    self.db.query(StudyWordProgress)
                    .filter(
                        StudyWordProgress.user_id == user_id,
                        StudyWordProgress.word_id == word_id,
                        StudyWordProgress.book_id == book_id,
                        StudyWordProgress.plan_id == plan_id,
                    )
                    .first()
                )

                if existing_record:
                    # 如果记录存在，则更新字段
                    # 始终累加 correct_count
                    existing_record.correct_count += correct_count
                    # 始终更新 last_study_time
                    existing_record.last_study_time = last_study_time

                    if incorrect_count > 0:
                        existing_record.incorrect_count += incorrect_count
                    else:
                        existing_record.incorrect_count = max(
                            1, existing_record.incorrect_count - correct_count
                        )
                        # 更新 is_mastered
                        existing_record.is_mastered = 1 if (
                            existing_record.correct_count - existing_record.incorrect_count
                        ) >= 3 else 0

                        # 更新 study_date
                        existing_record.study_date = last_study_time

                        # 重新计算 next_review_time
                        next_review_time = self.calculate_next_review_time(
                            existing_record.incorrect_count, existing_record.study_date
                        )
                        if next_review_time:
                            existing_record.next_review_time = next_review_time


                    
                   
                    # 更新 type 字段
                    existing_record.type = type_num

                    # 提交更新
                    self.db.commit()
                    self.db.refresh(existing_record)
                else:
                    # 如果记录不存在，跳过（仅更新，不插入）
                    continue

            return True  # 更新成功
        except Exception as e:
            print(f"操作失败: {str(e)}")
            self.db.rollback()  # 回滚事务
            return False  # 更新失败



    def update_or_create_study_record(
        self,
        user_id: str,
        book_id: str,
        study_date: date,
        new_words: int = None,
        review_words: int = None,
        duration: int = None,
    ) -> StudyRecord:
        """
        更新或创建学习记录
        :param user_id: 用户ID
        :param book_id: 书籍ID
        :param study_date: 学习日期
        :param new_words: 今日新学单词数（可选，累加）
        :param review_words: 今日复习单词数（可选，累加）
        :param duration: 今日学习时长（分钟）（可选，累加）
        :return: 更新或创建后的 StudyRecord 对象
        """
        # 查询是否已存在记录
        existing_record = (
            self.db.query(StudyRecord)
            .filter(
                StudyRecord.user_id == user_id,
                StudyRecord.book_id == book_id,
                StudyRecord.study_date == study_date,
            )
            .first()
        )

        if existing_record:
            # 如果记录存在，则累加字段
            if new_words is not None:
                existing_record.new_words += new_words  # 累加新学单词数
            if review_words is not None:
                existing_record.review_words += review_words  # 累加复习单词数
            if duration is not None:
                existing_record.duration += duration  # 累加学习时长

            self.db.commit()
            self.db.refresh(existing_record)
            return existing_record
        else:
            # 如果记录不存在，则插入新记录
            new_record = StudyRecord(
                user_id=user_id,
                book_id=book_id,
                study_date=study_date,
                new_words=new_words if new_words is not None else 0,
                review_words=review_words if review_words is not None else 0,
                duration=duration if duration is not None else 0,
            )
            self.db.add(new_record)
            self.db.commit()
            self.db.refresh(new_record)
            return new_record