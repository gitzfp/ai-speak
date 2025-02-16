from typing import Dict, List
from sqlalchemy.orm import Session
from app.db.textbook_entities import TextbookEntity,  LessonEntity, TaskTargetsEntity
from app.db.words_entities import Word, WordSyllable, Syllable  # 添加这行导入

class TextbookService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_textbooks(self, version: str = "全部", grade: str = "全部", term: str = "全部") -> Dict:
        # 构建返回数据结构
        result = {"booklist": []}

        # 获取所有教材基本信息并按subject_id分组
        query = self.db.query(TextbookEntity).order_by(TextbookEntity.subject_id)
        
        # 添加筛选条件
        if version != "全部":
            query = query.filter(TextbookEntity.version_type == version)
        if grade != "全部":
            query = query.filter(TextbookEntity.grade == grade)
        if term != "全部":
            query = query.filter(TextbookEntity.term == term)
            
        textbooks = query.all()

        # 按学科分组处理数据
        current_subject = None
        current_subject_data = None
        current_version = None
        current_version_data = None

        for textbook in textbooks:
            # 如果是新的学科
            if current_subject != textbook.subject_id:
                # 保存前一个版本(如果存在)
                if current_version_data and current_subject_data:
                    current_subject_data["versions"].append(
                        current_version_data)

                # 保存前一个学科(如果存在)
                if current_subject_data:
                    result["booklist"].append(current_subject_data)

                # 创建新的学科数据
                current_subject = textbook.subject_id
                current_subject_data = {
                    "subject_id": str(textbook.subject_id),
                    "versions": []
                }
                current_version = None

            # 如果是新的版本
            if current_version != textbook.version_type:
                # 保存前一个版本(如果存在)
                if current_version_data:
                    current_subject_data["versions"].append(
                        current_version_data)

                # 创建新的版本数据
                current_version = textbook.version_type
                current_version_data = {
                    "version_type": textbook.version_type,
                    "textbooks": []
                }

            # 添加教材信息到当前版本
            textbook_data = {
                "icon_url": textbook.icon_url,
                "subject_id": str(textbook.subject_id),
                "version_type": textbook.version_type,
                "book_id": textbook.id,
                "book_name": textbook.name,
                "grade": textbook.grade,
                "term": textbook.term
            }
            current_version_data["textbooks"].append(textbook_data)

        # 保存最后一个版本和学科
        if current_version_data and current_subject_data:
            current_subject_data["versions"].append(current_version_data)
        if current_subject_data:
            result["booklist"].append(current_subject_data)

        return result

    def get_textbook_detail(self, textbook_id: str) -> Dict:
        # 获取教材基本信息
        textbook = self.db.query(TextbookEntity).filter(TextbookEntity.id == textbook_id).first()
        if not textbook:
            return None

        # 获取顶级分类
        top_categories = self.db.query(TextbookCategoryEntity).filter(
            TextbookCategoryEntity.textbook_id == textbook_id,
            TextbookCategoryEntity.pid == "0"
        ).order_by(TextbookCategoryEntity.id.asc()).all()

        # 构建分类树
        categories = []
        for top_cat in top_categories:
            # 获取子分类
            sub_categories = self.db.query(TextbookCategoryEntity).filter(
                TextbookCategoryEntity.textbook_id == textbook_id,
                TextbookCategoryEntity.pid == top_cat.category_id
            ).all()

            category_dict = {
                "category_id": top_cat.category_id,
                "textbook_id": top_cat.textbook_id,
                "pid": top_cat.pid,
                "title": top_cat.title,
                "sub_list": [{
                    "category_id": sub.category_id,
                    "textbook_id": sub.textbook_id,
                    "pid": sub.pid,
                    "title": sub.title
                } for sub in sub_categories]
            }
            categories.append(category_dict)

        # 构建返回数据
        result = {
            "id": textbook.id,
            "title": textbook.title,
            "sub_title": textbook.sub_title,
            "dif_level": textbook.dif_level,
            "pic": textbook.pic,
            "sort": str(textbook.sort),
            "category": categories
        }
        
        return result

    def get_course_detail(self, textbook_id: str, category_id: str) -> Dict:
        # 获取课程信息
        courses = self.db.query(CourseEntity).filter(
            CourseEntity.textbook_id == textbook_id, 
            CourseEntity.category_id == category_id
        ).all()
        
        if not courses:
            return None

        # 构建课程列表
        course_list = []
        for course in courses:
            # 获取课程的步骤
            steps = self.db.query(StepEntity).filter(
                StepEntity.course_id == course.id
            ).all()
            
            # 构建步骤列表
            step_list = [{
                "id": step.id,
                "course_id": step.course_id,
                "text": step.text,
                "text_cn": step.text_cn,
                "step": step.step
            } for step in steps]
            
            # 构建课程详情
            course_dict = {
                "id": course.id,
                "textbook_id": course.textbook_id,
                "category_id": course.category_id,
                "title": course.title,
                "sub_title": course.sub_title,
                "video": course.video,
                "srt_text": course.srt_text,
                "pic": course.pic,
                "info_cn": course.info_cn,
                "info_en": course.info_en,
                "max_score": course.max_score,
                "steps": step_list
            }
            course_list.append(course_dict)

        # 构建返回数据
        result = {
            "textbook_id": textbook_id,
            "category_id": category_id,
            "courses": course_list
        }
        
        return result

    def get_all_lessions(self, textbook_id: str, category_id: str) -> List:
        # 获取课程信息
        courses = self.db.query(LessonEntity).filter(
            LessonEntity.textbook_id == textbook_id, 
            LessonEntity.category_id == category_id
        ).all()
        
        if not courses:
            return None

        # 构建课程列表
        course_list = []
        for course in courses:
            # 构建课程详情
            course_dict = {
                "id": course.id,
                "textbook_id": course.textbook_id,
                "category_id": course.category_id,
                "title": course.title,
                "sub_title": course.sub_title,
                "pic": course.pic,
                "max_score": course.max_score,
            }
            course_list.append(course_dict)

        # 构建返回数据
        result = {
            "textbook_id": textbook_id,
            "category_id": category_id,
            "courses": course_list
        }
        return result


    def get_lesson_detail(self, lesson_id: str) -> Dict:
        # 添加日志
        print(f"Querying lesson with id: {lesson_id}, type: {type(lesson_id)}")
        # 获取课程单元信息
        lesson = self.db.query(LessonEntity).filter(LessonEntity.lesson_id == lesson_id).first()
        print(f"Query result: {lesson}")
        # 获取任务目标
        task_targets = self.db.query(TaskTargetsEntity).filter(
            TaskTargetsEntity.lesson_id == lesson_id).all()
        task_target_list = [{
            "id": str(target.id),
            "info_cn": target.info_cn,
            "info_en": target.info_en,
            "info_en_audio": target.info_en_audio,
            "match_type": str(target.match_type),
            "status": str(target.status)
        } for target in task_targets]

        if not lesson:
            return {
                "task_target": task_target_list,
            } 

        # 获取知识点
        points = self.db.query(LessonPointEntity).filter(LessonPointEntity.lesson_id == lesson_id).all()
        point_list = [{
            "word": point.word,
            "meaning": point.meaning,
            "type": str(point.type),
            "audio": point.audio
        } for point in points]

        # 获取教材部分信息
        parts = self.db.query(LessonPartEntity).filter(LessonPartEntity.lesson_id == lesson_id).all()
        part_list = [{
            "id": part.id,
            "lesson_id": part.lesson_id,
            "type": part.type,
            "title": part.title,
            "subtitle": part.subtitle,
            "pic": part.pic,
            "gray_pic": part.gray_pic,
            "is_show": str(part.is_show),
            "rate": str(part.rate) if part.rate else None,
            "must": str(part.must)
        } for part in parts]

        # 获取课程解释
        lesson_explains = self.db.query(LessonExplainEntity).filter(LessonExplainEntity.lesson_id == lesson_id).all()
        print(f"lesson_explains result: {lesson_explains} lesson_id: {lesson_id}") 
        explain_list = [{
            "id": str(explain.id),
            "lesson_id": str(explain.lesson_id),
            "teacher_id": str(explain.teacher_id),
            "explain_content": explain.explain_content,
            "explain_audio": explain.explain_audio,
            "explain_audio_duration": str(explain.explain_audio_duration),
            "sort": str(explain.sort),
            "status": str(explain.status),
            "create_time": str(explain.create_time),
            "update_time": str(explain.update_time),
            "isai": str(explain.isai),
            "is_edit": str(explain.is_edit),
            "type": str(explain.type),
        } for explain in lesson_explains]

        # 获取练习题
        exercises = self.db.query(ExerciseEntity).filter(ExerciseEntity.lesson_id == lesson_id).all()
        exercise_list = []
        for exercise in exercises:
            # 获取练习题选项
            options = self.db.query(ExerciseOptionEntity).filter(ExerciseOptionEntity.exercise_id == exercise.id).all()
            option_list = [{
                "is_correct": str(option.is_correct),
                "text": option.text,
                "audio": option.audio
            } for option in options]

            exercise_dict = {
                "id": str(exercise.id),
                "lesson_id": str(exercise.lesson_id),
                "title": exercise.title,
                "exercise_type": str(exercise.exercise_type),
                "sort": str(exercise.sort),
                "pic": exercise.pic,
                "main_title": exercise.main_title,
                "options": option_list
            }
            exercise_list.append(exercise_dict)

      
        # 获取教师数据
        teacher = self.db.query(TeacherEntity).filter(
            TeacherEntity.lesson_id == lesson_id).first()
        teacher_list = {
            "id": str(teacher.id),
            "name": teacher.name,
        }
        # 构建返回数据
        result = {
                "detail": {
                    "textbook_id": lesson.textbook_id,
                    "category_id": lesson.category_id,
                    "title": lesson.title,
                    "sub_title": lesson.sub_title,
                    "pic": lesson.pic,
                    "lesson_id": str(lesson.id),
                    "feature": str(lesson.feature),
                    "user_text": "Say 'Hello. What's your name?'",
                    "chat_nums": "4",
                    "theme_id": "13450",
                    "is_audition": str(lesson.is_audition),
                    "theme_desc": "开学第一天，你走进了教室，发现你的新同桌已经在座位上了，你们开始了对话...",
                    "points": point_list,
                    "lock": "1"
                },
                "book_detail": {
                    "id": lesson.textbook_id,
                    "title": "【精学版】人教版三起",
                    "sub_title": "PEP人教",
                    "part_info": "null",
                    "part": part_list
                },
                "course_detail": {
                    "id": str(lesson.id),
                    "title": "三上U1：Part A Let's talk",
                    "subtitle_en": "https://cdn.qupeiyin.cn/dubbing/2024-06-11/FgukgIN52BWsUF76Z0xXE8fzrcC707.srt",
                    "up_down": "https://cdn.qupeiyin.cn/2024-08-06/1722933350694.srt",
                    "video_tch": "https://cdn.qupeiyin.cn/2024-09-05/1725503350281amt.mp4",
                    "video_srt": "https://cdn.qupeiyin.cn/2024-09-05/n1725503353423amt.mp4",
                    "original_audio": "https://cdn.qupeiyin.cn/2024-02-29/17092019235665172.mp3",
                    "audio": "https://cdn.qupeiyin.cn/dubbing/2024-09-05/FtCdDb0WUK9ndjeD49nPcUeX0E6k54.mp3",
                    "course_explain": explain_list,
                    "if_subtitle": "1"
                },
                "teacher": teacher_list,
                "exercise_list": exercise_list,
                "task_target": task_target_list,
                "total_star_nums": "7",
                "show_id": "0",
                "learn_id": "0",
                "exercise_id": "0",
                "report_id": "40858",
                "theme_flag": "1"
        }
        
        return result


    def get_lesson_words(self, book_id: str, lesson_id: str = None) -> Dict:
        """
        获取课程单元的单词列表
        """
        try:
            # 构建基础查询
            query = self.db.query(Word).filter(Word.book_id == book_id)
            
            # 如果指定了 lesson_id，则只获取该章节的单词
            if lesson_id:
                query = query.filter(Word.lesson_id == int(lesson_id))
                
            # 获取所有单词并按单元和单词ID排序
            words = query.order_by(Word.lesson_id.asc(), Word.word_id.asc()).all()
        
            # 构建单词列表
            word_list = [{
                "word_id": word.word_id,
                "word": word.word,
                "lesson_id": word.lesson_id,
                "chinese": word.chinese,
                "phonetic": word.phonetic,
                "sound_path": word.sound_path,
                "image_path": word.image_path,
                "has_base": word.has_base
            } for word in words]
        
            # 构建返回数据
            result = {
                "book_id": book_id,
                "lesson_id": lesson_id if lesson_id else "all",
                "words": word_list
            }
        
            return result
        
        except Exception as e:
            print(f"获取单词列表失败: {str(e)}")
            return None

    def get_words_with_syllables(self, book_id: str, word_list: List[str]) -> Dict:
        """
        获取指定单词列表的详细信息和音节信息
        """
        try:
            # 获取单词信息
            words = self.db.query(Word).filter(
                Word.book_id == book_id,
                Word.word_id.in_(word_list)
            ).all()

            # 获取这些单词的音节关联信息
            word_ids = [word.word_id for word in words]
            word_syllables = self.db.query(WordSyllable).filter(
                WordSyllable.word_id.in_(word_ids)
            ).order_by(WordSyllable.word_id, WordSyllable.position).all()

            # 获取相关的音节信息
            syllable_ids = [ws.syllable_id for ws in word_syllables]
            syllables = self.db.query(Syllable).filter(
                Syllable.id.in_(syllable_ids)
            ).all()
            
            # 构建音节字典以便快速查找
            syllable_dict = {s.id: s for s in syllables}
            
            # 构建单词音节映射
            word_syllable_map = {}
            for ws in word_syllables:
                if ws.word_id not in word_syllable_map:
                    word_syllable_map[ws.word_id] = []
                syllable = syllable_dict.get(ws.syllable_id)
                if syllable:
                    word_syllable_map[ws.word_id].append({
                        "position": ws.position,
                        "letter": syllable.letter,
                        "content": syllable.content,
                        "sound_path": syllable.sound_path,
                        "phonetic": syllable.phonetic
                    })

            # 构建返回数据
            word_list = []
            for word in words:
                word_data = {
                    "word_id": word.word_id,
                    "word": word.word,
                    "lesson_id": word.lesson_id,
                    "chinese": word.chinese,
                    "phonetic": word.phonetic,
                    "uk_phonetic": word.uk_phonetic,
                    "us_phonetic": word.us_phonetic,
                    "sound_path": word.sound_path,
                    "uk_sound_path": word.uk_sound_path,
                    "us_sound_path": word.us_sound_path,
                    "image_path": word.image_path,
                    "has_base": word.has_base,
                    "paraphrase": word.paraphrase,
                    "phonics": word.phonics,
                    "word_tense": word.word_tense,
                    "example_sentence": word.example_sentence,
                    "phrase": word.phrase,
                    "synonym": word.synonym,
                    "syllables": word_syllable_map.get(word.word_id, [])
                }
                word_list.append(word_data)

            return {
                "book_id": book_id,
                "words": word_list
            }

        except Exception as e:
            print(f"获取单词详情失败: {str(e)}")
            return None


