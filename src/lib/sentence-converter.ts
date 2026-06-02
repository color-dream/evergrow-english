import type { Sentence } from "@/types/domain";
import type {
  SentenceEntry,
  SentenceBookJSONMeta,
  LessonEntry,
} from "@/types/sentence";
import { BASE_PATH } from "./constants";

/**
 * 将 JSON 源数据中的单条句子转换为运行时 Sentence 对象。
 *
 * - wordCount 从 text 自动计算
 * - difficulty 继承 meta.level
 * - audioUrl 从 uuid 自动构造
 * - createdAt/updatedAt 静态数据统一设为 0
 */
export function convertToSentence(
  entry: SentenceEntry,
  meta: SentenceBookJSONMeta,
  lesson: LessonEntry,
): Sentence {
  return {
    id: entry.id,
    uuid: entry.uuid,
    text: entry.text,
    translation: entry.translation,
    phonetic: entry.phonetic,
    segments: entry.segments,
    audioUrl: `${BASE_PATH}audio/sentences/${entry.uuid}.mp3`,
    difficulty: meta.level,
    source: "builtin",
    tags: entry.tags ?? [],
    wordCount: entry.text.split(/\s+/).length,
    order: entry.order,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    bookId: meta.id,
    createdAt: 0,
    updatedAt: 0,
  };
}
