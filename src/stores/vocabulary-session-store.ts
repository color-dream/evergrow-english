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
import {
  createNewWordTaskQueue,
  createReviewTaskQueue,
  sortQueueByPriority,
  createTask,
} from "@/lib/fsrs/learning-scheduler";
import type { LearningTask } from "@/lib/fsrs/learning-scheduler";
import type { FSRSState } from "@/types/domain";
import { SKIP_WRONG_THRESHOLD, DEFAULT_WORDS_PER_ROUND } from "@/lib/constants";

/** 复习卡片的FSRS元数据 */
export interface ReviewWordMeta {
  previousRating: number;
  lastReviewTime: number;
  stability: number;
  fsrs?: FSRSState;
}

interface VocabularySessionState {
  // ── 配置 ──
  selectedWordBook: WordBookId | null;
  typingMode: TypingMode;
  wordsPerRound: number;

  // ── 阶段管理 ──
  phase: SessionPhase;

  // ── 新词阶段 ──
  newWords: Word[];
  newWordCompletions: Record<string, WordCompletion>;

  // ── 复习阶段 ──
  reviewWords: Word[];
  reviewWordCompletions: Record<string, WordCompletion>;
  reviewMeta: Record<string, ReviewWordMeta>;

  // ── 任务队列（交错调度）──
  taskQueue: LearningTask[];
  completedModeCount: number;
  lastCompletedWordId: string | null;

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
  setWordsPerRound: (n: number) => void;
  setIsTyping: (val: boolean) => void;

  startNewWordsPhase: (words: Word[]) => void;
  startReviewPhase: (
    words: Word[],
    meta: Record<string, ReviewWordMeta>,
  ) => void;

  scheduleNextTask: (result: WordModeResult) => void;

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

/** 聚合4模式结果为最终 WordResult */
function aggregateWordResult(
  wordId: string,
  wordText: string,
  definition: string,
  allResults: WordModeResult[],
): WordResult {
  const worstWrongCount = Math.max(...allResults.map((r) => r.wrongCount));
  const isCorrect = allResults.every((r) => r.isCorrect);

  const mergedMistakes: Record<number, string[]> = {};
  for (const r of allResults) {
    for (const [pos, mistakes] of Object.entries(r.letterMistakes)) {
      const key = Number(pos);
      mergedMistakes[key] = [...(mergedMistakes[key] ?? []), ...mistakes];
    }
  }

  return {
    wordId,
    wordText,
    definition,
    wrongCount: worstWrongCount,
    isCorrect,
    letterMistakes: mergedMistakes,
  };
}

export const useVocabularySessionStore = create<VocabularySessionState>()(
  (set) => ({
    selectedWordBook: null,
    typingMode: "strict",
    wordsPerRound: DEFAULT_WORDS_PER_ROUND,

    phase: "idle",

    newWords: [],
    newWordCompletions: {},

    reviewWords: [],
    reviewWordCompletions: {},
    reviewMeta: {},

    taskQueue: [],
    completedModeCount: 0,
    lastCompletedWordId: null,

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
    setWordsPerRound: (n) =>
      set((s) => {
        const isActive = s.phase === "new-words" || s.phase === "review";
        if (!isActive) return { wordsPerRound: n };
        // 活跃中更改 → 重置会话进度，保留配置
        return {
          wordsPerRound: n,
          phase: "idle",
          newWords: [],
          newWordCompletions: {},
          reviewWords: [],
          reviewWordCompletions: {},
          reviewMeta: {},
          taskQueue: [],
          completedModeCount: 0,
          lastCompletedWordId: null,
          currentWordIndex: 0,
          startTime: null,
          endTime: null,
          elapsedSeconds: 0,
          wordResults: [],
          totalKeystrokes: 0,
          totalCorrectKeystrokes: 0,
        };
      }),
    setIsTyping: (val) => set({ isTyping: val }),

    startNewWordsPhase: (words) => {
      const completions: Record<string, WordCompletion> = {};
      for (const word of words) {
        completions[word.id] = createCompletion(word.id);
      }

      const queue = createNewWordTaskQueue(words);
      const firstTask = queue[0];

      set({
        phase: "new-words",
        newWords: words,
        newWordCompletions: completions,
        taskQueue: queue.slice(1), // [0] 已取出作为当前任务
        completedModeCount: 0,
        lastCompletedWordId: null,
        currentWordIndex: firstTask?.wordIndex ?? 0,
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

      // 构建 FSRS 优先级排序的初始队列
      const fsrsMap: Record<string, FSRSState> = {};
      for (const [wordId, m] of Object.entries(meta)) {
        if (m.fsrs) {
          fsrsMap[wordId] = m.fsrs;
        }
      }
      const queue = createReviewTaskQueue(words, fsrsMap);
      const firstTask = queue[0];

      set({
        phase: "review",
        reviewWords: words,
        reviewWordCompletions: completions,
        reviewMeta: meta,
        taskQueue: queue.slice(1),
        completedModeCount: 0,
        lastCompletedWordId: null,
        currentWordIndex: firstTask?.wordIndex ?? 0,
        isTyping: true,
      });
    },

    scheduleNextTask: (result) =>
      set((s) => {
        const isNewWords = s.phase === "new-words";
        const wordsKey = isNewWords ? "newWords" : "reviewWords";
        const completionsKey = isNewWords
          ? "newWordCompletions"
          : "reviewWordCompletions";
        const words = s[wordsKey] as Word[];
        const completions = { ...s[completionsKey] };

        // 从 taskQueue[0] 获取当前任务（已经在展示前弹出，此处通过
        // currentWordIndex 找到当前词和模式）
        const currentWord = words[s.currentWordIndex];
        if (!currentWord) return {};

        const completion = completions[currentWord.id];
        if (!completion) return {};

        // 当前模式索引
        const currentMode = completion.currentModeIndex;

        // 递增已完成模式计数
        const newCompletedModeCount = s.completedModeCount + 1;

        // 追加本模式结果
        const updatedModeResults = [...completion.modeResults, result];

        let newQueue = [...s.taskQueue];
        let newCompletions = { ...completions };
        let newLastCompletedWordId: string | null = null;
        let newWordResults = [...s.wordResults];
        let nextWordIndex = s.currentWordIndex;
        let nextPhase: SessionPhase = s.phase;

        if (result.wrongCount >= SKIP_WRONG_THRESHOLD) {
          // ── 失败：重置到 mode 0 ──
          newCompletions[currentWord.id] = {
            ...completion,
            currentModeIndex: 0,
            modeResults: [],
            isFullyCompleted: false,
          };

          // 高优重新入队
          const resetTask = createTask(currentWord.id, s.currentWordIndex, 0, result.wrongCount);
          newQueue.push(resetTask);
        } else if (currentMode >= 3) {
          // ── 4 种模式全完成 ──
          newCompletions[currentWord.id] = {
            ...completion,
            modeResults: updatedModeResults,
            currentModeIndex: 4,
            isFullyCompleted: true,
          };

          // 聚合 WordResult
          const finalResult = aggregateWordResult(
            currentWord.id,
            currentWord.text,
            currentWord.definition,
            updatedModeResults,
          );
          newWordResults = [...newWordResults, finalResult];
          newLastCompletedWordId = currentWord.id;
        } else {
          // ── 推进到下一模式 ──
          const nextMode = currentMode + 1;
          newCompletions[currentWord.id] = {
            ...completion,
            modeResults: updatedModeResults,
            currentModeIndex: nextMode,
          };

          const nextTask = createTask(currentWord.id, s.currentWordIndex, nextMode, result.wrongCount);
          newQueue.push(nextTask);
        }

        // 按优先级重排
        const fsrsMap: Record<string, FSRSState> = {};
        if (!isNewWords) {
          for (const [wordId, meta] of Object.entries(s.reviewMeta)) {
            if (meta.fsrs) {
              fsrsMap[wordId] = meta.fsrs;
            }
          }
        }
        newQueue = sortQueueByPriority(newQueue, isNewWords, fsrsMap);

        // 取出队头作为下一个任务
        if (newQueue.length > 0) {
          const nextTask = newQueue[0];
          newQueue = newQueue.slice(1);
          nextWordIndex = nextTask.wordIndex;

          // 需要更新 completion 中的 modeIndex 以反映当前任务
          const nextCompletion = newCompletions[nextTask.wordId];
          if (nextCompletion && nextCompletion.currentModeIndex !== nextTask.modeIndex) {
            newCompletions[nextTask.wordId] = {
              ...nextCompletion,
              currentModeIndex: nextTask.modeIndex,
            };
          }
        } else {
          // 队列空 → 阶段结束
          if (isNewWords) {
            // 新词阶段结束，由 VocabularyPage useEffect 侦测并触发复习加载
            // 设为越界索引使 getCurrentWord 返回 null，避免闪烁
            nextWordIndex = words.length;
          } else {
            // 复习阶段结束
            nextPhase = "finished";
          }
        }

        return {
          [completionsKey]: newCompletions,
          taskQueue: newQueue,
          completedModeCount: newCompletedModeCount,
          lastCompletedWordId: newLastCompletedWordId,
          currentWordIndex: nextWordIndex,
          wordResults: newWordResults,
          phase: nextPhase,
          endTime: nextPhase === "finished" ? Date.now() : s.endTime,
        };
      }),

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
        taskQueue: [],
        completedModeCount: 0,
        lastCompletedWordId: null,
        currentWordIndex: 0,
        startTime: null,
        endTime: null,
        elapsedSeconds: 0,
        wordResults: [],
        totalKeystrokes: 0,
        totalCorrectKeystrokes: 0,
      }),
  }),
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
  completion: WordCompletion,
): WordLearnMode {
  return WORD_LEARN_MODE_SEQUENCE[completion.currentModeIndex] ?? "typeWithWord";
}
