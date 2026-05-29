import { useMemo } from "react";
import { BookMarked } from "lucide-react";
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
    <div className="flex min-h-full flex-col px-6 py-10">
      {/* 页头 */}
      <div className="mx-auto w-full max-w-3xl animate-spring-in">
        <div className="mb-2 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm"
            style={{
              background: "var(--glass-card-bg)",
              backdropFilter:
                "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter:
                "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-card-border)",
            }}
          >
            <BookMarked className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">词汇打字</h1>
            <p className="mt-0.5 text-sm text-foreground/55">
              选择单词本开始学习
            </p>
          </div>
        </div>
      </div>

      {/* 卡片区 */}
      <div className="mx-auto w-full max-w-3xl">
        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WORD_BOOK_OPTIONS.map((book) => (
              <div
                key={book.id}
                className="h-36 animate-pulse rounded-2xl"
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
    </div>
  );
}
