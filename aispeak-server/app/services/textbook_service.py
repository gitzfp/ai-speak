from typing import Dict, List
from sqlalchemy.orm import Session
from app.db.textbook_entities import TextbookEntity,  LessonEntity, TaskTargetsEntity, TextbookPageEntity, TextbookSentence, ChapterEntity, LessonSentenceEntity
from app.db.words_entities import Word, WordSyllable, Syllable  # 添加这行导入
import datetime

class TextbookService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_textbooks(self, version: str = "全部", grade: str = "全部", term: str = "全部", publisher: str = "全部") -> Dict:
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
        if publisher!= "全部":
            query = query.filter(TextbookEntity.publisher == publisher)
            
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
                "term": textbook.term,
                "publisher": textbook.publisher,
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
                    "textbook_id": lesson.book_id,
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
                    "id": lesson.book_id,
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

    def create_textbook_chapters(self, book_id: str, chapters: List[dict]) -> str:
        """
        创建或更新教材章节目录
        """
        try:
            def process_chapter(chapter: dict, parent_id: int = None, sort_order: int = 0):
                # 查找是否存在相同的章节记录
                existing_chapter = self.db.query(ChapterEntity).filter(
                    ChapterEntity.book_id == book_id,
                    ChapterEntity.title == chapter["title"],
                    ChapterEntity.page_id == chapter["page_id"]
                ).first()

                if existing_chapter:
                    # 更新已存在的章节
                    existing_chapter.parent_id = parent_id
                    existing_chapter.page_no = chapter["page_no"]
                    existing_chapter.update_time = datetime.datetime.now()
                    chapter_id = existing_chapter.id
                    print(f"Updated chapter: {existing_chapter.title}")
                else:
                    # 创建新的章节记录
                    db_chapter = ChapterEntity(
                        title=chapter["title"],
                        book_id=book_id,
                        parent_id=parent_id,
                        page_id=chapter["page_id"],
                        page_no=chapter["page_no"]
                    )
                    self.db.add(db_chapter)
                    self.db.flush()  # 获取新插入记录的ID
                    chapter_id = db_chapter.id
                    print(f"Created new chapter: {db_chapter.title}")

                # 如果有子章节，递归处理
                if "children" in chapter and chapter["children"]:
                    for idx, child in enumerate(chapter["children"]):
                        process_chapter(child, chapter_id, idx)

            # 处理所有顶级章节
            for idx, chapter in enumerate(chapters):
                process_chapter(chapter, None, idx)

            self.db.commit()
            return "教材章节目录创建/更新成功"

        except Exception as e:
            self.db.rollback()
            print(f"创建/更新教材章节目录失败: {str(e)}")
            import traceback
            print("Detailed error traceback:")
            print(traceback.format_exc())
            raise e

    def create_textbook_pages(self, book_id, pages: List[dict]) -> str:
        """
        创建教材页面和句子
        """
        try:
            # 打印输入数据结构
            print("Input pages data:", pages)
            
            for page_index, page in enumerate(pages):
                print(f"\nProcessing page: {page.get('page_id')}")
                print("Page data:", page)
                
                # 检查 track_info 是否存在
                if "track_info" not in page:
                    print(f"Warning: track_info not found in page data: {page}")
                    continue
                    
                # 打印 track_info 内容
                print(f"track_info content: {page['track_info']}")

                # 检查是否已存在相应的 TextbookPageEntity
                existing_page = self.db.query(TextbookPageEntity).filter(
                    TextbookPageEntity.id == str(page["page_id"])
                ).first()
                # 确保 page_no 不为空，如果为空则使用数组长度
                page_no = page.get("page_no")
                if page_no is None:
                    # 尝试从 page_no_v2 获取数字部分，如果也没有则使用数组索引+1
                    page_no_v2 = page.get("page_no_v2", "")
                    if page_no_v2.isdigit():
                        page_no = int(page_no_v2)
                    else:
                        page_no = page_index + 2
                if existing_page:
                    # 更新已存在的记录
                    existing_page.book_id = book_id
                    existing_page.page_name = page["page_name"]
                    existing_page.page_no = page_no
                    existing_page.page_url = page["page_url"]
                    existing_page.page_url_source = page["page_url_source"]
                    existing_page.update_time = datetime.datetime.now()

                    print(f"Updated textbook page with ID: {existing_page.id}")
                    textbook_page = existing_page  # 将 textbook_page 指向已更新的记录
                else:
                    # 创建新的记录
                    textbook_page = TextbookPageEntity(
                        id=str(page["page_id"]),
                        book_id=book_id,  # 假设 book_id 是 version 的第一个元素
                        page_name=page["page_name"],
                        page_no=page_no,
                        page_url=page["page_url"],
                        page_url_source=page["page_url_source"],
                        create_time=datetime.datetime.now(),
                        update_time=datetime.datetime.now()
                    )
                    self.db.add(textbook_page)
                    print(f"Created textbook page with ID: {textbook_page.id}")

                # 创建或更新 TextbookSentence 实例
                for track in page["track_info"]:
                    print(f"\nProcessing track: {track.get('track_id')}")
                    
                    # 尝试查找现有的 TextbookSentence 记录
                    existing_sentence = self.db.query(TextbookSentence).filter(
                        TextbookSentence.book_id == book_id,
                        TextbookSentence.page_no == textbook_page.page_no,
                        TextbookSentence.track_text == track["track_text"]  # 使用其他字段进行匹配
                    ).first()

                    if existing_sentence:
                        # 更新已存在的记录
                        existing_sentence.track_id = track["track_id"]
                        existing_sentence.is_recite = track["is_recite"]
                        existing_sentence.is_ai_dub = track["is_ai_dub"]
                        existing_sentence.track_continue_play_id = track.get("track_continue_play_id")
                        existing_sentence.track_url_source = track["track_url_source"]
                        existing_sentence.track_right = track["track_right"]
                        existing_sentence.track_top = track["track_top"]
                        existing_sentence.track_left = track["track_left"]
                        existing_sentence.track_url = track["track_url"]
                        existing_sentence.track_genre = track["track_genre"]
                        existing_sentence.track_duration = track["track_duration"]
                        existing_sentence.track_index = track["track_index"]
                        existing_sentence.track_text = track["track_text"]
                        existing_sentence.track_evaluation = track["track_evaluation"]
                        existing_sentence.track_bottom = track["track_bottom"]
                        existing_sentence.is_evaluation = track["is_evaluation"]
                        
                        print(f"Updated textbook sentence with ID: {existing_sentence.id}")
                    else:
                        # 创建新的记录
                        textbook_sentence = TextbookSentence(
                            book_id=book_id,
                            page_no=textbook_page.page_no,
                            sentence=track["track_text"],
                            is_recite=track["is_recite"],
                            is_ai_dub=track["is_ai_dub"],
                            track_continue_play_id=track.get("track_continue_play_id"),
                            track_url_source=track["track_url_source"],
                            track_right=track["track_right"],
                            track_top=track["track_top"],
                            track_left=track["track_left"],
                            track_url=track["track_url"],
                            track_id=track["track_id"],
                            track_genre=track["track_genre"],
                            track_duration=track["track_duration"],
                            track_index=track["track_index"],
                            track_text=track["track_text"],
                            track_evaluation=track["track_evaluation"],
                            track_bottom=track["track_bottom"],
                            is_evaluation=track["is_evaluation"]
                        )
                        self.db.add(textbook_sentence)
                        print(f"Created textbook sentence with ID: {textbook_sentence.id}")

            self.db.commit()
            return "教材页面和句子创建成功"

        except Exception as e:
            self.db.rollback()
            print(f"创建教材页面和句子失败: {str(e)}")
            # 打印详细的错误追踪
            import traceback
            print("Detailed error traceback:")
            print(traceback.format_exc())
            return str(e)

    def get_textbook_details(self, book_id: str) -> Dict:
        """
        获取教材页面和音频信息
        """
        try:
            # 获取所有页面
            pages = self.db.query(TextbookPageEntity).filter(
                TextbookPageEntity.book_id == book_id
            ).order_by(TextbookPageEntity.page_no).all()

            # 获取所有句子
            sentences = self.db.query(TextbookSentence).filter(
                TextbookSentence.book_id == book_id
            ).order_by(TextbookSentence.page_no, TextbookSentence.track_index).all()

            # 获取所有章节
            chapters = self.db.query(ChapterEntity).filter(
                ChapterEntity.book_id == book_id
            ).order_by(ChapterEntity.id).all()

            # 构建章节树
            def build_chapter_tree(parent_id=None):
                tree = []
                for chapter in chapters:
                    if chapter.parent_id == parent_id:
                        children = build_chapter_tree(chapter.id)
                        chapter_data = {
                            "id": chapter.id,
                            "title": chapter.title,
                            "page_id": chapter.page_id,
                            "page_no": chapter.page_no
                        }
                        if children:
                            chapter_data["children"] = children
                        tree.append(chapter_data)
                return tree

            # 按页面组织句子
            page_sentences = {}
            for sentence in sentences:
                if sentence.page_no not in page_sentences:
                    page_sentences[sentence.page_no] = []
                
                track_info = {
                    "is_recite": sentence.is_recite,
                    "is_ai_dub": sentence.is_ai_dub,
                    "track_continue_play_id": sentence.track_continue_play_id,
                    "track_url_source": sentence.track_url_source,
                    "track_right": sentence.track_right,
                    "track_top": sentence.track_top,
                    "track_left": sentence.track_left,
                    "track_url": sentence.track_url,
                    "track_id": sentence.track_id,
                    "is_evaluation": sentence.is_evaluation,
                    "track_name": sentence.track_name,
                    "track_genre": sentence.track_genre,
                    "track_duration": sentence.track_duration,
                    "track_index": sentence.track_index,
                    "track_text": sentence.track_text,
                    "track_evaluation": sentence.track_evaluation,
                    "track_bottom": sentence.track_bottom
                }
                page_sentences[sentence.page_no].append(track_info)

            # 构建返回数据
            bookpages = []
            for page in pages:
                page_data = {
                    "version": ["标准版", "高级版"],  # 这里可以根据实际需求从数据库获取
                    "page_name": page.page_name,
                    "page_url_source": page.page_url_source,
                    "page_id": page.page_no,
                    "track_info": page_sentences.get(page.page_no, [])
                }
                bookpages.append(page_data)

            return {
                "bookpages": bookpages,
                "chapters": build_chapter_tree()  # 添加章节目录树
            }

        except Exception as e:
            print(f"获取教材页面信息失败: {str(e)}")
            return None

    def get_textbook_lessons_and_sentences(self, book_id: str) -> dict:
        try:
            # 1. 查询主课程
            main_lessons = self.db.query(LessonEntity).filter(
                LessonEntity.book_id == book_id,
                LessonEntity.parent_id == None
            ).all()
            print(f"\n=== 开始获取教材课程和句子，book_id: {book_id} ===")
            
            # 2. 批量查询子课程
            main_lesson_ids = [m.lesson_id for m in main_lessons]
            print(f"主课程IDs: {main_lesson_ids}")
            
            sub_lessons = self.db.query(LessonEntity).filter(
                LessonEntity.parent_id.in_(main_lesson_ids),
                LessonEntity.book_id == book_id
            ).all()
            print(f"找到子课程数量: {len(sub_lessons)}")
            for sl in sub_lessons:
                print(f"子课程: id={sl.id}, lesson_id={sl.lesson_id}, parent_id={sl.parent_id}, title={sl.title}")

            # 3. 准备需要查询句子的课程ID
            parent_ids_with_subs = {s.parent_id for s in sub_lessons}
            print(f"有子课程的父课程IDs: {parent_ids_with_subs}")
            
            need_sentence_main = [m.id for m in main_lessons 
                            if m.lesson_id not in parent_ids_with_subs]
            print(f"需要查询句子的主课程IDs: {need_sentence_main}")
            
            lesson_ids_for_sentences = need_sentence_main + [s.id for s in sub_lessons]
            print(f"所有需要查询句子的课程IDs: {lesson_ids_for_sentences}")

            # 4. 批量查询所有句子
            sentences = self.db.query(LessonSentenceEntity).filter(
                LessonSentenceEntity.lesson_id.in_(lesson_ids_for_sentences)
            ).all()
            print(f"找到句子数量: {len(sentences)}")
            for s in sentences:
                print(f"句子: lesson_id={s.lesson_id}, english={s.english[:30]}...")

            # 5. 构建数据结构
            from collections import defaultdict
            sub_map = defaultdict(list)
            for s in sub_lessons:
                sub_map[s.parent_id].append(s)
            
            sentence_map = defaultdict(list)
            for s in sentences:
                sentence_map[s.lesson_id].append(s)
            print(f"句子映射表的大小: {len(sentence_map)}")
            print(f"句子映射表的课程IDs: {list(sentence_map.keys())}")

            # 6. 组装结果
            result = []
            for main in main_lessons:
                print(f"\n处理主课程: id={main.id}, lesson_id={main.lesson_id}, title={main.title}")
                lesson_data = {
                    "id": main.lesson_id,
                    "title": main.title,
                    "sub_lessons": []
                }

                # 判断是否有子课程
                subs = sub_map.get(main.lesson_id, [])
                print(f"该主课程的子课程数量: {len(subs)}")
                if not subs:
                    main_sentences = sentence_map.get(main.id, [])
                    print(f"主课程的句子数量: {len(main_sentences)}")
                    print(f"查找句子使用的ID: {main.id}")
                    lesson_data["sentences"] = [
                        {
                        "id": s.id,
                        "english": s.english, "chinese": s.chinese, 
                        "audio_url": s.audio_url, "audio_start": s.audio_start,
                        "audio_end": s.audio_end, "is_lock": s.is_lock}
                        for s in main_sentences
                    ]
                else:
                    for sub in subs:
                        print(f"处理子课程: id={sub.id}, lesson_id={sub.lesson_id}, title={sub.title}")
                        sub_sentences = sentence_map.get(sub.id, [])
                        print(f"子课程的句子数量: {len(sub_sentences)}")
                        print(f"查找句子使用的ID: {sub.id}")
                        sub_lesson_data = {
                            "id": sub.id,
                            "title": sub.title,
                            "sentences": [
                                {"id": s.id, "english": s.english, "chinese": s.chinese,
                                "audio_url": s.audio_url, "audio_start": s.audio_start,
                                "audio_end": s.audio_end, "is_lock": s.is_lock}
                                for s in sub_sentences
                            ]
                        }
                        lesson_data["sub_lessons"].append(sub_lesson_data)
                
                result.append(lesson_data)
            
            return result

        except Exception as e:
            print(f"Error: {str(e)}")
            return None