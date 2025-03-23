import json
import os
import sys
import re
from pathlib import Path
from collections import defaultdict

# 添加项目根目录到 Python 路径
project_root = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, project_root)

from app.db.textbook_entities import LessonSentenceEntity, LessonEntity
from app.db import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

def extract_module_number(title):
    """从标题中提取Module编号"""
    match = re.search(r'Module\s+(\d+)', title)
    return int(match.group(1)) if match else None

def get_module_page_ranges(chapters_data):
    """
    从章节数据中提取每个Module的页码范围
    返回格式：{module_number: (start_page, end_page)}
    """
    # 先按Module编号分组
    module_groups = defaultdict(list)
    
    for chapter in chapters_data:
        module_number = extract_module_number(chapter.get('title', ''))
        if module_number is not None:
            module_groups[module_number].append(chapter)
    
    # 按Module编号排序
    module_numbers = sorted(module_groups.keys())
    
    # 计算每个Module的起始和结束页码
    module_ranges = {}
    
    for i, module_number in enumerate(module_numbers):
        chapters = module_groups[module_number]
        # 找到该Module下最小的页码作为起始
        start_page = min(chapter.get('page_no', float('inf')) for chapter in chapters)
        
        # 如果是最后一个Module，结束页码设为无穷大
        if i == len(module_numbers) - 1:
            end_page = float('inf')
        else:
            # 否则结束页码是下一个Module的起始页码
            next_module = module_numbers[i + 1]
            next_chapters = module_groups[next_module]
            end_page = min(chapter.get('page_no', float('inf')) for chapter in next_chapters)
        
        module_ranges[module_number] = (start_page, end_page)
    
    return module_ranges

def get_lesson_id_by_module(module_number, lessons):
    """
    根据Module编号获取对应的lesson_id（数据库ID）
    """
    for lesson in lessons:
        if lesson.lesson_id == str(module_number):
            return lesson.id
    return None

def import_lesson_sentences():
    # 创建数据库会话
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 定义文件目录
        data_dir = os.path.join(project_root, 'app/scripts/data')
        chapter_dirs = [
            os.path.join(data_dir, 'wys-from1-chapter')
            # os.path.join(data_dir, 'wys-from3-chapter')
        ]
        textbook_dirs = [
            os.path.join(data_dir, 'wys-from1-textbook')
            # os.path.join(data_dir, 'wys-from3-textbook')
        ]
        
        # 打印当前目录和数据目录路径
        print(f"当前工作目录: {os.getcwd()}")
        print(f"数据目录: {data_dir}")
        
        total_files_processed = 0
        total_tracks_processed = 0
        total_tracks_imported = 0
        total_tracks_skipped = 0
        total_duplicates_skipped = 0
        
        # 遍历每个教材
        for chapter_dir, textbook_dir in zip(chapter_dirs, textbook_dirs):
            # 确保目录存在
            if not os.path.exists(chapter_dir) or not os.path.exists(textbook_dir):
                print(f"目录不存在: {chapter_dir} 或 {textbook_dir}")
                continue
                
            # 获取章节文件
            chapter_files = [f for f in os.listdir(chapter_dir) if f.endswith('_chapters.json')]
            
            for chapter_file in chapter_files:
                book_id = chapter_file.split('_chapters.json')[0]
                textbook_file = f"{book_id}.json"
                textbook_path = os.path.join(textbook_dir, textbook_file)
                
                if not os.path.exists(textbook_path):
                    print(f"教材文件不存在: {textbook_path}")
                    continue
                
                print(f"处理教材: {book_id}")
                print(f"章节文件: {chapter_file}")
                print(f"教材文件: {textbook_file}")
                
                # 读取章节文件
                with open(os.path.join(chapter_dir, chapter_file), 'r', encoding='utf-8') as f:
                    chapters_data = json.load(f)
                
                # 读取教材文件
                with open(textbook_path, 'r', encoding='utf-8') as f:
                    textbook_data = json.load(f)
                
                # 获取指定教材的所有lesson
                lesson_stmt = select(LessonEntity).where(
                    LessonEntity.book_id == book_id
                )
                lessons = session.execute(lesson_stmt).scalars().all()
                
                if not lessons:
                    print(f"未找到 {book_id} 教材的课程单元，跳过此文件")
                    continue
                
                # 列出所有找到的lesson记录，用于调试
                print("找到的lesson记录:")
                for lesson in lessons:
                    print(f"  ID: {lesson.id}, lesson_id: {lesson.lesson_id}, 标题: {lesson.title}")
                
                # 获取每个Module的页码范围
                module_page_ranges = get_module_page_ranges(chapters_data)
                
                # 打印页码范围信息，用于调试
                print("Module页码范围:")
                for module_number, (start_page, end_page) in module_page_ranges.items():
                    end_page_str = str(end_page) if end_page != float('inf') else "无穷大"
                    print(f"  Module {module_number}: 页码 {start_page} 到 {end_page_str}")
                
                # 记录处理的数据
                file_tracks = 0
                file_imported = 0
                file_skipped = 0
                file_duplicates = 0
                module_counts = defaultdict(int)  # 记录每个Module的句子数量
                
                # 保存每个Module的句子，用于去重
                module_sentences = defaultdict(dict)  # {module_number: {english: sentence_data}}
                
                # 第一遍遍历：将句子按Module分组并去重
                for page in textbook_data:
                    page_no = page.get('page_no')
                    if page_no is None:
                        continue
                    
                    # 找到这个页面所属的Module
                    module_found = False
                    for module_number, (start_page, end_page) in module_page_ranges.items():
                        if start_page <= page_no < end_page:
                            # 找到了所属的Module
                            for track in page.get('track_info', []):
                                file_tracks += 1
                                
                                if track.get('is_recite') != 1:
                                    file_skipped += 1
                                    continue
                                    
                                if track.get('track_text') and track.get('track_genre'):
                                    english = track['track_text']
                                    
                                    # 如果这个英文句子在当前Module中还没有出现过，就保存它
                                    if english not in module_sentences[module_number]:
                                        module_sentences[module_number][english] = {
                                            'module_number': module_number,
                                            'english': english,
                                            'chinese': track['track_genre'],
                                            'audio_url': track.get('track_url_source')
                                        }
                                        module_counts[module_number] += 1
                                    else:
                                        file_duplicates += 1
                            
                            module_found = True
                            break
                    
                    if not module_found and page_no > 0:
                        print(f"警告：页码 {page_no} 没有找到对应的Module")
                
                # 打印每个Module的句子数量，用于调试
                print("每个Module的句子数量:")
                for module_number, count in module_counts.items():
                    print(f"  Module {module_number}: {count} 条句子")
                
                # 第二遍遍历：将去重后的句子导入数据库
                for module_number, sentences in module_sentences.items():
                    # 获取对应的lesson_id
                    lesson_id = get_lesson_id_by_module(module_number, lessons)
                    
                    if not lesson_id:
                        print(f"未找到Module {module_number}对应的lesson记录，跳过此Module的句子")
                        continue
                    
                    print(f"将Module {module_number}的句子导入到lesson_id={lesson_id}")
                    
                    for sentence_data in sentences.values():
                        sentence_entity = LessonSentenceEntity(
                            lesson_id=lesson_id,
                            english=sentence_data['english'],
                            chinese=sentence_data['chinese'],
                            audio_url=sentence_data['audio_url'],
                            audio_start=None,
                            audio_end=None
                        )
                        session.add(sentence_entity)
                        file_imported += 1
                
                print(f"处理文件 {textbook_file}：总共 {file_tracks} 条记录，导入 {file_imported} 条，跳过 {file_skipped} 条，重复 {file_duplicates} 条")
                
                total_files_processed += 1
                total_tracks_processed += file_tracks
                total_tracks_imported += file_imported
                total_tracks_skipped += file_skipped
                total_duplicates_skipped += file_duplicates
        
        # 提交事务
        session.commit()
        print(f"课程句子数据导入成功！处理了 {total_files_processed} 个文件，总共 {total_tracks_processed} 条记录，"
              f"导入 {total_tracks_imported} 条，跳过 {total_tracks_skipped} 条，重复 {total_duplicates_skipped} 条")
        
    except Exception as e:
        print(f"导入过程中发生错误: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    import_lesson_sentences()
