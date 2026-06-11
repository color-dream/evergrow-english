import { BookMarked } from "lucide-react";
import type { WordBookMeta } from "@/lib/word-book-registry";
import type { BookStats } from "@/hooks/useWordBookStats";
import type { WordBookId } from "@/types/vocabulary";

const bookTheme: Record<
  WordBookId,
  { accent: string; bg: string }
> = {
  cet4: {
    accent: "oklch(0.55 0.195 252)",
    bg: "oklch(0.55 0.195 252 / 0.08)",
  },
  cet6: {
    accent: "oklch(0.52 0.16 285)",
    bg: "oklch(0.52 0.16 285 / 0.08)",
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

  const mastered = stats?.masteredCount ?? 0;
  const learning = stats ? stats.totalCards - mastered : 0;
  const remaining = Math.max(0, meta.wordCount - (stats?.totalCards ?? 0));

  return (
    <button
      onClick={onSelect}
      className="group flex w-full max-w-[260px] flex-col rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
      {/* 图标 + 标签名 */}
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
          style={{ background: theme.bg }}
        >
          <BookMarked className="h-5 w-5" style={{ color: theme.accent }} />
        </div>
        <span
          className="text-sm font-bold truncate"
          style={{ color: theme.accent }}
        >
          {meta.label}
        </span>
      </div>

      {/* 描述 */}
      <p className="mt-0.5 truncate text-xs text-foreground/45">
        {meta.description}
      </p>

      {/* 词数 */}
      <p className="mt-0.5 font-mono text-xs text-foreground/30 tabular-nums whitespace-nowrap">
        {meta.wordCount.toLocaleString()} 词
      </p>

      {/* 进度区（仅进行中显示） */}
      {inProgress && (
        <div className="mt-4 space-y-3">
          {/* 进度条 */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] whitespace-nowrap">
              <span className="text-foreground/40">进度</span>
              <span
                className="font-mono font-semibold tabular-nums"
                style={{ color: theme.accent }}
              >
                {learnedPercent}%
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: theme.bg }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(learnedPercent, stats.totalCards > 0 ? 2 : 0)}%`,
                  background: theme.accent,
                }}
              />
            </div>
          </div>

          {/* 统计 — 三列等宽 */}
          <div className="grid grid-cols-3 text-center">
            {[
              { label: "掌握", value: mastered, color: "oklch(0.56 0.19 148)", title: "FSRS 判定：记忆稳定性 > 5 天即视为已掌握" },
              { label: "学习", value: learning, color: "oklch(0.72 0.18 85)" },
              { label: "未学", value: remaining, color: "oklch(0.6 0.01 260 / 0.35)" },
            ].map(({ label, value, color, title }) => (
              <div key={label} className="whitespace-nowrap" title={title}>
                <div className="font-mono text-lg font-bold tabular-nums text-foreground">
                  {value}
                </div>
                <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-foreground/40">
                  <span
                    className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
