import { SpeechRecognizer, guid} from "./speechrecognizer";
import RecorderModule from "../../webRecorder";
declare global {
    interface Window {
        WebAudioSpeechRecognizer: typeof WebAudioSpeechRecognizer;
    }
}

export default class WebAudioSpeechRecognizer {
    // 类属性类型声明
    params: any;
    recorder: RecorderModule | null = null;
    speechRecognizer: SpeechRecognizer | null = null;
    isCanSendData: boolean = false;
    isNormalEndStop: boolean = false;
    audioData: any[] = [];
    isLog: boolean;
    requestId: string | null = null;

    constructor(params: any, isLog: boolean) {
        this.params = params;
        this.isLog = isLog;
    }

    // 修改数据回调增加空数据检测
    private validateAudioData(data: ArrayBuffer) {
        if (!data || data.byteLength === 0) {
            throw new Error("无效的音频数据");
        }
        
        // 增加采样率校验（16kHz）
        const sampleRate = this.recorder?.sampleRate;
        if (sampleRate && sampleRate !== 16000) {
            throw new Error(`不支持的采样率: ${sampleRate}`);
        }
    }

    start(): void {
        try {
            this.isLog && console.log('start function is click');
            this.requestId = guid();
            this.recorder = new RecorderModule(this.requestId!, this.params, this.isLog);
            
            // 录音数据回调
            this.recorder.OnReceivedData = (data: ArrayBuffer) => {
                try {
                    this.validateAudioData(data);
                    if (this.isCanSendData) {
                        this.speechRecognizer?.write(data);
                    }
                } catch (error) {
                    this.OnError(error);
                }
            };

            // 错误处理
            this.recorder.OnError = (err: Error) => {
                this.speechRecognizer?.close();
                this.stop();
                this.OnError(err);
            };

            // 录音停止
            this.recorder.OnStop = (res: any) => {
                this.speechRecognizer?.stop();
                this.OnRecorderStop(res);
            };

            this.recorder.start();

            if (!this.speechRecognizer) {
                this.speechRecognizer = new SpeechRecognizer(
                    this.params,
                    this.requestId!,
                    this.isLog
                );
            }

            // 事件回调绑定
            this.speechRecognizer.OnRecognitionStart = (res: any) => {
                if (this.recorder) {
                    this.OnRecognitionStart(res);
                    this.isCanSendData = true;
                } else {
                    this.speechRecognizer?.close();
                }
            };

            this.speechRecognizer.OnSentenceBegin = (res: any) => {
                this.OnSentenceBegin(res);
            };

            this.speechRecognizer.OnRecognitionResultChange = (res: any) => {
                console.log('底层识别结果:', res);
                const normalizedData = {
                    result: {
                        voice_text_str: res?.result?.voice_text_str || res?.FinalResult?.voice_text_str || ''
                    },
                    FinalResult: res.FinalResult,
                    requestId: this.requestId,
                    timestamp: new Date().getTime()
                };
                console.log('准备传递给上层的数据:', normalizedData);
                this.OnRecognitionResultChange(normalizedData);
            };

            this.speechRecognizer.OnSentenceEnd = (res: any) => {
                console.log('底层一句话结束', res);
                this.OnSentenceEnd(res);
            };

            this.speechRecognizer.OnRecognitionComplete = (res: any) => {
                console.log('底层识别结束', res);
                this.OnRecognitionComplete(res);
                this.isCanSendData = false;
                this.isNormalEndStop = true;
            };

            this.speechRecognizer.OnError = (res: any) => {
                if (!this.isNormalEndStop) {
                    this.OnError(res);
                }
                this.speechRecognizer = null;
                this.recorder?.stop();
                this.isCanSendData = false;
            };

            this.speechRecognizer.start();
        } catch (e) {
            console.error(e);
        }
    }

    stop(): void {
        this.isLog && console.log('stop function is click');
        this.recorder?.stop();
    }

    destroyStream(): void {
        this.isLog && console.log('destroyStream function is click', this.recorder);
        this.recorder?.destroyStream();
    }

    // 事件回调方法（保持空实现）
    OnRecognitionStart(res: any): void {}
    OnSentenceBegin(res: any): void {}
    OnRecognitionResultChange(res: any): void {}
    OnSentenceEnd(res: any): void {}
    OnRecognitionComplete(res: any): void {}
    OnError(error: any): void {}
    OnRecorderStop(res: any): void {}
}

// 全局声明
if (typeof window !== 'undefined') {
    window.WebAudioSpeechRecognizer = WebAudioSpeechRecognizer;
}