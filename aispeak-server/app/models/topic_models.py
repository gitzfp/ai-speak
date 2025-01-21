from enum import Enum
from typing import List, Dict

from pydantic import BaseModel, constr


class CreateSessionDTO(BaseModel):
    topic_id: str

class TopicCreateDTO(BaseModel):
    ai_role: str
    my_role: str
    topic: str


class SentenceInfo(BaseModel):
    info_en: str
    info_cn: str


class LessonSessionCreate(BaseModel):
    lesson_id: str
    sentences: List[SentenceInfo]
