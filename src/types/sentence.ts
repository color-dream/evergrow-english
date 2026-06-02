import type { DifficultyLevel, SyntaxSegment } from "./domain";

// ===== 句子本标识 =====

/** 句子本标识 — 每新增一个本子加一项 */
export type SentenceBookId =
  | "daily-a1"
  | "daily-a2"
  | "daily-b1"
  | "travel-b1"
  | "work-b2"
  | "quotes-b2";

// ===== 句子学习模式（阶段二细化） =====

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

// ===== JSON 源数据类型 =====

/** JSON 文件中的单条句子 */
export interface SentenceEntry {
  id: string;
  uuid: string;
  text: string;
  translation: string;
  phonetic?: string;
  segments?: SyntaxSegment[];
  order: number;
  tags?: string[];
}

/** JSON 文件中的 lesson */
export interface LessonEntry {
  id: string;
  title: string;
  description?: string;
  sentences: SentenceEntry[];
}

/** JSON 文件的元信息 */
export interface SentenceBookJSONMeta {
  id: string;
  label: string;
  description: string;
  level: DifficultyLevel;
  topic: string;
  version: string;
  language?: string;
}

/** JSON 文件的完整结构 */
export interface SentenceBookJSON {
  meta: SentenceBookJSONMeta;
  lessons: LessonEntry[];
}

// ===== 句子进度追踪（阶段二使用） =====

export interface SentenceProgressRecord {
  bookId: string;
  lessonId: string;
  statementIndex: number;
  updatedAt: number;
}

export interface SentenceLessonProgressRecord {
  bookId: string;
  lessonId: string;
  completed: boolean;
  completedAt: number;
  score: number;
}
