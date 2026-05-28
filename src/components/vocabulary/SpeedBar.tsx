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
    <div className="flex w-full shrink-0 px-4 py-2 opacity-30 transition-opacity hover:opacity-60">
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
    <div className="flex flex-1 flex-col items-center">
      <span className="font-mono text-sm font-bold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
