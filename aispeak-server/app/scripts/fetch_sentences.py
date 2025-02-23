import json
import requests
import os
from sqlalchemy.orm import sessionmaker
from app.db import engine
from app.db.textbook_entities import LessonEntity, LessonSentenceEntity
import logging
from contextlib import contextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@contextmanager
def session_scope():
    """提供事务范围的会话"""
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise
    finally:
        session.close()

def fetch_sentences(stage_tag, lesson_id, version_tag, grade_tag, term_tag):
    """获取句子数据"""
    url = f"https://api.suyang123.com/api/syh5/yy/sentences/list"
    params = {
        "stage_tag": stage_tag,
        "lesson_id": lesson_id,
        "version_tag": version_tag,
        "grade_tag": grade_tag,
        "term_tag": term_tag
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # 检查API返回的错误码
        if data.get('code') == 616:  # 书籍课文不存在
            logger.warning(f"书籍课文不存在，跳过处理")
            return None
        elif data.get('code') != 200:
            logger.error(f"API返回错误: {data.get('msg')}")
            return None
            
        return data.get('data', {})
    except Exception as e:
        logger.error(f"获取句子数据失败: {e}")
        return None

def save_lessons_and_sentences(data, book_id):
    """保存课程和句子数据"""
    if not data or "lessons" not in data:
        logger.error(f"数据结构错误，缺少 lessons 字段或数据为空: {data}")
        return
            
    with session_scope() as session:
        try:
            # 保存课程数据
            for lesson in data["lessons"]:
                # 查找或创建主课程
                parent_lesson = session.query(LessonEntity).filter(
                    LessonEntity.book_id == book_id,
                    LessonEntity.lesson_id == str(lesson["id"])
                ).first()
                
                if parent_lesson:
                    # 更新主课程
                    parent_lesson.title = lesson["title"]
                    logger.info(f"更新主课程: {parent_lesson.title}")
                else:
                    # 创建主课程
                    parent_lesson = LessonEntity(
                        lesson_id=str(lesson["id"]),
                        book_id=book_id,
                        title=lesson["title"],
                        parent_id=None
                    )
                    session.add(parent_lesson)
                    logger.info(f"创建主课程: {parent_lesson.title}")
                session.flush()
                
                # 处理子课程
                for sub_title in lesson["sub_titles"]:
                    # 查找或创建子课程
                    sub_lesson = session.query(LessonEntity).filter(
                        LessonEntity.book_id == book_id,
                        LessonEntity.title == sub_title,
                        LessonEntity.parent_id == parent_lesson.lesson_id
                    ).first()
                    
                    if sub_lesson:
                        # 更新子课程
                        sub_lesson.parent_id = parent_lesson.lesson_id
                        logger.info(f"更新子课程: {sub_lesson.title}")
                    else:
                        # 创建子课程，生成lesson_id
                        sub_lesson = LessonEntity(
                            lesson_id=f"{parent_lesson.lesson_id}_{sub_title.replace(' ', '_')}",  # 生成唯一的lesson_id
                            book_id=book_id,
                            title=sub_title,
                            parent_id=parent_lesson.lesson_id
                        )
                        session.add(sub_lesson)
                        logger.info(f"创建子课程: {sub_lesson.title}")
                
                # 获取该课程的句子数据
                lesson_data = fetch_sentences(
                    stage_tag=data["info"]["stage_tag"],
                    lesson_id=str(lesson["id"]),
                    version_tag=data["info"]["version_tag"],
                    grade_tag=data["info"]["grade_tag"],
                    term_tag=data["info"]["term_tag"]
                )
                
                if lesson_data and "sentences" in lesson_data:
                    # 保存句子数据
                    for lesson_sentences in lesson_data["sentences"]:
                        # 找到对应的lesson
                        sub_lesson = session.query(LessonEntity).filter(
                            LessonEntity.book_id == book_id,
                            LessonEntity.title == lesson_sentences["title"]
                        ).first()
                        
                        target_lesson_id = sub_lesson.id if sub_lesson else parent_lesson.id
                        
                        for sentence in lesson_sentences["sentences"]:
                            # 查找现有句子
                            existing_sentence = session.query(LessonSentenceEntity).filter(
                                LessonSentenceEntity.lesson_id == target_lesson_id,
                                LessonSentenceEntity.english == sentence["english"]
                            ).first()
                            
                            if existing_sentence:
                                # 更新现有句子
                                existing_sentence.chinese = sentence["chinese"]
                                existing_sentence.audio_url = lesson_sentences.get("audio_url")
                                existing_sentence.audio_start = sentence.get("audio_start")
                                existing_sentence.audio_end = sentence.get("audio_end")
                                existing_sentence.is_lock = lesson_sentences.get("is_lock", 0)
                                logger.info(f"更新句子: {existing_sentence.english}")
                            else:
                                # 创建新句子
                                sentence_entity = LessonSentenceEntity(
                                    lesson_id=target_lesson_id,
                                    english=sentence["english"],
                                    chinese=sentence["chinese"],
                                    audio_url=lesson_sentences.get("audio_url"),
                                    audio_start=sentence.get("audio_start"),
                                    audio_end=sentence.get("audio_end"),
                                    is_lock=lesson_sentences.get("is_lock", 0)
                                )
                                session.add(sentence_entity)
                                logger.info(f"创建句子: {sentence_entity.english}")
                else:
                    logger.error(f"获取课程 {lesson['title']} 的句子数据失败")
        except Exception as e:
            logger.error(f"保存课程数据失败: {str(e)}")
            raise

def main():
    # 使用相对路径获取 JSON 文件
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, 'data', 'words_grade4.json')

    with open(json_path, 'r', encoding='utf-8') as file:
        textbooks = json.loads(file.read())
    
    for textbook in textbooks:
        try:
            logger.info(f"处理教材: {textbook['book_name']}， 版本 {textbook['version_tag']}")
            
            # 获取句子数据
            data = fetch_sentences(
                stage_tag=textbook["stage_tag"],
                lesson_id=textbook["lesson_id"],
                version_tag=textbook["version_tag"],
                grade_tag=textbook["grade_tag"],
                term_tag=textbook["term_tag"]
            )
            
            if data:
                logger.info(f"获取到的数据结构: {data.keys()}")
                try:
                    save_lessons_and_sentences(data, textbook["textbook_id"])
                    logger.info(f"保存成功: {textbook['book_name']}")
                except Exception as e:
                    logger.error(f"保存失败: {textbook['book_name']}, 错误: {str(e)}")
                    logger.error(f"错误详情: {data}")
                    continue  # 继续处理下一个教材
            else:
                logger.error(f"获取数据失败: {textbook['book_name']}")
                continue  # 继续处理下一个教材
        except Exception as e:
            logger.error(f"处理教材 {textbook.get('book_name', '未知')} 时发生未预期的错误: {str(e)}")
            continue  # 继续处理下一个教材

    logger.info("所有教材处理完成")

if __name__ == "__main__":
    main()