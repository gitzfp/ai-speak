import requests
from bs4 import BeautifulSoup
from app.db.words_entities import Word, Syllable, WordSyllable
from app.db import SessionLocal
import os
from urllib.parse import urlparse
import oss2
import asyncio
from app.db import Base, engine
from sqlalchemy import event
from sqlalchemy.orm import Session

# 添加 SQL 语句监听器
@event.listens_for(Session, 'after_flush')
def after_flush(session, flush_context):
    for instance in session.dirty:
        if isinstance(instance, Word):
            # 获取更改的字段
            changes = {}
            for attr in instance.__dict__:
                if not attr.startswith('_') and hasattr(instance, f'_{type(instance).__name__}__original_{attr}'):
                    orig = getattr(instance, f'_{type(instance).__name__}__original_{attr}')
                    curr = getattr(instance, attr)
                    if orig != curr:
                        changes[attr] = (orig, curr)
            
            if changes:
                print(f"\nSQL Update for word '{instance.word}':")
                print("UPDATE words SET")
                for attr, (old_val, new_val) in changes.items():
                    print(f"  {attr} = '{new_val}' -- (原值: '{old_val}')")
                print(f"WHERE word_id = {instance.word_id} AND book_id = '{instance.book_id}' AND lesson_id = {instance.lesson_id};")

# 阿里云OSS配置
region = 'oss-cn-beijing'
auth = oss2.Auth('LTAI5tMjmUPHEitz9RNi7QjJ', 'xxcNZWIAQmUqeoW1TaIekQz9WGyOsW')
bucket_name = 'books-bct'
endpoint = f"https://{region}.aliyuncs.com"
bucket = oss2.Bucket(auth, endpoint, bucket_name)
public_endpoint = f"https://books-bct.{region}.aliyuncs.com"


async def download_and_upload_to_oss(url: str, bucket: oss2.Bucket, public_endpoint: str, book_id: str, lesson_id: str) -> str:
    """下载文件并上传到阿里云OSS"""
    try:
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        oss_key = f"words/book_{book_id}/lesson_{lesson_id}/{filename}"
        if bucket.object_exists(oss_key):
            print(f"Object {oss_key} already exists in OSS, skipping upload.")
        else:
            response = requests.get(url)
            response.raise_for_status()
            bucket.put_object(oss_key, response.content)
        return f"{public_endpoint}/{oss_key}"
    except Exception as e:
        print(f"Error uploading file {url} to OSS: {str(e)}")
        return url


def parse_word_data(word: str) -> dict:
    """从API获取单词数据"""
    url = f"https://v2.xxapi.cn/api/englishwords?word={word}"
    response = requests.get(url)
    response.raise_for_status()
    api_data = response.json()

    if api_data['code'] != 200:
        return {
            "paraphrase": "",
            "phonics": "",
            "word_tense": "",
            "example_sentence": "",
            "phrase": "",
            "synonym": "",
            "uk_phonetic": "",
            "us_phonetic": "",
            "uk_sound_path": "",
            "us_sound_path": ""
        }

    data = api_data['data']

    # 格式化例句
    sentences = "\n".join([
        f"{s['s_content']}\n{s['s_cn']}"
        for s in data.get('sentences', [])
    ])

    # 格式化词组
    phrases = "\n".join([
        f"{p['p_content']}\n{p['p_cn']}"
        for p in data.get('phrases', [])
    ])

    # 格式化同义词
    synonyms = "\n".join([
        f"{s['pos']} {s['tran']}\n" + "\n".join([w['word'] for w in s['Hwds']])
        for s in data.get('synonyms', [])
    ])

    # 格式化释义
    translations = "\n".join([
        f"{t['pos']} {t['tran_cn']}"
        for t in data.get('translations', [])
    ])

    return {
        "paraphrase": translations,
        "phonics": "",  # API中没有这个字段
        "word_tense": "",  # API中没有这个字段
        "example_sentence": sentences,
        "phrase": phrases,
        "synonym": synonyms,
        "uk_phonetic": data.get('ukphone', ''),
        "us_phonetic": data.get('usphone', ''),
        "uk_sound_path": data.get('ukspeech', ''),
        "us_sound_path": data.get('usspeech', '')
    }


async def parse_word_html(word_data: any, book_id: str, lesson_id: str) -> dict:

    """解析单词HTML页面"""
    data = {
        "paraphrase": "",
        "phonics": "",
        "word_tense": "",
        "example_sentence": "",
        "phrase": "",
        "synonym": "",
        "uk_phonetic": "",
        "us_phonetic": "",
        "uk_sound_path": f"https://ywld-1315558954.51jiaoxi.com/yy-static/word/mp3/3002240/{word_data['id']}_0.mp3",
        "us_sound_path": f"https://ywld-1315558954.51jiaoxi.com/yy-static/word/mp3/3002240/{word_data['id']}_1.mp3"
    }

    uk_sound_path = await download_and_upload_to_oss(
        data['uk_sound_path'],
        bucket,
        public_endpoint,
        str(book_id),
        f"{str(lesson_id)}_uk"
    ) if data['uk_sound_path'] else ""

    us_sound_path = await download_and_upload_to_oss(
        data['us_sound_path'],
        bucket,
        public_endpoint,
        str(book_id),
        f"{str(lesson_id)}_us"
    ) if data['us_sound_path'] else ""

    # 获取HTML内容
    url = f"https://yy.suyang123.com/words/{word_data['word']}.html"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # 提取音标
    phonetics = soup.find('div', class_='word-phonetics')
    if phonetics:
        items = phonetics.find_all('div', class_='item')
        for item in items:
            type_div = item.find('div', class_='item-type')
            text_div = item.find('div', class_='item-text')
            if type_div and text_div:
                if type_div.text.strip() == '英':
                    data["uk_phonetic"] = text_div.text.strip()
                elif type_div.text.strip() == '美':
                    data["us_phonetic"] = text_div.text.strip()

    # 提取释义
    paraphrase = soup.find('div', class_='paraphrase-list')
    if paraphrase:
        data["paraphrase"] = paraphrase.get_text(strip=True)

    # 提取自然拼读
    phonics = soup.find('div', class_='phonics-list')
    if phonics:
        data["phonics"] = phonics.get_text(strip=True)

    # 提取词态
    word_tense = soup.find('div', class_='word_tense-list')
    if word_tense:
        data["word_tense"] = word_tense.get_text(strip=True)

    # 提取例句
    example_sentence = soup.find('div', class_='example_sentence-list')
    if example_sentence:
        data["example_sentence"] = example_sentence.get_text(strip=True)

    # 提取词组
    phrase = soup.find('div', class_='phrase-list')
    if phrase:
        data["phrase"] = phrase.get_text(strip=True)

    # 提取近义词
    synonym = soup.find('div', class_='synonym-list')
    if synonym:
        data["synonym"] = synonym.get_text(strip=True)

    if uk_sound_path or us_sound_path:
        data["uk_sound_path"] = uk_sound_path
        data["us_sound_path"] = us_sound_path
    return data


async def get_word_data(word_data: any, book_id: str, lesson_id: str) -> dict:
    """获取单词数据（结合API和HTML解析）"""

    # 打印API返回的原始数据
    print(f"\nAPI data for word '{word_data}':")
    # 获取API数据
    # html_data = parse_word_data(word_data)
    # 获取HTML数据
    html_data = await parse_word_html(word_data, book_id, lesson_id)

    print("API Response:", html_data)
    
    # 合并数据，优先使用API数据，缺失则使用HTML数据
    return {
        "paraphrase": html_data["paraphrase"],
        "phonics": html_data["phonics"],  # 只从HTML获取自然拼读信息
        "word_tense": html_data["word_tense"],  # 只从HTML获取词态信息
        "example_sentence": html_data["example_sentence"],
        "phrase": html_data["phrase"],
        "synonym":  html_data["synonym"],
        "uk_phonetic": html_data["uk_phonetic"],
        "us_phonetic": html_data["us_phonetic"],
        "uk_sound_path": html_data["uk_sound_path"],
        "us_sound_path": html_data["us_sound_path"]
    }


async def fetch_words_data(params: dict):
    """
    params 格式示例:
    {
        'url': 'https://api.suyang123.com/api/syh5/yy/words/list?stage_tag=xiaoxue&lesson_id=1&version_tag=rjbp&grade_tag=yinianji&term_tag=xiace',
        'book_id': '1212001101247'
    }
    """
    url = params.get('url', 'https://api.suyang123.com/api/syh5/yy/words/list')
    book_id = params.get('book_id', '1212001101247')

    parsed_url = urlparse(url)
    base_params = dict(param.split('=') for param in parsed_url.query.split(
        '&')) if parsed_url.query else {}
    url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"

    headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
        'origin': 'https://yy.suyang123.com',
        'referer': 'https://yy.suyang123.com/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
    }

    try:
        first_params = base_params.copy()
        first_params['lesson_id'] = '1'
        response = requests.get(url, params=first_params, headers=headers)
        response.raise_for_status()
        data = response.json()

        if data['code'] == 200 and 'data' in data:
            lessons = data['data']['lessons']

            # 确保数据库表已创建
            Base.metadata.create_all(bind=engine)
            
            for lesson in lessons:
                print(f"Processing Unit {lesson['id']}...")
                current_params = base_params.copy()
                current_params['lesson_id'] = str(lesson['id'])

                response = requests.get(
                    url, params=current_params, headers=headers)
                response.raise_for_status()
                lesson_data = response.json()

                if lesson_data['code'] == 200 and 'data' in lesson_data:
                    db = SessionLocal()
                    try:
                        lesson_id = int(
                            lesson_data['data']['info']['lesson_id'])
                        words_data = lesson_data['data']['lesson_words']['words']

                        for word_data in words_data:
                            # 在获取merged_data之后添加调试日志
                            merged_data = await get_word_data(word_data, book_id, lesson_id)
                            print(f"\nProcessing word: {word_data['word']}")
                            print(f"Phonics data: {merged_data['phonics']}")
                            
                            if merged_data['phonics']:
                                print(f"Processing syllables for word: {word_data['word']}")
                                await process_syllables(
                                    merged_data['phonics'],
                                    db,
                                    bucket,
                                    public_endpoint,
                                    word_data['id']
                                )
                            else:
                                print(f"Skipping syllables processing - no phonics data for word: {word_data['word']}")

                            # 上传音频和图片到OSS
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

                            # 上传英音和美音到OSS
                            uk_sound_path = await download_and_upload_to_oss(
                                merged_data['uk_sound_path'],
                                bucket,
                                public_endpoint,
                                str(book_id),
                                f"{str(lesson_id)}_uk"
                            ) if merged_data['uk_sound_path'] else ""
                            
                            us_sound_path = await download_and_upload_to_oss(
                                merged_data['us_sound_path'],
                                bucket,
                                public_endpoint,
                                str(book_id),
                                f"{str(lesson_id)}_us"
                            ) if merged_data['us_sound_path'] else ""

                            # 检查数据库中是否已存在该单词
                            existing_word = db.query(Word).filter(
                                Word.word_id == word_data['id'],
                                Word.book_id == book_id,
                                Word.lesson_id == lesson_id
                            ).first()

                            word_data_dict = {
                                'word_id': word_data['id'],
                                'lesson_id': lesson_id,
                                'book_id': book_id,
                                'word': word_data['word'],
                                'chinese': word_data['chinese'],
                                'phonetic': word_data['phonetic'],
                                'sound_path': sound_path,
                                'image_path': image_path,
                                'has_base': bool(word_data['has_base']),
                                'paraphrase': merged_data['paraphrase'],
                                'phonics': merged_data['phonics'],
                                'word_tense': merged_data['word_tense'],
                                'example_sentence': merged_data['example_sentence'],
                                'phrase': merged_data['phrase'],
                                'synonym': merged_data['synonym'],
                                "uk_phonetic": merged_data["uk_phonetic"],
                                "us_phonetic": merged_data["us_phonetic"],
                                "uk_sound_path": uk_sound_path,
                                "us_sound_path": us_sound_path
                            }
                            print(f"合并后的数据：Processing word: {word_data['word']}", word_data_dict)

                            # 创建新的Word对象
                            word = Word(**word_data_dict)
                            
                            if existing_word:
                                # 更新现有记录
                                for key, value in word_data_dict.items():
                                    setattr(existing_word, key, value)
                            else:
                                # 添加新记录
                                db.add(word)
                            
                            # 立即提交每个单词
                            try:
                                db.commit()
                                print(f"Successfully saved/updated word: {word_data['word']}")
                            except Exception as e:
                                db.rollback()
                                print(f"Error saving word {word_data['word']}: {str(e)}")
                                raise
                        print(f"Unit {lesson['id']} words successfully saved to database")

                    except Exception as e:
                        db.rollback()
                        print(f"Error processing Unit {lesson['id']}: {str(e)}")
                        raise
                    finally:
                        db.close()
        else:
            print("Invalid response format")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {str(e)}")


def get_syllables(phonics: str) -> list:
    """解析音节列表，返回原始字母音标配对和合并后的音节，合并后的音节按顺序插入"""
    if not phonics:
        return []

    # 最终结果列表
    result = []

    # 按空格分割音节部分
    syllable_parts = phonics.strip().split(' ')

    for part in syllable_parts:
        # 分割每个音节部分并过滤空元素
        elements = list(filter(None, part.split('/')))
        current_merged_syllable = {'letter': '', 'sound': ''}

        # 处理每个字母和音标对
        i = 0
        while i < len(elements):
            letter = elements[i]
            sound = elements[i + 1] if i + 1 < len(elements) else ''
            # 添加原始字母音标配对
            result.append({'letter': letter, 'sound': sound})
            # 合并到当前音节
            current_merged_syllable['letter'] += letter
            current_merged_syllable['sound'] += sound
            i += 2  # 每次跳两个元素处理下一个字母

        # 添加合并后的音节
        if current_merged_syllable['letter']:
            result.append(current_merged_syllable)

    print(f"========音节数据====={result}")
    return result

async def process_syllables(phonics_text: str, db, bucket: oss2.Bucket, public_endpoint: str, word_id: int = None) -> None:
    """处理音节信息并存储到数据库"""
   
    print(f"Adding {phonics_text} new syllable relationships====上: {word_id}")
    if not phonics_text or word_id is None:
        print("Adding {phonics_text} new syllable relationships====中: {word_id}")
        return
        
    syllables = get_syllables(phonics_text)
    
    # 检查现有的单词-音节关联
    existing_relations = db.query(WordSyllable).filter(
        WordSyllable.word_id == word_id
    ).all()
    
    # # 如果音节数量和顺序都没变，就不需要更新
    # if len(existing_relations) == len(syllables):
    #     all_match = True
    #     for i, relation in enumerate(existing_relations):
    #         syllable = db.query(Syllable).get(relation.syllable_id)
    #         if (syllable.letter != syllables[i]['letter'] or 
    #             syllable.phonetic != syllables[i]['sound']):
    #             all_match = False
    #             break
    #     if all_match:
    #         return
    
    try:
        # 处理每个音节
        new_relations = []
        for position, syllable_data in enumerate(syllables):
            letter = syllable_data['letter']
            sound = syllable_data['sound']
            
            # 检查音节是否已存在
            existing_syllable = db.query(Syllable).filter(
                Syllable.letter == letter,
                Syllable.phonetic == sound
            ).first()
            
            # 处理音节音频
            sound_url = f"https://static.suyang123.com/assets/yyld/word-base/syllable/{sound}.mp3"
            try:
                sound_path = await download_and_upload_to_oss(
                    sound_url,
                    bucket,
                    public_endpoint,
                    'syllables',
                    letter
                )
            except Exception as e:
                print(f"Error downloading syllable audio {letter}: {str(e)}")
                sound_path = ""
            
            if not existing_syllable:
                # 创建新音节
                existing_syllable = Syllable(
                    letter=letter,
                    content=f"{letter}[{sound}]",  # 组合字母和音标作为唯一标识
                    sound_path=sound_path,
                    phonetic=sound
                )
                db.add(existing_syllable)
                db.flush()
                print(f"Added new syllable: {letter} [{sound}]")
            else:
                # 更新现有音节
                existing_syllable.letter = letter
                existing_syllable.content = f"{letter}[{sound}]"
                existing_syllable.sound_path = sound_path
                existing_syllable.phonetic = sound 
            
            # 创建新的关联记录
            new_relations.append(WordSyllable(
                word_id=word_id,
                syllable_id=existing_syllable.id,
                position=position
            ))
        
        # 批量删除旧关系
        if existing_relations:
            print(f"Deleting {len(existing_relations)} existing syllable relationships for word_id {word_id}")
            db.query(WordSyllable).filter(
                WordSyllable.word_id == word_id
            ).delete()
        
        # 批量添加新关系
        print(
            f"Adding {len(new_relations)} new syllable relationships: {word_id}=====下:{phonics_text}")
        for relation in new_relations:
            syllable = db.query(Syllable).get(relation.syllable_id)
            print(f"  Position {relation.position}: {syllable.letter} [{syllable.phonetic}]")
        
        db.bulk_save_objects(new_relations)
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"Error saving syllables relationships to database: {str(e)}")


if __name__ == "__main__":
    # sylleble = "h/h/e/ə/l/ /l/l/o/əʊ/"
    # get_syllables(sylleble)
    # # 示例用法
    params_list = [
        {
            'url': 'https://api.suyang123.com/api/syh5/yy/words/list?stage_tag=xiaoxue&lesson_id=1&version_tag=rjbp&grade_tag=yinianji&term_tag=shangce',
            'book_id': '1212001101247'
        },
        {
            'url': 'https://api.suyang123.com/api/syh5/yy/words/list?stage_tag=xiaoxue&lesson_id=1&version_tag=rjbp&grade_tag=yinianji&term_tag=xiace',
            'book_id': '1212001102247'
        }
    ]

    for params in params_list:
        print(f"\n开始处理 book_id: {params['book_id']} 的数据...")
        asyncio.run(fetch_words_data(params))
