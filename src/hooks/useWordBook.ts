import { useState, useCallback } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { loadWordBook } from "@/lib/word-book-registry";
import { getCardsByBookId } from "@/lib/db";
import { getDueCards } from "@/lib/fsrs";
import type { WordBookId } from "@/types/vocabulary";
import type { Word } from "@/types/domain";

export function useWordBook() {
  const [loadedWords, setLoadedWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueCount, setDueCount] = useState(0);

  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const setSelectedBook = useVocabularySessionStore(
    (s) => s.setSelectedWordBook
  );

  const selectBook = useCallback(
    async (id: WordBookId): Promise<Word[]> => {
      setSelectedBook(id);
      setIsLoading(true);
      setError(null);
      try {
        const words = await loadWordBook(id);
        setLoadedWords(words);

        // 获取该词典的到期复习数量
        const cards = await getCardsByBookId(id);
        const dueCards = getDueCards(cards, Date.now());
        setDueCount(dueCards.length);

        return words;
      } catch (e) {
        setError(e instanceof Error ? e.message : "词库加载失败");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [setSelectedBook]
  );

  return {
    loadedWords,
    isLoading,
    error,
    dueCount,
    selectedBook,
    selectBook,
  };
}
