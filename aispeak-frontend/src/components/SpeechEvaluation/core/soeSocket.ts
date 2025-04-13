import { SoeNewCredential } from "../lib/credential";
import * as CryptoJS from "crypto-js";
import utils from '@/utils/utils';

export default class SoeNewConnect {
  appid: string;
  secretid: string;
  secretkey: string;
  socket: UniApp.SocketTask | null;
  isSignSuccess: boolean;
  isRecognizeComplete: boolean;
  isSentenceBegin: boolean;
  query: any;
  isLog: boolean;
  logServer: any;
  isWechat: boolean;

  constructor(query: any, isLog: boolean = false, logServer: any) {
    this.appid = query.appid || "";
    this.secretid = query.secretid || "";
    this.secretkey = query.secretkey || "";
    this.socket = null;
    this.isSignSuccess = false;
    this.isSentenceBegin = false;
    this.isRecognizeComplete = false;
    this.query = query;
    this.isLog = isLog;
    this.logServer = logServer;
    this.isWechat = utils.isWechat();
  }

  // 签名函数
  signCallback(signStr: string) {
    const hmac = CryptoJS.HmacSHA1(signStr, this.secretkey);
    const signature = CryptoJS.enc.Base64.stringify(hmac);
    return signature;
  }

  // 暂停识别，关闭连接
  stop() {
    if (this.socket) {
      this.socket.send({
        data: JSON.stringify({ type: "end" }),
        success: () => {},
        fail: (err) => {
          this.OnError(err);
        }
      });
    }
  }

  // 拼接鉴权数据
  async getUrl() {
    if (!this.appid || !this.secretid) {
      throw new Error("缺少appid或secretid");
    }
    const soe = new SoeNewCredential(this.query);
    const { urlStr, signStr } = await soe.getSignStr();
    return `${urlStr}&signature=${encodeURIComponent(
      this.signCallback(signStr)
    )}`;
  }

  async start() {
    const url = await this.getUrl();
    const self = this;

    // 使用UniApp的WebSocket API
    this.socket = uni.connectSocket({
      url: `wss://${url}`,
      success: () => {
        console.log('WebSocket连接已建立');
      },
      fail: (err) => {
        this.OnError(err);
      }
    });

    if (this.socket) {
      // 监听WebSocket打开事件
      this.socket.onOpen(() => {
        console.log('WebSocket连接已打开', this.isWechat);
      });

      // 监听消息接收
      this.socket.onMessage((res) => {
        const response = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        
        if (response.code !== 0) {
          this.OnError(response.message);
          this.close();
          return;
        }

        if (!this.isSignSuccess) {
          this.OnEvaluationStart(response);
          this.isSignSuccess = true;
        }

        if (response.final === 1) {
          this.isRecognizeComplete = true;
          this.OnEvaluationComplete(response);
          return;
        }

        console.log('实时评测结果', response);
        if (response.result) {
          this.OnEvaluationResultChange(response);
        }
      });

      // 监听错误事件
      this.socket.onError((err) => {
        this.OnError(err);
        this.close();
      });

      // 监听关闭事件
      this.socket.onClose((res) => {
        if (!this.isRecognizeComplete) {
          this.OnError(res);
        }
      });
    }
  }

  // 发送数据
  write(data: any) {
    if (!this.socket) {
      this.OnError("连接未建立，请稍后发送数据！");
      return;
    }

    this.socket.send({
      data: data,
      success: () => {},
      fail: (err) => {
        this.OnError(err);
      }
    });
  }

  // 关闭连接
  close() {
    if (this.socket) {
      this.socket.close({
        code: 1000,
        success: () => {
          this.socket = null;
        },
        fail: (err) => {
          this.OnError(err);
        }
      });
    }
  }

  // 以下方法需要由使用者实现
  OnEvaluationStart(res: any) {}
  OnEvaluationResultChange(res: any) {}
  OnEvaluationComplete(res: any) {}
  OnError(err: any) {}

  async OndownloadLogs() {
    if (!this.logServer) {
      return;
    }
    const res = await this.logServer.QueryLog();
    return res;
  }
}

// 全局注册（仅在浏览器环境下）
if (typeof window !== 'undefined') {
  (window as any).SoeNewConnect = SoeNewConnect;
}