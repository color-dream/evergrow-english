import type { FSRSState } from "@/types/domain";

/** Dexie 持久化的学习卡片记录 */
export interface LearningCard {
  id: string;
  wordText: string;
  definition: string;
  bookId: string;
  cardType: "word";
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
