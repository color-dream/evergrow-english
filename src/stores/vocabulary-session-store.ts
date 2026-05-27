import { create } from "zustand";
import type { Word } from "@/types/domain";
import type {
  TypingMode,
  SessionPhase,
  WordResult,
  WordBookId,
  WordLearnMode,
  WordModeResult,
  WordCompletion,
} from "@/types/vocabulary";
import { WORD_LEARN_MODE_SEQUENCE } from "@/types/vocabulary";

/** 复习卡片的FSRS元数据 */
export interface ReviewWordMeta {
  previousRating: number;
  lastReviewTime: number;
  stability: number;
}

interface VocabularySessionState {
  // ── 配置 ──
  selectedWordBook: WordBookId | null;
  typingMode: TypingMode;

  // ── 阶段管理 ──
  phase: SessionPhase;

  // ── 新词阶段 ──
  newWords: Word[];
  newWordCompletions: Record<string, WordCompletion>;

  // ── 复习阶段 ──
  reviewWords: Word[];
  reviewWordCompletions: Record<string, WordCompletion>;
  reviewMeta: Record<string, ReviewWordMeta>;

  // ── 当前位置 ──
  currentWordIndex: number;

  // ── 打字状态 ──
  isTyping: boolean;

  // ── 计时 ──
  startTime: number | null;
  endTime: number | null;
  elapsedSeconds: number;

  // ── 统计 ──
  wordResults: WordResult[];
  totalKeystrokes: number;
  totalCorrectKeystrokes: number;

  // ── Actions ──
  setSelectedWordBook: (id: WordBookId) => void;
  setTypingMode: (mode: TypingMode) => void;
  setIsTyping: (val: boolean) => void;

  startNewWordsPhase: (words: Word[]) => void;
  startReviewPhase: (
    words: Word[],
    meta: Record<string, ReviewWordMeta>
  ) => void;

  recordModeResult: (wordId: string, result: WordModeResult) => void;
  advanceToNextMode: () => void;
  resetToFirstMode: () => void;
  advanceToNextWord: () => void;

  addWordResult: (result: WordResult) => void;
  addKeystrokes: (correct: boolean) => void;
  setElapsedSeconds: (seconds: number) => void;
  tickTimer: () => void;
  finishSession: () => void;
  resetSession: () => void;
}

/** 创建空的 WordCompletion */
function createCompletion(wordId: string): WordCompletion {
  return {
    wordId,
    modeResults: [],
    currentModeIndex: 0,
    isFullyCompleted: false,
  };
}

export const useVocabularySessionStore = create<VocabularySessionState>()(
  (set) => ({
    selectedWordBook: null,
    typingMode: "strict",

    phase: "idle",

    newWords: [],
    newWordCompletions: {},

    reviewWords: [],
    reviewWordCompletions: {},
    reviewMeta: {},

    currentWordIndex: 0,

    isTyping: false,

    startTime: null,
    endTime: null,
    elapsedSeconds: 0,

    wordResults: [],
    totalKeystrokes: 0,
    totalCorrectKeystrokes: 0,

    setSelectedWordBook: (id) => set({ selectedWordBook: id }),
    setTypingMode: (mode) => set({ typingMode: mode }),
    setIsTyping: (val) => set({ isTyping: val }),

    startNewWordsPhase: (words) => {
      const completions: Record<string, WordCompletion> = {};
      for (const word of words) {
        completions[word.id] = createCompletion(word.id);
      }
      set({
        phase: "new-words",
        newWords: words,
        newWordCompletions: completions,
        currentWordIndex: 0,
        isTyping: true,
        startTime: Date.now(),
        endTime: null,
        elapsedSeconds: 0,
        wordResults: [],
        totalKeystrokes: 0,
        totalCorrectKeystrokes: 0,
      });
    },

    startReviewPhase: (words, meta) => {
      const completions: Record<string, WordCompletion> = {};
      for (const word of words) {
        completions[word.id] = createCompletion(word.id);
      }
      set({
        phase: "review",
        reviewWords: words,
        reviewWordCompletions: completions,
        reviewMeta: meta,
        currentWordIndex: 0,
        isTyping: true,
      });
    },

    recordModeResult: (wordId, result) =>
      set((s) => {
        const isNewWords = s.phase === "new-words";
        const completionsKey = isNewWords
          ? "newWordCompletions"
          : "reviewWordCompletions";
        const completions = { ...s[completionsKey] };
        const completion = completions[wordId];
        if (!completion) return {};

        completions[wordId] = {
          ...completion,
          modeResults: [...completion.modeResults, result],
        };

        return { [completionsKey]: completions };
      }),

    advanceToNextMode: () =>
      set((s) => {
        const isNewWords = s.phase === "new-words";
        const wordsKey = isNewWords ? "newWords" : "reviewWords";
        const completionsKey = isNewWords
          ? "newWordCompletions"
          : "reviewWordCompletions";
        const words = s[wordsKey];
        const completions = { ...s[completionsKey] };
        const currentWord = words[s.currentWordIndex];
        if (!currentWord) return {};

        const completion = completions[currentWord.id];
        if (!completion) return {};

        const nextModeIndex = completion.currentModeIndex + 1;
        completions[currentWord.id] = {
          ...completion,
          currentModeIndex: nextModeIndex,
          isFullyCompleted: nextModeIndex >= 4,
        };

        return { [completionsKey]: completions };
      }),

    resetToFirstMode: () =>
      set((s) => {
        const isNewWords = s.phase === "new-words";
        const wordsKey = isNewWords ? "newWords" : "reviewWords";
        const completionsKey = isNewWords
          ? "newWordCompletions"
          : "reviewWordCompletions";
        const words = s[wordsKey];
        const completions = { ...s[completionsKey] };
        const currentWord = words[s.currentWordIndex];
        if (!currentWord) return {};

        completions[currentWord.id] = {
          ...completions[currentWord.id],
          currentModeIndex: 0,
          modeResults: [],
          isFullyCompleted: false,
        };

        return { [completionsKey]: completions };
      }),

    advanceToNextWord: () =>
      set((s) => {
        const isNewWords = s.phase === "new-words";
        const wordsKey = isNewWords ? "newWords" : "reviewWords";
        const words = s[wordsKey];
        const nextIndex = s.currentWordIndex + 1;

        if (nextIndex >= words.length) {
          if (isNewWords) {
            return {
              currentWordIndex: nextIndex,
            };
          }
          return {
            currentWordIndex: nextIndex,
            phase: "finished",
            endTime: Date.now(),
          };
        }

        return { currentWordIndex: nextIndex };
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
        newWords: [],
        newWordCompletions: {},
        reviewWords: [],
        reviewWordCompletions: {},
        reviewMeta: {},
        currentWordIndex: 0,
        startTime: null,
        endTime: null,
        elapsedSeconds: 0,
        wordResults: [],
        totalKeystrokes: 0,
        totalCorrectKeystrokes: 0,
      }),
  })
);

/** 获取当前活跃的单词和完成状态 */
export function getCurrentWord(state: VocabularySessionState): {
  word: Word;
  completion: WordCompletion;
} | null {
  const isNewWords = state.phase === "new-words";
  const words = isNewWords ? state.newWords : state.reviewWords;
  const completions = isNewWords
    ? state.newWordCompletions
    : state.reviewWordCompletions;

  const word = words[state.currentWordIndex];
  if (!word) return null;

  const completion = completions[word.id];
  if (!completion) return null;

  return { word, completion };
}

/** 获取当前单词的学习模式 */
export function getCurrentLearnMode(
  completion: WordCompletion
): WordLearnMode {
  return WORD_LEARN_MODE_SEQUENCE[completion.currentModeIndex] ?? "typeWithWord";
}
