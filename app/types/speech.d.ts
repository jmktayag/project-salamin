/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly results: any;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
  }

  interface Window {
    webkitSpeechRecognition?: { new (): SpeechRecognition };
    SpeechRecognition?: { new (): SpeechRecognition };
  }
}
