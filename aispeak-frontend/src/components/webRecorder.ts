// #ifdef H5
const audioWorkletCode = `
class MyProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.audioData = [];
    this.nextUpdateFrame = 40;
  }

  get intervalInFrames() {
    return 200 / 1000 * sampleRate;
  }

  process(inputs) {
    if (inputs[0][0]) {
      const output = ${to16kHz}(inputs[0][0], sampleRate);
      const audioData = ${to16BitPCM}(output);
      const data = [...new Int8Array(audioData.buffer)];
      this.audioData = this.audioData.concat(data);
      this.nextUpdateFrame -= inputs[0][0].length;
      if (this.nextUpdateFrame < 0) {
        this.nextUpdateFrame += this.intervalInFrames;
        this.port.postMessage({
          audioData: new Int8Array(this.audioData)
        });
        this.audioData = [];
      }
      return true;
    }
  }
}

registerProcessor('my-processor', MyProcessor);
`;
const audioWorkletBlobURL = window.URL.createObjectURL(
  new Blob([audioWorkletCode], { type: "text/javascript" })
);
// #endif

function to16BitPCM(input: any) {
  const dataLength = input.length * (16 / 8);
  const dataBuffer = new ArrayBuffer(dataLength);
  const dataView = new DataView(dataBuffer);
  let offset = 0;
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    dataView.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return dataView;
}

function to16kHz(audioData: any, sampleRate = 44100) {
  const data = new Float32Array(audioData);
  const fitCount = Math.round(data.length * (16000 / sampleRate));
  const newData = new Float32Array(fitCount);
  const springFactor = (data.length - 1) / (fitCount - 1);
  newData[0] = data[0];
  for (let i = 1; i < fitCount - 1; i++) {
    const tmp = i * springFactor;
    const before = Math.floor(tmp);
    const after = Math.ceil(tmp);
    const atPoint = tmp - before;
    newData[i] = data[before] + (data[after] - data[before]) * atPoint;
  }
  newData[fitCount - 1] = data[data.length - 1];
  return newData;
}

export default class WebRecorder {
  audioData: Array<any>;
  stream: any;
  audioContext: any;
  static instance: any;
  isLog: boolean;
  logServer: any;
  requestId: string;
  allAudioData: Int8Array;
  // #ifndef H5
  wxRecorderManager: UniApp.RecorderManager | null;
  // #endif

  constructor(isLog: boolean = false, logServer: any, requestId: string = "") {
    this.audioData = [];
    this.stream = null;
    this.audioContext = null;
    if (!WebRecorder.instance) {
      WebRecorder.instance = this;
    }
    this.isLog = isLog;
    this.logServer = logServer;
    this.requestId = requestId;
    this.allAudioData = new Int8Array();

    // 绑定方法，确保上下文正确
    this.OnStop = this.OnStop.bind(this);
    this.OnError = this.OnError.bind(this);
    this.OnReceivedData = this.OnReceivedData.bind(this);

    // #ifndef H5
    this.wxRecorderManager = null;
    // #endif
  }

  start() {
    this.allAudioData = new Int8Array();

    // #ifndef H5
    this.startMpWeixinRecording();
    // #endif

    // #ifdef H5
    this.startH5Recording();
    // #endif
  }

  // #ifndef H5
  startMpWeixinRecording() {
    const recorderManager = uni.getRecorderManager();

    if (!recorderManager) {
      this.OnError("无法获取录音管理器");
      return;
    }

    this.wxRecorderManager = recorderManager;

    let format = "wav";
    // #ifdef APP-PLUS
    if (uni.getSystemInfoSync().platform === "android") {
      format = "mp3";
    }
    // #endif

    try {
      recorderManager.start({
        duration: 60000,
        sampleRate: 44100,
        encodeBitRate: 192000,
        format: format,
      });

      recorderManager.onStop((res: any) => {
        if (!res || !res.tempFilePath) {
          this.OnError("录音结果无效");
          return;
        }

        uni.getFileSystemManager().readFile({
          filePath: res.tempFilePath,
          success: (fileRes: any) => {
            const audioData = new Int8Array(fileRes.data);
            this.allAudioData = audioData;
            this.OnStop(audioData);
          },
          fail: (err: any) => {
            this.OnError(`读取录音文件失败: ${JSON.stringify(err)}`);
          }
        });
      });

      recorderManager.onError((err: any) => {
        this.OnError(err);
      });

    } catch (err) {
      this.OnError(err);
    }
  }
  // #endif

  // #ifdef H5
  startH5Recording() {
    if (this.audioContext) {
      this.OnError("录音已开启");
      return;
    }

    const navigator = (window as any).navigator;
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.audioContext.resume();
      if (!this.audioContext) {
        this.OnError("浏览器不支持webAudioApi相关接口");
        return;
      }
    } catch (e) {
      if (!this.audioContext) {
        this.OnError("浏览器不支持webAudioApi相关接口");
        return;
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: false,
        })
        .then((stream: any) => {
          this.getAudioSuccess(stream);
        })
        .catch((e: any) => {
          this.getAudioFail(e);
        });
    } else if (navigator.getUserMedia) {
      navigator.getUserMedia(
        {
          audio: true,
          video: false,
        },
        (stream: any) => {
          this.getAudioSuccess(stream);
        },
        (e: any) => {
          this.getAudioFail(e);
        }
      );
    } else {
      if (
        navigator.userAgent.toLowerCase().match(/chrome/) &&
        location.origin.indexOf("https://") < 0
      ) {
        this.OnError(
          "chrome下获取浏览器录音功能，因为安全性问题，需要在localhost或127.0.0.1或https下才能获取权限"
        );
      } else {
        this.OnError("无法获取浏览器录音功能，请升级浏览器或使用chrome");
      }
      this.audioContext && this.audioContext.close();
      return;
    }
  }

  private getAudioSuccess(stream: any) {
    this.stream = stream;
    const mediaStreamSource = this.audioContext.createMediaStreamSource(stream);

    if (this.audioContext.audioWorklet) {
      this.audioContext.audioWorklet
        .addModule(audioWorkletBlobURL)
        .then(() => {
          const myNode = new AudioWorkletNode(
            this.audioContext,
            "my-processor",
            { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 }
          );
          myNode.port.onmessage = (event) => {
            this.OnReceivedData(event.data.audioData);
            const newData = new Int8Array([...this.allAudioData, ...event.data.audioData]);
            this.allAudioData = newData;
          };
          mediaStreamSource
            .connect(myNode)
            .connect(this.audioContext.destination);
        })
        .catch((err: any) => this.OnError(err));
    } else {
      const scriptProcessor = this.audioContext.createScriptProcessor(0, 1, 1);
      scriptProcessor.onaudioprocess = (e: any) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const output = to16kHz(inputData, this.audioContext.sampleRate);
        const audioData = to16BitPCM(output);
        const newData = new Int8Array([...this.allAudioData, ...new Int8Array(audioData.buffer)]);
        this.allAudioData = newData;
        this.audioData.push(...new Int8Array(audioData.buffer));
        if (this.audioData.length > 6400) {
          const audioDataArray = new Int8Array(this.audioData);
          this.OnReceivedData(audioDataArray);
          this.audioData = [];
        }
      };
      mediaStreamSource.connect(scriptProcessor);
      scriptProcessor.connect(this.audioContext.destination);
    }
  }

  private getAudioFail(err: any) {
    this.OnError(err);
    this.stop();
  }
  // #endif

  stop() {
    // #ifndef H5
    if (this.wxRecorderManager) {
      try {
        this.wxRecorderManager.stop();
      } catch (err) {
        this.OnError(`停止录音失败: ${err}`);
      }
    }
    // #endif

    // #ifdef H5
    if (
      !(
        /Safari/.test(navigator.userAgent) &&
        !/Chrome/.test(navigator.userAgent)
      )
    ) {
      this.audioContext && this.audioContext.suspend();
    }
    this.audioContext && this.audioContext.suspend();
    if (this.stream) {
      this.stream.getTracks().forEach((track: any) => track.stop());
      this.stream = null;
    }
    this.OnStop(this.allAudioData);
    // #endif
  }

  OnReceivedData(data: Int8Array) {
    // 获取音频数据
    console.log('接收到音频数据:', data);
  }

  OnError(res: any) {
    console.error('录音错误:', res);
  }

  OnStop(res: Int8Array) {
    if (!res) {
      console.error('无效的录音结果');
      return;
    }
    console.log('录音停止，音频数据:', res);
  }
}

// #ifdef H5
window && ((window as any).WebRecorder = WebRecorder);
// #endif