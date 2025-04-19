import * as CryptoJS from 'crypto-js';

type QueryParams = {
  [key: string]: any;
  appid?: string;
  secretid?: string;
  secretkey?: string;
  engine_model_type?: string;
  voice_format?: number;
  signCallback?: (str: string) => string;
  echoCancellation?: boolean;
};

interface WebSocketEvent extends Event {
  data?: any;
}

const needFiltrationParams = ['appid', 'secretkey', 'signCallback', 'echoCancellation'];
const TAG = 'SpeechRecognizer';

function formatSignString(query: QueryParams, params: QueryParams): string {
  let strParam = "";
  let signStr = "asr.cloud.tencent.com/asr/v2/";
  
  if (query.appid) {
    signStr += query.appid;
  }
  
  const keys = Object.keys(params).sort();
  for (const key of keys) {
    strParam += `&${key}=${params[key]}`;
  }
  
  return `${signStr}?${strParam.slice(1)}`;
}

async function createQuery(query: QueryParams): Promise<QueryParams> {
  const time = new Date().getTime();
  const params: QueryParams = {};

  const getServerTime = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 使用 uni-app 的 API 替代 XMLHttpRequest
      if (typeof uni !== 'undefined') {
        uni.request({
          url: 'https://asr.cloud.tencent.com/server_time',
          success: (res) => {
            resolve(res.data);
          },
          fail: (err) => {
            reject(err);
          }
        });
      } else if (typeof XMLHttpRequest !== 'undefined') {
        // 浏览器环境
        const xhr = new XMLHttpRequest();
        xhr.open("GET", 'https://asr.cloud.tencent.com/server_time', true);
        xhr.send();
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            resolve(xhr.responseText);
          }
        };
        xhr.onerror = reject;
      } else {
        // 其他环境，使用当前时间
        resolve(String(Math.round(time / 1000)));
      }
    });
  };

  try {
    const serverTime = await getServerTime();
    params.secretid = query.secretid || '';
    params.engine_model_type = query.engine_model_type || '16k_zh';
    params.timestamp = parseInt(serverTime) || Math.round(time / 1000);
    params.expired = Math.round(time / 1000) + 24 * 60 * 60;
    params.nonce = Math.round(time / 100000);
    params.voice_id = guid();
    params.voice_format = query.voice_format || 1;

    const tempQuery = { ...query };
    needFiltrationParams.forEach(param => delete tempQuery[param]);

    return { ...tempQuery, ...params };
  } catch (error) {
    throw new Error(`Failed to create query: ${error}`);
  }
}

export const guid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

async function getUrl(self: SpeechRecognizer, params: QueryParams): Promise<string | false> {
  console.log('zfp getUrl 参数', params);
  
  if (!params.appid || !params.secretid) {
    self.isLog && console.log(self.requestId, '请确认是否填入账号信息', TAG);
    self.OnError('请确认是否填入账号信息');
    return false;
  }

  try {
    const urlQuery = await createQuery(params);
    const queryStr = formatSignString(params, urlQuery);
    let signature = '';
    
    if (params.signCallback) {
      signature = params.signCallback(queryStr);
    } else {
      signature = signCallback(params.secretkey || '', queryStr);
    }
    
    return `wss://${queryStr}&signature=${encodeURIComponent(signature)}`;
  } catch (error) {
    self.OnError(error as Error);
    return false;
  }
}

function toUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  
  return u8;
}

function Uint8ArrayToString(fileData: Uint8Array): string {
  return Array.from(fileData).map(byte => String.fromCharCode(byte)).join('');
}

// 添加 btoa 的兼容实现
function customBtoa(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  } else {
    // 简单的 base64 编码实现
    const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      
      const triplet = (a << 16) | (b << 8) | c;
      
      for (let j = 0; j < 4; j++) {
        if (i - 3 > str.length && j === 3) {
          result += '=';
        } else if (i - 2 > str.length && j === 2) {
          result += '=';
        } else {
          const index = (triplet >>> (6 * (3 - j))) & 0x3F;
          result += base64chars[index];
        }
      }
    }
    
    return result;
  }
}

function signCallback(secretKey: string, signStr: string): string {
  const hash = CryptoJS.HmacSHA1(signStr, secretKey);
  const bytes = Uint8ArrayToString(toUint8Array(hash));
  return customBtoa(bytes);
}

export class SpeechRecognizer {
  private socket: any = null; // 改为 any 类型以适应不同环境
  private isSignSuccess = false;
  private isSentenceBegin = false;
  private isRecognizeComplete = false;
  private sendCount = 0;
  private getMessageList: string[] = [];
  private socketTaskId: string = '';

  constructor(
    private query: QueryParams,
    private requestId: string,
    private isLog: boolean
  ) {}

  stop(): void {
    if (typeof uni !== 'undefined' && this.socket) {
      this.socket.send({
        data: JSON.stringify({ type: 'end' }),
        success: () => {
          this.isRecognizeComplete = true;
        }
      });
    } else if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'end' }));
      this.isRecognizeComplete = true;
    } else if (this.socket) {
      this.socket.close();
    }
  }

  async start(): Promise<void> {
    this.socket = null;
    this.getMessageList = [];
    
    const url = await getUrl(this, this.query);
    if (!url) return;

    this.isLog && console.log(this.requestId, 'get ws url', url, TAG);
    
    if (typeof uni !== 'undefined') {
      // uni-app 环境
      this.socket = uni.connectSocket({
        url: url,
        success: () => {
          this.isLog && console.log(this.requestId, '连接建立成功', TAG);
        },
        fail: (error) => {
          this.OnError(error);
        }
      });
      
      // 监听 WebSocket 连接打开事件
      uni.onSocketOpen((res) => {
        this.isLog && console.log(this.requestId, '连接已打开', res, TAG);
      });
      
      // 监听 WebSocket 接收到服务器的消息事件
      uni.onSocketMessage((res) => {
        try {
          this.getMessageList.push(JSON.stringify(res));
          const response = JSON.parse(res.data);
          
          if (response.code !== 0) {
            uni.closeSocket();
            this.OnError(response);
          } else {
            this.handleResponse(response);
          }
        } catch (error) {
          this.logError('socket.onmessage', error);
        }
      });
      
      // 监听 WebSocket 错误事件
      uni.onSocketError((res) => {
        uni.closeSocket();
        this.OnError(res);
      });
      
      // 监听 WebSocket 关闭事件
      uni.onSocketClose((res) => {
        if (!this.isRecognizeComplete) {
          this.OnError(res);
        }
      });
    } else if (typeof WebSocket !== 'undefined') {
      // 浏览器环境
      this.socket = new WebSocket(url);
      
      this.socket.onopen = (e: Event) => {
        this.isLog && console.log(this.requestId, '连接建立', e, TAG);
      };

      this.socket.onmessage = async (e: MessageEvent) => {
        try {
          this.getMessageList.push(JSON.stringify(e));
          const response = JSON.parse(e.data);
          
          if (response.code !== 0) {
            this.socket?.close();
            this.OnError(response);
          } else {
            this.handleResponse(response);
          }
        } catch (error) {
          this.logError('socket.onmessage', error);
        }
      };

      this.socket.onerror = (e: Event) => {
        this.socket?.close();
        this.OnError(e);
      };

      this.socket.onclose = (e: CloseEvent) => {
        if (!this.isRecognizeComplete) {
          this.OnError(e);
        }
      };
    } else {
      this.OnError('当前环境不支持WebSocket');
      return;
    }
  }

  close(): void {
    if (typeof uni !== 'undefined') {
      uni.closeSocket({
        code: 1000
      });
    } else if (this.socket) {
      this.socket.close(1000);
    }
  }

  write(data: string | ArrayBuffer | Blob): void {
    try {
      if (typeof uni !== 'undefined') {
        // uni-app 环境
        uni.sendSocketMessage({
          data: data,
          fail: (error) => {
            setTimeout(() => this.trySend(data), 100);
          }
        });
        this.sendCount++;
      } else if (this.socket?.readyState !== WebSocket.OPEN) {
        setTimeout(() => this.trySend(data), 100);
        return;
      } else {
        this.sendCount++;
        this.socket.send(data);
      }
    } catch (error) {
      this.logError('发送数据', error);
    }
  }

  // 事件回调方法
  OnError(error: Error | string | Event): void {}
  OnRecognitionStart(res: any): void {}
  OnSentenceBegin(res: any): void {}
  OnRecognitionResultChange(res: any): void {}
  OnSentenceEnd(res: any): void {}
  OnRecognitionComplete(res: any): void {}

  private handleResponse(response: any): void {
    if (!this.isSignSuccess) {
      this.OnRecognitionStart(response);
      this.isSignSuccess = true;
    }

    if (response.final === 1) {
      this.OnRecognitionComplete(response);
      return;
    }

    if (response.result) {
      switch (response.result.slice_type) {
        case 0:
          this.OnSentenceBegin(response);
          this.isSentenceBegin = true;
          break;
        case 2:
          if (!this.isSentenceBegin) this.OnSentenceBegin(response);
          this.OnSentenceEnd(response);
          break;
        default:
          this.OnRecognitionResultChange(response);
      }
    }
  }

  private trySend(data: string | ArrayBuffer | Blob): void {
    if (typeof uni !== 'undefined') {
      uni.sendSocketMessage({
        data: data
      });
    } else if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    }
  }

  private logError(context: string, error: unknown): void {
    this.isLog && console.error(this.requestId, `${context} error`, error, TAG);
  }
}

// 全局声明保持不变
declare global {
  interface Window {
    SpeechRecognizer: typeof SpeechRecognizer;
  }
}

if (typeof window !== 'undefined') {
  window.SpeechRecognizer = SpeechRecognizer;
}