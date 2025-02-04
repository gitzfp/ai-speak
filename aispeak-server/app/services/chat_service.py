from sqlalchemy.orm import Session
from pydub import AudioSegment
import os
import logging

from app.core.utils import *
from app.db.account_entities import *
from app.db.chat_entities import *
from app.db.sys_entities import *
from app.db.topic_entities import *
from app.models.account_models import *
from app.models.chat_models import *
from app.services.account_service import AccountService
from app.services.topic_service import TopicService

from app.ai.models import *
from app.ai import chat_ai
from app.core.azure_voice import *
from app.core.exceptions import *

MESSAGE_SYSTEM = "SYSTEM"

# 读取data下 language_demo_map.json 生成对应字典
language_demo_map = {}
with open("data/language_demo_map.json", "r") as f:
    language_demo_map = json.load(f)


class ChatService:
    """聊天核心类，会调用account_service与topic_service, 反向不可以引用"""

    def __init__(self, db: Session):
        self.db = db
        self.account_service = AccountService(db)
        self.topic_service = TopicService(db)

    def get_settings_languages_example(self, language: str, account_id: str):
        """获取语言下的示例"""
        # 获取语言下的示例
        # 语言没有国家  所以去掉后面的国家后缀
        language = language.split("-")[0]
        return language_demo_map[language]

    def get_default_session(self, account_id: str):
        """获取用户的默认会话, 如果没有默认会话，就创建一个"""
        session = (
            self.db.query(MessageSessionEntity)
            .filter_by(
                account_id=account_id,
                is_default=1,
            )
            .order_by(MessageSessionEntity.create_time.desc())
            .first()
        )
        if not session:
            # 为用户创建一个默认的session
            return self.create_session(
                account_id,
            )
        return self.__convert_session_model(session)

    def get_session(self, session_id: str, account_id: str):
        """获取会话详情"""
        session = self.__get_and_check_session(session_id, account_id)
        result = self.__convert_session_model(session)

        # 获取会话下的消息
        result["messages"] = self.get_session_messages(session_id, account_id, 1, 100)
        return result

    def get_session_greeting(self, session_id: str, account_id: str, task_targets: list = None):
        """需要会话没有任何消息时，需要返回的问候语"""
        try:
            logging.info(f"Starting get_session_greeting for session_id: {session_id}, account_id: {account_id}")
            
            # 检查session是否存在
            session = self.__get_and_check_session(session_id, account_id)
            logging.info(f"Session found: {session.type}")

            # 检查会话下是否已经有了消息
            self.__check_has_messages(session_id, account_id)
            logging.info("No existing messages found")

            # 区分自由聊天与话题聊天
            result = None
            if (session.type == "CHAT"):
                language = self.account_service.get_account_target_language(account_id)
                logging.info(f"CHAT type, using language: {language}")
                result = chat_ai.invoke_greet(GreetParams(language=language))
                
            elif (session.type == "TOPIC"):
                logging.info("TOPIC type, getting topic_greet_params")
                topic_greet_params = self.topic_service.get_topic_greet_params(session.id)
                logging.info(f"Topic greet params: {topic_greet_params.__dict__}")
                result = chat_ai.topic_invoke_greet(topic_greet_params)
                
            elif (session.type == "LESSON"):
                logging.info("LESSON type, getting lesson session")
                # 构建课程相关的问候参数
                targets_str = ""
                first_target = None
                
                if task_targets and len(task_targets) > 0:
                    logging.info(f"Processing task_targets: {task_targets}")
                    targets_str = ",\n".join([f"{target['info_en']}" for target in task_targets])
                    first_target = task_targets[0]
                    logging.info(f"First target: {first_target}")
                else:
                    logging.warning("No task_targets provided or empty list")
                
                first_target_text = first_target['info_en'] if first_target else "No target specified"
                
                topic_greet_params = TopicGreetParams(
                    language=self.account_service.get_account_target_language(account_id),
                    prompt=f"""你是一位充满创意的英语老师，正在给一位中国学生上一节有趣的英语课。

本节课的学习目标是：
{targets_str}

请按以下顺序回复：
1. 用简单的中文以老师的身份热情地向学生问好，称呼要用"你"，展现亲切感
2. 用中文清晰列出本节课的具体学习目标，用"让你"而不是"让大家"
3. 用简单的英语创造一个有趣的情境，引导学生说出第一个目标句子：{first_target_text}
   - 创造一个你和学生之间的互动场景
   - 或设计一个你带着学生玩的小游戏
   - 让学生在轻松的对话中自然说出目标句子

注意事项：
1. 全程使用"你"而不是"你们"，让每个学生感受到专属关注
2. 使用简单易懂的英语(no more than 60 words)表达
3. 给予个性化的鼓励和引导
4. 通过一对一的提问让学生更投入
5. 创造轻松愉快的学习氛围
6. 目标句子要自然地融入对话中
7. 先示范给学生听，再邀请学生模仿
8. 回答不要有旁白信息，全程对同一个学生说话

示例引导方式：
- "假设我是商店店员，你来询问商品价格"
- "我来扮演服务员，你来点一份你最喜欢的食物"
- "让我们玩个游戏，我迷路了，你来告诉我路线"
- "想象你是你最喜欢的明星，向我介绍一下你自己"
- "我这里有一个神秘物品，你来猜猜是什么"
"""
                )
                
                logging.info(f"Created topic_greet_params: {topic_greet_params.__dict__}")
                result = chat_ai.topic_invoke_greet(topic_greet_params)

            logging.info(f"AI response result: {result}")

            sequence = self.__get_message_sequence()
            logging.info(f"Got message sequence: {sequence}")

            add_message = self.__add_system_message(session_id, account_id, result, "", sequence + 1)
            logging.info("Added system message")
            
            self.db.add(add_message)
            self.db.commit()
            self.db.flush()
            logging.info("Committed to database")
            
            self.__refresh_session_message_count(session_id)
            logging.info("Refreshed session message count")
            
            return self.initMessageResult(add_message)
            
        except Exception as e:
            logging.error(f"Error in get_session_greeting: {str(e)}", exc_info=True)
            raise e

    def send_session_message(self, session_id: str, dto: ChatDTO, account_id: str):
        """发送消息"""
        self.__validate_dto(dto)
        session = self.__get_and_check_session(session_id, account_id)
        account_settings = self.__get_account_settings(account_id)
        send_message_content = self.__get_send_message_content(dto, account_settings)
        sequence = self.__get_message_sequence()
        add_account_message = self.__add_account_message(
            account_id, session_id, send_message_content, sequence + 1, dto.file_name
        )
        send_message_id = add_account_message.id
        messages = self.__get_message_history(session_id, send_message_content)
        invoke_result, completed, achieved_targets, all_targets = self.__invoke_ai(session, messages, dto)
        add_system_message = self.__add_system_message(
            session_id, account_id, invoke_result.message, invoke_result.message_style, sequence + 2
        )
        self.__save_messages(add_account_message, add_system_message)
        self.__refresh_session_message_count(session_id)
        return self.__build_response(invoke_result, add_system_message, session_id, send_message_id, send_message_content, completed, achieved_targets, all_targets)

    def __validate_dto(self, dto: ChatDTO):
        if not dto.file_name and not dto.message:
            raise Exception("Message or file_name is required")

    def __get_account_settings(self, account_id: str):
        return self.db.query(AccountSettingsEntity).filter_by(account_id=account_id).first()

    def __get_send_message_content(self, dto: ChatDTO, account_settings: AccountSettingsEntity):
        if dto.message:
            return dto.message
        return speech_translate_text(voice_file_get_path(dto.file_name), account_settings.target_language)

    def __get_message_history(self, session_id: str, send_message_content: str):
        message_history = (
            self.db.query(MessageEntity)
            .filter(MessageEntity.session_id == session_id)
            .order_by(MessageEntity.create_time.desc())
            .slice(0, 5)
            .all()
        )
        messages = [{"role": "assistant" if message.type == MessageType.SYSTEM.value else "user", "content": message.content} for message in reversed(message_history)]
        messages.append({"role": "user", "content": send_message_content})
        return messages

    def __invoke_ai(self, session: MessageSessionEntity, messages: list, dto: ChatDTO):
        completed = False
        achieved_targets = None
        all_targets = None
        if session.type == 'CHAT':
            invoke_result = self.__invoke_chat_ai(session, messages)
        elif session.type == 'TOPIC':
            invoke_result = self.__invoke_topic_ai(session, messages)
            completed = invoke_result.completed
        elif session.type == 'LESSON':
            invoke_result, completed, achieved_targets, all_targets = self.__invoke_lesson_ai(session, messages, dto)
        else:
            raise ValueError("未知的会话类型")
        return invoke_result, completed, achieved_targets, all_targets

    def __invoke_chat_ai(self, session: MessageSessionEntity, messages: list):
        account_settings = self.__get_account_settings(session.account_id)
        speech_role_name = account_settings.speech_role_name
        styles = []
        if speech_role_name:
            voice_role_config = get_azure_voice_role_by_short_name(speech_role_name)
            styles = voice_role_config["style_list"]
        message_params = MessageParams(
            language=account_settings.target_language, name=Config.AI_NAME, messages=messages, styles=styles
        )
        return chat_ai.invoke_message(message_params)

    def __invoke_topic_ai(self, session: MessageSessionEntity, messages: list):
        topic_message_params = self.topic_service.get_topic_message_params(session.id)
        topic_message_params.messages = messages
        return chat_ai.topic_invoke_message(topic_message_params)

    def __invoke_lesson_ai(self, session: MessageSessionEntity, messages: list, dto: ChatDTO):
        logging.info(f"dto: {dto.__dict__}")
        lesson_message_params = self.topic_service.get_lesson_message_params(session.id)
        lesson_message_params.messages = messages
        invoke_result = chat_ai.lesson_invoke_message(lesson_message_params)
        completed = invoke_result.completed
        new_achieved_target = invoke_result.new_achieved_target
        all_targets = lesson_message_params.task_target_list

        achieved_targets = json.loads(session.achieved_targets or '[]')
        # 将new_achieved_target添加到session的archieved_targets字段中
        if new_achieved_target:
            achieved_targets.append(new_achieved_target)  # 添加新的目标
            session.achieved_targets = json.dumps(achieved_targets)  # 更新为JSON字符串

        unique_achieved_target_ids = set(target['target_id'] for target in achieved_targets)
        logging.info(
            f"unique_achieved_target_ids: {unique_achieved_target_ids}, len(all_targets): {len(all_targets)}")
        if len(unique_achieved_target_ids) >= len(all_targets):
            session.completed = 1

        logging.info(
            f"completed: {completed} achieved_targets: {achieved_targets}, all_targets: {all_targets}")
        return invoke_result, completed, achieved_targets, all_targets

    def __save_messages(self, add_account_message: MessageEntity, add_system_message: MessageEntity):
        self.db.add(add_account_message)
        self.db.add(add_system_message)
        self.db.commit()
        self.db.flush()

    def __build_response(self, invoke_result, add_system_message, session_id, send_message_id, send_message_content, completed, achieved_targets, all_targets):
        return {
            "data": invoke_result.message,
            "id": add_system_message.id,
            "session_id": session_id,
            "send_message_id": send_message_id,
            "send_message_content": send_message_content,
            "create_time": date_to_str(add_system_message.create_time),
            "completed": completed,
            "achieved_targets": achieved_targets,
            "all_targets": all_targets
        }

    def message_practice(
        self, message_id: str, dto: MessagePracticeDTO, account_id: str
    ):
        """用户发送过的消息进行练习"""
        message = self.db.query(MessageEntity).filter_by(id=message_id).first()
        if not message:
            raise Exception("Message not found")
        target_language = self.account_service.get_account_target_language(account_id)
        return word_speech_pronunciation(
            message.content, voice_file_get_path(dto.file_name), target_language
        )

    def get_word(self, dto: WordDetailDTO, account_id: str):
        """通过AI获取单词的音标与翻译"""
        # 先查询数据库中是否有数据，如果有数据就直接返回
        word = self.db.query(SysCacheEntity).filter_by(key=f"word_{dto.word}").first()
        if word:
            return json.loads(word.value)
        invoke_result = chat_ai.invoke_word_detail(WordDetailParams(word=dto.word))
        result = invoke_result.__dict__
        result["original"] = dto.word
        # result 转换成字符串进行保存
        sys_cache = SysCacheEntity(key=f"word_{dto.word}", value=json.dumps(result))
        self.db.add(sys_cache)
        self.db.commit()
        return result

    def grammar_analysis(self, dto: GrammarDTO, account_id: str):
        message = self.db.query(MessageEntity).filter_by(id=dto.message_id).first()
        # 检查AccountGrammarEntity是否已经存在数据，如果存在就直接返回已经保存的数据
        message_grammar = (
            self.db.query(MessageGrammarEntity)
            .filter_by(
                message_id=dto.message_id, file_name=message.file_name, type="GRAMMAR"
            )
            .first()
        )
        if message_grammar:
            return json.loads(message_grammar.result)

        content = message.content
        target_language = self.account_service.get_account_target_language(account_id)
        result = chat_ai.invoke_grammar_analysis(
            GrammarAnalysisParams(language=target_language, content=content)
        ).__dict__
        result["original"] = content
        # result是json格式的字符串，把result 解析成json返回
        # 结果以字符串方式保存到数据库中
        message_grammar = MessageGrammarEntity(
            account_id=account_id,
            session_id=message.session_id,
            message_id=dto.message_id,
            file_name=message.file_name,
            type="GRAMMAR",
            result=json.dumps(result),
        )
        self.db.add(message_grammar)
        self.db.commit()
        return result

    def word_practice(self, dto: WordPracticeDTO, account_id: str):
        """单词发音练习"""
        target_language = self.account_service.get_account_target_language(account_id)
        return word_speech_pronunciation(
            dto.word, voice_file_get_path(dto.file_name), language=target_language
        )

    def pronunciation(self, dto: PronunciationDTO, account_id: str):
        """发单评估"""
        # 先根据message_id查询出message
        message = self.db.query(MessageEntity).filter_by(id=dto.message_id).first()
        if not message:
            raise UserAccessDeniedException("message不存在")
        file_name = message.file_name
        if not file_name:
            raise UserAccessDeniedException("message中没有语音文件")

        # 检查AccountGrammarEntity是否已经存在数据，如果存在就直接返回已经保存的数据
        grammar = (
            self.db.query(MessageGrammarEntity)
            .filter_by(
                message_id=dto.message_id,
                file_name=message.file_name,
                type="PRONUNCIATION",
            )
            .first()
        )
        if grammar:
            return json.loads(grammar.result)

        file_full_path = voice_file_get_path(file_name)
        # 检查文件是否存在
        if not os.path.exists(file_full_path):
            raise UserAccessDeniedException("语音文件不存在")
        target_language = self.account_service.get_account_target_language(account_id)
        # 进行评分
        try:
            session = (
                self.db.query(MessageSessionEntity)
                .filter_by(id=message.session_id)
                .first()
            )
            pronunciation_result = word_speech_pronunciation(
                message.content, file_full_path, language=target_language
            )
            logging.info("end")
        except Exception as e:
            # 输出错误信息
            logging.exception(
                f"file_full_path:{file_full_path}\n content:{message.content}", e
            )
            raise UserAccessDeniedException("语音评估失败")
        # 结果以字符串方式保存到数据库中
        message_grammar = MessageGrammarEntity(
            account_id=account_id,
            session_id=message.session_id,
            message_id=dto.message_id,
            file_name=message.file_name,
            type="PRONUNCIATION",
            result=json.dumps(pronunciation_result),
        )
        self.db.add(message_grammar)
        self.db.commit()
        return pronunciation_result

    def message_speech_content(self, dto: TransformContentSpeechDTO, account_id: str):
        """如果file表中已经存在文件的保存，则直接返回，如果不存在，生成一份并保存"""
        # 根据convert_language与speech_role_name，speech_rate,speech_style来生成唯一标识,用于生成缓存的key
        # 获取用户语言
        account_settings = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        target_language = account_settings.target_language
        set_speech_role_name = None
        set_speech_role_style = ""
        if dto.speech_role_name:
            set_speech_role_name = dto.speech_role_name
            if dto.speech_role_style:
                set_speech_role_style = dto.speech_role_style
        elif account_settings.speech_role_name:
            set_speech_role_name = account_settings.speech_role_name

        set_speech_rate = "1.0"
        if dto.speech_rate:
            set_speech_rate = dto.speech_rate
        elif account_settings.speech_role_speed:
            set_speech_rate = account_settings.speech_role_speed

        content_md5 = hashlib.md5(dto.content.encode("utf-8")).hexdigest()
        key = f"content_{set_speech_role_name}_{set_speech_role_style}_{set_speech_rate}_{content_md5}"
        file_module = "SPEECH_CONTENT_VOICE"
        # 对key进行md5加密
        file_detail = (
            self.db.query(FileDetail)
            .filter_by(module=file_module, module_id=key, deleted=0)
            .first()
        )
        if file_detail:
            # 检查文件是否存在，只有文件存在情况下才进行返回
            if os.path.exists(voice_file_get_path(file_detail.file_name)):
                return {"file": file_detail.file_name}
            else:
                # 如果文件不存在，就删除数据库中的记录，重新生成
                file_detail.deleted = 1
                self.db.commit()

        # 调用speech组件，将speech_content转换成语音文件
        filename = f"{key}.wav"
        full_file_name = voice_file_get_path(filename)

        if set_speech_rate != "1.0" or set_speech_role_style:
            speech_by_ssml(
                dto.content,
                full_file_name,
                voice_name=set_speech_role_name,
                speech_rate=set_speech_rate,
                feel=set_speech_role_style,
                targetLang=target_language,
            )
        else:
            speech_default(
                dto.content, full_file_name, target_language, set_speech_role_name
            )

        file_detail = FileDetail(
            id=short_uuid(),
            file_path=filename,
            module=file_module,
            file_name=filename,
            module_id=key,
            file_ext="wav",
            created_by=account_id,
        )
        self.db.add(file_detail)
        self.db.commit()
        self.db.flush()
        return {"file": file_detail.file_name}

    def message_speech(self, message_id: str, account_id: str):
        """文字转语音"""
        # 如果没有，就生成一个
        message = self.db.query(MessageEntity).filter_by(id=message_id).first()

        # 获取用户的语音配置
        account_settings = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        target_language = account_settings.target_language
        voice_name = account_settings.speech_role_name
        speech_speed = account_settings.playing_voice_speed
        filename = f"message_{message.id}_{voice_name}_{speech_speed}.wav"
        full_file_name = voice_file_get_path(filename)
        voice_role_style = ""
        if message.style:
            voice_role_style = message.style
        speech_by_ssml(
            message.content,
            full_file_name,
            voice_name=voice_name,
            speech_rate=speech_speed,
            feel=voice_role_style,
            targetLang=target_language,
        )

        file_detail = FileDetail(
            id=short_uuid(),
            file_path=filename,
            module="SPEECH_VOICE",
            file_name=filename,
            module_id=message_id,
            file_ext="wav",
            created_by=account_id,
        )
        self.db.add(file_detail)
        message.file_name = filename
        self.db.commit()
        return {"file": file_detail.file_name}

    def create_session(self, account_id: str):
        """为用户创建新的session，并且设置成默认的session"""
        session = MessageSessionEntity(
            id=f"session_{short_uuid()}", account_id=account_id, is_default=1
        )
        self.db.add(session)
        self.db.commit()
        return self.__convert_session_model(session)

    def get_session_messages(
        self, session_id: str, account_id: str, page: int, page_size: int
    ):
        query = (
            self.db.query(MessageEntity)
            .filter_by(session_id=session_id, account_id=account_id, deleted=0)
            .filter(
                MessageEntity.type.in_(
                    [MessageType.ACCOUNT.value, MessageType.SYSTEM.value]
                )
            )
        )
        messages = (
            query.order_by(MessageEntity.sequence.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        # 获取总数
        total = query.count()
        result = []
        for message in reversed(messages):
            result.append(self.initMessageResult(message))

        # 如果是我的消息，则检查是否进行过语音分析，如果进行过就加载分析结果
        self.initOwnerMessagePronunciation(result)
        return {"total": total, "list": result}

    def prompt_sentence(self, dto: PromptDTO, account_id: str):
        """提示用户下一句话"""
        # 查询出session中最后5条消息
        messageEntities = (
            self.db.query(MessageEntity)
            .filter_by(session_id=dto.session_id)
            .order_by(MessageEntity.create_time.desc())
            .limit(5)
            .all()
        )
        messages = []
        for message in messageEntities:
            messages.append(self.initMessageResult(message))

        target_language = self.account_service.get_account_target_language(account_id)
        return chat_ai.invoke_prompt_sentence(
            PromptSentenceParams(language=target_language, messages=messages)
        )

    def delete_all_session_messages(self, session_id: str, account_id: str):
        """把所有的消息都调整为deleted=1"""
        messages = (
            self.db.query(MessageEntity)
            .filter_by(session_id=session_id, account_id=account_id, deleted=0)
            .all()
        )
        for message in messages:
            message.deleted = 1
        self.db.commit()
        return True

    def transform_text(self, session_id: str, dto: VoiceTranslateDTO, account_id: str):
        """语音解析成文字"""
        input_file = voice_file_get_path(dto.file_name)
        logging.info(f"Starting voice transformation for file: {input_file}")
        
        try:
            # 检查输入文件是否存在
            if not os.path.exists(input_file):
                raise Exception(f"输入文件不存在: {input_file}")
                
            # 检查文件大小
            file_size = os.path.getsize(input_file)
            logging.info(f"Input file size: {file_size} bytes")
            if file_size == 0:
                raise Exception("输入文件为空")
            
            # 转换音频格式
            temp_wav = self._convert_to_standard_wav(input_file)
            logging.info(f"Audio converted successfully to: {temp_wav}")
            
            # 使用转换后的文件进行识别
            result = speech_translate_text(
                temp_wav,
                self.account_service.get_account_target_language(account_id),
            )
            
            # 删除临时文件
            if os.path.exists(temp_wav):
                os.remove(temp_wav)
                logging.info("Temporary WAV file removed")
                
            return result
            
        except Exception as e:
            logging.error(f"语音识别失败: {str(e)}, file: {input_file}")
            raise Exception(f"语音识别失败: {str(e)}")

    def _convert_to_standard_wav(self, input_file: str) -> str:
        """转换音频为标准 WAV 格式"""
        try:
            # 生成临时文件路径
            temp_path = input_file + ".standard.wav"
            logging.info(f"Converting audio file: {input_file} to {temp_path}")
            
            # 检查输入文件格式
            try:
                audio = AudioSegment.from_file(input_file)
                logging.info(f"Original audio properties - Channels: {audio.channels}, "
                           f"Frame rate: {audio.frame_rate}, "
                           f"Sample width: {audio.sample_width}")
            except Exception as e:
                logging.error(f"Failed to load audio file: {str(e)}")
                # 尝试指定格式加载
                audio = AudioSegment.from_file(input_file, format="wav")
                logging.info("Successfully loaded file with explicit WAV format")
            
            # 设置标准参数
            try:
                # 转换为单声道
                if audio.channels > 1:
                    audio = audio.set_channels(1)
                    logging.info("Converted to mono")
                
                # 设置采样率
                if audio.frame_rate != 16000:
                    audio = audio.set_frame_rate(16000)
                    logging.info("Set frame rate to 16kHz")
                
                # 设置采样位深
                if audio.sample_width != 2:
                    audio = audio.set_sample_width(2)
                    logging.info("Set sample width to 16-bit")
                
                # 导出为标准 WAV 格式
                audio.export(
                    temp_path,
                    format="wav",
                    parameters=["-acodec", "pcm_s16le"]
                )
                
                # 验证输出文件
                if not os.path.exists(temp_path):
                    raise Exception("输出文件未生成")
                
                output_size = os.path.getsize(temp_path)
                logging.info(f"Output file size: {output_size} bytes")
                if output_size == 0:
                    raise Exception("输出文件为空")
                
                return temp_path
                
            except Exception as e:
                logging.error(f"Audio conversion failed: {str(e)}")
                raise Exception(f"音频参数转换失败: {str(e)}")
            
        except Exception as e:
            logging.error(f"音频转换失败: {str(e)}, file: {input_file}")
            raise Exception(f"音频格式转换失败: {str(e)}")

    def delete_latest_session_messages(self, session_id: str, account_id: str):
        """查出最近的一条type为ACCOUNT的数据，并且把create_time之后的数据全部调整为deleted=1，删除成功后需要返回所有删除成功的message的id"""
        message = (
            self.db.query(MessageEntity)
            .filter_by(
                session_id=session_id,
                account_id=account_id,
                type=MessageType.ACCOUNT.value,
                deleted=0,
            )
            .order_by(MessageEntity.create_time.desc())
            .first()
        )
        if message:
            # 获取所有需要删除的数据
            messages = (
                self.db.query(MessageEntity)
                .filter_by(session_id=session_id, deleted=0)
                .filter(MessageEntity.create_time >= message.create_time)
                .all()
            )
            for message in messages:
                message.deleted = 1
            self.db.commit()
            return [message.id for message in messages]
        return []

    def initOwnerMessagePronunciation(self, result):
        # 过滤出所有role为USER的id列表，然后根据id列表获取所有的message_pronunciation，再组装到item中，不存在则组装None
        user_message_ids = [item["id"] for item in result if item["role"] == "USER"]
        message_pronunciations = (
            self.db.query(MessageGrammarEntity)
            .filter(
                MessageGrammarEntity.message_id.in_(user_message_ids),
                MessageGrammarEntity.type == "PRONUNCIATION",
            )
            .all()
        )
        for item in result:
            if item["role"] == "USER":
                item["pronunciation"] = None
                for message_pronunciation in message_pronunciations:
                    if message_pronunciation.message_id == item["id"]:
                        item["pronunciation"] = json.loads(message_pronunciation.result)
                        break

    def translate_source_language(self, dto: TranslateTextDTO, account_id: str):
        """翻译成源语言"""
        source_language = self.account_service.get_account_source_language(account_id)
        result = self.translate_language(dto.text, source_language)
        return result

    def translate_setting_language(self, dto: TranslateTextDTO, account_id: str):
        """翻译成目标语言，也就是用户学习的语言"""
        # 获取用户配置language
        account_settings = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        result = self.translate_language(dto.text, account_settings.target_language)
        return result

    def translate_language(self, content: str, language: str):
        """翻译成参数中配置的语言"""
        result = chat_ai.invoke_translate(
            TranslateParams(target_language=language, content=content)
        )
        return result

    def translate_message(self, message_id: str, account_id: str):
        # 检查是否已经生成了对应翻译，生成的话直接返回
        message_translate = (
            self.db.query(MessageTranslateEntity)
            .filter_by(message_id=message_id)
            .first()
        )
        if message_translate:
            return message_translate.target_text

        message = self.db.query(MessageEntity).filter_by(id=message_id).first()
        content = message.content
        source_language = self.account_service.get_account_source_language(account_id)
        target_language = self.account_service.get_account_target_language(account_id)
        result = self.translate_source_language(
            TranslateTextDTO(text=content), account_id
        )

        account_translate = MessageTranslateEntity(
            account_id=account_id,
            session_id=message.session_id,
            message_id=message_id,
            target_language=target_language,
            source_language=source_language,
            source_text=content,
            target_text=result,
        )
        self.db.add(account_translate)
        self.db.commit()
        return result

    def initMessageResult(self, message: MessageEntity):
        return {
            "role": "ASSISTANT" if message.type == MessageType.SYSTEM.value else "USER",
            "content": message.content,
            "file_name": message.file_name,
            "id": message.id,
            "create_time": date_to_str(message.create_time),
            "session_id": message.session_id,
        }

    def __convert_session_model(self, session: MessageSessionEntity):
        return {
            "id": session.id,
            "type": session.type,
            "message_count": session.message_count,
            "completed": session.completed,
            "create_time": date_to_str(session.create_time),
            "friendly_time": friendly_time(date_to_str(session.create_time)),
        }

    def __add_account_message(
        self, account_id: str, session_id: str, content: str, sequence: int, file_name: str = None
    ):
        """添加用户消息"""
        message = MessageEntity(
            id=short_uuid(),
            account_id=account_id,
            sender=account_id,
            session_id=session_id,
            receiver=MESSAGE_SYSTEM,
            type=MessageType.ACCOUNT.value,
            content=content,
            file_name=file_name,
            length=len(content),
            sequence=sequence,
        )
        return message

    def __add_system_message(
        self, session_id, account_id: str, content: str, style: str, sequence: int
    ) -> MessageEntity:
        """添加系统消息"""
        add_message = MessageEntity(
            id=short_uuid(),
            account_id=account_id,
            sender=MESSAGE_SYSTEM,
            session_id=session_id,
            receiver=account_id,
            type=MessageType.SYSTEM.value,
            content=content,
            style=style,
            length=len(content),
            sequence=sequence,
        )
        return add_message

    def __refresh_session_message_count(self, session_id: str):
        """刷新session的消息数量, 需要排除deleted为1的数据"""
        count = (
            self.db.query(MessageEntity)
            .filter(MessageEntity.session_id == session_id, MessageEntity.deleted == 0)
            .count()
        )
        self.db.query(MessageSessionEntity).filter(
            MessageSessionEntity.id == session_id
        ).update({"message_count": count})
        self.db.commit()
        self.db.flush()

    def __get_and_check_session(
        self, session_id: str, account_id: str
    ) -> MessageSessionEntity:
        """检查会话是否存在"""
        session = (
            self.db.query(MessageSessionEntity)
            .filter_by(id=session_id, account_id=account_id)
            .first()
        )
        if not session:
            raise Exception("Session not found")
        return session

    def __check_has_messages(self, session_id: str, account_id: str):
        """检查会话下是否已经有了消息"""
        messages = (
            self.db.query(MessageEntity)
            .filter_by(session_id=session_id, account_id=account_id, deleted=0)
            .order_by(MessageEntity.create_time.desc())
            .slice(0, 1)
            .all()
        )
        if len(messages) == 1:
            raise Exception("Session has messages")
        
    def __get_message_sequence(self):
        """获取当前最大的sequence"""
        sequence = (
            self.db.query(MessageEntity)
            .filter_by(deleted=0)
            .order_by(MessageEntity.sequence.desc())
            .first()
        )
        if sequence:
            return sequence.sequence
        return 0
