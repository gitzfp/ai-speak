from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.services.textbook_service import TextbookService
from app.db import get_db
from app.models.response import ApiResponse
from typing import List
from pydantic import BaseModel
from app.core import get_current_account

router = APIRouter()

class SentenceListRequest(BaseModel):
    sentence_ids: List[int]

@router.post("/sentences/details", response_model=ApiResponse)
def get_sentences_details(
    sentence_list: SentenceListRequest,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    获取指定句子列表的详细信息（不需要book_id）
    用于任务跟读等场景，通过selected_sentence_ids获取句子信息
    """
    try:
        from app.db.textbook_entities import LessonSentenceEntity
        
        # 查询所有指定ID的句子
        sentences = db.query(LessonSentenceEntity).filter(
            LessonSentenceEntity.id.in_(sentence_list.sentence_ids)
        ).all()
        
        # 构建返回数据，保持原始顺序
        sentence_dict = {s.id: s for s in sentences}
        ordered_sentences = []
        
        for sid in sentence_list.sentence_ids:
            if sid in sentence_dict:
                sentence = sentence_dict[sid]
                # 查询用户的学习进度（如果需要）
                from app.db.study_entities import StudyProgressReport
                progress = db.query(StudyProgressReport).filter(
                    StudyProgressReport.user_id == account_id,
                    StudyProgressReport.content_id == sentence.id,
                    StudyProgressReport.content_type == 4  # 句子类型
                ).order_by(StudyProgressReport.create_time.desc()).first()
                
                ordered_sentences.append({
                    "id": sentence.id,
                    "sentence": sentence.english,  # 使用 english 字段
                    "english": sentence.english,   # 保留 english 字段以兼容
                    "chinese": sentence.chinese,
                    "audio_url": sentence.audio_url,
                    "audio_start": sentence.audio_start,
                    "audio_end": sentence.audio_end,
                    "type": getattr(sentence, 'type', None),  # type 可能不存在
                    "order_num": getattr(sentence, 'order_num', None),  # order_num 可能不存在
                    # 添加学习进度信息
                    "error_count": progress.error_count if progress else 0,
                    "points": progress.points if progress else 0
                })
        
        return ApiResponse.success({
            "sentences": ordered_sentences,
            "total": len(ordered_sentences)
        })
        
    except Exception as e:
        return ApiResponse.system_error(str(e))

@router.get("/task/{task_id}/sentences", response_model=ApiResponse)
def get_task_sentences(
    task_id: int,
    db: Session = Depends(get_db),
    account_id: str = Depends(get_current_account)
) -> ApiResponse:
    """
    根据任务ID获取句子信息
    用于任务跟读等场景，直接通过task_id获取相关句子
    """
    try:
        from app.db.task_entities import Task, TaskContent
        from app.db.textbook_entities import LessonSentenceEntity
        from app.db.study_entities import StudyProgressReport, StudyCompletionRecord
        
        # 查询任务是否存在
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return ApiResponse.error("任务不存在")
            
        # 查询任务内容，不过滤content_type，因为句子可能在不同类型的内容中
        task_contents = db.query(TaskContent).filter(
            TaskContent.task_id == task_id
        ).all()
        
        all_sentence_ids = []
        for content in task_contents:
            # 打印调试信息
            print(f"TaskContent ID: {content.id}, content_type: {content.content_type}, selected_sentence_ids: {content.selected_sentence_ids}")
            if content.selected_sentence_ids:
                all_sentence_ids.extend(content.selected_sentence_ids)
        
        if not all_sentence_ids:
            # 打印更多调试信息
            print(f"No sentence IDs found for task {task_id}")
            print(f"Task type: {task.task_type.value if task.task_type else None}")
            print(f"Total task contents: {len(task_contents)}")
            
            return ApiResponse.success({
                "sentences": [],
                "total": 0,
                "task_info": {
                    "task_id": task_id,
                    "title": task.title,
                    "task_type": task.task_type.value if task.task_type else None
                },
                "debug_info": {
                    "task_contents_count": len(task_contents),
                    "task_contents": [
                        {
                            "id": c.id,
                            "content_type": c.content_type,
                            "selected_sentence_ids": c.selected_sentence_ids,
                            "selected_word_ids": c.selected_word_ids
                        } for c in task_contents
                    ]
                }
            })
        
        # 查询所有句子
        sentences = db.query(LessonSentenceEntity).filter(
            LessonSentenceEntity.id.in_(all_sentence_ids)
        ).all()
        
        # 构建返回数据，保持原始顺序
        sentence_dict = {s.id: s for s in sentences}
        ordered_sentences = []
        
        for sid in all_sentence_ids:
            if sid in sentence_dict:
                sentence = sentence_dict[sid]
                # 查询用户的学习进度
                # 先尝试从StudyCompletionRecord查询
                print(f"[DEBUG] 查询进度 - 用户: {account_id}, 任务: {task_id}, 句子: {sentence.id}")
                completion_record = db.query(StudyCompletionRecord).filter(
                    StudyCompletionRecord.user_id == account_id,
                    StudyCompletionRecord.task_id == task_id,
                    StudyCompletionRecord.type == 1,  # type=1 对应句子
                    StudyCompletionRecord.status == 0
                ).order_by(StudyCompletionRecord.create_time.desc()).first()
                
                if completion_record:
                    print(f"[DEBUG] 找到StudyCompletionRecord记录，ID: {completion_record.id}")
                else:
                    print(f"[DEBUG] 未找到StudyCompletionRecord记录")
                
                progress = None
                if completion_record and completion_record.progress_data:
                    # 解析progress_data找到对应句子的进度
                    import json
                    progress_data = json.loads(completion_record.progress_data)
                    for item in progress_data:
                        if item.get('content_id') == sentence.id:
                            progress = type('Progress', (), {
                                'error_count': item.get('error_count', 0),
                                'points': item.get('points', 0)
                            })()
                            break
                
                # 如果没找到，再从StudyProgressReport查询（兼容旧数据）
                if not progress:
                    progress = db.query(StudyProgressReport).filter(
                        StudyProgressReport.user_id == account_id,
                        StudyProgressReport.content_id == sentence.id,
                        StudyProgressReport.content_type == 4  # 句子类型
                    ).order_by(StudyProgressReport.create_time.desc()).first()
                
                ordered_sentences.append({
                    "id": sentence.id,
                    "sentence": sentence.english,  # 使用 english 字段
                    "english": sentence.english,   # 保留 english 字段以兼容
                    "chinese": sentence.chinese,
                    "audio_url": sentence.audio_url,
                    "audio_start": sentence.audio_start,
                    "audio_end": sentence.audio_end,
                    "type": getattr(sentence, 'type', None),  # type 可能不存在
                    "order_num": getattr(sentence, 'order_num', None),  # order_num 可能不存在
                    # 添加学习进度信息
                    "error_count": progress.error_count if progress else 0,
                    "points": progress.points if progress else 0
                })
        
        return ApiResponse.success({
            "sentences": ordered_sentences,
            "total": len(ordered_sentences),
            "task_info": {
                "task_id": task_id,
                "title": task.title,
                "task_type": task.task_type.value if task.task_type else None
            },
            "debug_info": {
                "found_sentence_ids": all_sentence_ids,
                "task_contents_count": len(task_contents)
            }
        })
        
    except Exception as e:
        return ApiResponse.system_error(str(e))