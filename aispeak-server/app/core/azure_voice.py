import json

import azure.cognitiveservices.speech as speechsdk

from app.config import Config
from app.core.logging import logging
from app.core.language import *

key = Config.AZURE_KEY
region = Config.AZURE_REGIEON

speech_config = speechsdk.SpeechConfig(subscription="C3ZsFIdkGAowcnbFVCrURBeBj7wFiyXpYHpf8sJITtRNkMVW5r1RJQQJ99BCACYeBjFXJ3w3AAAYACOGmvxn", region="eastus")

speech_synthesizer = speechsdk.SpeechSynthesizer(
    speech_config=speech_config, audio_config=None
)

def speech_default(content: str, output_path_str: str, language: str, voice_name: str|None = None):
    """默认语音合成  还是用不了，因为每次还要实例化 speech_synthesizer"""
    speech_config.speech_recognition_language = language
    speech_config.speech_synthesis_language = language
    # 如果voice_name是空，则设置对应语言的默认角色
    if not voice_name:
        voice_name = get_azure_language_default_role(language)
    speech_config.speech_synthesis_voice_name = voice_name
    speech_synthesis_result = speech_synthesizer.speak_text_async(content).get()
    audio_data_stream = speechsdk.AudioDataStream(speech_synthesis_result)

    if (
        speech_synthesis_result.reason
        == speechsdk.ResultReason.SynthesizingAudioCompleted
    ):
        audio_data_stream.save_to_wav_file(output_path_str)
    elif (
        speech_synthesis_result.reason
        == speechsdk.ResultReason.Canceled
    ):
        cancellation_details = speech_synthesis_result.cancellation_details
        logging.error(
            "Speech synthesis canceled: {}".format(cancellation_details.reason)
        )
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            if cancellation_details.error_details:
                logging.error(
                    "Error details: {}".format(cancellation_details.error_details)
                )
                logging.error(
                    "Did you set the speech resource key and region values?"
                )
        raise Exception("语音合成失败")
    else:
        logging.error(
            "Speech synthesis failed: {}".format(speech_synthesis_result.reason)
        )
        raise Exception("语音合成失败")

def speech_by_ssml(
    content: str,
    output_path_str: str,
    voice_name: str,
    speech_rate: str,
    feel: str,
    targetLang: str,
):
    """可定制的文本转语音，支持中英混合"""
    # 检测内容是否包含中文
    def contains_chinese(text):
        return any('\u4e00' <= char <= '\u9fff' for char in text)
    
    has_chinese = contains_chinese(content)
    logging.info(f"Content contains Chinese: {has_chinese}")
    voice_name = "zh-CN-XiaoxiaoNeural"  # 或者使用 "zh-CN-XiaoyiNeural"
    
    # 如果包含中文，强制使用中文语音角色
    if has_chinese:
        # 使用中文女声
        targetLang = "zh-CN"
        logging.info(f"Switched to Chinese voice: {voice_name}")
    
    processed_content = process_mixed_language_content(content, targetLang)
    
    ssml = f"""<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="{targetLang}">
    <voice name="{voice_name}">
        <prosody rate="{speech_rate}">
            {processed_content}
        </prosody>
    </voice>
</speak>"""
    
    logging.info(f"Using voice_name: {voice_name}")
    logging.info(f"Target language: {targetLang}")
    logging.info(f"Original content: {content}")
    logging.info(f"Processed content: {processed_content}")
    logging.info(f"Generated SSML: {ssml}")
    
    try:
        speech_config = speechsdk.SpeechConfig(subscription=key, region=region)
        speech_config.speech_synthesis_voice_name = voice_name
        
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)
        
        speech_synthesis_result = synthesizer.speak_ssml_async(ssml).get()
        audio_data_stream = speechsdk.AudioDataStream(speech_synthesis_result)

        if speech_synthesis_result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            logging.info("Starting audio synthesis...")
            audio_data_stream.save_to_wav_file(output_path_str)
            logging.info(f"Audio synthesis completed and saved to {output_path_str}")
            
            import os
            if os.path.exists(output_path_str):
                file_size = os.path.getsize(output_path_str)
                logging.info(f"Generated audio file size: {file_size} bytes")
                if file_size == 0:
                    raise Exception("Generated audio file is empty")
            else:
                raise Exception("Audio file was not generated")
        else:
            handle_synthesis_error(speech_synthesis_result)
    except Exception as e:
        logging.error(f"Speech synthesis failed: {str(e)}")
        logging.error(f"SSML content: {ssml}")
        raise Exception(f"语音合成失败: {str(e)}")

def process_mixed_language_content(content: str, target_lang: str) -> str:
    """处理混合语言内容，为中英文添加适当的语言标签"""
    import re
    
    # 使用正则表达式匹配英文内容（包括标点符号和空格）
    english_pattern = r'[A-Za-z][A-Za-z\s\.,\?\!\'\"]+[A-Za-z\.,\?\!\'\"]'
    
    # 将内容按英文分段
    parts = re.split(f'({english_pattern})', content)
    
    processed_parts = []
    for part in parts:
        if re.match(english_pattern, part):
            # 英文内容
            processed_parts.append(f'<lang xml:lang="en-US">{part}</lang>')
        elif part.strip():  # 确保非空内容
            # 非英文内容（主要是中文）
            processed_parts.append(f'<lang xml:lang="zh-CN">{part}</lang>')
    
    processed_content = ''.join(processed_parts)
    logging.info(f"Original content: {content}")
    logging.info(f"Processed content: {processed_content}")
    return processed_content

def handle_synthesis_error(speech_synthesis_result):
    """处理语音合成错误"""
    logging.error(f"Speech synthesis failed: {speech_synthesis_result.reason}")
    
    if speech_synthesis_result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = speech_synthesis_result.cancellation_details
        logging.error(f"Speech synthesis canceled: {cancellation_details.reason}")
        
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            if cancellation_details.error_details:
                logging.error(f"Error details: {cancellation_details.error_details}")
                logging.error("Did you set the speech resource key and region values?")
    
    raise Exception("语音合成失败")

def speech_pronunciation(content: str, speech_path: str, language: str = "en-US"):
    """发音评估"""
    audio_config = speechsdk.audio.AudioConfig(filename=speech_path)
    speech_config.speech_recognition_language = language
    speech_recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config, audio_config=audio_config
    )
    # "{\"referenceText\":\"good morning\",\"gradingSystem\":\"HundredMark\",\"granularity\":\"Phoneme\",\"EnableMiscue\":true}" 通过dict生成json
    json_param = {
        "referenceText": content,
        "gradingSystem": "HundredMark",
        "granularity": "Word",
        "EnableMiscue": True,
    }
    pronunciation_assessment_config = speechsdk.PronunciationAssessmentConfig(
        json_string=json.dumps(json_param)
    )

    pronunciation_assessment_config.apply_to(speech_recognizer)

    speech_recognition_result = speech_recognizer.recognize_once()
    pronunciation_assessment_result = speechsdk.PronunciationAssessmentResult(
        speech_recognition_result
    )
    result = {
        "accuracy_score": pronunciation_assessment_result.accuracy_score,
        "fluency_score": pronunciation_assessment_result.fluency_score,
        "completeness_score": pronunciation_assessment_result.completeness_score,
        "pronunciation_score": pronunciation_assessment_result.pronunciation_score,
    }
    original_words = pronunciation_assessment_result.words
    result_words = []
    # 循环words，获取每个单词的发音评估结果
    for word in original_words:
        result_words.append(
            {
                "word": word.word,
                "accuracy_score": word.accuracy_score,
                "error_type": word.error_type,
            }
        )
    result["words"] = result_words
    return result


# 单词发单评估，可以精确到每一个音素
def word_speech_pronunciation(word: str, speech_path: str, language: str = "en-US"):
    audio_config = speechsdk.audio.AudioConfig(filename=speech_path)
    speech_config.speech_recognition_language = language
    speech_recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config, audio_config=audio_config
    )
    # "{\"referenceText\":\"good morning\",\"gradingSystem\":\"HundredMark\",\"granularity\":\"Phoneme\",\"EnableMiscue\":true}" 通过dict生成json
    json_param = {
        "referenceText": word,
        "gradingSystem": "HundredMark",
        "granularity": "Phoneme",
        "EnableMiscue": True,
        "phonemeAlphabet": "IPA",
    }
    pronunciation_assessment_config = speechsdk.PronunciationAssessmentConfig(
        json_string=json.dumps(json_param)
    )

    pronunciation_assessment_config.apply_to(speech_recognizer)

    speech_recognition_result = speech_recognizer.recognize_once()
    pronunciation_assessment_result = speechsdk.PronunciationAssessmentResult(
        speech_recognition_result
    )
    result = {
        "accuracy_score": pronunciation_assessment_result.accuracy_score,
        "fluency_score": pronunciation_assessment_result.fluency_score,
        "completeness_score": pronunciation_assessment_result.completeness_score,
        "pronunciation_score": pronunciation_assessment_result.pronunciation_score,
    }
    original_words = pronunciation_assessment_result.words
    result_words = []
    # 循环words，获取每个单词的发音评估结果
    for word in original_words:

        # 获取音素评估结果
        phonemes = word.phonemes
        phonemes_list = []
        for phoneme in phonemes:
            phonemes_list.append(
                {
                    "phoneme": phoneme.phoneme,
                    "accuracy_score": phoneme.accuracy_score
                }
            )

        result_words.append(
            {
                "word": word.word,
                "accuracy_score": word.accuracy_score,
                "error_type": word.error_type,
                "phonemes": phonemes_list,
            }
        )
    result["words"] = result_words
    return result


# 语音转文字
def speech_translate_text(speech_path: str, language: str) -> str:
    """语音转文字，支持中英文识别"""
    # 始终包含中文和英文支持
    languages = ["zh-CN", "en-US"]
    
    # 如果指定的语言不在列表中且不是中英文，将其添加到首位
    if language not in languages:
        languages.insert(0, language)
    
    logging.info(f"Speech recognition languages: {languages}")
    
    try:
        auto_detect_source_language_config = (
            speechsdk.languageconfig.AutoDetectSourceLanguageConfig(languages=languages)
        )
        audio_config = speechsdk.audio.AudioConfig(filename=speech_path)

        speech_recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            auto_detect_source_language_config=auto_detect_source_language_config,
            audio_config=audio_config,
        )

        logging.info(f"Starting speech recognition for file: {speech_path}")
        speech_recognition_result = speech_recognizer.recognize_once_async().get()

        if speech_recognition_result.reason == speechsdk.ResultReason.RecognizedSpeech:
            recognized_text = speech_recognition_result.text
            detected_language = speech_recognition_result.properties.get(
                speechsdk.PropertyId.SpeechServiceConnection_RecoLanguage
            )
            logging.info(f"Recognized text: {recognized_text}")
            logging.info(f"Detected language: {detected_language}")
            return recognized_text
            
        elif speech_recognition_result.reason == speechsdk.ResultReason.NoMatch:
            no_match_detail = speech_recognition_result.no_match_details
            logging.error(f"No speech could be recognized: {no_match_detail.reason}")
            logging.error(f"Detail: {no_match_detail.details}")
            raise Exception("未能识别语音内容")
            
        elif speech_recognition_result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = speech_recognition_result.cancellation_details
            logging.error(f"Speech Recognition canceled: {cancellation_details.reason}")
            
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                logging.error(f"Error details: {cancellation_details.error_details}")
                logging.error("Please check speech resource key and region values")
            raise Exception("语音识别被取消")
            
    except Exception as e:
        logging.error(f"Speech recognition failed: {str(e)}")
        logging.error(f"Speech file path: {speech_path}")
        logging.error(f"Target language: {language}")
        raise Exception(f"语音识别失败: {str(e)}")

    return ""


# 获取支持的语音列表，组装成对象数组进行返回
def get_voice_list():
    """通过synthesizer.getVoicesAsync()方法来获取所有支持的语音列表"""
    speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)
    voice_list = speech_synthesizer.get_voices_async().get()
    # 迭代list，组装成对象数组进行返回
    voice_vo_list = []
    for voice in voice_list.voices:
        voice_vo_list.append(
            {
                "gender": voice.gender.value,
                "locale": voice.locale,
                "local_name": voice.local_name,
                "name": voice.name,
                "short_name": voice.short_name,
                "voice_type": {
                    "name": voice.voice_type.name,
                    "value": voice.voice_type.value,
                },
                "style_list": voice.style_list,
            }
        )
    return voice_vo_list


# 获取支持的语音列表，组装成对象数组进行返回
def get_voice_list():
    """通过synthesizer.getVoicesAsync()方法来获取所有支持的语音列表"""
    speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)
    voice_list = speech_synthesizer.get_voices_async().get()
    # 迭代list，组装成对象数组进行返回
    voice_vo_list = []
    for voice in voice_list.voices:
        voice_vo_list.append(
            {
                "gender": voice.gender.value,
                "locale": voice.locale,
                "local_name": voice.local_name,
                "name": voice.name,
                "short_name": voice.short_name,
                "voice_type": {
                    "name": voice.voice_type.name,
                    "value": voice.voice_type.value,
                },
                "style_list": voice.style_list,
            }
        )
    return voice_vo_list

voice_vo_list = get_voice_list()
# 获取azure语音配置，并且按 locale 分组
azure_voice_configs = voice_vo_list

azure_voice_configs_group = {}
for azure_voice_config in azure_voice_configs:
    if azure_voice_config["locale"] not in azure_voice_configs_group:
        azure_voice_configs_group[azure_voice_config["locale"]] = []
    azure_voice_configs_group[azure_voice_config["locale"]].append(azure_voice_config)

def get_azure_voice_role_by_short_name(short_name: str):
    """根据short_name获取语音配置"""
    local = short_name.rsplit('-', 1)[0]
    azure_voice_configs = azure_voice_configs_group[local]
    # 迭代azure_voice_configs，找到item中short_name与settings.speech_role_name相同的item，取local_name
    result = None
    for item in azure_voice_configs:
        if item["short_name"] == short_name:
            return item
    # 抛出异常
    raise Exception("未找到对应的语音配置")    