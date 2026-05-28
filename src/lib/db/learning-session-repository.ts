import { getDB } from "./database";

/** 学习会话持久化记录 */
export interface LearningSessionRecord {
  bookId: string; // 主键（同 WordBookId）
  stateJson: string; // JSON 序列化的会话状态快照
  updatedAt: number;
}

export async function saveLearningSession(
  record: LearningSessionRecord
): Promise<void> {
  await getDB().learningSessions.put(record);
}

export async function loadLearningSession(
  bookId: string
): Promise<LearningSessionRecord | undefined> {
  return getDB().learningSessions.get(bookId);
}

export async function deleteLearningSession(
  bookId: string
): Promise<void> {
  await getDB().learningSessions.delete(bookId);
}
