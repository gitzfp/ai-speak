import json
import os
import sys
import re
from pathlib import Path
from collections import defaultdict

# 添加项目根目录到 Python 路径
project_root = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, project_root)

from app.db.textbook_entities import LessonEntity
from app.db import engine
from sqlalchemy.orm import sessionmaker

def extract_module_number(title):
    """从标题中提取Module编号"""
    match = re.search(r'Module\s+(\d+)', title)
    return int(match.group(1)) if match else None

def merge_unit_titles(chapters):
    """合并相同Module的Units"""
    module_groups = defaultdict(list)
    
    # 按Module编号分组
    for chapter in chapters:
        module_number = extract_module_number(chapter['title'])
        if module_number is not None:
            module_groups[module_number].append(chapter)
    
    # 合并每个Module组的标题
    merged_chapters = []
    for module_number, module_chapters in module_groups.items():
        if not module_chapters:
            continue
            
        # 按page_no排序确保顺序正确
        module_chapters.sort(key=lambda x: x['page_no'])
        
        # 获取第一个chapter的基本信息
        base_chapter = module_chapters[0]
        
        # 构建合并后的标题
        merged_title = base_chapter['title']  # 第一个Unit的完整标题
        for chapter in module_chapters[1:]:
            # 提取Unit部分（包括后面的内容）
            unit_part = re.sub(r'^Module\s+\d+\s+', '', chapter['title'])
            merged_title += f" & {unit_part}"
        
        # 创建合并后的chapter
        merged_chapter = {
            'title': merged_title,
            'book_id': base_chapter['book_id'],
            'parent_id': base_chapter['parent_id'],
            'page_no': module_number  # 使用Module编号作为lesson_id
        }
        merged_chapters.append(merged_chapter)
    
    return merged_chapters

def import_lessons():
    # 创建数据库会话
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 使用绝对路径定义章节文件目录
        script_dir = Path(__file__).parent
        chapter_dirs = [
            script_dir / 'data/wys-from1-chapter'
            # script_dir / 'data/wys-from3-chapter'
        ]
        
        total_imported = 0
        
        # 遍历每个目录
        for chapter_dir in chapter_dirs:
            # 确保目录存在
            if not chapter_dir.exists():
                print(f"目录不存在: {chapter_dir}")
                continue
                
            # 获取目录中的所有JSON文件
            json_files = [f for f in os.listdir(chapter_dir) if f.endswith('_chapters.json')]
            
            print(f"在 {chapter_dir} 中找到 {len(json_files)} 个章节文件")
            
            # 遍历每个JSON文件
            for json_file in json_files:
                file_path = chapter_dir / json_file
                
                # 读取JSON文件
                with open(file_path, 'r', encoding='utf-8') as f:
                    chapters = json.load(f)
                
                # 合并相同Module的Units
                merged_chapters = merge_unit_titles(chapters)
                
                book_id = None
                file_imported = 0
                
                # 遍历合并后的数据并创建LessonEntity对象
                for chapter in merged_chapters:
                    book_id = chapter['book_id']
                    lesson_entity = LessonEntity(
                        title=chapter['title'],
                        book_id=chapter['book_id'],
                        parent_id=chapter['parent_id'],
                        lesson_id=chapter['page_no']
                    )
                    session.add(lesson_entity)
                    file_imported += 1
                
                print(f"从 {json_file} 导入了 {file_imported} 个合并后的章节 (book_id: {book_id})")
                total_imported += file_imported
        
        # 提交事务
        session.commit()
        print(f"章节数据导入成功！总共导入了 {total_imported} 个章节")
        
    except Exception as e:
        print(f"导入过程中发生错误: {str(e)}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    import_lessons() 