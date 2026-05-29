export interface SpeakOptions {
  rate?: number;
  voice?: string;
  accent?: "us" | "uk";
}

export interface Voice {
  name: string;
  lang: string;
  default: boolean;
}

export interface IAudioService {
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stop(): void;
  getVoices(): Promise<Voice[]>;
  isSpeaking(): boolean;
  readonly supported: boolean;
}
