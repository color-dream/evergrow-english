import { create } from "zustand";
import type { Word } from "@/types/domain";
import type {
  TypingMode,
  DictationConfig,
  SessionPhase,
  WordResult,
  WordBookId,
} from "@/types/vocabulary";

interface VocabularySessionState {
  // ── 配置 ──
  selectedWordBook: WordBookId | null;
  mode: TypingMode;
  dictation: DictationConfig;

  // ── 会话生命周期 ──
  phase: SessionPhase;
  words: Word[];
  currentIndex: number;
  isTyping: boolean;

  // ── 计时 ──
  startTime: number | null;
  endTime: number | null;
  elapsedSeconds: number;

  // ── 统计（跨单词累积） ──
  wordResults: WordResult[];
  totalKeystrokes: number;
  totalCorrectKeystrokes: number;

  // ── Actions ──
  setSelectedWordBook: (id: WordBookId) => void;
  setMode: (mode: TypingMode) => void;
  setDictation: (config: Partial<DictationConfig>) => void;
  startSession: (words: Word[]) => void;
  advanceWord: () => void;
  addWordResult: (result: WordResult) => void;
  addKeystrokes: (correct: boolean) => void;
  setElapsedSeconds: (seconds: number) => void;
  tickTimer: () => void;
  finishSession: () => void;
  setIsTyping: (val: boolean) => void;
  resetSession: () => void;
}

export const useVocabularySessionStore = create<VocabularySessionState>()(
  (set) => ({
    selectedWordBook: null,
    mode: "strict",
    dictation: { enabled: false, type: "hideAll" },

    phase: "idle",
    words: [],
    currentIndex: 0,
    isTyping: false,

    startTime: null,
    endTime: null,
    elapsedSeconds: 0,

    wordResults: [],
    totalKeystrokes: 0,
    totalCorrectKeystrokes: 0,

    setSelectedWordBook: (id) => set({ selectedWordBook: id }),

    setMode: (mode) => set({ mode }),

    setDictation: (config) =>
      set((s) => ({
        dictation: { ...s.dictation, ...config },
      })),

    startSession: (words) =>
      set({
        phase: "active",
        words,
        currentIndex: 0,
        isTyping: true,
        startTime: Date.now(),
        endTime: null,
        elapsedSeconds: 0,
        wordResults: [],
        totalKeystrokes: 0,
        totalCorrectKeystrokes: 0,
      }),

    advanceWord: () =>
      set((s) => {
        const nextIndex = s.currentIndex + 1;
        if (nextIndex >= s.words.length) {
          return {
            currentIndex: nextIndex,
            phase: "finished",
            endTime: Date.now(),
          };
        }
        return { currentIndex: nextIndex };
      }),

    addWordResult: (result) =>
      set((s) => ({
        wordResults: [...s.wordResults, result],
      })),

    addKeystrokes: (correct) =>
      set((s) => ({
        totalKeystrokes: s.totalKeystrokes + 1,
        totalCorrectKeystrokes: correct
          ? s.totalCorrectKeystrokes + 1
          : s.totalCorrectKeystrokes,
      })),

    setIsTyping: (val) => set({ isTyping: val }),

    setElapsedSeconds: (seconds: number) => set({ elapsedSeconds: seconds }),
    tickTimer: () =>
      set((s) => ({
        elapsedSeconds: s.elapsedSeconds + 1,
      })),

    finishSession: () =>
      set({
        phase: "finished",
        endTime: Date.now(),
      }),

    resetSession: () =>
      set({
        phase: "idle",
        words: [],
        currentIndex: 0,
        startTime: null,
        endTime: null,
        elapsedSeconds: 0,
        wordResults: [],
        totalKeystrokes: 0,
        totalCorrectKeystrokes: 0,
      }),
  })
);
