import type { IAudioService, Voice, SpeakOptions } from "./types";

export class WebSpeechAudioService implements IAudioService {
  private synth: SpeechSynthesis | null = null;

  get supported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (!this.supported) {
      console.warn("Web Speech API not supported");
      return;
    }

    this.synth = window.speechSynthesis;
    this.stop();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = options?.rate ?? 1;

      if (options?.voice) {
        const voices = this.synth!.getVoices();
        const voice = voices.find((v) => v.name === options.voice);
        if (voice) utterance.voice = voice;
      } else {
        const voices = this.synth!.getVoices();
        const englishVoice = voices.find(
          (v) => v.lang.startsWith("en") && v.default
        );
        if (englishVoice) utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(e.error));

      this.synth!.speak(utterance);
    });
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  async getVoices(): Promise<Voice[]> {
    if (!this.supported) return [];

    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(
          voices.map((v) => ({
            name: v.name,
            lang: v.lang,
            default: v.default,
          }))
        );
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          const updated = window.speechSynthesis.getVoices();
          resolve(
            updated.map((v) => ({
              name: v.name,
              lang: v.lang,
              default: v.default,
            }))
          );
        };
      }
    });
  }

  isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }
}
