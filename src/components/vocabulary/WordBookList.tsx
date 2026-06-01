import { useMemo } from "react";
import { WORD_BOOK_OPTIONS } from "@/lib/word-book-registry";
import { useWordBookStats } from "@/hooks/useWordBookStats";
import { WordBookCard } from "./WordBookCard";
import type { WordBookId } from "@/types/vocabulary";

interface WordBookListProps {
  onSelectBook: (id: WordBookId) => void;
  onSelectInProgressBook: (id: WordBookId) => void;
}

export function WordBookList({
  onSelectBook,
  onSelectInProgressBook,
}: WordBookListProps) {
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
    <div className="flex min-h-full flex-col px-6 py-6">
      {/* 卡片区 */}
      <div className="mx-auto w-full max-w-5xl">
        {isLoading ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {WORD_BOOK_OPTIONS.map((book) => (
              <div
                key={book.id}
                className="h-52 w-full max-w-[260px] animate-pulse rounded-2xl"
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
              <div className="mt-8 animate-spring-up">
                <h2 className="mb-3 text-sm font-semibold text-foreground/50">
                  进行中
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 justify-items-center">
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
              <div
                className={inProgress.length > 0 ? "mt-10" : "mt-8"}
                style={{
                  animation: inProgress.length > 0
                    ? "spring-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both"
                    : "spring-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                }}
              >
                <h2 className="mb-3 text-sm font-semibold text-foreground/50">
                  未开始
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 justify-items-center">
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
    </div>
  );
}
