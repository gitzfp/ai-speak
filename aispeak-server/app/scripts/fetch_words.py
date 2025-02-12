import requests
from app.db.words_entities import Word
from app.db import SessionLocal
import os
from urllib.parse import urlparse
import oss2
import asyncio

# 添加阿里云OSS配置
region = 'oss-cn-beijing'
auth = oss2.Auth('LTAI5tMjmUPHEitz9RNi7QjJ', 'xxcNZWIAQmUqeoW1TaIekQz9WGyOsW')
bucket_name = 'books-bct'
endpoint = f"https://{region}.aliyuncs.com"
bucket = oss2.Bucket(auth, endpoint, bucket_name)
public_endpoint = f"https://books-bct.{region}.aliyuncs.com"


async def download_and_upload_to_oss(url: str, bucket, public_endpoint: str, book_id: str, lesson_id: str) -> str:
    """下载文件并上传到阿里云OSS"""
    try:
        # 下载文件
        response = requests.get(url)
        response.raise_for_status()
        
        # 从URL中获取文件名
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        
        # 构造OSS存储路径，包含book_id和lesson_id
        oss_key = f"words/book_{book_id}/lesson_{lesson_id}/{filename}"
        
        # 上传到OSS
        bucket.put_object(oss_key, response.content)
        
        # 返回新的URL
        return f"{public_endpoint}/{oss_key}"
    except Exception as e:
        print(f"Error uploading file {url} to OSS: {str(e)}")
        return url  # 如果上传失败，返回原始URL

async def fetch_words_data():
    url = 'https://api.suyang123.com/api/syh5/yy/words/list'
    base_params = {
        'stage_tag': 'xiaoxue',
        'version_tag': 'rjbp',
        'grade_tag': 'yinianji',
        'term_tag': 'shangce'
    }
    
    headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
        'origin': 'https://yy.suyang123.com',
        'referer': 'https://yy.suyang123.com/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
    }

    try:
        # 先获取第一个单元的数据，以获取所有单元信息
        first_params = base_params.copy()
        first_params['lesson_id'] = '1'
        response = requests.get(url, params=first_params, headers=headers)
        response.raise_for_status()
        data = response.json()

        if data['code'] == 200 and 'data' in data:
            lessons = data['data']['lessons']
            
            # 循环处理每个单元
            for lesson in lessons:
                print(f"Processing Unit {lesson['id']}...")
                current_params = base_params.copy()
                current_params['lesson_id'] = str(lesson['id'])
                
                response = requests.get(url, params=current_params, headers=headers)
                response.raise_for_status()
                lesson_data = response.json()
                
                if lesson_data['code'] == 200 and 'data' in lesson_data:
                    db = SessionLocal()
                    try:
                        book_id = '1212001101247'
                        lesson_id = int(lesson_data['data']['info']['lesson_id'])
                        words_data = lesson_data['data']['lesson_words']['words']

                        for word_data in words_data:
                            # 上传音频和图片到OSS，传入book_id和lesson_id
                            sound_path = await download_and_upload_to_oss(
                                word_data['sound_path'], 
                                bucket, 
                                public_endpoint,
                                str(book_id),
                                str(lesson_id)
                            )
                            image_path = await download_and_upload_to_oss(
                                word_data['image_path'], 
                                bucket, 
                                public_endpoint,
                                str(book_id),
                                str(lesson_id)
                            )
                            
                            word = Word(
                                word_id=word_data['id'],
                                lesson_id=lesson_id,
                                book_id=book_id,
                                word=word_data['word'],
                                chinese=word_data['chinese'],
                                phonetic=word_data['phonetic'],
                                sound_path=sound_path,  # 使用新的OSS URL
                                image_path=image_path,  # 使用新的OSS URL
                                has_base=bool(word_data['has_base'])
                            )
                            db.add(word)

                        db.commit()
                        print(f"Unit {lesson['id']} words successfully saved to database")

                    except Exception as e:
                        db.rollback()
                        print(f"Error saving Unit {lesson['id']} to database: {str(e)}")
                    finally:
                        db.close()
        else:
            print("Invalid response format")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {str(e)}")


if __name__ == "__main__":
    asyncio.run(fetch_words_data())
