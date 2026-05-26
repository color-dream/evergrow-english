import { createContext, useContext, type ReactNode } from "react";
import type { IAudioService } from "@/services/audio/types";
import { WebSpeechAudioService } from "@/services/audio/web-speech";

const audioService = new WebSpeechAudioService();
const AudioContext = createContext<IAudioService>(audioService);

export function useAudio() {
  return useContext(AudioContext);
}

export function AudioProvider({ children }: { children: ReactNode }) {
  return (
    <AudioContext.Provider value={audioService}>
      {children}
    </AudioContext.Provider>
  );
}
