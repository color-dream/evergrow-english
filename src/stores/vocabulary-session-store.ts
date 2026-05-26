import { create } from "zustand";
import type { Word } from "@/types/domain";
import type {
  TypingMode,
  DictationConfig,
  SessionPhase,
  WordResult,
} from "@/types/vocabulary";
import { DEFAULT_WORDS_PER_ROUND } from "@/lib/constants";
import { shuffleArray } from "@/lib/vocabulary-utils";

interface VocabularySessionState {
  // ── 配置 ──
  wordsPerRound: number;
  mode: TypingMode;
  dictation: DictationConfig;

  // ── 会话生命周期 ──
  phase: SessionPhase;
  words: Word[];
  currentIndex: number;

  // ── 计时 ──
  startTime: number | null;
  endTime: number | null;
  elapsedSeconds: number;

  // ── 统计（跨单词累积） ──
  wordResults: WordResult[];
  totalKeystrokes: number;
  totalCorrectKeystrokes: number;

  // ── Actions ──
  setMode: (mode: TypingMode) => void;
  setDictation: (config: Partial<DictationConfig>) => void;
  setWordsPerRound: (n: number) => void;
  startSession: (availableWords: Word[]) => void;
  advanceWord: () => void;
  addWordResult: (result: WordResult) => void;
  addKeystrokes: (correct: boolean) => void;
  setElapsedSeconds: (seconds: number) => void;
  tickTimer: () => void;
  finishSession: () => void;
  resetSession: () => void;
}

export const useVocabularySessionStore = create<VocabularySessionState>()(
  (set) => ({
    // 默认配置
    wordsPerRound: DEFAULT_WORDS_PER_ROUND,
    mode: "strict",
    dictation: { enabled: false, type: "hideAll" },

    // 会话状态
    phase: "idle",
    words: [],
    currentIndex: 0,

    // 计时
    startTime: null,
    endTime: null,
    elapsedSeconds: 0,

    // 统计
    wordResults: [],
    totalKeystrokes: 0,
    totalCorrectKeystrokes: 0,

    setMode: (mode) => set({ mode }),

    setDictation: (config) =>
      set((s) => ({
        dictation: { ...s.dictation, ...config },
      })),

    setWordsPerRound: (n) => set({ wordsPerRound: n }),

    startSession: (availableWords) => {
      const shuffled = shuffleArray(availableWords);
      set((s) => ({
        phase: "active",
        words: shuffled.slice(0, s.wordsPerRound),
        currentIndex: 0,
        startTime: Date.now(),
        endTime: null,
        elapsedSeconds: 0,
        wordResults: [],
        totalKeystrokes: 0,
        totalCorrectKeystrokes: 0,
      }));
    },

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
