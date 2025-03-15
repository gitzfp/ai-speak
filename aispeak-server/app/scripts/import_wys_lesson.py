import json
import os
from app.db.textbook_entities import LessonEntity
from app.db import engine
from sqlalchemy.orm import sessionmaker

def import_lessons():
    # 创建数据库会话
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # 定义章节文件目录
        chapter_dirs = [
            './data/wys-from1-chapter',
            './data/wys-from3-chapter'
        ]
        
        total_imported = 0
        
        # 遍历每个目录
        for chapter_dir in chapter_dirs:
            # 获取目录中的所有JSON文件
            json_files = [f for f in os.listdir(chapter_dir) if f.endswith('_chapters.json')]
            
            print(f"在 {chapter_dir} 中找到 {len(json_files)} 个章节文件")
            
            # 遍历每个JSON文件
            for json_file in json_files:
                file_path = os.path.join(chapter_dir, json_file)
                
                # 读取JSON文件
                with open(file_path, 'r', encoding='utf-8') as f:
                    chapters = json.load(f)
                
                book_id = None
                file_imported = 0
                
                # 遍历JSON数据并创建LessonEntity对象
                for chapter in chapters:
                    book_id = chapter['book_id']
                    lesson_entity = LessonEntity(
                        title=chapter['title'],
                        book_id=chapter['book_id'],
                        parent_id=chapter['parent_id'],
                        lesson_id=chapter['page_no']
                    )
                    session.add(lesson_entity)
                    file_imported += 1
                
                print(f"从 {json_file} 导入了 {file_imported} 个章节 (book_id: {book_id})")
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