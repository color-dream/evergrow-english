import type { Word } from "@/types/domain";
import type { WordBookId } from "@/types/vocabulary";
import { convertToWord } from "./word-converter";

export interface WordBookMeta {
  id: WordBookId;
  label: string;
  description: string;
  wordCount: number;
  difficulty: string;
}

export const WORD_BOOK_META: Record<WordBookId, WordBookMeta> = {
  cet4: {
    id: "cet4",
    label: "CET-4",
    description: "大学英语四级词汇",
    wordCount: 5400,
    difficulty: "大学四级",
  },
  cet6: {
    id: "cet6",
    label: "CET-6",
    description: "大学英语六级词汇",
    wordCount: 4800,
    difficulty: "大学六级",
  },
};

export const WORD_BOOK_OPTIONS: WordBookMeta[] = [
  WORD_BOOK_META.cet4,
  WORD_BOOK_META.cet6,
];

export async function loadWordBook(id: WordBookId): Promise<Word[]> {
  if (id === "cet4") {
    const raw = await import("@/assets/dicts/CET4_T.json");
    return (raw.default as Array<Record<string, unknown>>).map((entry) =>
      convertToWord(
        {
          name: String(entry.name),
          trans: entry.trans as { text: string; pos: string }[],
          usphone: String(entry.usphone ?? ""),
          ukphone: String(entry.ukphone ?? ""),
        },
        "cet4"
      )
    );
  }
  if (id === "cet6") {
    const raw = await import("@/assets/dicts/CET6_T.json");
    return (raw.default as Array<Record<string, unknown>>).map((entry) =>
      convertToWord(
        {
          name: String(entry.name),
          trans: entry.trans as { text: string; pos: string }[],
          usphone: String(entry.usphone ?? ""),
          ukphone: String(entry.ukphone ?? ""),
        },
        "cet6"
      )
    );
  }
  throw new Error(`未知词库: ${id}`);
}
