import json
import os
from app.db.textbook_entities import LessonSentenceEntity, LessonEntity
from app.db import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

def is_numeric_lesson_id(lesson_id):
    """检查lesson_id是否为数字"""
    try:
        int(lesson_id)
        return True
    except (ValueError, TypeError):
        return False

def get_lesson_id_by_page(page_no, lessons):
    """根据页码获取对应的lesson_id"""
    # 过滤出数字类型的lesson_id
    numeric_lessons = [lesson for lesson in lessons if is_numeric_lesson_id(lesson.lesson_id)]
    
    if not numeric_lessons:
        return None
        
    for i in range(len(numeric_lessons) - 1):
        current_lesson = numeric_lessons[i]
        next_lesson = numeric_lessons[i + 1]
        if int(current_lesson.lesson_id) <= page_no < int(next_lesson.lesson_id):
            return current_lesson.id
    
    # 处理最后一个单元
    if numeric_lessons and page_no >= int(numeric_lessons[-1].lesson_id):
        return numeric_lessons[-1].id
    
    return None

def import_lesson_sentences():
    # 创建数据库会话
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 定义教材文件目录
        textbook_dirs = [
            './data/wys-from1-textbook',
            './data/wys-from3-textbook'
        ]
        
        total_files_processed = 0
        total_tracks_processed = 0
        total_tracks_imported = 0
        total_tracks_skipped = 0
        
        # 遍历每个目录
        for textbook_dir in textbook_dirs:
            # 确保目录存在
            if not os.path.exists(textbook_dir):
                print(f"目录不存在: {textbook_dir}")
                continue
                
            # 获取目录中的所有JSON文件
            json_files = [f for f in os.listdir(textbook_dir) if f.endswith('.json')]
            
            print(f"在 {textbook_dir} 中找到 {len(json_files)} 个JSON文件")
            
            # 遍历每个JSON文件
            for json_file in json_files:
                file_path = os.path.join(textbook_dir, json_file)
                
                # 从文件名获取book_id
                book_id = json_file.split('.')[0]
                
                # 读取JSON文件
                with open(file_path, 'r', encoding='utf-8') as f:
                    textbook_data = json.load(f)
                
                # 获取指定教材的所有课程单元并按lesson_id排序
                lesson_stmt = select(LessonEntity).where(
                    LessonEntity.book_id == book_id
                ).order_by(LessonEntity.lesson_id)
                lessons = session.execute(lesson_stmt).scalars().all()
                
                if not lessons:
                    print(f"未找到 {book_id} 教材的课程单元，跳过此文件")
                    continue
                    
                print(f"处理 {book_id} 教材，找到 {len(lessons)} 个课程单元")
                
                # 记录处理的数据
                file_tracks = 0
                file_imported = 0
                file_skipped = 0
                
                # 遍历教材页面数据
                for page in textbook_data:
                    page_no = page.get('page_no')
                    if page_no is None:
                        continue
                        
                    # 获取对应的lesson_id
                    lesson_id = get_lesson_id_by_page(page_no, lessons)
                    
                    if lesson_id:
                        # 遍历页面中的音频信息
                        for track in page.get('track_info', []):
                            file_tracks += 1
                            
                            # 检查is_recite是否为1
                            if track.get('is_recite') != 1:
                                file_skipped += 1
                                continue
                            
                            # 只有当track_text和track_genre都存在时才创建句子记录
                            if track.get('track_text') and track.get('track_genre'):
                                sentence_entity = LessonSentenceEntity(
                                    lesson_id=lesson_id,
                                    english=track['track_text'],
                                    chinese=track['track_genre'],
                                    audio_url=track.get('track_url_source'),
                                    audio_start=None,
                                    audio_end=None
                                )
                                session.add(sentence_entity)
                                file_imported += 1
                
                print(f"处理文件 {json_file}：总共 {file_tracks} 条记录，导入 {file_imported} 条，跳过 {file_skipped} 条")
                
                total_files_processed += 1
                total_tracks_processed += file_tracks
                total_tracks_imported += file_imported
                total_tracks_skipped += file_skipped
        
        # 提交事务
        session.commit()
        print(f"课程句子数据导入成功！处理了 {total_files_processed} 个文件，总共 {total_tracks_processed} 条记录，导入 {total_tracks_imported} 条，跳过 {total_tracks_skipped} 条")
        
    except Exception as e:
        print(f"导入过程中发生错误: {str(e)}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    import_lesson_sentences()
