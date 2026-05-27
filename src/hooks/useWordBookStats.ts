import { useState, useEffect } from "react";
import { WORD_BOOK_OPTIONS } from "@/lib/word-book-registry";
import { getCardsByBookId } from "@/lib/db";
import { getDueCards, getMasteredCount } from "@/lib/fsrs";
import type { WordBookId } from "@/types/vocabulary";

export interface BookStats {
  totalCards: number;
  masteredCount: number;
  dueCount: number;
}

export function useWordBookStats() {
  const [stats, setStats] = useState<Map<WordBookId, BookStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.all(
          WORD_BOOK_OPTIONS.map(async (book) => {
            const cards = await getCardsByBookId(book.id);
            const now = Date.now();
            return [
              book.id,
              {
                totalCards: cards.length,
                masteredCount: getMasteredCount(cards),
                dueCount: getDueCards(cards, now).length,
              },
            ] as const;
          })
        );

        if (!cancelled) {
          setStats(new Map(results));
        }
      } catch {
        // 静默处理，视为空数据
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading };
}
