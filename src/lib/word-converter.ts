import type { Word, DifficultyLevel } from "@/types/domain";

interface QwertyLearnerEntry {
  name: string;
  trans: { text: string; pos: string }[];
  usphone: string;
  ukphone: string;
}

const BOOK_DIFFICULTY: Record<string, DifficultyLevel> = {
  cet4: "B1",
  cet6: "B2",
};

export function convertToWord(entry: QwertyLearnerEntry, bookId: string): Word {
  const definition = entry.trans
    .map((t) => `${t.pos} ${t.text}`)
    .join("；");

  return {
    id: `${bookId}_${entry.name}`,
    text: entry.name,
    lemma: entry.name,
    definition,
    partOfSpeech: entry.trans[0]?.pos ?? "other",
    phonetic: entry.usphone || entry.ukphone || undefined,
    usphone: entry.usphone || undefined,
    ukphone: entry.ukphone || undefined,
    difficulty: BOOK_DIFFICULTY[bookId] ?? "B1",
    tags: [],
    createdAt: Date.now(),
  };
}
