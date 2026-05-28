import Dexie, { type EntityTable } from "dexie";
import type { LearningCard, StudySessionRecord } from "@/lib/fsrs/types";
import type { LearningSessionRecord } from "./learning-session-repository";

export class EvergrowDB extends Dexie {
  learningCards!: EntityTable<LearningCard, "id">;
  studySessions!: EntityTable<StudySessionRecord, "id">;
  learningSessions!: EntityTable<LearningSessionRecord, "bookId">;

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
