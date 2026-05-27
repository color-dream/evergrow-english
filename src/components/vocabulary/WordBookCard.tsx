import { BookMarked, RotateCcw } from "lucide-react";
import type { WordBookMeta } from "@/lib/word-book-registry";
import type { BookStats } from "@/hooks/useWordBookStats";

interface WordBookCardProps {
  meta: WordBookMeta;
  stats: BookStats | undefined;
  onSelect: () => void;
}

export function WordBookCard({ meta, stats, onSelect }: WordBookCardProps) {
  const inProgress = stats && stats.totalCards > 0;
  const progressPercent = inProgress
    ? Math.min(100, Math.round((stats.masteredCount / meta.wordCount) * 100))
    : 0;

  return (
    <button
      onClick={onSelect}
      className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-xs transition-all hover:border-primary/20 hover:shadow-sm active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/6">
        <BookMarked className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{meta.label}</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {meta.difficulty}
          </span>
          {inProgress ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              进行中
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              未开始
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {meta.description} · {meta.wordCount.toLocaleString()} 词
        </p>

        {inProgress && (
          <div className="mt-3 space-y-2">
            {/* 进度条 */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>已掌握</span>
                <span>
                  {stats.masteredCount.toLocaleString()} / {meta.wordCount.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 待复习 */}
            {stats.dueCount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-warning">
                <RotateCcw className="h-3 w-3" />
                <span>{stats.dueCount} 词待复习</span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
