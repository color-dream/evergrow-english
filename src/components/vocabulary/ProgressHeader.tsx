import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { cn } from "@/lib/utils";

export function ProgressHeader() {
  const currentIndex = useVocabularySessionStore((s) => s.currentIndex);
  const total = useVocabularySessionStore((s) => s.words.length);
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const correctK = useVocabularySessionStore((s) => s.totalCorrectKeystrokes);

  const accuracy = totalK > 0 ? Math.round((correctK / totalK) * 100) : 100;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const accuracyColor =
    accuracy >= 90
      ? "text-success"
      : accuracy >= 70
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 pb-3 pt-1 bg-background/85 backdrop-blur-sm">
      {/* 进度条 */}
      <div className="mb-3 h-1 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 统计行 */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium tabular-nums">
          <span className="text-foreground">{currentIndex + 1}</span>
          <span className="text-muted-foreground"> / {total} 词</span>
        </span>

        <span className="font-mono tabular-nums text-muted-foreground">
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
