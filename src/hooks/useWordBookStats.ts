import { useState, useEffect, useCallback, useRef } from "react";
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
  const lastFetchRef = useRef(0);

  const fetchStats = useCallback(async () => {
    // 1 秒内不重复查询
    if (Date.now() - lastFetchRef.current < 1000) return;

    setIsLoading(true);
    lastFetchRef.current = Date.now();

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

      setStats(new Map(results));
    } catch {
      // 静默处理，视为空数据
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      lastFetchRef.current = Date.now();

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

        if (!cancelled) setStats(new Map(results));
      } catch {
        // 静默处理
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 窗口重新获得焦点时刷新（学习弹窗关闭后触发）
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchStats();
    };
    const onFocus = () => fetchStats();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchStats]);

  return { stats, isLoading };
}
