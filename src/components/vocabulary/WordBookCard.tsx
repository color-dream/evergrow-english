import { BookMarked } from "lucide-react";
import type { WordBookMeta } from "@/lib/word-book-registry";
import type { BookStats } from "@/hooks/useWordBookStats";

interface WordBookCardProps {
  meta: WordBookMeta;
  stats: BookStats | undefined;
  onSelect: () => void;
}

export function WordBookCard({ meta, stats, onSelect }: WordBookCardProps) {
  const inProgress = stats && stats.totalCards > 0;
  const learnedPercent = inProgress
    ? Math.round((stats.totalCards / meta.wordCount) * 100)
    : 0;

  return (
    <button
      onClick={onSelect}
      className="flex items-start gap-4 rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: "var(--glass-card-bg)",
        backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
        border: "1px solid var(--glass-card-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "oklch(0.55 0.195 252 / 0.08)" }}
      >
        <BookMarked className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{meta.label}</p>
          <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-foreground/40">
            {meta.difficulty}
          </span>
          {inProgress ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: "oklch(0.55 0.195 252 / 0.1)",
                color: "oklch(0.55 0.195 252)",
              }}
            >
              进行中
            </span>
          ) : (
            <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-foreground/40">
              未开始
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-foreground/45">
          {meta.description} · {meta.wordCount.toLocaleString()} 词
        </p>

        {inProgress && (
          <div className="mt-3 space-y-2">
            {/* 进度条：已学习 / 总词数 */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-foreground/45">已学习</span>
                <span className="font-medium text-foreground">
                  {stats.totalCards.toLocaleString()}
                  <span className="text-foreground/35 font-normal"> / {meta.wordCount.toLocaleString()}</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary transition-all duration-500"
                  style={{
                    width: `${Math.max(learnedPercent, stats.totalCards > 0 ? 2 : 0)}%`,
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
            </div>

            {/* 明细：已掌握 / 学习中 / 未学习 */}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                <span className="text-foreground/45">已掌握</span>
                <span className="font-medium text-foreground">{stats.masteredCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-foreground/45">学习中</span>
                <span className="font-medium text-foreground">{stats.totalCards - stats.masteredCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-foreground/15" />
                <span className="text-foreground/45">未学习</span>
                <span className="font-medium text-foreground">{Math.max(0, meta.wordCount - stats.totalCards)}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
