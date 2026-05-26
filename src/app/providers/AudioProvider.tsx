import { createContext, useContext, type ReactNode } from "react";
import type { IAudioService } from "@/services/audio/types";
import { YoudaoAudioService } from "@/services/audio/youdao";

const audioService = new YoudaoAudioService();
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
