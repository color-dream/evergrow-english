import { BookMarked } from "lucide-react";
import type { WordBookMeta } from "@/lib/word-book-registry";
import type { BookStats } from "@/hooks/useWordBookStats";
import type { WordBookId } from "@/types/vocabulary";

const bookTheme: Record<
  WordBookId,
  { accent: string; bg: string; gradient: string }
> = {
  cet4: {
    accent: "oklch(0.55 0.195 252)",
    bg: "oklch(0.55 0.195 252 / 0.08)",
    gradient:
      "linear-gradient(90deg, oklch(0.55 0.195 252), oklch(0.5 0.17 265), oklch(0.55 0.195 252))",
  },
  cet6: {
    accent: "oklch(0.52 0.16 285)",
    bg: "oklch(0.52 0.16 285 / 0.08)",
    gradient:
      "linear-gradient(90deg, oklch(0.52 0.16 285), oklch(0.48 0.14 300), oklch(0.52 0.16 285))",
  },
};

interface WordBookCardProps {
  meta: WordBookMeta;
  stats: BookStats | undefined;
  onSelect: () => void;
}

export function WordBookCard({ meta, stats, onSelect }: WordBookCardProps) {
  const inProgress = stats && stats.totalCards > 0;
  const theme = bookTheme[meta.id];
  const learnedPercent = inProgress
    ? Math.round((stats.totalCards / meta.wordCount) * 100)
    : 0;

  return (
    <button
      onClick={onSelect}
      className="group flex items-start gap-4 rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: "var(--glass-card-bg)",
        backdropFilter:
          "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
        WebkitBackdropFilter:
          "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
        border: "1px solid var(--glass-card-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* 图标区 */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: theme.bg }}
      >
        <BookMarked
          className="h-5 w-5"
          style={{ color: theme.accent }}
        />
      </div>

      {/* 内容区 */}
      <div className="min-w-0 flex-1">
        {/* 标题行 */}
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">{meta.label}</p>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              background: theme.bg,
              color: theme.accent,
            }}
          >
            {meta.difficulty}
          </span>
          {inProgress && (
            <span className="shrink-0 ml-auto flex items-center gap-1 text-[11px] text-foreground/40">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: theme.accent }}
              />
              进行中
            </span>
          )}
        </div>

        {/* 描述 */}
        <p className="mt-0.5 text-xs text-foreground/45">
          {meta.description} · {meta.wordCount.toLocaleString()} 词
        </p>

        {/* 进度区（仅进行中显示） */}
        {inProgress && (
          <div className="mt-4 space-y-3">
            {/* 进度条 */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-foreground/45">学习进度</span>
                <span className="font-mono font-medium tabular-nums text-foreground/70">
                  {learnedPercent}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
                <div
                  className="h-full rounded-full animate-shimmer transition-all duration-500"
                  style={{
                    width: `${Math.max(learnedPercent, stats.totalCards > 0 ? 3 : 0)}%`,
                    background: theme.gradient,
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
            </div>

            {/* 统计指标 */}
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "oklch(0.56 0.19 148)" }}
                />
                <span className="text-foreground/45">已掌握</span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {stats.masteredCount}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "oklch(0.72 0.18 85)" }}
                />
                <span className="text-foreground/45">学习中</span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {stats.totalCards - stats.masteredCount}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "oklch(0.6 0.01 260 / 0.25)" }}
                />
                <span className="text-foreground/45">未学习</span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {Math.max(0, meta.wordCount - stats.totalCards)}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
