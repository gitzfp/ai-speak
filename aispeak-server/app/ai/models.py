from typing import List, Dict, Optional
from dataclasses import dataclass, field


@dataclass
class MessageItemParams:
    role: str
    content: str

@dataclass
class MessageParams:
    language: str
    name: str
    messages: List[Dict]
    styles: List[str]
    temperature: float = 0.5
    max_tokens: int = 300


@dataclass
class TaskTarget:
    id: str
    info_cn: str
    info_en: str
    info_en_audio: str
    match_type: str
    status: str

    def __str__(self):
        return f"Target {self.id}: {self.info_en}"

@dataclass
class AchievedTarget:
    user_say: str
    target_id: str
    info_en: str

    def __str__(self):
        return f"Target {self.target_id}: {self.info_en}"

@dataclass
class AITopicMessageParams:
    language: str
    speech_role_name: str
    prompt: str
    name: str
    messages: List[Dict] = field(default_factory=list)
    styles: List[str] = field(default_factory=list)
    temperature: float = 0.5
    max_tokens: int = 300
    task_target_list: List[TaskTarget] = field(default_factory=list)
    completed_targets: List[AchievedTarget] = field(default_factory=list)


@dataclass
class AITopicCompleteParams:
    language: str
    targets: List[str] = field(default_factory=list)
    messages: List[MessageItemParams] = field(default_factory=list)

@dataclass
class AITopicCompleteResult:
    targets: str
    score: str 
    words: int 
    suggestion: str 

@dataclass
class AIMessageResult:
    message: str
    message_style: str | None


@dataclass
class AITopicMessageResult:
    def __init__(self, message: str, message_style: str, completed: bool, new_achieved_target: dict = None):
        self.message = message
        self.message_style = message_style
        self.completed = completed
        self.new_achieved_target = new_achieved_target

    all_targets: Optional[List[TaskTarget]] = field(default=None)


@dataclass
class TranslateParams:
    target_language: str
    content: str


@dataclass
class GreetParams:
    language: str


@dataclass
class GrammarAnalysisParams:
    language: str
    content: str


@dataclass
class AIGrammarAnalysisResult:
    is_correct: bool
    error_reason: str
    correct_content: str
    better: str


@dataclass
class PromptSentenceParams:
    language: str
    messages: List[Dict]


@dataclass
class WordDetailParams:
    word: str


@dataclass
class AIWordDetailResult:
    phonetic: str
    translation: str


@dataclass
class TopicGreetParams:
    language: str
    prompt: str