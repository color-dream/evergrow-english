import type { SentenceBookJSON } from "@/types/sentence";

export interface ValidationError {
  file: string;
  lessonId?: string;
  sentenceId?: string;
  field: string;
  message: string;
}

const VALID_ROLES = [
  "subject", "predicate", "linking-verb", "object",
  "indirect-object", "direct-object", "predicative",
  "object-complement", "attributive", "adverbial",
  "conjunction", "interjection",
];

/**
 * 校验单个句子本 JSON 的结构和内容完整性。
 * 返回错误数组，空数组表示通过。
 */
export function validateSentenceBook(
  json: SentenceBookJSON,
  fileName: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // ── meta 校验 ──
  if (!json.meta?.id) {
    errors.push({ file: fileName, field: "meta.id", message: "缺少 meta.id" });
  }
  if (!json.meta?.label) {
    errors.push({ file: fileName, field: "meta.label", message: "缺少 meta.label" });
  }
  if (!json.meta?.level) {
    errors.push({ file: fileName, field: "meta.level", message: "缺少 meta.level" });
  }

  // ── lessons 校验 ──
  if (!json.lessons?.length) {
    errors.push({ file: fileName, field: "lessons", message: "lessons 数组为空" });
    return errors;
  }

  const seenIds = new Set<string>();
  const seenUuids = new Set<string>();

  for (const lesson of json.lessons) {
    if (!lesson.id) {
      errors.push({ file: fileName, field: "lesson.id", message: "缺少 lesson.id" });
    }
    if (!lesson.title) {
      errors.push({
        file: fileName,
        lessonId: lesson.id,
        field: "lesson.title",
        message: "缺少 lesson.title",
      });
    }

    if (!lesson.sentences?.length) {
      // 空课只警告，不阻塞（骨架文件允许预留课结构）
      console.warn(`⚠️  [${fileName}] 课 "${lesson.title}" 的 sentences 为空`);
      continue;
    }

    let expectedOrder = 1;
    for (const s of lesson.sentences) {
      const ctx = { file: fileName, lessonId: lesson.id, sentenceId: s.id };

      // ID 唯一性
      if (seenIds.has(s.id)) {
        errors.push({ ...ctx, field: "id", message: `ID 重复: ${s.id}` });
      }
      seenIds.add(s.id);

      // UUID 唯一性和必填
      if (!s.uuid) {
        errors.push({ ...ctx, field: "uuid", message: "缺少 uuid" });
      } else if (seenUuids.has(s.uuid)) {
        errors.push({ ...ctx, field: "uuid", message: `UUID 重复: ${s.uuid}` });
      } else {
        seenUuids.add(s.uuid);
      }

      // 必填字段
      if (!s.text) {
        errors.push({ ...ctx, field: "text", message: "缺少 text" });
      }
      if (!s.translation) {
        errors.push({ ...ctx, field: "translation", message: "缺少 translation" });
      }

      // segments 校验
      if (s.segments) {
        const joined = s.segments.map((seg) => seg.text).join(" ");
        // 文本标准化：展开缩写、去标点、归并空格 → 比较词序列
        const normalize = (str: string) =>
          str
            .replace(/\bI'm\b/g, "I am")
            .replace(/\bdon't\b/g, "do not")
            .replace(/\bdidn't\b/g, "did not")
            .replace(/\bcan't\b/g, "can not")
            .replace(/\bcouldn't\b/g, "could not")
            .replace(/\bwon't\b/g, "will not")
            .replace(/\bwouldn't\b/g, "would not")
            .replace(/\bdoesn't\b/g, "does not")
            .replace(/\bhasn't\b/g, "has not")
            .replace(/\bhaven't\b/g, "have not")
            .replace(/\bhadn't\b/g, "had not")
            .replace(/\bIt's\b/g, "It is")
            .replace(/\bit's\b/g, "it is")
            .replace(/\bthat's\b/g, "that is")
            .replace(/\blet's\b/g, "let us")
            .replace(/\bLet's\b/g, "Let us")
            .replace(/[.,!?;:'"()]+/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
        if (normalize(joined) !== normalize(s.text)) {
          errors.push({
            ...ctx,
            field: "segments",
            message: `segments 拼接结果 "${joined}" 与 text 不匹配`,
          });
        }
        for (const seg of s.segments) {
          if (!seg.text) {
            errors.push({ ...ctx, field: "segments[].text", message: "segment.text 为空" });
          }
          if (!VALID_ROLES.includes(seg.role)) {
            errors.push({
              ...ctx,
              field: "segments[].role",
              message: `无效的 role 值: ${seg.role}`,
            });
          }
        }
      }

      // order 连续性
      if (s.order !== expectedOrder) {
        errors.push({
          ...ctx,
          field: "order",
          message: `order 不连续，期望 ${expectedOrder}，实际 ${s.order}`,
        });
      }
      expectedOrder++;
    }
  }

  return errors;
}
