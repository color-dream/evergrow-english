import { useState, useCallback } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { loadWordBook } from "@/lib/word-book-registry";
import { shuffleArray } from "@/lib/vocabulary-utils";
import { FIXED_WORDS_PER_ROUND } from "@/lib/constants";
import type { WordBookId } from "@/types/vocabulary";
import type { Word } from "@/types/domain";

export function useWordBook() {
  const [loadedWords, setLoadedWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const setSelectedBook = useVocabularySessionStore(
    (s) => s.setSelectedWordBook
  );
  const startSession = useVocabularySessionStore((s) => s.startSession);

  const selectBook = useCallback(
    async (id: WordBookId) => {
      setSelectedBook(id);
      setIsLoading(true);
      setError(null);
      try {
        const words = await loadWordBook(id);
        setLoadedWords(words);
      } catch (e) {
        setError(e instanceof Error ? e.message : "词库加载失败");
      } finally {
        setIsLoading(false);
      }
    },
    [setSelectedBook]
  );

  const startRound = useCallback(() => {
    if (loadedWords.length === 0) return;
    const shuffled = shuffleArray(loadedWords);
    const round = shuffled.slice(0, FIXED_WORDS_PER_ROUND);
    startSession(round);
  }, [loadedWords, startSession]);

  return {
    loadedWords,
    isLoading,
    error,
    selectedBook,
    selectBook,
    startRound,
  };
}
