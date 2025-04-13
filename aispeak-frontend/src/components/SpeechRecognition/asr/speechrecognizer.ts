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
      const xhr = new XMLHttpRequest();
      xhr.open("GET", 'https://asr.cloud.tencent.com/server_time', true);
      xhr.send();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          resolve(xhr.responseText);
        }
      };
      xhr.onerror = reject;
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

function signCallback(secretKey: string, signStr: string): string {
  const hash = CryptoJS.HmacSHA1(signStr, secretKey);
  const bytes = Uint8ArrayToString(toUint8Array(hash));
  return btoa(bytes);
}

export class SpeechRecognizer {
  private socket: WebSocket | null = null;
  private isSignSuccess = false;
  private isSentenceBegin = false;
  private isRecognizeComplete = false;
  private sendCount = 0;
  private getMessageList: string[] = [];

  constructor(
    private query: QueryParams,
    private requestId: string,
    private isLog: boolean
  ) {}

  stop(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
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
    
    if (typeof WebSocket !== 'undefined') {
      this.socket = new WebSocket(url);
    } else {
      this.OnError('浏览器不支持WebSocket');
      return;
    }

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
  }

  close(): void {
    this.socket?.close(1000);
  }

  write(data: string | ArrayBuffer | Blob): void {
    try {
      if (this.socket?.readyState !== WebSocket.OPEN) {
        setTimeout(() => this.trySend(data), 100);
        return;
      }
      this.sendCount++;
      this.socket.send(data);
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
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    }
  }

  private logError(context: string, error: unknown): void {
    this.isLog && console.error(this.requestId, `${context} error`, error, TAG);
  }
}

declare global {
  interface Window {
    SpeechRecognizer: typeof SpeechRecognizer;
  }
}

if (typeof window !== 'undefined') {
  window.SpeechRecognizer = SpeechRecognizer;
}