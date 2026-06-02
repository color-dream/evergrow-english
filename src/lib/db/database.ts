import Dexie, { type EntityTable } from "dexie";
import type { LearningCard, StudySessionRecord } from "@/lib/fsrs/types";
import type { LearningSessionRecord } from "./learning-session-repository";
import type {
  SentenceProgressRecord,
  SentenceLessonProgressRecord,
} from "@/types/sentence";

export class EvergrowDB extends Dexie {
  learningCards!: EntityTable<LearningCard, "id">;
  studySessions!: EntityTable<StudySessionRecord, "id">;
  learningSessions!: EntityTable<LearningSessionRecord, "bookId">;
  sentenceProgress!: EntityTable<SentenceProgressRecord, "bookId">;
  sentenceLessonProgress!: EntityTable<SentenceLessonProgressRecord, "bookId">;

  constructor() {
    super("evergrow-english");

    this.version(1).stores({
      learningCards:
        "id, cardType, bookId, fsrs.state, fsrs.lastReview, fsrs.stability, createdAt",
      studySessions: "++id, sessionType, startTime, endTime",
    });

    this.version(2).stores({
      learningSessions: "bookId",
    });

    // v3: 句子学习进度追踪
    this.version(3).stores({
      sentenceProgress: "bookId",
      sentenceLessonProgress: "[bookId+lessonId]",
    });
  }
}

/** 单例 */
let dbInstance: EvergrowDB | null = null;

export function getDB(): EvergrowDB {
  if (!dbInstance) {
    dbInstance = new EvergrowDB();
  }
  return dbInstance;
}
