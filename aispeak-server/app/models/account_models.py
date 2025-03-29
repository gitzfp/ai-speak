from enum import Enum
from typing import List, Dict

from pydantic import BaseModel, constr


class MessageType(Enum):
    """消息类型"""

    ACCOUNT = "ACCOUNT"
    SYSTEM = "SYSTEM"


class WechatLoginDTO(BaseModel):
    code: str = None
    state: str = None


class PhoneLoginDTO(BaseModel):
    phone_number: str
    password: str
    user_name: str | None = None 

class VisitorLoginDTO(BaseModel):
    fingerprint: constr(min_length=15)


class ChatDTO(BaseModel):
    """聊天"""

    message: str | None = None
    file_name: str | None = None


class MessagePracticeDTO(BaseModel):
    """句子练习"""

    file_name: str = None


class TransformSpeechDTO(BaseModel):
    """消息转语音"""

    message_id: constr(min_length=5)


class VoiceTranslateDTO(BaseModel):
    """语音转文字"""

    file_name: constr(min_length=1)


class TranslateDTO(BaseModel):
    """翻译"""

    message_id: constr(min_length=1)


class TranslateTextDTO(BaseModel):
    """翻译"""

    text: constr(min_length=1)
    session_id: str = None


class GrammarDTO(BaseModel):
    """分析英文的语法错误"""

    message_id: constr(min_length=1)


class WordDetailDTO(BaseModel):
    """单词详情"""

    word: constr(min_length=1)


class WordPracticeDTO(BaseModel):
    """单词练习"""

    session_id: str = None
    word: constr(min_length=1)
    file_name: constr(min_length=1)


class CollectDTO(BaseModel):
    """收藏单词或者句子"""

    type: constr(min_length=1)
    message_id: str = None
    content: str = None
    word_id: int = None
    # book_id: int = None
    book_id: str = None


class PromptDTO(BaseModel):
    """帮助用户生成提示句"""

    session_id: constr(min_length=1)


class CreateSessionDTO(BaseModel):
    role_name: str


class UpdateRoleDTO(BaseModel):
    language: str
    role_name: str
    style: str = None
    avatar: str
    local_name: str


class UpdateLanguageDTO(BaseModel):
    language: constr(min_length=1)


from typing import Optional
from pydantic import BaseModel, constr, validator

class AccountSettingsDTO(BaseModel):
    target_language: Optional[str] = None
    speech_role_name: Optional[str] = None
    auto_playing_voice: Optional[bool] = None
    playing_voice_speed: Optional[str] = None
    auto_text_shadow: Optional[bool] = None
    auto_pronunciation: Optional[bool] = None

    @validator('auto_playing_voice', 'auto_text_shadow', 'auto_pronunciation', pre=True)
    def convert_to_bool(cls, v):
        if isinstance(v, int):
            return bool(v)
        return v
