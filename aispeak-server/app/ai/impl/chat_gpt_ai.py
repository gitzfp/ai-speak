from typing import List, Dict
import json
from app.ai.interfaces import *
from app.ai.models import *
from app.core.logging import logging


class ChatGPTAI(ChatAI):
    """本地直接调用openai的接口"""

    def __init__(self, api_key: str, base_url: str = None, model: str = None):
        from openai import OpenAI
        import httpx

        # Create custom httpx client if base_url is provided
        self.client = OpenAI(
            base_url=base_url,
            api_key=api_key
        )
        self.model = model

    def invoke_greet(self, params: GreetParams) -> str:
        messages = [
            {"role": "system", "content": f"你需要使用标识为 {params.language} 的语言来打个招呼，10字左右."}
        ]

        invoke_dto = MessageInvokeDTO(messages=messages)
        return self._original_invoke_chat(invoke_dto)

    def topic_invoke_greet(self, params: TopicGreetParams) -> str:
        messages = [
            {
                "role": "system",
                "content": f"场景：{params.prompt}",
            }
        ]

        invoke_dto = MessageInvokeDTO(messages=messages)
        return self._original_invoke_chat(invoke_dto)

    def invoke_message(self, dto: MessageParams) -> AIMessageResult:
        """与AI自由聊天"""
        language = dto.language
        system_message = (
            'The reply must be json, and format of json is {"message":"result of message","message_style":"must be one of the options '
            + f"{json.dumps(dto.styles, ensure_ascii=False)}"
            + '"}, '
            + f"The 'message_style'  within the square brackets . "
            + f"I want you to act as an {language} speaking partner and improver, your name is {dto.name}. "
            + f"No matter what language I speak to you, you need to reply me in {language}. "
            + f"I hope you will ask me a question from time to time in your reply "
        )

        messages = [{"role": "system", "content": system_message}]
        for message in dto.messages:
            messages.append(message)
        resp = self._original_invoke_chat_json(MessageInvokeDTO(messages=messages))
        result = AIMessageResult(
            message=resp["message"], message_style=resp["message_style"]
        )
        return result

    
    def lesson_invoke_message(self, dto: AITopicMessageParams) -> AITopicMessageResult:
        """与AI进行课程相关的聊天"""
        logging.info("Starting lesson_invoke_message")
        logging.info(f"Input params: {dto.__dict__}")
        
        completed_targets_info = "\n".join(map(str, dto.completed_targets))
        targets_info = "\n".join(map(str, dto.task_target_list))
        logging.info(f"targets_info: {targets_info}")
        
        system_message = (
            f"Lesson: {dto.prompt}\n"
            f"Completed Targets:\n{completed_targets_info}\n"
            f"Learning Targets:\n{targets_info}\n"
            "'The reply must be JSON format, Rules:\n"
            "1. Track each learning target achievement, showing which have already been met.\n"
            "2. For the current user input, if the target is achieved, include in new_achieved_target:\n"
            '   {"user_say": "actual user input", "target_id": "achieved target ID", "target_name": "achieved target name (info_en of target)"}\n'
            '3. If target is achieved:\n'
            '   - Include achievement in new_achieved_target\n'
            '   - Give brief positive feedback\n'
            '   - Immediately create a simple, engaging scenario for the next target\n'
            '   - Use one of these approaches for the next target:\n'
            '     * Simple role-play (e.g., "Now imagine you are...")\n'
            '     * Easy question (e.g., "What do you think about...")\n'
            '     * Real-life situation (e.g., "Let\'s say you...")\n'
            '4. If no targets are achieved:\n'
            '   - Set new_achieved_target to None\n'
            '   - If attempts < 3:\n'
            '     * Continue guiding with simpler approaches\n'
            '     * Use encouraging feedback and hints\n'
            '   - If attempts >= 3:\n'
            '     * Show the correct answer\n'
            '     * Move to next target with simple scenario\n'
            'Response Format:\n'
            '{\n'
            '  "message": "your response",\n'
            '  "lesson_completed": "true/false",\n'
            '  "new_achieved_target": {\n'
            '    "user_say": "user input",\n'
            '    "target_id": "id of target"\n'
            '    "target_name": "info_en of target"\n'
            '  },\n'
            f'  "message_style": "{json.dumps(dto.styles, ensure_ascii=False)}"\n'
            '}\n\n'
            f"Additional Instructions:\n"
            f"- Respond only in {dto.language}\n"
        )
        
        logging.info(f"System message: {system_message}")
        
        messages = [{"role": "system", "content": system_message}]
        for message in dto.messages:
            messages.append(message)
            
        logging.info(f"All messages being sent to AI: {json.dumps(messages, ensure_ascii=False)}")
        
        resp = self._original_invoke_chat_json(MessageInvokeDTO(messages=messages))
        logging.info(f"AI response: {json.dumps(resp, ensure_ascii=False)}")
        
        message_style = None
        if "message_style" in resp:
            if isinstance(resp["message_style"], list) and resp["message_style"]:
                message_style = resp["message_style"][0]
            else:
                message_style = resp["message_style"]

        completed = False
        if "lesson_completed" in resp:
            completed = resp["lesson_completed"] == "true"
            
        new_achieved_target = None
        # 确保如果没有达成目标，new_achieved_target 返回 None
        if "new_achieved_target" in resp and resp["new_achieved_target"]:
            new_achieved_target = resp["new_achieved_target"]
        else:
            new_achieved_target = None  # 设置为 None 如果没有达成新目标
            
        result = AITopicMessageResult(
            message=resp["message"], 
            message_style=message_style, 
            completed=completed,
            new_achieved_target=new_achieved_target,
        )
        
        logging.info(f"Final result: {result.__dict__}")
        return result 

    def topic_invoke_message(self, dto: AITopicMessageParams) -> AITopicMessageResult:
        """与AI自由聊天"""
        language = dto.language
        system_message = (
            f"Topic:{dto.prompt}.Please chat with me in this topic. If this conversation can be concluded or if the user wishes to end it, please return topic_completed=true."
            + 'The reply must be json, and format of json is {"message":"result of message","topic_completed":"Whether this topic has been completd.","message_style":"must be one of the options '
            + f"{json.dumps(dto.styles, ensure_ascii=False)}"
            + '"}, '
            + f"The 'message_style'  within the square brackets . "
            + f"I want you to act as an {language} speaking partner and improver, your name is {dto.name}. "
            + f"No matter what language I speak to you, you need to reply me in {language}. "
            + f"I hope you will ask me a question from time to time in your reply "
        )

        messages = [{"role": "system", "content": system_message}]
        for message in dto.messages:
            messages.append(message)
        resp = self._original_invoke_chat_json(MessageInvokeDTO(messages=messages))
        message_style = None
        # resp是否有message_style
        if "message_style" in resp:
            message_style = resp["message_style"]

        completed = False
        # resp是否有topic_completed
        if "topic_completed" in resp:
            completed = resp["topic_completed"] == "true"
        result = AITopicMessageResult(
            message=resp["message"], message_style=message_style, completed=completed
        )
        return result

    def topic_invoke_complete(
        self, dto: AITopicCompleteParams
    ) -> AITopicCompleteResult:
        """场景 结束"""
        system_content = "下面是一场对话\n"
        for message in dto.messages:
            if message.role.lower() == "system":
                system_content = system_content + f"AI: {message.content}\n"
            elif message.role.lower() == "account":
                system_content = system_content + f"用户: {message.content}\n"

        system_content = system_content + "下面是用户对话中需要实现的目标\n"  
        for target in dto.targets:
            system_content = system_content + f"{target}\n"     

        system_content = (
            system_content
           + "现在你需要计算出 <用户:> 所说的所有话中使用了多少单词数量（仅需要数字结果，重复单词不需要计算），对应后面的目标实现了多少个（仅需要数字结果），对用户的表达给出评分（满分100分，仅需要数字结果），还要给出300字以内的建议（包含中文讲解与英文示例），返回结果只需要有json格式,使用单词量放在words字段，目标实现数量放在targets字段，评分放在score字段，建议放在suggestion字段，不需要再额外的任何信息，记住，只需要统计<用户:>下的内容\n"
        )
        json_result = self._original_invoke_chat_json(
            MessageInvokeDTO(messages=[{"role": "system", "content": system_content}])
        )
        logging.info(f"计算结果:{json_result}")
        # 组装成AITopicCompleteResult返回
        return AITopicCompleteResult(
            targets=json_result["targets"],
            score=json_result["score"],
            words=json_result["words"],
            suggestion=json_result["suggestion"],
        )


    def invoke_translate(self, dto: TranslateParams) -> str:
        """翻译"""
        system_message = f"下面是段文本：'{dto.content}'   仅输出翻译成 {dto.target_language} 后的内容"
        invoke_dto = MessageInvokeDTO(
            messages=[{"role": "system", "content": system_message}]
        )
        resp = self._original_invoke_chat(invoke_dto)
        return resp

    def invoke_grammar_analysis(
        self, params: GrammarAnalysisParams
    ) -> AIGrammarAnalysisResult:
        messages = [
            {
                "role": "user",
                "content": (
                    f"请检查以下内容是否存在语法错误（不需要检查符号的使用）。"
                    f"如果存在错误，请用中文返回这段内容中的语法错误，并提供一句推荐示例。"
                    f"请确保返回的数据格式为 JSON，且无任何转义字符，"
                    f"可以直接被程序正常序列化。"
                    f"请将语法是否错误放在属性 'isCorrect' 中，"
                    f"错误原因放在 'errorReason' 中，"
                    f"修正后的正确示例放在 'correctContent' 中，"
                    f"推荐示例放在 'better' 中。"
                    f"正确示例与推荐示例的语言要使用 {params.language}，"
                    f"错误原因使用中文。"
                    f"提供内容是: {params.content}"
                ),
            }
        ]
        invoke_dto = MessageInvokeDTO(messages=messages)
        result_data = self._original_invoke_chat(invoke_dto)
        if result_data:
            try:
                # 直接解析 JSON
                result_json = json.loads(result_data)
                return AIGrammarAnalysisResult(
                    is_correct=result_json["isCorrect"],
                    error_reason=result_json["errorReason"],
                    correct_content=result_json["correctContent"],
                    better=result_json["better"],
                )
            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse JSON response: {e}")
                logging.error(f"Response data: {result_data}")
                raise
        else:
            logging.error("Received empty response from AI service")
            raise ValueError("Empty response from AI service")

    def invoke_prompt_sentence(self, params: PromptSentenceParams) -> str:
        """ """
        logging.info(f"request_params:{params}")
        system_content = "下面是一场对话\n"
        for message in reversed(params.messages):
            if message["role"].lower() == "user":
                system_content = system_content + f"用户: {message['content']}\n"
            else:
                system_content = system_content + f"AI: {message['content']}\n"
        system_content = (
            system_content
            + "现在你需要做为一个用户来回答下一句话，不可以有提供帮助与提问问题的意思，语言使用"
            + params.language
            + ", 直接输出内容前面不可以加 User:"
        )
        invoke_dto = MessageInvokeDTO(
            messages=[{"role": "user", "content": system_content}]
        )
        resp = self._original_invoke_chat(invoke_dto)
        return resp

    def invoke_word_detail(self, params: WordDetailParams) -> AIWordDetailResult:
        logging.info(f"request_dto:{params}")
        messages = [
            {
                "role": "user",
                "content": f'提供一个单词，只需要简洁快速的用中文返回这个单词的音标与翻译，要求数据格式为json，音标放在属性phonetic中，音标的前后要加上"/"，翻译放在translation中， 这个单词是"{params.word}"',
            }
        ]
        
        # 添加系统消息以确保返回 JSON 格式
        system_message = {
            "role": "system",
            "content": "请只返回 JSON 格式的响应，格式如下：\n"
                       '{\n'
                       '  "phonetic": "音标",\n'
                       '  "translation": "翻译"\n'
                       '}\n'
                       '确保没有其他文本或格式。'
        }
        
        messages.insert(0, system_message)  # 将系统消息插入到消息列表的开头
        invoke_dto = MessageInvokeDTO(messages=messages)
        result_data = self._original_invoke_chat(invoke_dto)

        # Log the result_data for debugging
        logging.info(f"Result data from invoke_word_detail: '{result_data}'")  # Log with quotes to see whitespace

        if not result_data or result_data.strip() == "":
            logging.error("Received empty or whitespace-only response from AI service")
            raise ValueError("Empty response from AI service")

        try:
            # Attempt to parse JSON
            result_json = json.loads(result_data.strip())  # Strip whitespace
            return AIWordDetailResult(
                phonetic=result_json["phonetic"], translation=result_json["translation"]
            )
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse JSON response: {e}")
            logging.error(f"Response data: '{result_data}'")  # Log with quotes for clarity
            raise

    def _original_invoke_chat_json(self, dto: MessageInvokeDTO):
        logging.info(f"request_dto:{dto}")
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=dto.temperature,
            messages=dto.messages,
            max_tokens=dto.max_tokens,
            response_format={"type": "json_object"},
        )
        logging.info(f"response:{resp}")
        result = resp.choices[0].message.content
        return json.loads(result)

    def _original_invoke_chat(self, dto: MessageInvokeDTO):
        logging.info(f"dto:{dto}")
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=dto.temperature,
            messages=dto.messages,
            max_tokens=dto.max_tokens,
        )
        logging.info(f"response:{resp}")
        result = resp.choices[0].message.content
        # 去掉俩边的 " " ' '
        result = result.strip('"')
        result = result.strip("'")
        # 去掉json的转义字符
        result = result.replace('\\"', '"').replace("\\n", "\n").replace("\\", "")
        return result
