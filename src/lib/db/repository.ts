import { getDB } from "./database";
import type { LearningCard, StudySessionRecord } from "@/lib/fsrs/types";
import type { FSRSState } from "@/types/domain";

const db = () => getDB();

// ── LearningCard CRUD ──

export async function getCardById(
  id: string
): Promise<LearningCard | undefined> {
  return db().learningCards.get(id);
}

export async function getCardsByBookId(
  bookId: string
): Promise<LearningCard[]> {
  return db().learningCards.where("bookId").equals(bookId).toArray();
}

export async function getAllCards(): Promise<LearningCard[]> {
  return db().learningCards.toArray();
}

export async function upsertCard(card: LearningCard): Promise<void> {
  await db().learningCards.put(card);
}

export async function bulkUpsertCards(cards: LearningCard[]): Promise<void> {
  await db().learningCards.bulkPut(cards);
}

export async function getCardCount(): Promise<number> {
  return db().learningCards.count();
}

/** 获取状态为指定值的卡片数 */
export async function getCardCountByState(
  state: FSRSState["state"]
): Promise<number> {
  return db().learningCards.where("fsrs.state").equals(state).count();
}

// ── StudySession CRUD ──

export async function addStudySession(
  session: StudySessionRecord
): Promise<number | undefined> {
  return db().studySessions.add(session);
}

export async function getRecentSessions(
  limit = 10
): Promise<StudySessionRecord[]> {
  return db()
    .studySessions.orderBy("startTime")
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getTotalStudySessions(): Promise<number> {
  return db().studySessions.count();
}

export async function getTotalCardsReviewed(): Promise<number> {
  const sessions = await db().studySessions.toArray();
  return sessions.reduce((sum, s) => sum + s.cardsReviewed, 0);
}
