import type { Sentence } from "@/types/domain";
import type { DifficultyLevel } from "@/types/domain";
import type { SentenceBookId, SentenceBookJSON } from "@/types/sentence";
import { convertToSentence } from "./sentence-converter";

// ===== 注册表元信息 =====

export interface SentenceBookInfo {
  id: SentenceBookId;
  label: string;
  description: string;
  sentenceCount: number;
  lessonCount: number;
  level: DifficultyLevel;
  topic: string;
}

export const SENTENCE_BOOK_META: Record<SentenceBookId, SentenceBookInfo> = {
  "daily-a1": {
    id: "daily-a1",
    label: "日常口语 A1",
    description: "入门级日常生活短句，涵盖问候、介绍、时间、购物等基础场景",
    sentenceCount: 40,
    lessonCount: 3,
    level: "A1",
    topic: "daily",
  },
  "daily-a2": {
    id: "daily-a2",
    label: "日常口语 A2",
    description: "基础日常场景对话，涵盖问路、点餐、天气、计划等话题",
    sentenceCount: 40,
    lessonCount: 3,
    level: "A2",
    topic: "daily",
  },
  "daily-b1": {
    id: "daily-b1",
    label: "日常口语 B1",
    description: "中级日常对话，涵盖情感表达、观点陈述、建议请求等场景",
    sentenceCount: 40,
    lessonCount: 3,
    level: "B1",
    topic: "daily",
  },
  "travel-b1": {
    id: "travel-b1",
    label: "旅行英语 B1",
    description: "旅行场景常用句，涵盖机场、酒店、餐厅、问路等",
    sentenceCount: 30,
    lessonCount: 3,
    level: "B1",
    topic: "travel",
  },
  "work-b2": {
    id: "work-b2",
    label: "职场英语 B2",
    description: "职场常用表达，涵盖会议、邮件、汇报、协商等场景",
    sentenceCount: 30,
    lessonCount: 3,
    level: "B2",
    topic: "work",
  },
  "quotes-b2": {
    id: "quotes-b2",
    label: "经典名言 B2",
    description: "经典英语名言警句，提升语感和文化理解",
    sentenceCount: 20,
    lessonCount: 2,
    level: "B2",
    topic: "quote",
  },
};

export const SENTENCE_BOOK_OPTIONS: SentenceBookInfo[] =
  Object.values(SENTENCE_BOOK_META);

// ===== 动态加载 =====

/**
 * 动态 import JSON → 按 lesson + order 排序 → 转换为 Sentence[]
 */
export async function loadSentenceBook(id: SentenceBookId): Promise<Sentence[]> {
  const module = await import(`@/assets/sentences/${id}.json`);
  const json = module.default as SentenceBookJSON;
  const sentences: Sentence[] = [];

  for (const lesson of json.lessons) {
    for (const entry of lesson.sentences) {
      sentences.push(convertToSentence(entry, json.meta, lesson));
    }
  }

  // 按 lesson 出现顺序 + sentence.order 排序
  sentences.sort((a, b) => {
    if (a.lessonId !== b.lessonId) {
      const aIdx = json.lessons.findIndex((l) => l.id === a.lessonId);
      const bIdx = json.lessons.findIndex((l) => l.id === b.lessonId);
      return aIdx - bIdx;
    }
    return a.order - b.order;
  });

  return sentences;
}
