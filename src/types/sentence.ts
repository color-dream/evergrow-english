// ===== 句子本标识 =====

/** 句子本标识 — 每新增一个本子加一项 */
export type SentenceBookId =
  | "xingrong-1"
  | "xingrong-2"
  | "xingrong-3"
  | "xingrong-4"
  | "xingrong-5";

// ===== 句子学习模式 =====

/** 句子学习模式 — 逐词输入，非逐字母 */
export type SentenceLearnMode =
  | "sentenceWithText"
  | "sentenceWithoutText"
  | "sentenceFullBlind";

export const SENTENCE_LEARN_MODE_SEQUENCE: SentenceLearnMode[] = [
  "sentenceWithText",
  "sentenceWithoutText",
  "sentenceFullBlind",
];

export const SENTENCE_LEARN_MODE_LABELS: Record<SentenceLearnMode, string> = {
  sentenceWithText: "显示句子",
  sentenceWithoutText: "隐藏句子",
  sentenceFullBlind: "全隐藏（听写）",
};

// ===== JSON 源数据类型（Earthworm 风格） =====

/**
 * JSON 文件中的单条语句 — 三字段极简模型（Earthworm）
 *
 * 每个 JSON 文件就是 `StatementEntry[]` 平铺数组，无任何包装。
 * 文件名即课程序号，如 01.json、02.json、...、55.json。
 */
export interface StatementEntry {
  /** 中文翻译 — 用户看到的提示 */
  chinese: string;
  /** 英文句子 — 用户打字的目标 */
  english: string;
  /** 音标 — 逐词 `/word/` 格式，如 "/aɪ/ /laɪk/ /ðə/ /fud/" */
  soundmark: string;
}

// ===== 句子进度追踪 =====

export interface SentenceProgressRecord {
  bookId: string;
  courseId: string;
  statementIndex: number;
  updatedAt: number;
}

export interface SentenceLessonProgressRecord {
  bookId: string;
  courseId: string;
  completed: boolean;
  completedAt: number;
  score: number;
}
