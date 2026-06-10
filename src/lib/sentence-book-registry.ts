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
  "xingrong-1": {
    id: "xingrong-1",
    title: "星荣零基础英语 ①",
    description: "基础入门：第1-10课，从单词到简单句，适合零基础学习者",
    courseCount: 10,
    level: "A1",
    courseFiles: courseFileRange(1, 10),
  },
  "xingrong-2": {
    id: "xingrong-2",
    title: "星荣零基础英语 ②",
    description: "基础进阶：第11-20课，复合句与时态变化，逐步提升",
    courseCount: 10,
    level: "A2",
    courseFiles: courseFileRange(11, 20),
  },
  "xingrong-3": {
    id: "xingrong-3",
    title: "星荣零基础英语 ③",
    description: "中级巩固：第21-30课，复合从句与多样表达",
    courseCount: 10,
    level: "B1",
    courseFiles: courseFileRange(21, 30),
  },
  "xingrong-4": {
    id: "xingrong-4",
    title: "星荣零基础英语 ④",
    description: "中高级：第31-40课，长难句与地道表达",
    courseCount: 10,
    level: "B1",
    courseFiles: courseFileRange(31, 40),
  },
  "xingrong-5": {
    id: "xingrong-5",
    title: "星荣零基础英语 ⑤",
    description: "高级：第41-55课，被动语态、虚拟语气等复杂语法",
    courseCount: 15,
    level: "B2",
    courseFiles: courseFileRange(41, 55),
  },
};

export const SENTENCE_BOOK_OPTIONS: SentenceBookInfo[] =
  Object.values(SENTENCE_BOOK_META);

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
