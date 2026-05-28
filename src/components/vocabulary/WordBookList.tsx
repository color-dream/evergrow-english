import { useMemo } from "react";
import { WORD_BOOK_OPTIONS } from "@/lib/word-book-registry";
import { useWordBookStats } from "@/hooks/useWordBookStats";
import { WordBookCard } from "./WordBookCard";
import type { WordBookId } from "@/types/vocabulary";

interface WordBookListProps {
  onSelectBook: (id: WordBookId) => void;
  onSelectInProgressBook: (id: WordBookId) => void;
}

export function WordBookList({ onSelectBook, onSelectInProgressBook }: WordBookListProps) {
  const { stats, isLoading } = useWordBookStats();

  const { inProgress, notStarted } = useMemo(() => {
    const ip: typeof WORD_BOOK_OPTIONS = [];
    const ns: typeof WORD_BOOK_OPTIONS = [];
    for (const book of WORD_BOOK_OPTIONS) {
      const s = stats.get(book.id);
      if (s && s.totalCards > 0) {
        ip.push(book);
      } else {
        ns.push(book);
      }
    }
    return { inProgress: ip, notStarted: ns };
  }, [stats]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">词汇打字</h1>
      <p className="mt-1 text-sm text-foreground/55">
        选择单词本开始学习
      </p>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {WORD_BOOK_OPTIONS.map((book) => (
            <div
              key={book.id}
              className="h-32 animate-pulse rounded-2xl"
              style={{
                background: "var(--glass-card-bg)",
                border: "1px solid var(--glass-card-border)",
              }}
            />
          ))}
        </div>
      ) : (
        <>
          {inProgress.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-foreground/50">
                进行中
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {inProgress.map((book) => (
                  <WordBookCard
                    key={book.id}
                    meta={book}
                    stats={stats.get(book.id)}
                    onSelect={() => onSelectInProgressBook(book.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {notStarted.length > 0 && (
            <div className={inProgress.length > 0 ? "mt-8" : "mt-8"}>
              <h2 className="mb-3 text-sm font-semibold text-foreground/50">
                未开始
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {notStarted.map((book) => (
                  <WordBookCard
                    key={book.id}
                    meta={book}
                    stats={stats.get(book.id)}
                    onSelect={() => onSelectBook(book.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
