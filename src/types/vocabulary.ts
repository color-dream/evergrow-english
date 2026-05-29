/** 词库标识 */
export type WordBookId = "cet4" | "cet6";

/** 打字模式：严格 = 即时比对打错重置；宽松 = 退格修正，输完比对 */
export type TypingMode = "strict" | "loose";

/** 字母显示状态 */
export type LetterState = "normal" | "correct" | "wrong";

/** 学习阶段 */
export type SessionPhase = "idle" | "new-words" | "review" | "finished";

/** 每个单词的4种学习模式（渐进式隐藏） */
export type WordLearnMode =
  | "typeWithWord"
  | "typeWithoutWord"
  | "typeWithoutWordAndTranslation"
  | "typeWithoutWordAndTranslationAndPhonetic";

/** 4种模式的固定顺序 */
export const WORD_LEARN_MODE_SEQUENCE: WordLearnMode[] = [
  "typeWithWord",
  "typeWithoutWord",
  "typeWithoutWordAndTranslation",
  "typeWithoutWordAndTranslationAndPhonetic",
];

/** 4种模式的中文名称 */
export const WORD_LEARN_MODE_LABELS: Record<WordLearnMode, string> = {
  typeWithWord: "照单词输入",
  typeWithoutWord: "不显示单词",
  typeWithoutWordAndTranslation: "不显示单词和翻译",
  typeWithoutWordAndTranslationAndPhonetic: "不显示单词和翻译和音标",
};

/** 单个词的学习结果 */
export interface WordResult {
  wordId: string;
  wordText: string;
  definition: string;
  usphone?: string;
  ukphone?: string;
  wrongCount: number;
  isCorrect: boolean;
  letterMistakes: Record<number, string[]>;
}

/** 单模式结果 */
export interface WordModeResult {
  mode: WordLearnMode;
  wrongCount: number;
  isCorrect: boolean;
  letterMistakes: Record<number, string[]>;
}

/** 单词完成追踪（4种模式） */
export interface WordCompletion {
  wordId: string;
  modeResults: WordModeResult[];
  currentModeIndex: number;
  isFullyCompleted: boolean;
}

/** 一轮结束后的统计数据 */
export interface SessionStats {
  totalTimeSec: number;
  accuracy: number;
  wpm: number;
  wordsCompleted: number;
  wordsCorrect: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
}

/** useReducer state for per-word typing */
export interface WordTypingState {
  displayWord: string;
  inputWord: string;
  letterStates: LetterState[];
  isFinished: boolean;
  hasWrong: boolean;
  wrongCount: number;
  randomLetterVisible: boolean[];
}

/** useReducer actions for per-word typing */
export type WordTypingAction =
  | { type: "INIT"; displayWord: string; randomVisible: boolean[] }
  | { type: "ADD_CORRECT"; position: number; char: string }
  | { type: "ADD_WRONG"; position: number; char: string }
  | { type: "ADD_CHAR"; position: number; char: string }
  | { type: "DELETE_CHAR" }
  | {
      type: "COMPARE_ALL";
      results: Array<{ position: number; correct: boolean }>;
    }
  | { type: "RESET" }
  | { type: "FINISH" };
