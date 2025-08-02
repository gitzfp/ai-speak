import json
import os
import re
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

import requests
from sqlalchemy.orm import Session

from app.config import Config
from app.core import auth, azure_voice
from app.core.azure_voice import *
from app.core.exceptions import UserAccessDeniedException
from app.core.utils import *
from app.db.sys_entities import *
from app.db.account_entities import *
from app.db.chat_entities import *
from app.models.account_models import *
from app.core.logging import logging
from app.ai import chat_ai
from app.ai.models import *
from app.core.logging import logging
from app.core.language import *
from app.core.language import *


MESSAGE_SYSTEM = "SYSTEM"


class AccountService:
    def __init__(self, db: Session):
        self.db = db

    def visitor_login(self, fingerprint: str, client_host: str, user_agent: str = None):
        """先检查此ip下是否有用户，如果有，直接返回ip下的用户，如果没有，就生成新的访客"""
        visitor = (
            self.db.query(AccountEntity).filter_by(
                fingerprint=fingerprint).first()
        )
        if not visitor:
            visitor = AccountEntity(
                id=f"visitor_{short_uuid()}",
                fingerprint=fingerprint,
                client_host=client_host,
                user_agent=user_agent,
            )
            self.db.add(visitor)
            self.db.commit()

        self.__check_and_init_default_settings(visitor.id)
        return {"token": auth.init_token(visitor.id, visitor.id)}
    
    def wechat_login(self, dto: WechatLoginDTO, client_host: str):
        """微信登录，调用 code2Session 接口"""
        # 微信小程序配置
        APPID = "wx553ddbc4589aaaa9"
        APPSECRET = "3a64d34ebbf6e3c12de02e7450bf58ab"

        # 调用微信接口获取 openid 和 session_key
        url = f"https://api.weixin.qq.com/sns/jscode2session?appid={APPID}&secret={APPSECRET}&js_code={dto.code}&grant_type=authorization_code"
        response = requests.get(url)
        data = response.json()

        # 检查微信接口返回的错误
        if "errcode" in data:
            raise Exception(f"微信登录失败: {data['errmsg']}")

        openid = data["openid"]
        session_key = data["session_key"]

        # 查找或创建用户
        account = self.db.query(AccountEntity).filter_by(
            openid=openid).first()
        if not account:
            # 自动注册新用户
            account = AccountEntity(
                id=f"user_{short_uuid()}",
                openid=openid,
                session_key=session_key,  # 保存 session_key
                client_host=client_host
            )
            self.db.add(account)
            self.db.commit()
        else:
            # 更新 session_key
            account.session_key = session_key
            self.db.commit()

        self.__check_and_init_default_settings(account.id)
        # 生成自定义登录态（如 JWT）
        token = auth.init_token(account.id, account.id)
        return {"token": token, "openid": openid}
    
    def phone_login(self, dto: PhoneLoginDTO, client_host: str, is_register: bool = False):
        """手机登录，支持验证码和密码登录"""
        logging.debug(f"开始处理手机登录请求，手机号：{dto.phone_number[-4:]}，注册模式：{is_register}")

        # 检查手机号是否为空和格式
        if not dto.phone_number:
            logging.error("手机号为空")
            raise Exception("手机号不能为空")

        phone_valid = re.match(r'^1[3-9]\d{9}$', dto.phone_number)
        logging.debug(f"手机号格式验证结果：{phone_valid is not None}")
        if not phone_valid:
            logging.error(f"无效手机号格式：{dto.phone_number}")
            raise Exception("手机号格式不正确")

        # 查找用户
        logging.debug(f"查询用户：{dto.phone_number[-4:]}")
        account = self.db.query(AccountEntity).filter_by(
            phone_number=dto.phone_number).first()
        logging.info(f"用户存在性检查结果：{account is not None}")

        if account and is_register:
            logging.warning(f"用户已存在，手机号：{dto.phone_number[-4:]}")
            raise UserAccessDeniedException("用户已存在，请直接登录")
        
        if not account and not is_register:
            logging.warning(f"用户不存在，手机号：{dto.phone_number[-4:]}")
            raise UserAccessDeniedException("用户不存在，请先注册")

        # 如果用户不存在，自动注册
        if not account and is_register:
            logging.info("进入注册流程")
            if not dto.password:
                logging.error("注册时未提供密码")
                raise Exception("新用户必须设置密码")

            pwd_length_valid = len(dto.password) >= 6
            logging.debug(f"密码长度验证结果：{pwd_length_valid}")
            if not pwd_length_valid:
                logging.error(f"密码长度不足：{len(dto.password)}")
                raise Exception("密码长度不能少于6位")

            logging.info(f"创建新用户：{dto.phone_number[-4:]}")
            account = AccountEntity(
                id=f"user_{short_uuid()}",
                user_name=dto.user_name,
                phone_number=dto.phone_number,
                password=generate_password_hash(dto.password),
                client_host=client_host
            )
            self.db.add(account)
            self.db.commit()
            logging.debug(f"用户创建成功，ID：{account.id}")
        else:
            # 验证密码或验证码
            if dto.password:
                logging.debug("尝试密码登录")
                pwd_valid = check_password_hash(account.password, dto.password)
                logging.info(f"密码验证结果：{pwd_valid}")
                if not pwd_valid:
                    logging.warning(f"密码错误：{dto.phone_number[-4:]}")
                    raise Exception("密码错误")
            elif dto.code:
                logging.debug("尝试验证码登录")
                code_valid = self.verify_sms_code(dto.phone_number, dto.code)
                logging.info(f"验证码验证结果：{code_valid}")
                if not code_valid:
                    logging.warning(f"验证码错误：{dto.code}")
                    raise Exception("验证码错误")
            else:
                logging.error("未提供任何认证方式")
                raise Exception("必须提供密码或验证码")

        self.__check_and_init_default_settings(account.id)
        logging.debug(f"初始化用户设置完成：{account.id}")

        token = auth.init_token(account.id, account.id)
        logging.info(f"生成登录令牌成功，用户ID：{account.id}")

        return {"token": token, "user_id": account.id}
    def verify_sms_code(self, phone_number: str, code: str) -> bool:
        """验证短信验证码（示例逻辑）"""
        # 这里可以实现验证码的验证逻辑，比如从 Redis 中获取验证码并比对
        # 示例：假设验证码是 "123456"
        return code == "123456"

    def collect(self, dto: CollectDTO, account_id: str):
        """用户收藏，根据类型保存到AccountCollectEntity，保存前先做检查，如果已经存在，则不需要再进行保存"""

        # 先检查是否已经存在，如果已经存在，就不需要再进行保存
        if dto.message_id:
            collect = (
                self.db.query(AccountCollectEntity)
                .filter_by(account_id=account_id, message_id=dto.message_id)
                .first()
            )
        elif dto.word_id:
            collect = (
                self.db.query(AccountCollectEntity)
                .filter_by(account_id=account_id, word_id=dto.word_id)
                .first()
            )
        else:
            collect = (
                self.db.query(AccountCollectEntity)
                .filter_by(account_id=account_id, type=dto.type, content=dto.content)
                .first()
            )

        if collect:
            if collect.deleted == 1:
                collect.deleted = 0
                collect.update_time = datetime.datetime.now()

            self.db.commit()
            return

        # 查询出session
        if dto.message_id:
            message = (
                self.db.query(MessageEntity)
                .filter_by(id=dto.message_id, account_id=account_id)
                .first()
            )
            content = message.content
        else:
            content = dto.content

        # 获得翻译
        source_language = self.get_account_source_language(account_id)
        translation = chat_ai.invoke_translate(
            TranslateParams(target_language=source_language, content=content)
        )

        # 如果存在 word_id，则 type 为 NEW_WORD
        if dto.type:
            type = dto.type
        # 如果没有任何符号且只有单独一个单词，则 type 为 WORD，否则为 SENTENCE
        elif re.match(r"^[a-zA-Z]+$", content) and len(content.split(" ")) == 1:
            type = "WORD"
        else:
            type = "SENTENCE"

        account_collect = AccountCollectEntity(
            account_id=account_id,
            type=type,
            message_id=dto.message_id,
            word_id=dto.word_id,
            book_id=dto.book_id,
            content=content,
            translation=translation,
        )
        self.db.add(account_collect)

        self.db.commit()
        return

    def get_account_info(self, account_id: str):
        """获取用户的今日聊天次数与总次数返回"""
        account = self.db.query(AccountEntity).filter_by(
                id=account_id).first()
        if not account:
            raise Exception("User not found")
        logging.info(f"账号account_id: {account_id}, user_name: {account.user_name}")
        result = {
            "account_id": account_id,
            "user_name": account.user_name,
            "user_role": account.user_role or "student",  # 添加用户角色
            "nickname": account.user_name,  # nickname 与 user_name 相同
            "phone_number": account.phone_number,  # 添加手机号
            "today_chat_count": self.get_user_current_day_system_message_count(
                account_id
            ),
            "total_chat_count": self.get_user_system_message_count(account_id),
        }
        account_settings = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        target_language = account_settings.target_language
        result["target_language"] = target_language
        result["target_language_label"] = get_label_by_language(
            target_language)
        return result

    def get_collect(self, dto: CollectDTO, account_id: str):
        """获取用户是否已经收藏的数据"""
        if dto.message_id:
            collect = (
                self.db.query(AccountCollectEntity)
                .filter_by(account_id=account_id, message_id=dto.message_id)
                .first()
            )
        else:
            collect = (
                self.db.query(AccountCollectEntity)
                .filter_by(account_id=account_id, type=dto.type, content=dto.content)
                .first()
            )
        if collect and collect.deleted == 0:
            return {"is_collect": True}
        else:
            return {"is_collect": False}

    def cancel_collect(self, dto: CollectDTO, account_id: str):
        """取消收藏"""
        if dto.message_id:
            collect = (
                self.db.query(AccountCollectEntity)
                .filter_by(account_id=account_id, message_id=dto.message_id)
                .first()
            )
        elif dto.word_id:
            collect = (
                self.db.query(AccountCollectEntity)
                .filter_by(account_id=account_id, word_id=dto.word_id)
                .first()
            )
        else:
            collect = (
                self.db.query(AccountCollectEntity)
                .filter_by(account_id=account_id, type=dto.type, content=dto.content)
                .first()
            )
        if collect:
            collect.deleted = 1
            collect.update_time = datetime.datetime.now()
            self.db.commit()
        return

    def get_collects(self, type: str, page: int, page_size: int, account_id: str):
        """获取用户收藏的列表信息"""
        query = (
            self.db.query(AccountCollectEntity)
            .filter_by(account_id=account_id, type=type, deleted=0)
            .order_by(AccountCollectEntity.create_time.desc())
        )
        collects = query.offset((page - 1) * page_size).limit(page_size).all()
        # 获取总数
        total = query.count()
        result = []
        for collect in collects:
            result.append(
                {
                    "id": collect.id,
                    "word_id": collect.word_id,
                    "type": collect.type,
                    "content": collect.content,
                    "translation": collect.translation,
                    "message_id": collect.message_id,
                    "create_time": date_to_str(collect.create_time),
                }
            )
        return {"total": total, "list": result}

    def get_settings(self, account_id: str):
        """获取AccountSettingsEntity中key 为 auto_playing_voice, playing_voice_speed, auto_text_shadow, auto_pronunciation的配置"""
        settings = (
            self.db.query(AccountSettingsEntity)
            .filter(AccountSettingsEntity.account_id == account_id)
            .first()
        )
        if not settings:
            settings = self.db.query(AccountSettingsEntity).first()
            # 如果还是没有找到设置，使用默认值
            if not settings:
                settings = type('DefaultSettings', (object,), {
                    "auto_playing_voice": False,
                    "playing_voice_speed": 1.0,
                    "auto_text_shadow": False,
                    "auto_pronunciation": False,
                    "speech_role_name": None,
                    "target_language": None
                })()

        # 设置 vo dict，里面的值与settings中的值一致
        vo = {
            "auto_playing_voice": settings.auto_playing_voice,
            "playing_voice_speed": settings.playing_voice_speed,
            "auto_text_shadow": settings.auto_text_shadow,
            "auto_pronunciation": settings.auto_pronunciation,
            "speech_role_name": settings.speech_role_name,
            "target_language": settings.target_language,
        }

        # 如果存在 speech_role_name，则从azure_voice_configs_group获取对应值，取local_name
        if settings.speech_role_name:
            voice_role_config = get_azure_voice_role_by_short_name(
                settings.speech_role_name
            )
            vo["speech_role_name_label"] = voice_role_config["local_name"]
        return vo

    def save_settings(self, dto: AccountSettingsDTO, account_id: str):
        """保存用户设置"""
        account_settings = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )

        # 如果 account_settings 为空，插入默认配置
        if not account_settings:
            speech_role_name = get_azure_language_default_role(Config.DEFAULT_TARGET_LANGUAGE)
            account_settings = AccountSettingsEntity(
                account_id=account_id,
                auto_playing_voice=True,
                playing_voice_speed=1.0,
                auto_text_shadow=False,
                auto_pronunciation=True,
                speech_role_name=speech_role_name,
                target_language=Config.DEFAULT_TARGET_LANGUAGE,
                source_language=Config.DEFAULT_SOURCE_LANGUAGE  # Ensure source_language is set
            )
            self.db.add(account_settings)
            self.db.commit()

        print("保存单词save_settings", account_settings, dto)
        if dto.auto_playing_voice is not None:
            account_settings.auto_playing_voice = dto.auto_playing_voice
        if dto.playing_voice_speed is not None:
            account_settings.playing_voice_speed = dto.playing_voice_speed
        if dto.auto_text_shadow is not None:
            account_settings.auto_text_shadow = dto.auto_text_shadow
        if dto.auto_pronunciation is not None:
            account_settings.auto_pronunciation = dto.auto_pronunciation
        if dto.speech_role_name is not None:
            account_settings.speech_role_name = dto.speech_role_name
        if dto.target_language is not None:
            if dto.target_language != account_settings.target_language:
                # 获取语言对应的语音角色
                speech_role_name = get_azure_language_default_role(dto.target_language)
                account_settings.speech_role_name = speech_role_name
            account_settings.target_language = dto.target_language
        self.db.commit()
        
        # 保存身份信息到 account 表
        account = self.db.query(AccountEntity).filter_by(id=account_id).first()
        if account:
            if dto.user_name is not None:
                account.user_name = dto.user_name
            self.db.commit()

    def update_role_setting(self, dto: UpdateRoleDTO, account_id: str):
        """选择角色"""
        # 先删除 account_settings 中的数据
        account_settings_entity = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        # dto 转json格式保存
        account_settings_entity.role_setting = json.dumps(dto.model_dump())
        self.db.commit()
        return {
            "account_id": account_id,
            "role_name": dto.role_name,
            "role_style": dto.style,
        }

    def get_role_setting(self, account_id: str):
        """获取用户当前设置的角色"""
        # 先删除 account_settings 中的数据
        account_settings_entity = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        role_setting = get_azure_voice_role_by_short_name(
            account_settings_entity.speech_role_name)
        # 补充头像，根据性别补充头像
        if role_setting['gender'] == 1:
            role_setting['role_image'] = 'http://qiniu.prejade.com/1597936949107363840/talkie/images/en-US_JennyNeural.png'
        else:
            role_setting['role_image'] = 'http://qiniu.prejade.com/1597936949107363840/talkie/images/en-US_Guy.png'
        return {
            "role_setting": role_setting
        }

    def get_account_source_language(self, account_id: str):
        """获取用户的学习语言"""
        settings = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        if settings:
            return settings.source_language
        else:
            return Config.DEFAULT_SOURCE_LANGUAGE

    def get_account_target_language(self, account_id: str):
        """获取用户的目标语言"""
        settings = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        if settings:
            return settings.target_language
        else:
            return Config.DEFAULT_TARGET_LANGUAGE

    def get_user_current_day_system_message_count(self, account_id: str):
        """获取用户当天系统消息次数"""
        # 获取当天0点的时间进行筛选
        today = day_to_str(datetime.datetime.now())
        return (
            self.db.query(MessageEntity)
            .filter_by(account_id=account_id, type=MessageType.SYSTEM.value)
            .filter(MessageEntity.create_time >= today)
            .count()
        )

    def get_user_system_message_count(self, account_id: str):
        """获取用户当天系统消息次数"""
        return (
            self.db.query(MessageEntity)
            .filter_by(account_id=account_id, type=MessageType.SYSTEM.value)
            .count()
        )

    def __check_and_init_default_settings(self, account_id: str):
        """检查并初始化用户的默认设置"""
        # 先检查是否已经存在，如果已经存在，就不需要再进行保存
        settings = (
            self.db.query(AccountSettingsEntity)
            .filter_by(account_id=account_id)
            .first()
        )
        if not settings:
            speech_role_name = get_azure_language_default_role(
                Config.DEFAULT_TARGET_LANGUAGE
            )
            settings = AccountSettingsEntity(
                account_id=account_id,
                target_language=Config.DEFAULT_TARGET_LANGUAGE,
                source_language=Config.DEFAULT_SOURCE_LANGUAGE,
                speech_role_name=speech_role_name,
            )
            self.db.add(settings)
            self.db.commit()

    def get_wx_access_token(self):
        """获取微信 access_token"""
        url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={Config.WECHAT_APP_ID}&secret={Config.WX_APP_SECRET}"
        response = requests.get(url)
        data = response.json()

        if "errcode" in data:
            raise Exception(f"获取access_token失败: {data['errmsg']}")

        return data["access_token"]


    def get_wx_jsapi_ticket(self):
        """获取微信 JSAPI_TICKET"""
        access_token = self.get_wx_access_token()
        url = f"https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token={access_token}&type=jsapi"
        response = requests.get(url)
        data = response.json()

        if data["errcode"] != 0:
            raise Exception(f"获取jsapi_ticket失败: {data['errmsg']}")

        return data["ticket"]

    def set_user_role(self, dto, account_id: str):
        """设置用户身份角色"""
        account = self.db.query(AccountEntity).filter_by(id=account_id).first()
        if not account:
            raise Exception("用户不存在")
        
        account.user_role = dto.role
        self.db.commit()
        
        return {
            "account_id": account_id,
            "role": dto.role
        }

    def get_user_role(self, account_id: str):
        """获取用户身份角色"""
        account = self.db.query(AccountEntity).filter_by(id=account_id).first()
        if not account:
            return {"role": None}
        
        return {
            "role": account.user_role
        }
