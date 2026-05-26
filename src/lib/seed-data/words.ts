import type { Word } from "@/types/domain";

let _id = 0;
function wid(): string {
  return `w_${String(++_id).padStart(4, "0")}`;
}
function now(): number {
  return Date.now();
}

export const seedWords: Word[] = [
  // A1 常见词
  { id: wid(), text: "hello", lemma: "hello", definition: "你好", partOfSpeech: "interjection", difficulty: "A1", tags: ["greeting"], createdAt: now() },
  { id: wid(), text: "name", lemma: "name", definition: "名字", partOfSpeech: "noun", difficulty: "A1", tags: ["introduction"], createdAt: now() },
  { id: wid(), text: "coffee", lemma: "coffee", definition: "咖啡", partOfSpeech: "noun", difficulty: "A1", tags: ["food"], createdAt: now() },
  { id: wid(), text: "tea", lemma: "tea", definition: "茶", partOfSpeech: "noun", difficulty: "A1", tags: ["food"], createdAt: now() },
  { id: wid(), text: "water", lemma: "water", definition: "水", partOfSpeech: "noun", difficulty: "A1", tags: ["food"], createdAt: now() },
  { id: wid(), text: "school", lemma: "school", definition: "学校", partOfSpeech: "noun", difficulty: "A1", tags: ["education"], createdAt: now() },
  { id: wid(), text: "book", lemma: "book", definition: "书", partOfSpeech: "noun", difficulty: "A1", tags: ["objects"], createdAt: now() },
  { id: wid(), text: "table", lemma: "table", definition: "桌子", partOfSpeech: "noun", difficulty: "A1", tags: ["objects"], createdAt: now() },
  { id: wid(), text: "family", lemma: "family", definition: "家庭", partOfSpeech: "noun", difficulty: "A1", tags: ["family"], createdAt: now() },
  { id: wid(), text: "teacher", lemma: "teacher", definition: "老师", partOfSpeech: "noun", difficulty: "A1", tags: ["jobs"], createdAt: now() },
  { id: wid(), text: "weather", lemma: "weather", definition: "天气", partOfSpeech: "noun", difficulty: "A1", tags: ["weather"], createdAt: now() },
  { id: wid(), text: "today", lemma: "today", definition: "今天", partOfSpeech: "adverb", difficulty: "A1", tags: ["time"], createdAt: now() },
  { id: wid(), text: "tomorrow", lemma: "tomorrow", definition: "明天", partOfSpeech: "adverb", difficulty: "A1", tags: ["time"], createdAt: now() },
  { id: wid(), text: "Monday", lemma: "Monday", definition: "星期一", partOfSpeech: "noun", difficulty: "A1", tags: ["time"], createdAt: now() },
  { id: wid(), text: "please", lemma: "please", definition: "请", partOfSpeech: "adverb", difficulty: "A1", tags: ["politeness"], createdAt: now() },

  // A2 词汇
  { id: wid(), text: "usually", lemma: "usually", definition: "通常", partOfSpeech: "adverb", difficulty: "A2", tags: ["frequency"], createdAt: now() },
  { id: wid(), text: "station", lemma: "station", definition: "车站", partOfSpeech: "noun", difficulty: "A2", tags: ["travel"], createdAt: now() },
  { id: wid(), text: "hospital", lemma: "hospital", definition: "医院", partOfSpeech: "noun", difficulty: "A2", tags: ["places"], createdAt: now() },
  { id: wid(), text: "foreign", lemma: "foreign", definition: "外国的", partOfSpeech: "adjective", difficulty: "A2", tags: ["travel"], createdAt: now() },
  { id: wid(), text: "country", lemma: "country", definition: "国家", partOfSpeech: "noun", difficulty: "A2", tags: ["travel"], createdAt: now() },
  { id: wid(), text: "weekend", lemma: "weekend", definition: "周末", partOfSpeech: "noun", difficulty: "A2", tags: ["time"], createdAt: now() },
  { id: wid(), text: "interested", lemma: "interested", definition: "感兴趣的", partOfSpeech: "adjective", difficulty: "A2", tags: ["emotion"], createdAt: now() },
  { id: wid(), text: "minute", lemma: "minute", definition: "分钟", partOfSpeech: "noun", difficulty: "A2", tags: ["time"], createdAt: now() },
  { id: wid(), text: "party", lemma: "party", definition: "聚会", partOfSpeech: "noun", difficulty: "A2", tags: ["social"], createdAt: now() },
  { id: wid(), text: "vegetable", lemma: "vegetable", definition: "蔬菜", partOfSpeech: "noun", difficulty: "A2", tags: ["food"], createdAt: now() },

  // B1 词汇
  { id: wid(), text: "environment", lemma: "environment", definition: "环境", partOfSpeech: "noun", difficulty: "B1", tags: ["nature"], createdAt: now() },
  { id: wid(), text: "announce", lemma: "announce", definition: "宣布", partOfSpeech: "verb", difficulty: "B1", tags: ["news"], createdAt: now() },
  { id: wid(), text: "policy", lemma: "policy", definition: "政策", partOfSpeech: "noun", difficulty: "B1", tags: ["news"], createdAt: now() },
  { id: wid(), text: "despite", lemma: "despite", definition: "尽管", partOfSpeech: "preposition", difficulty: "B1", tags: ["grammar"], createdAt: now() },
  { id: wid(), text: "suggest", lemma: "suggest", definition: "建议", partOfSpeech: "verb", difficulty: "B1", tags: ["work"], createdAt: now() },
  { id: wid(), text: "mental", lemma: "mental", definition: "心理的", partOfSpeech: "adjective", difficulty: "B1", tags: ["health"], createdAt: now() },
  { id: wid(), text: "apologize", lemma: "apologize", definition: "道歉", partOfSpeech: "verb", difficulty: "B1", tags: ["social"], createdAt: now() },
  { id: wid(), text: "communicate", lemma: "communicate", definition: "交流", partOfSpeech: "verb", difficulty: "B1", tags: ["social"], createdAt: now() },
  { id: wid(), text: "technology", lemma: "technology", definition: "科技", partOfSpeech: "noun", difficulty: "B1", tags: ["technology"], createdAt: now() },
  { id: wid(), text: "schedule", lemma: "schedule", definition: "日程", partOfSpeech: "noun", difficulty: "B1", tags: ["work"], createdAt: now() },
];
