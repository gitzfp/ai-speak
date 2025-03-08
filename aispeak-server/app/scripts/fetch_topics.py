import json
import os
from typing import Dict, List, Any, Union
from urllib.parse import unquote

import asyncio
from app.scripts.utils.utils import download_and_upload_to_oss
from sqlalchemy.orm import Session
from app.db import engine
from app.db.topic_entities import TopicGroupEntity, TopicEntity, TopicTargetEntity, TopicPhraseEntity


async def transform_data(input_data: Dict) -> Dict:
    """
    执行数据转换的核心函数
    :param input_data: 原始输入数据
    :return: 转换后的数据格式
    """
    # 分类ID到组名的映射表（需要根据业务需求补充完整）
    CATEGORY_MAPPING = {
        "75": "社交互动",
        "87": "兴趣爱好",
        "74": "日常生活",
        "88": "家庭生活",
        "86": "校园生活"
    }

    # 初始化组字典和排序计数器
    groups: Dict[str, Dict] = {}
    sequence_counter = 10

    for item in input_data.get("data", []):
        # 处理分类分组
        category_ids = [cid.strip() for cid in item.get(
            "category_id", "").split(",") if cid.strip()]

        # 构建基础主题结构
        topic = await build_topic(item)

        # 将主题添加到对应分组
        for cid in category_ids:
            group_name = CATEGORY_MAPPING.get(cid, f"未分类_{cid}")
            group_key = f"group_{cid}"

            if group_key not in groups:
                groups[group_key] = create_group(
                    cid, group_name, sequence_counter)
                sequence_counter += 10  # 每组间隔10个序号

            groups[group_key]["topics"].append(topic)

    # 后处理：排序和清理
    return {
        "groups": sorted(
            [post_process_group(g) for g in groups.values()],
            key=lambda x: x["sequence"]
        )
    }

async def build_topic(item: Dict) -> Dict:
    """构建单个主题的结构"""
    # 处理图片上传
    image_url = process_image_url(item.get("pic", ""))
    try:
        oss_key = f"images/topic_aiwj/{item['id']}.jpg"
        oss_image_url = await download_and_upload_to_oss(image_url, oss_key)
    except Exception as e:
        print(f"图片上传失败 {image_url}: {str(e)}")
        oss_image_url = image_url

    return {
        "id": item["id"],
        "language": "en-US",
        "name": unquote(item["title"]),  # 解码中文
        "level": calculate_level(item.get("hot_sort", 0)),
        "role_short_name": "en-US-JaneNeural",
        "role_speech_rate": "1.0",
        "topic_user_name": "User",
        "topic_bot_name": "Assistant",
        "prompt": item.get("info_en", ""),
        "description": unquote(item.get("sub_title", "")),
        "image_url": oss_image_url,
        "sequence": abs(int(item.get("sort", 0))),  # 处理负值排序
        "phrases": build_phrases(item.get("important_words", "")),
        "targets": build_targets(item)
    }


def build_phrases(important_words: str) -> List[Dict]:
    """构建短语列表"""
    phrases = []
    for idx, word in enumerate(filter(None, important_words.splitlines()), start=1):
        # 简单中英分离逻辑（实际业务需增强）
        if '\r' in word:
            en, zh = word.split('\r', 1)
        else:
            en, zh = word, word  # 默认中英相同

        phrases.append({
            "phrase": en.strip(),
            "phrase_translation": zh.strip(),
            "type": "PHRASE",
            "sequence": idx
        })
    return phrases


def build_targets(item: Dict) -> List[Dict]:
    """构建对话目标"""
    targets = []
    if user_text := item.get("user_text"):
        targets.append({
            "type": "MAIN",
            "description": user_text,
            "description_translation": unquote(item.get("info_cn", "")),
            "sequence": 100
        })

    if continue_text := item.get("user_continue_text"):
        targets.append({
            "type": "TRIAL",
            "description": continue_text,
            "description_translation": "延续对话",
            "sequence": 10
        })
    return targets


def process_image_url(url: str) -> str:
    """处理图片URL"""
    return unquote(url).replace("\\/", "/")  # 修正转义字符


def calculate_level(hot_sort: Union[str, int]) -> int:
    """根据热度计算难度级别"""
    try:
        hs = int(hot_sort)
        return min(max(1, 5 - abs(hs)//20), 5)  # 将hot_sort映射到1-5级
    except ValueError:
        return 3


def create_group(cid: str, name: str, sequence: int) -> Dict:
    """创建新的对话组"""
    return {
        "id": f"group_{cid}",
        "name": name,
        "type": "ROLE_PLAY",
        "description": f"{name}相关场景",
        "sequence": sequence,
        "topics": []
    }


def post_process_group(group: Dict) -> Dict:
    """组后处理：排序和清理"""
    group["topics"] = sorted(
        group["topics"],
        key=lambda t: t["sequence"]
    )
    return group


async def main():
    """异步主函数"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, 'data', 'aiwj_topic_school.json')
    output_path = os.path.join(current_dir, 'data', 'aiwj_topic_output.json')
    
    # 生成JSON数据
    with open(json_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)
    output_data = await transform_data(input_data)
    # with open(output_path, "w", encoding="utf-8") as f:
    #     json.dump(output_data, f, ensure_ascii=False, indent=2)

    # 新增数据库存储
    await save_to_database(output_data)

async def save_to_database(data: Dict):
    """保存数据到数据库"""
    default_account = "system_auto"
    
    try:
        with Session(engine) as session:
            # 处理话题分组
            for group in data["groups"]:
                await process_topic_group(session, group, default_account)
            
            session.commit()
            print("数据成功写入数据库")
    except Exception as e:
        session.rollback()
        print(f"数据库写入失败: {str(e)}")
        raise

async def process_topic_group(session: Session, group_data: Dict, account: str):
    """处理单个话题分组"""
    # 处理分组（使用merge）
    group = session.merge(TopicGroupEntity(
        id=group_data["id"],
        type=group_data["type"],
        name=group_data["name"],
        sequence=group_data["sequence"],
        description=group_data["description"],
        created_by=account
    ))
    
    # 处理主题
    for topic_data in group_data["topics"]:
        # 合并主题（使用merge）
        topic = session.merge(TopicEntity(
            id=topic_data["id"],
            group_id=group.id,
            name=topic_data["name"],
            description=topic_data["description"],
            level=topic_data["level"],
            image_url=topic_data["image_url"],
            language=topic_data["language"],
            role_short_name=topic_data["role_short_name"],
            role_speech_rate=topic_data["role_speech_rate"],
            sequence=topic_data["sequence"],
            topic_user_name=topic_data["topic_user_name"],
            topic_bot_name=topic_data["topic_bot_name"],
            prompt=topic_data["prompt"],
            created_by=account
        ))
        
        # 处理目标（使用upsert）
        for target_data in topic_data["targets"]:
            # 根据业务唯一键查询（假设唯一键为 topic_id + type + sequence）
            existing_target = session.query(TopicTargetEntity).filter(
                TopicTargetEntity.topic_id == topic.id,
                TopicTargetEntity.type == target_data["type"],
                TopicTargetEntity.sequence == target_data["sequence"]
            ).first()
            
            if existing_target:
                # 更新字段
                existing_target.description = target_data["description"]
                existing_target.description_translation = target_data["description_translation"]
            else:
                # 插入新记录
                session.add(TopicTargetEntity(
                    topic_id=topic.id,
                    type=target_data["type"],
                    description=target_data["description"],
                    sequence=target_data["sequence"],
                    description_translation=target_data["description_translation"],
                    created_by=account
                ))

        # 处理短语（使用upsert）
        for phrase_data in topic_data["phrases"]:
            # 根据业务唯一键查询（假设唯一键为 topic_id + phrase）
            existing_phrase = session.query(TopicPhraseEntity).filter(
                TopicPhraseEntity.topic_id == topic.id,
                TopicPhraseEntity.phrase == phrase_data["phrase"]
            ).first()
            
            if existing_phrase:
                # 更新字段
                existing_phrase.phrase_translation = phrase_data["phrase_translation"]
                existing_phrase.type = phrase_data["type"]
                existing_phrase.sequence = phrase_data["sequence"]
            else:
                # 插入新记录
                session.add(TopicPhraseEntity(
                    topic_id=topic.id,
                    phrase=phrase_data["phrase"],
                    phrase_translation=phrase_data["phrase_translation"],
                    type=phrase_data["type"],
                    sequence=phrase_data["sequence"],
                    created_by=account
                ))

if __name__ == "__main__":
    asyncio.run(main())
