import { create } from "zustand";
import type { Sentence } from "@/types/domain";
import type { SentenceBookId, SentenceLearnMode } from "@/types/sentence";
import { SENTENCE_LEARN_MODE_SEQUENCE } from "@/types/sentence";

// ── 结果类型 ──

export interface SentenceModeResult {
  mode: SentenceLearnMode;
  wrongWordIndices: number[];
  isCorrect: boolean;
}

export interface SentenceResult {
  sentenceId: string;
  sentenceUuid: string;
  sentenceText: string;
  translation: string;
  wrongWordCount: number;
  isCorrect: boolean;
  modeResults: SentenceModeResult[];
}

// ── Completion ──

interface SentenceCompletion {
  sentenceId: string;
  modeResults: SentenceModeResult[];
  currentModeIndex: number;
  isFullyCompleted: boolean;
}

// ── State ──

interface SentenceSessionState {
  selectedBook: SentenceBookId | null;
  phase: "idle" | "learning" | "finished";
  sentences: Sentence[];
  completions: Record<string, SentenceCompletion>;
  currentSentenceIndex: number;
  currentMode: SentenceLearnMode;
  isTyping: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  sentenceResults: SentenceResult[];

  setSelectedBook: (id: SentenceBookId) => void;
  setIsTyping: (val: boolean) => void;
  startSession: (sentences: Sentence[], bookId: SentenceBookId) => void;
  /** 记录当前句的一种模式完成（由 SentenceCard 内的 hook 提供结果） */
  completeMode: (wrongWordIndices: number[]) => void;
  advanceSentence: () => boolean;
  finishSession: () => void;
  resetSession: () => void;
  setElapsedSeconds: (s: number) => void;
  tickTimer: () => void;
}

function createCompletion(sentenceId: string): SentenceCompletion {
  return { sentenceId, modeResults: [], currentModeIndex: 0, isFullyCompleted: false };
}

export const useSentenceSessionStore = create<SentenceSessionState>()((set) => ({
  selectedBook: null,
  phase: "idle",
  sentences: [],
  completions: {},
  currentSentenceIndex: 0,
  currentMode: "sentenceWithText",
  isTyping: false,
  startTime: null,
  elapsedSeconds: 0,
  sentenceResults: [],

  setSelectedBook: (id) => set({ selectedBook: id }),
  setIsTyping: (val) => set({ isTyping: val }),

  startSession: (sentences, bookId) => {
    const comps: Record<string, SentenceCompletion> = {};
    for (const s of sentences) comps[s.id] = createCompletion(s.id);
    set({
      selectedBook: bookId, phase: "learning", sentences, completions: comps,
      currentSentenceIndex: 0, currentMode: "sentenceWithText",
      isTyping: false, startTime: Date.now(), elapsedSeconds: 0, sentenceResults: [],
    });
  },

  completeMode: (wrongWordIndices) =>
    set((s) => {
      const sentence = s.sentences[s.currentSentenceIndex];
      if (!sentence) return {};

      const completion = s.completions[sentence.id];
      if (!completion) return {};

      const modeResult: SentenceModeResult = {
        mode: SENTENCE_LEARN_MODE_SEQUENCE[completion.currentModeIndex] ?? "sentenceWithText",
        wrongWordIndices,
        isCorrect: wrongWordIndices.length === 0,
      };

      const newModeResults = [...completion.modeResults, modeResult];
      const newModeIdx = completion.currentModeIndex + 1;

      if (newModeIdx >= 3) {
        const finalResult: SentenceResult = {
          sentenceId: sentence.id, sentenceUuid: sentence.uuid,
          sentenceText: sentence.text, translation: sentence.translation,
          wrongWordCount: Math.max(...newModeResults.map((r) => r.wrongWordIndices.length), 0),
          isCorrect: newModeResults.every((r) => r.isCorrect),
          modeResults: newModeResults,
        };
        return {
          completions: { ...s.completions, [sentence.id]: { ...completion, modeResults: newModeResults, currentModeIndex: 3, isFullyCompleted: true } },
          sentenceResults: [...s.sentenceResults, finalResult],
          isTyping: false,
        };
      }

      const nextMode = SENTENCE_LEARN_MODE_SEQUENCE[newModeIdx] ?? "sentenceWithText";
      return {
        completions: { ...s.completions, [sentence.id]: { ...completion, modeResults: newModeResults, currentModeIndex: newModeIdx } },
        currentMode: nextMode,
        isTyping: false,
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

    const nextSentence = s.sentences[nextIdx];
    set({
      currentSentenceIndex: nextIdx,
      currentMode: SENTENCE_LEARN_MODE_SEQUENCE[s.completions[nextSentence.id]?.currentModeIndex ?? 0] ?? "sentenceWithText",
      isTyping: false,
    });
    return false;
  },

  finishSession: () => set({ phase: "finished", isTyping: false }),

  resetSession: () =>
    set({
      phase: "idle", sentences: [], completions: {},
      currentSentenceIndex: 0, currentMode: "sentenceWithText",
      isTyping: false, startTime: null, elapsedSeconds: 0, sentenceResults: [],
    }),

  setElapsedSeconds: (s) => set({ elapsedSeconds: s }),
  tickTimer: () => set((st) => ({ elapsedSeconds: st.elapsedSeconds + 1 })),
}));

// ── Selectors ──

export function getCurrentSentence(state: SentenceSessionState): Sentence | null {
  return state.sentences[state.currentSentenceIndex] ?? null;
}
