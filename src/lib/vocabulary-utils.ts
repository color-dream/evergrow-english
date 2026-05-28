import { loadLearningSession } from "@/lib/db";
import { useSettingsStore } from "@/stores/settings-store";
import type { WordBookId } from "@/types/vocabulary";
import { DEFAULT_WORDS_PER_ROUND, WORDS_PER_ROUND_MIN, WORDS_PER_ROUND_MAX } from "@/lib/constants";

const VOWEL_LETTERS = ["A", "E", "I", "O", "U"];

export const isVowel = (letter: string): boolean =>
  VOWEL_LETTERS.includes(letter.toUpperCase());

export const isConsonant = (letter: string): boolean => {
  const upper = letter.toUpperCase();
  if (upper < "A" || upper > "Z") return false;
  return !VOWEL_LETTERS.includes(upper);
};

/** 三级回退获取每轮单词数缓存 */
export async function resolveWordsPerRound(bookId: WordBookId): Promise<number> {
  // 一级：Dexie 活跃会话
  try {
    const session = await loadLearningSession(bookId);
    if (session) {
      const data = JSON.parse(session.stateJson);
      const wpr = data.wordsPerRound;
      if (typeof wpr === "number" && wpr >= WORDS_PER_ROUND_MIN && wpr <= WORDS_PER_ROUND_MAX) {
        return wpr;
      }
    }
  } catch { /* 解析失败，回退 */ }

  // 二级：localStorage 按词书缓存
  const bookWpr = useSettingsStore.getState().bookWordsPerRound[bookId];
  if (typeof bookWpr === "number" && bookWpr >= WORDS_PER_ROUND_MIN && bookWpr <= WORDS_PER_ROUND_MAX) {
    return bookWpr;
  }

  // 三级：默认值
  return DEFAULT_WORDS_PER_ROUND;
}

/** Fisher-Yates 洗牌 */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
