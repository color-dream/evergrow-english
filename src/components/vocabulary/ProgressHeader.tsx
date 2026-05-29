import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { cn } from "@/lib/utils";

export function ProgressHeader() {
  const completedModeCount = useVocabularySessionStore(
    (s) => s.completedModeCount
  );
  const phase = useVocabularySessionStore((s) => s.phase);
  const newWords = useVocabularySessionStore((s) => s.newWords);
  const reviewWords = useVocabularySessionStore((s) => s.reviewWords);
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const correctK = useVocabularySessionStore((s) => s.totalCorrectKeystrokes);
  const regressionCount = useVocabularySessionStore((s) => s.regressionCount);

  const isReview = phase === "review";
  const total = isReview ? reviewWords.length : newWords.length;
  const totalModes = total * 4 + regressionCount;

  const accuracy = totalK > 0 ? Math.round((correctK / totalK) * 100) : 100;
  const progress = totalModes > 0 ? (completedModeCount / totalModes) * 100 : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const accuracyColor =
    accuracy >= 90
      ? "text-success"
      : accuracy >= 70
        ? "text-warning"
        : "text-destructive";

  return (
    <div
      className="sticky top-0 z-10 -mx-4 px-4 pb-3 pt-1"
      style={{
        background: "var(--glass-sheet-bg)",
        backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
        borderBottom: "1px solid var(--glass-sheet-border)",
      }}
    >
      {/* 进度条 */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isReview ? "bg-amber-400" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 统计行 */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium tabular-nums">
          <span className="text-foreground">{completedModeCount}</span>
          <span className="text-foreground/45"> / {totalModes} 模式</span>
          {isReview && (
            <span className="ml-2 text-xs" style={{ color: "oklch(0.55 0.14 80)" }}>复习</span>
          )}
        </span>

        <span className="font-mono tabular-nums text-foreground/45">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>

        <span
          className={cn("font-mono tabular-nums font-medium", accuracyColor)}
        >
          {accuracy}%
        </span>
      </div>
    </div>
  );
}
