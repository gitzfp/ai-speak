import os
import json
from app.db.textbook_entities import TextbookEntity, Base, engine
from sqlalchemy.orm import Session
from app.scripts.utils.utils import download_and_upload_to_oss  
import asyncio


async def insert_english_textbooks(json_data):
    # Create database session
    session = Session(engine)

    try:
        # Parse the JSON data
        data = json.loads(json_data)

        # Find English subject (subject_id = 12)
        english_subject = next(
            (subject for subject in data['booklist']
             if subject['subject_id'] == '12'),
            None
        )

        if not english_subject:
            print("No English subject found in data")
            return

        print(f"Processing {english_subject['subject_name']} textbooks...")

        # Iterate through each version type
        for version in english_subject['versions']:
            version_type = version['version_type']
            print(f"Processing version: {version_type}")

            # Iterate through each textbook
            for book in version['textbooks']:
                # Create new textbook entity
                icon_url_oss = await download_and_upload_to_oss(book['icon_url'], 'textbook_icons', f"{book['book_id']}.jpg", f"textbook_icons/{book['book_id']}.jpg")
                textbook = TextbookEntity(
                    id=book['book_id'],
                    name=book['book_name'],
                    subject_id=int(english_subject['subject_id']),
                    version_type=version_type,
                    grade=book['grade'],
                    term=book['term'],
                    icon_url=icon_url_oss  # Use the OSS URL
                )
                # Add to session
                # Using merge instead of add to handle duplicates
                session.merge(textbook)
                print(
                    f"Added: {book['book_name']} - {book['grade']} {book['term']}")

        # Commit all changes
        session.commit()
        print("\nSuccessfully inserted English textbooks into database")

    except Exception as e:
        session.rollback()
        print(f"Error occurred: {str(e)}")
        raise

    finally:
        session.close()


# Add this async function to call your existing async function
async def main():
    # 读取 JSON 文件，使用相对于脚本文件的路径
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, 'data', 'textbook_data.json')
    
    with open(json_path, 'r', encoding='utf-8') as file:
        json_data = file.read()
    
    await insert_english_textbooks(json_data)

# Call the main function in an appropriate context
if __name__ == "__main__":
    asyncio.run(main())
