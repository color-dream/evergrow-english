import { useMemo } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";

export function SpeedBar() {
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const newCompletions = useVocabularySessionStore((s) => s.newWordCompletions);
  const reviewCompletions = useVocabularySessionStore((s) => s.reviewWordCompletions);

  // 按模式级别统计：每个模式 wrongCount===0 算正确，否则算错误
  const { correctModes, wrongModes } = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    const allCompletions = { ...newCompletions, ...reviewCompletions };
    for (const comp of Object.values(allCompletions)) {
      for (const mr of comp.modeResults) {
        if (mr.wrongCount === 0) {
          correct++;
        } else {
          wrong++;
        }
      }
    }
    return { correctModes: correct, wrongModes: wrong };
  }, [newCompletions, reviewCompletions]);

  const totalModes = correctModes + wrongModes;
  const accuracy = totalModes > 0
    ? Math.round((correctModes / totalModes) * 100)
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
      <InfoBox value={`${correctModes}`} label="正确" />
      <InfoBox value={`${wrongModes}`} label="错误" />
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
