import type { Sentence } from "@/types/domain";
import type { DifficultyLevel } from "@/types/domain";
import type { SentenceBookId, StatementEntry } from "@/types/sentence";

// ===== 注册表元信息 =====

export interface SentenceBookInfo {
  id: SentenceBookId;
  title: string;
  description: string;
  courseCount: number;
  level: DifficultyLevel;
  /** 该本子包含的课程序号范围 */
  courseFiles: string[];
}

/** 中文数字转换（对标 earthworm seed.ts） */
function toChineseNumber(num: number): string {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  let str = "第";
  if (num >= 10) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    if (tens !== 1) str += digits[tens];
    str += "十";
    if (ones !== 0) str += digits[ones];
  } else {
    str += digits[num];
  }
  str += "课";
  return str;
}

/** 根据课程序号推导 CEFR 等级 */
function courseLevel(num: number): DifficultyLevel {
  if (num <= 15) return "A1";
  if (num <= 30) return "A2";
  if (num <= 45) return "B1";
  return "B2";
}

/** 生成连续课程序号的文件名列表 */
function courseFileRange(start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) =>
    String(start + i).padStart(2, "0"),
  );
}

export const SENTENCE_BOOK_META: Record<SentenceBookId, SentenceBookInfo> = {
  xingrong: {
    id: "xingrong",
    title: "星荣零基础英语",
    description: "从单词到复杂句，55 课渐进式构建英语语感，适合零基础到中高级学习者",
    courseCount: 55,
    level: "B1",
    courseFiles: courseFileRange(1, 55),
  },
};

export const SENTENCE_BOOK_OPTIONS: SentenceBookInfo[] =
  Object.values(SENTENCE_BOOK_META);

// ===== 课程元信息 =====

/** 单门课程的元信息（不含语句数据，用于课程列表展示） */
export interface CourseInfo {
  /** JSON 文件名（如 "01"） */
  fileName: string;
  /** 课程序号（1-55） */
  courseNum: number;
  /** 中文课名（如 "第一课"） */
  title: string;
  /** 该课语句数（近似值，精确值需加载后计算） */
  statementCount: number;
  /** CEFR 等级 */
  level: DifficultyLevel;
  /** 所属分册 */
  bookId: SentenceBookId;
}

/** 每个课程文件的近似语句数（基于 earthworm 源数据统计） */
const COURSE_STATEMENT_COUNTS: Record<string, number> = {
  "01": 99, "02": 85, "03": 97, "04": 97, "05": 117,
  "06": 121, "07": 121, "08": 127, "09": 135, "10": 127,
  "11": 147, "12": 129, "13": 141, "14": 139, "15": 127,
  "16": 133, "17": 135, "18": 139, "19": 141, "20": 133,
  "21": 131, "22": 133, "23": 137, "24": 137, "25": 121,
  "26": 137, "27": 137, "28": 153, "29": 147, "30": 139,
  "31": 165, "32": 167, "33": 167, "34": 173, "35": 157,
  "36": 149, "37": 165, "38": 173, "39": 173, "40": 165,
  "41": 155, "42": 157, "43": 155, "44": 169, "45": 147,
  "46": 149, "47": 145, "48": 141, "49": 155, "50": 167,
  "51": 141, "52": 143, "53": 155, "54": 156, "55": 127,
};

/** 获取某个书本下全部课程的元信息 */
export function getCourseInfosForBook(bookId: SentenceBookId): CourseInfo[] {
  const meta = SENTENCE_BOOK_META[bookId];
  return meta.courseFiles.map((fileName) => ({
    fileName,
    courseNum: parseInt(fileName, 10),
    title: toChineseNumber(parseInt(fileName, 10)),
    statementCount: COURSE_STATEMENT_COUNTS[fileName] ?? 150,
    level: courseLevel(parseInt(fileName, 10)),
    bookId,
  }));
}

/** 根据 course fileName 反查所属 bookId */
export function getBookIdForCourse(courseFileName: string): SentenceBookId | null {
  for (const [bookId, meta] of Object.entries(SENTENCE_BOOK_META)) {
    if (meta.courseFiles.includes(courseFileName)) {
      return bookId as SentenceBookId;
    }
  }
  return null;
}

// ===== 动态加载 =====

/**
 * 将 StatementEntry 转换为运行时 Sentence 对象
 */
function convertStatement(
  entry: StatementEntry,
  index: number,
  courseFileName: string,
  courseNum: number,
  bookId: string,
): Sentence {
  return {
    id: `${courseFileName}-${index}`,
    chinese: entry.chinese,
    english: entry.english,
    soundmark: entry.soundmark,
    difficulty: courseLevel(courseNum),
    source: "builtin",
    wordCount: entry.english.split(/\s+/).length,
    order: index + 1,
    courseId: courseFileName,
    courseTitle: toChineseNumber(courseNum),
    bookId,
    createdAt: 0,
    updatedAt: 0,
  };
}

/**
 * 动态 import 多个 JSON 文件 → 按课程序号 + 语句顺序 → 转换为 Sentence[]
 */
export async function loadSentenceBook(
  id: SentenceBookId,
): Promise<Sentence[]> {
  const info = SENTENCE_BOOK_META[id];
  const sentences: Sentence[] = [];

  for (const fileName of info.courseFiles) {
    const module = (await import(
      `@/assets/sentences/xingrong-courses/${fileName}.json`
    )) as { default: StatementEntry[] };
    const statements = module.default;
    const courseNum = parseInt(fileName, 10);

    for (let i = 0; i < statements.length; i++) {
      sentences.push(convertStatement(statements[i], i, fileName, courseNum, id));
    }
  }

  return sentences;
}

/**
 * 动态 import 单个 JSON 文件 → 转换为 Sentence[]
 * 用于单课学习模式。
 */
export async function loadSingleCourse(
  courseFileName: string,
  bookId: SentenceBookId,
): Promise<Sentence[]> {
  const module = (await import(
    `@/assets/sentences/xingrong-courses/${courseFileName}.json`
  )) as { default: StatementEntry[] };
  const statements = module.default;
  const courseNum = parseInt(courseFileName, 10);

  return statements.map((stmt, i) =>
    convertStatement(stmt, i, courseFileName, courseNum, bookId),
  );
}
