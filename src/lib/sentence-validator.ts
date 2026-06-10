import type { StatementEntry } from "@/types/sentence";

export interface ValidationError {
  file: string;
  index?: number;
  field: string;
  message: string;
}

/**
 * 校验单个课程文件（平铺 StatementEntry[]）。
 *
 * 校验规则：
 * - chinese 非空
 * - english 非空
 * - soundmark 非空（基本检查，不强制格式 — earthworm 原数据有的含中文注释）
 */
export function validateCourseFile(
  statements: StatementEntry[],
  fileName: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(statements)) {
    errors.push({ file: fileName, field: "root", message: "文件内容不是数组" });
    return errors;
  }

  if (statements.length === 0) {
    errors.push({ file: fileName, field: "root", message: "文件内容为空数组" });
    return errors;
  }

  for (let i = 0; i < statements.length; i++) {
    const s = statements[i];

    if (!s.chinese?.trim()) {
      errors.push({ file: fileName, index: i, field: "chinese", message: "chinese 为空" });
    }

    if (!s.english?.trim()) {
      errors.push({ file: fileName, index: i, field: "english", message: "english 为空" });
    }

    if (!s.soundmark?.trim()) {
      errors.push({ file: fileName, index: i, field: "soundmark", message: "soundmark 为空" });
    }
  }

  return errors;
}
