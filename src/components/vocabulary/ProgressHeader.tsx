import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { cn } from "@/lib/utils";

export function ProgressHeader() {
  const currentIndex = useVocabularySessionStore((s) => s.currentIndex);
  const total = useVocabularySessionStore((s) => s.words.length);
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const correctK = useVocabularySessionStore((s) => s.totalCorrectKeystrokes);

  const accuracy = totalK > 0 ? Math.round((correctK / totalK) * 100) : 100;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background/80 py-3 text-sm text-muted-foreground backdrop-blur-sm">
      <span>
        第{" "}
        <span className="font-semibold text-foreground">
          {currentIndex + 1}
        </span>{" "}
        / {total} 词
      </span>
      <span className="font-mono tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          accuracy >= 90
            ? "text-success"
            : accuracy >= 70
              ? "text-warning"
              : "text-destructive"
        )}
      >
        {accuracy}%
      </span>
    </div>
  );
}
