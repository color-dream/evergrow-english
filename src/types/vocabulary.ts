/** 词库标识 */
export type WordBookId = "cet4" | "cet6";

/** 打字模式：严格 = 即时比对打错重置；宽松 = 退格修正，输完比对 */
export type TypingMode = "strict" | "loose";

/** 听写模式：隐藏字母类型 */
export type DictationType =
  | "hideVowel"
  | "hideConsonant"
  | "hideAll"
  | "randomHide";

/** 字母显示状态 */
export type LetterState = "normal" | "correct" | "wrong";

/** 学习阶段 */
export type SessionPhase = "idle" | "active" | "finished";

/** 听写配置 */
export interface DictationConfig {
  enabled: boolean;
  type: DictationType;
}

/** 单个词的学习结果 */
export interface WordResult {
  wordId: string;
  wordText: string;
  definition: string;
  wrongCount: number;
  isCorrect: boolean;
  letterMistakes: Record<number, string[]>;
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
