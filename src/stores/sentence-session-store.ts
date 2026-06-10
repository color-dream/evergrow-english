import { create } from "zustand";
import type { Sentence } from "@/types/domain";
import type { SentenceBookId } from "@/types/sentence";

// ── 结果类型 ──

export interface SentenceResult {
  sentenceId: string;
  sentenceEnglish: string;
  chinese: string;
  wrongWordIndices: number[];
  wrongWordCount: number;
  isCorrect: boolean;
}

// ── State ──

interface SentenceSessionState {
  selectedBook: SentenceBookId | null;
  phase: "idle" | "learning" | "finished";
  sentences: Sentence[];
  currentSentenceIndex: number;
  isTyping: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  sentenceResults: SentenceResult[];

  setSelectedBook: (id: SentenceBookId) => void;
  setIsTyping: (val: boolean) => void;
  startSession: (sentences: Sentence[], bookId: SentenceBookId) => void;
  /** 记录当前句完成（单次提交，对标 earthworm 的 submitAnswer） */
  completeSentence: (wrongWordIndices: number[]) => void;
  advanceSentence: () => boolean;
  finishSession: () => void;
  resetSession: () => void;
  setElapsedSeconds: (s: number) => void;
  tickTimer: () => void;
}

export const useSentenceSessionStore = create<SentenceSessionState>()((set) => ({
  selectedBook: null,
  phase: "idle",
  sentences: [],
  currentSentenceIndex: 0,
  isTyping: false,
  startTime: null,
  elapsedSeconds: 0,
  sentenceResults: [],

  setSelectedBook: (id) => set({ selectedBook: id }),
  setIsTyping: (val) => set({ isTyping: val }),

  startSession: (sentences, bookId) => {
    set({
      selectedBook: bookId,
      phase: "learning",
      sentences,
      currentSentenceIndex: 0,
      isTyping: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      sentenceResults: [],
    });
  },

  completeSentence: (wrongWordIndices) =>
    set((s) => {
      const sentence = s.sentences[s.currentSentenceIndex];
      if (!sentence) return {};

      const result: SentenceResult = {
        sentenceId: sentence.id,
        sentenceEnglish: sentence.english,
        chinese: sentence.chinese,
        wrongWordIndices,
        wrongWordCount: wrongWordIndices.length,
        isCorrect: wrongWordIndices.length === 0,
      };

      return {
        sentenceResults: [...s.sentenceResults, result],
      };
    }),

  advanceSentence: () => {
    const s = useSentenceSessionStore.getState();
    const nextIdx = s.currentSentenceIndex + 1;
    const isLast = nextIdx >= s.sentences.length;

    if (isLast) {
      set({ phase: "finished", currentSentenceIndex: nextIdx, isTyping: false });
      return true;
    }

    set({
      currentSentenceIndex: nextIdx,
      isTyping: true, // 下一句直接进入打字，无需按任意键
    });
    return false;
  },

  finishSession: () => set({ phase: "finished", isTyping: false }),

  resetSession: () =>
    set({
      phase: "idle",
      sentences: [],
      currentSentenceIndex: 0,
      isTyping: false,
      startTime: null,
      elapsedSeconds: 0,
      sentenceResults: [],
    }),

  setElapsedSeconds: (s) => set({ elapsedSeconds: s }),
  tickTimer: () => set((st) => ({ elapsedSeconds: st.elapsedSeconds + 1 })),
}));

// ── Selectors ──

export function getCurrentSentence(state: SentenceSessionState): Sentence | null {
  return state.sentences[state.currentSentenceIndex] ?? null;
}
