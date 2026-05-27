import { useState, useCallback } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { loadWordBook } from "@/lib/word-book-registry";
import { shuffleArray } from "@/lib/vocabulary-utils";
import { FIXED_WORDS_PER_ROUND } from "@/lib/constants";
import { getCardsByBookId } from "@/lib/db";
import { getDueCards } from "@/lib/fsrs";
import type { WordBookId } from "@/types/vocabulary";
import type { Word } from "@/types/domain";
import type { LearnMode } from "@/stores/vocabulary-session-store";

export function useWordBook() {
  const [loadedWords, setLoadedWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueCount, setDueCount] = useState(0);

  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const setSelectedBook = useVocabularySessionStore(
    (s) => s.setSelectedWordBook
  );
  const startSession = useVocabularySessionStore((s) => s.startSession);

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

  const startRound = useCallback(() => {
    if (loadedWords.length === 0) return;
    const shuffled = shuffleArray(loadedWords);
    const round = shuffled.slice(0, FIXED_WORDS_PER_ROUND);
    startSession(round);
  }, [loadedWords, startSession]);

  const getDueReviewWords = useCallback(
    async (bookId: WordBookId): Promise<Word[]> => {
      const cards = await getCardsByBookId(bookId);
      const dueCards = getDueCards(cards, Date.now());

      // 将 LearningCard 转换为 Word 格式
      return dueCards.slice(0, FIXED_WORDS_PER_ROUND).map((card) => ({
        id: card.id,
        text: card.wordText,
        lemma: card.wordText,
        definition: card.definition,
        partOfSpeech: "other" as const,
        difficulty: "B1" as const,
        tags: [],
        createdAt: card.createdAt,
      }));
    },
    []
  );

  const startRoundByMode = useCallback(
    async (mode: LearnMode) => {
      if (!selectedBook) return;

      setIsLoading(true);
      setError(null);

      try {
        let roundWords: Word[] = [];

        if (mode === "new") {
          // 新词学习：从词典中随机选取
          if (loadedWords.length === 0) return;
          const shuffled = shuffleArray(loadedWords);
          roundWords = shuffled.slice(0, FIXED_WORDS_PER_ROUND);
        } else if (mode === "review") {
          // 错词复习：从 FSRS 到期卡片中选取
          roundWords = await getDueReviewWords(selectedBook);
          if (roundWords.length === 0) {
            setError("没有到期的复习卡片");
            return;
          }
        } else if (mode === "mixed") {
          // 混合模式：50% 到期卡片 + 50% 新词
          const dueWords = await getDueReviewWords(selectedBook);
          const dueCount = Math.min(dueWords.length, Math.floor(FIXED_WORDS_PER_ROUND / 2));
          const newCount = FIXED_WORDS_PER_ROUND - dueCount;

          const duePart = dueWords.slice(0, dueCount);
          const newPart = shuffleArray(loadedWords).slice(0, newCount);
          roundWords = [...duePart, ...newPart];

          if (roundWords.length === 0) {
            setError("没有可学习的单词");
            return;
          }
        }

        startSession(roundWords);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBook, loadedWords, startSession, getDueReviewWords]
  );

  return {
    loadedWords,
    isLoading,
    error,
    dueCount,
    selectedBook,
    selectBook,
    startRound,
    startRoundByMode,
  };
}
