declare class SowNewSocketSdk {
    constructor(config: any);
    start(): void;
    stop(): void;
    OnAudioComplete: (data: Int8Array) => void;
    OnEvaluationStart: (res: any) => void;
    OnError: (err: Error) => void;
}

export default SowNewSocketSdk;