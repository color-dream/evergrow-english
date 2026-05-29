import type { IAudioService, Voice, SpeakOptions } from "./types";

const YOUDAO_BASE = "https://dict.youdao.com/dictvoice";
const WEB_SPEECH_DELAY_MS = 500;
const INTERACTION_TIMEOUT_MS = 30_000;

const INTERACTION_EVENTS = [
  "keydown",
  "mousedown",
  "touchstart",
  "pointerdown",
] as const;

export class YoudaoAudioService implements IAudioService {
  private audio: HTMLAudioElement | null = null;
  private _isSpeaking = false;
  private cleanupInteraction: (() => void) | null = null;
  private webSpeechTimer: ReturnType<typeof setTimeout> | null = null;
  private interactionTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingAccent: "us" | "uk" = "us";

  get supported(): boolean {
    return typeof window !== "undefined" && typeof Audio !== "undefined";
  }

  async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (!this.supported) {
      throw new Error("Audio element not supported");
    }

    this.stop();

    this.pendingAccent = options?.accent ?? "us";
    const type = this.pendingAccent === "uk" ? 1 : 0;
    const url = `${YOUDAO_BASE}?audio=${encodeURIComponent(text)}&type=${type}`;

    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(url);
      this.audio = audio;

      audio.onended = () => {
        this.stopWebSpeech();
        this._isSpeaking = false;
        resolve();
      };

      audio.onerror = () => {
        this.stopWebSpeech();
        this._isSpeaking = false;
        reject(new Error("Youdao audio playback failed"));
      };

      let started = false;
      audio.onplay = () => {
        started = true;
        this.clearWebSpeechTimer();
        this.clearInteractionTimer();
        this.removeInteractionListeners();
        this._isSpeaking = true;
      };

      // 在 play() 之前设置降级定时器和交互监听器
      this.webSpeechTimer = setTimeout(() => {
        this.startWebSpeech(text);
      }, WEB_SPEECH_DELAY_MS);

      this.interactionTimer = setTimeout(() => {
        this.stop();
        reject(new Error("Youdao audio timeout"));
      }, INTERACTION_TIMEOUT_MS);

      const retry = () => {
        this.stopWebSpeech();
        audio.play().catch(() => {
          this.stop();
        });
      };
      this.addInteractionListeners(retry);

      audio.play().then(
        () => {
          // 播放成功，onended 会 resolve
        },
        () => {
          // play() rejected — 检查 onplay 是否已触发
          if (started) {
            // 音频已在播放，清除降级定时器
            this.clearWebSpeechTimer();
            this.clearInteractionTimer();
            this.removeInteractionListeners();
          }
          // 否则：真正被阻止，Web Speech 定时器已就位
        },
      );
    });
  }

  stop(): void {
    this.removeInteractionListeners();
    this.clearWebSpeechTimer();
    this.clearInteractionTimer();
    this.stopWebSpeech();
    if (this.audio) {
      this.audio.onerror = null;
      this.audio.onended = null;
      this.audio.onplay = null;
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = "";
      this.audio = null;
      this._isSpeaking = false;
    }
  }

  async getVoices(): Promise<Voice[]> {
    return [];
  }

  isSpeaking(): boolean {
    return this._isSpeaking;
  }

  private startWebSpeech(text: string): void {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    const voices = speechSynthesis.getVoices();
    // 按口音偏好选择语音：美音优先 en-US，英音优先 en-GB
    const targetLang = this.pendingAccent === "uk" ? "en-GB" : "en-US";
    const preferred = voices.find((v) => v.lang.startsWith(targetLang));
    const fallback = voices.find((v) => v.lang.startsWith("en") && v.default);
    if (preferred) utterance.voice = preferred;
    else if (fallback) utterance.voice = fallback;
    speechSynthesis.speak(utterance);
  }

  private stopWebSpeech(): void {
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
  }

  private clearWebSpeechTimer(): void {
    if (this.webSpeechTimer) {
      clearTimeout(this.webSpeechTimer);
      this.webSpeechTimer = null;
    }
  }

  private clearInteractionTimer(): void {
    if (this.interactionTimer) {
      clearTimeout(this.interactionTimer);
      this.interactionTimer = null;
    }
  }

  private addInteractionListeners(retry: () => void): void {
    const handler = () => retry();
    INTERACTION_EVENTS.forEach((evt) =>
      document.addEventListener(evt, handler, { once: true }),
    );
    this.cleanupInteraction = () => {
      INTERACTION_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, handler),
      );
    };
  }

  private removeInteractionListeners(): void {
    if (this.cleanupInteraction) {
      this.cleanupInteraction();
      this.cleanupInteraction = null;
    }
  }
}
