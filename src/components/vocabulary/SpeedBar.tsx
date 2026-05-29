import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";

export function SpeedBar() {
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const wordResults = useVocabularySessionStore((s) => s.wordResults);

  const correctWords = wordResults.filter((r) => r.isCorrect).length;
  const wrongWords = wordResults.filter((r) => !r.isCorrect).length;
  const wordAccuracy = wordResults.length > 0
    ? Math.round((correctWords / wordResults.length) * 100)
    : 0;
  const cpm =
    elapsed > 0 ? Math.round((totalK / elapsed) * 60) : 0;
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
      <InfoBox value={`${cpm}`} label="字母/分" />
      <InfoBox value={`${correctWords}`} label="正确" />
      <InfoBox value={`${wrongWords}`} label="错误" />
      <InfoBox value={`${wordAccuracy}%`} label="正确率" />
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
