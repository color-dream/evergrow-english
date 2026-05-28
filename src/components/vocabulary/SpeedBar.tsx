import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";

export function SpeedBar() {
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const correctK = useVocabularySessionStore((s) => s.totalCorrectKeystrokes);
  const wordResults = useVocabularySessionStore((s) => s.wordResults);

  const accuracy = totalK > 0 ? Math.round((correctK / totalK) * 100) : 0;
  const wpm =
    elapsed > 0 ? Math.round((wordResults.length / elapsed) * 60) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div
      className="mx-auto mb-4 flex w-fit items-center gap-1 rounded-full px-4 py-2 animate-spring-up"
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
      <InfoBox
        value={`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
        label="时间"
      />
      <InfoBox value={`${totalK}`} label="输入数" />
      <InfoBox value={`${wpm}`} label="WPM" />
      <InfoBox value={`${correctK}`} label="正确数" />
      <InfoBox value={`${accuracy}%`} label="正确率" />
    </div>
  );
}

function InfoBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-2.5">
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-[10px] font-medium text-foreground/40">{label}</span>
    </div>
  );
}
