import type { Sentence } from "@/types/domain";
import type { DifficultyLevel } from "@/types/domain";
import type { StatementEntry } from "@/types/sentence";

/**
 * 将 JSON 源数据中的单条语句转换为运行时 Sentence 对象。
 *
 * - wordCount 从 english 自动计算
 * - createdAt/updatedAt 静态数据统一设为 0
 */
export function convertToSentence(
  entry: StatementEntry,
  index: number,
  courseFileName: string,
  courseTitle: string,
  bookId: string,
  level: DifficultyLevel,
): Sentence {
  return {
    id: `${courseFileName}-${index}`,
    chinese: entry.chinese,
    english: entry.english,
    soundmark: entry.soundmark,
    difficulty: level,
    source: "builtin",
    wordCount: entry.english.split(/\s+/).length,
    order: index + 1,
    courseId: courseFileName,
    courseTitle,
    bookId,
    createdAt: 0,
    updatedAt: 0,
  };
}
