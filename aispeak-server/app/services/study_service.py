from typing import Dict, List, Optional,Union,Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func  # 导入 func
from datetime import datetime, date
from app.db.study_entities import StudyPlan, StudyWordProgress, StudyRecord,StudyCompletionRecord,StudyProgressReport  # 假设实体类在 study_entities.py 中

from app.db.account_entities import AccountEntity 
from app.db.words_entities import Word  # 假设 Word 是单词表实体
from datetime import datetime, date, timedelta
import json

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



    def get_study_completion_records(
        self, user_id: str, book_id: str, dates: List[date]
    ) -> List[Dict]:
        """
        根据用户ID、书本ID和日期数组查询学习完成记录，并返回与日期数组顺序一致的字典列表
        :param user_id: 用户ID
        :param book_id: 书本ID
        :param dates: 日期数组
        :return: 学习完成记录的字典格式列表，与 dates 顺序一致
        """
        try:
            # 查询 StudyCompletionRecord 表中符合条件的所有记录
            study_completion_records = (
                self.db.query(StudyCompletionRecord)
                .filter(
                    StudyCompletionRecord.user_id == user_id,
                    StudyCompletionRecord.book_id == book_id,
                    StudyCompletionRecord.type == 2,  # type=2
                    StudyCompletionRecord.date.in_(dates),  # 使用 in_ 来匹配日期数组
                )
                .all()
            )
            
            # 将查询到的记录转换为字典，并以日期的字符串形式为 key 存入字典中
            records_dict = {
                record.date.strftime("%Y-%m-%d"): {  # 将日期转换为字符串作为 key
                    "id": record.id,
                    "user_id": record.user_id,
                    "book_id": record.book_id,
                    "date": record.date.strftime("%Y-%m-%d"),  # 将日期格式化为字符串
                    "status": record.status,
                    "continuous_days": record.continuous_days,
                    "create_time": record.create_time.strftime("%Y-%m-%d %H:%M:%S") if record.create_time else None,
                    "update_time": record.update_time.strftime("%Y-%m-%d %H:%M:%S") if record.update_time else None,
                }
                for record in study_completion_records
            }
            
            # 严格按照 dates 的顺序构建返回结果
            result = []
            for d in dates:
                date_str = d.strftime("%Y-%m-%d")  # 将日期转换为字符串
                if date_str in records_dict:
                    result.append(records_dict[date_str])  # 如果查询到记录，则添加到结果中
                else:
                    # 如果没有查询到记录，则创建默认记录
                    default_record = {
                        "id": None,  # 默认记录没有 ID
                        "user_id": user_id,
                        "book_id": book_id,
                        "date": date_str,  # 使用日期字符串
                        "status": 0,  # 默认状态为 0
                        "continuous_days": 0,  # 默认连续天数为 0
                        "create_time": None,  # 默认记录没有创建时间
                        "update_time": None,  # 默认记录没有更新时间
                    }
                    result.append(default_record)
            
            return result
        except Exception as e:
            print(f"查询学习完成记录失败: {str(e)}")
            return []  


    def create_or_update_study_completion_record(
        self, user_id: str, book_id: str
    ) -> Dict:
        """
        创建或更新学习完成记录，并返回字典格式
        :param user_id: 用户ID
        :param book_id: 书本ID
        :return: 创建或更新后的 StudyCompletionRecord 字典
        """
        # 获取当前日期
        current_date = datetime.now().date()

        # 查询当前日期的记录是否存在
        existing_record = (
            self.db.query(StudyCompletionRecord)
            .filter(
                StudyCompletionRecord.user_id == user_id,
                StudyCompletionRecord.book_id == book_id,
                StudyCompletionRecord.type == 2,  # type=2
                StudyCompletionRecord.date == current_date
            )
            .first()
        )

        # 如果记录已经存在，直接返回字典格式
        if existing_record:
            return self._record_to_dict(existing_record)

        # 如果记录不存在，查询昨天的记录
        yesterday = current_date - timedelta(days=1)
        yesterday_record = (
            self.db.query(StudyCompletionRecord)
            .filter(
                StudyCompletionRecord.user_id == user_id,
                StudyCompletionRecord.book_id == book_id,
                StudyCompletionRecord.type == 2,  # type=2
                StudyCompletionRecord.date == yesterday
            )
            .first()
        )

        # 计算 continuous_days
        continuous_days = 1  # 默认值为 1
        if yesterday_record:
            continuous_days = yesterday_record.continuous_days + 1

        # 创建新的记录
        new_record = StudyCompletionRecord(
            user_id=user_id,
            book_id=book_id,
            date=current_date,
            status=1,  # 默认状态为 1（已完成）
            type=2,
            continuous_days=continuous_days,
            create_time=datetime.now(),
            update_time=datetime.now()
        )

        # 插入新记录
        self.db.add(new_record)
        self.db.commit()
        self.db.refresh(new_record)

        # 返回字典格式
        return self._record_to_dict(new_record)

    def _record_to_dict(self, record: StudyCompletionRecord) -> Dict:
        """
        将 StudyCompletionRecord 对象转换为字典
        :param record: StudyCompletionRecord 对象
        :return: 字典格式的记录
        """
        return {
            "id": record.id,
            "user_id": record.user_id,
            "book_id": record.book_id,
            "date": record.date.strftime("%Y-%m-%d"),  # 将日期格式化为字符串
            "status": record.status,
            "continuous_days": record.continuous_days,
            "create_time": record.create_time.strftime("%Y-%m-%d %H:%M:%S") if record.create_time else None,
            "update_time": record.update_time.strftime("%Y-%m-%d %H:%M:%S") if record.update_time else None,
        }
    

    def submit_study_progress_report(
    self,
    user_id: str,
    book_id: str,
    lesson_id: int,
    reports: List[Dict],  # 使用 StudyProgressReportItem 对象
    statusNum: int = 1,  # 新增可选参数，默认值为 1
    ) -> bool:
        """
        提交学习进度报告表数据，仅处理 StudyCompletionRecord 中的 progress_data 字段
        """
        try:
            # 新增调试信息
            print(f"[DEBUG] 开始处理学习进度报告，用户: {user_id}，书本: {book_id}，课程: {lesson_id}")
            print(f"[DEBUG] 收到 {len(reports)} 条报告数据")

            # 查询当前用户
            user = self.db.query(AccountEntity).filter_by(id=user_id).first()
            if not user:
                print(f"[ERROR] 用户不存在: {user_id}")
                raise Exception("用户不存在")
            else:
                print(f"[DEBUG] 找到用户记录: {user_id}")

            # 计算总积分和总开口次数
            total_points, totalspeak_count = self._calculate_total_points_and_speak_count(reports)

            print(f"[total_points] : {total_points}")
            print(f"[totalspeak_count] : {totalspeak_count}")

            # 根据 content_type 判断 type
            # 根据 content_type 判断 type
            if len(reports) > 0:
                content_type = reports[0].content_type
                if content_type == 4:
                    type_value = 1
                elif content_type == 3:
                    type_value = 3
                else:
                    type_value = 0
            else:
                type_value = 0  # 默认值，如果没有报告数据

            # 处理 StudyCompletionRecord 记录
            self._process_study_completion_record(user_id, book_id, lesson_id, type_value, total_points, totalspeak_count, statusNum, reports)

            # 为用户加上积分
            user.points += total_points
            user.update_time = datetime.now()

            # 提交事务
            self.db.commit()
            return True
        except Exception as e:
            print(f"提交学习进度报告失败: {str(e)}")
            self.db.rollback()  # 回滚事务
            return False

    def _calculate_total_points_and_speak_count(self, reports: List[Dict]) -> Tuple[int, int]:
        """
        计算总积分和总开口次数
        """
        total_points = 0
        totalspeak_count = 0
        for report in reports:
            total_points += report.points
            totalspeak_count += report.speak_count
        return total_points, totalspeak_count

    def _process_study_completion_record(
        self,
        user_id: str,
        book_id: str,
        lesson_id: int,
        type_value: int,
        total_points: int,
        totalspeak_count: int,
        statusNum: int,
        reports: List[Dict],
   ):
        """
        处理 StudyCompletionRecord 记录，包括更新 progress_data 字段
        """
        # 查询 StudyCompletionRecord 是否存在
        completion_record = (
            self.db.query(StudyCompletionRecord)
            .filter(
                StudyCompletionRecord.user_id == user_id,
                StudyCompletionRecord.book_id == book_id,
                StudyCompletionRecord.lesson_id == lesson_id,
                StudyCompletionRecord.type == type_value,
                StudyCompletionRecord.status == 0,
            )
            .order_by(StudyCompletionRecord.create_time.desc())
            .first()
        )

        # 处理 progress_data 字段
        progress_data = []
        if completion_record and completion_record.progress_data:
            # 如果 progress_data 有值，则反序列化为数组
            progress_data = json.loads(completion_record.progress_data)

        # 将新的 reports 数据插入到 progress_data 中
        for report in reports:
            progress_data.append({
                "word": report.word.strip(),
                "content_type": report.content_type,
                "content_id": report.content_id,
                "error_count": report.error_count,
                "points": report.points,
                "speak_count": report.speak_count,
                "json_data": report.json_data,
                "voice_file": report.voice_file,
                "chinese": report.chinese,
                "audio_url": report.audio_url,
                "audio_start": report.audio_start,
                "audio_end": report.audio_end,
            })

        # 将 progress_data 序列化为字符串
        progress_data_str = json.dumps(progress_data)

        if completion_record and completion_record.status != 1:
            # 如果记录存在，则更新字段
            completion_record.points += total_points
            completion_record.speak_count += totalspeak_count
            completion_record.progress_data = progress_data_str  # 更新 progress_data
            completion_record.update_time = datetime.now()
            if statusNum == 1:
                completion_record.status = statusNum
        else:
            # 如果记录不存在，则插入新记录
            completion_record = StudyCompletionRecord(
                user_id=user_id,
                book_id=book_id,
                lesson_id=lesson_id,
                date=datetime.now().date(),
                status=statusNum,  # 使用传入的 statusNum
                type=type_value,  # 根据 content_type 判断 type
                points=total_points,
                speak_count=totalspeak_count,
                progress_data=progress_data_str,  # 设置 progress_data
                create_time=datetime.now(),
                update_time=datetime.now(),
            )
            self.db.add(completion_record)


     
    def get_unit_summary_report(
    self,
    user_id: str,
    book_id: str,
    lesson_id: int,
) -> Dict[str, Union[int, List[Dict], Dict]]:
        """
        获取单元总结报告，结合两种数据来源：
        1. 从completed_records计算总开口次数和积分
        2. 从progress_data获取详细记录
        """
        try:
            # 1. 查询三种类型的所有已完成记录（用于计算总指标）
            def get_all_completed_records(record_type):
                return (
                    self.db.query(StudyCompletionRecord)
                    .filter(
                        StudyCompletionRecord.user_id == user_id,
                        StudyCompletionRecord.book_id == book_id,
                        StudyCompletionRecord.lesson_id == lesson_id,
                        StudyCompletionRecord.type == record_type,
                        StudyCompletionRecord.status == 1
                    )
                    .order_by(StudyCompletionRecord.create_time.desc())
                    .all()
                )

            completed_word_records = get_all_completed_records(0)      # type=0 单词
            completed_sentence_records = get_all_completed_records(1)  # type=1 句子
            completed_spelling_records = get_all_completed_records(3)  # type=3 拼写单词

            # 2. 计算总开口次数和积分（使用所有已完成记录）
            total_speak_count = (
                sum(record.speak_count for record in completed_word_records) +
                sum(record.speak_count for record in completed_sentence_records) +
                sum(record.speak_count for record in completed_spelling_records)
            )

            total_points = (
                sum(record.points for record in completed_word_records) +
                sum(record.points for record in completed_sentence_records) +
                sum(record.points for record in completed_spelling_records)
            )

            # 3. 从各种类型的最新记录中获取progress_data（用于构建详细报告）
            def get_latest_record(records):
                return records[0] if records else None

            latest_word_record = get_latest_record(completed_word_records)
            latest_sentence_record = get_latest_record(completed_sentence_records)
            latest_spelling_record = get_latest_record(completed_spelling_records)

            # 解析progress_data
            word_records = json.loads(latest_word_record.progress_data) if latest_word_record else []
            sentence_records = json.loads(latest_sentence_record.progress_data) if latest_sentence_record else []
            word_spell_records = json.loads(latest_spelling_record.progress_data) if latest_spelling_record else []

            # 4. 构建各种摘要
            word_summary = self._create_word_summary(word_records)
            word_spell_summary = self._create_word_spell_summary(word_spell_records)
            sentence_summary = self._create_sentence_summary(sentence_records)

            # 5. 构建最终结果
            return {
                "speak_count": total_speak_count,
                "points": total_points,
                "sentences_count": len(sentence_records),
                "words_count": word_summary["word_count"],
                "word_summary": word_summary,
                "word_spell_summary": word_spell_summary,
                "sentence_summary": sentence_summary
            }

        except Exception as e:
            print(f"获取单元总结报告失败: {str(e)}")
            return self._create_empty_summary()


    def _create_word_summary(self, word_records: List[Dict]) -> Dict:
        """
        保持原始字段结构的单词摘要
        """
        try:
            # 按content_id分组处理
            word_map = {}
            for record in word_records or []:
                content_id = record.get("content_id")
                if content_id not in word_map:
                    word_map[content_id] = {
                        "content_id": content_id,
                        "content": record.get("word", ""),
                        "chinese": record.get("chinese", ""),
                        "audio_url": record.get("audio_url", ""),
                        "practice_error_count": 0,
                        "spell_error_count": 0,
                        "points": 0
                    }
                
                # 累计错误次数
                content_type = record.get("content_type")
                if content_type == 1:  # 跟读练习
                    word_map[content_id]["practice_error_count"] += record.get("error_count", 0)
                elif content_type == 2:  # 拼写练习
                    word_map[content_id]["spell_error_count"] += record.get("error_count", 0)
                
                word_map[content_id]["points"] += record.get("points", 0)

            # 分类处理
            mastered_words = []
            words_to_review = []
            for word in word_map.values():
                if word["practice_error_count"] == 0 and word["spell_error_count"] == 0:
                    mastered_words.append({
                        "content_id": word["content_id"],
                        "content": word["content"],
                        "chinese": word["chinese"],
                        "audio_url": word["audio_url"]
                    })
                else:
                    words_to_review.append({
                        "content_id": word["content_id"],
                        "content": word["content"],
                        "chinese": word["chinese"],
                        "practice_error_count": word["practice_error_count"],
                        "spell_error_count": word["spell_error_count"]
                    })

            return {
                "word_count": len(word_map),
                "total_points": sum(w["points"] for w in word_map.values()),
                "mastered_words": mastered_words,
                "words_to_review": words_to_review
            }

        except Exception as e:
            print(f"创建单词摘要失败: {str(e)}")
            return {
                "word_count": 0,
                "total_points": 0,
                "mastered_words": [],
                "words_to_review": []
            }
    
    def _create_word_spell_summary(self, spell_records: List[Dict]) -> Dict:
        """
        保持原始字段结构的拼写单词摘要
        """
        try:
            return {
                "word_count": len(spell_records),
                "total_points": sum(r.get("points", 0) for r in spell_records),
                "word_spell_records": [
                    {
                        "content_id": r.get("content_id"),
                        "content": r.get("word", ""),
                        "error_count": r.get("error_count", 0),
                        "points": r.get("points", 0),
                        "chinese": r.get("chinese", ""),
                        "audio_url": r.get("audio_url", ""),
                        "create_time": r.get("create_time"),
                        "update_time": r.get("update_time")
                    }
                    for r in spell_records
                ] if spell_records else []
            }
        except Exception as e:
            print(f"创建拼写单词摘要失败: {str(e)}")
            return {
                "word_count": 0,
                "total_points": 0,
                "word_spell_records": []
            }
   
    def _create_sentence_summary(self, sentence_records: List[Dict]) -> Dict:
        """
        保持原始字段结构的句子摘要
        """
        try:
            return {
                "sentence_count": len(sentence_records),
                "total_points": sum(r.get("points", 0) for r in sentence_records),
                "sentence_records": [
                    {
                        "content_id": r.get("content_id"),
                        "content": r.get("word", ""),
                        "error_count": r.get("error_count", 0),
                        "points": r.get("points", 0),
                        "json_data": r.get("json_data"),
                        "voice_file": r.get("voice_file"),
                        "chinese": r.get("chinese", ""),
                        "audio_url": r.get("audio_url"),
                        "audio_start": r.get("audio_start"),
                        "audio_end": r.get("audio_end")
                    }
                    for r in sentence_records
                ] if sentence_records else []
            }
        except Exception as e:
            print(f"创建句子摘要失败: {str(e)}")
            return {
                "sentence_count": 0,
                "total_points": 0,
                "sentence_records": []
            }

    def _create_empty_summary(self) -> Dict[str, Union[int, Dict, List]]:
        """
        创建空白的摘要数据结构（用于错误处理或默认返回）
        :return: 完整但为空的所有摘要结构 {
            "speak_count": 0,
            "points": 0,
            "sentences_count": 0,
            "words_count": 0,
            "word_summary": {...},
            "word_spell_summary": {...},
            "sentence_summary": {...}
        }
        """
        return {
            "speak_count": 0,
            "points": 0,
            "sentences_count": 0,
            "words_count": 0,
            "word_summary": {
                "word_count": 0,
                "total_points": 0,
                "mastered_words": [],
                "words_to_review": []
            },
            "word_spell_summary": {
                "word_count": 0,
                "total_points": 0,
                "word_spell_records": []
            },
            "sentence_summary": {
                "sentence_count": 0,
                "total_points": 0,
                "sentence_records": []
            }
        }

    def get_study_progress_reports(
    self,
    user_id: str,
    book_id: str,
    lesson_id: int,
    content_type: Optional[int] = None
) -> List[Dict]:
        """
        根据用户ID、书本ID、课程ID和内容类型查询学习进度报告
        :param user_id: 用户ID
        :param book_id: 书本ID
        :param lesson_id: 课程ID
        :param content_type: 可选的内容类型(0:单词,1:句子,2:背词计划用,3:真正的单词拼写)
        :return: 包含学习进度报告的字典
        """
        try:
            # 查询最新的一条记录
            record = (
                self.db.query(StudyCompletionRecord)
                .filter(
                    StudyCompletionRecord.user_id == user_id,
                    StudyCompletionRecord.book_id == book_id,
                    StudyCompletionRecord.lesson_id == lesson_id,
                    StudyCompletionRecord.type == content_type
                )
                .order_by(StudyCompletionRecord.create_time.desc())
                .first()
            )

            # 如果没有记录或status=1，返回空数组
            if not record or record.status == 1:
                return []

            # 解析progress_data
            progress_data = json.loads(record.progress_data) if record.progress_data else []


            # 将 StudyProgressReport 对象转换为字典数组
            # 格式化返回数据
            report_dicts = [
                {
                    "id": data.get("id", ""),
                    "user_id": user_id,
                    "book_id": book_id,
                    "lesson_id": lesson_id,
                    "content": data.get("word", ""),  # 注意这里使用word字段
                    "content_id": data.get("content_id", 0),
                    "content_type": data.get("content_type", 0),
                    "error_count": data.get("error_count", 0),
                    "points": data.get("points", 0),
                    "chinese": data.get("chinese", ""),
                    # 可以添加其他需要的字段
                    "json_data": data.get("json_data"),
                    "voice_file": data.get("voice_file"),
                    "audio_url": data.get("audio_url"),
                    "audio_start": data.get("audio_start"),
                    "audio_end": data.get("audio_end"),
                }
                for data in progress_data
            ]

            return report_dicts

        except Exception as e:
            print(f"查询学习进度报告失败: {str(e)}")
            return []        