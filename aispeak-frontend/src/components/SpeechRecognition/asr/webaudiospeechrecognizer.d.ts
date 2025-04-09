declare class WebAudioSpeechRecognizer {
  constructor(config: {
    requestId: string;
    [key: string]: any;
  });

  // Methods
  start(): void;
  stop(): void;
  write(data: Int8Array | ArrayBuffer): void;

  // Event handlers
  onStart: () => void;
  onStop: (result: any) => void;
  onError: (error: any) => void;
  onRecognitionResultChange: (result: any) => void;
}

export default WebAudioSpeechRecognizer;