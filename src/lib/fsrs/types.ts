import type { FSRSState } from "@/types/domain";

/** Dexie 持久化的学习卡片记录 */
export interface LearningCard {
  id: string;
  bookId: string;
  cardType: "word" | "sentence";

  // 单词卡片字段（cardType === "word" 时使用）
  wordText: string;
  definition: string;
  usphone?: string;
  ukphone?: string;

  // 句子卡片字段（cardType === "sentence" 时使用）
  sentenceText?: string;
  sentenceTranslation?: string;
  sentenceSoundmark?: string;

  // FSRS 记忆状态
  fsrs: FSRSState;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

/** Dexie 持久化的学习会话记录 */
export interface StudySessionRecord {
  id?: number;
  sessionType: "review" | "learn-new" | "mixed";
  startTime: number;
  endTime: number;
  cardsReviewed: number;
  cardsCorrect: number;
  totalTimeSpentMs: number;
}
