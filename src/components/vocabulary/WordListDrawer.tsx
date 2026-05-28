import { useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import type { Word } from "@/types/domain";

interface WordListDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function WordListDrawer({ open, onClose }: WordListDrawerProps) {
  const phase = useVocabularySessionStore((s) => s.phase);
  const newWords = useVocabularySessionStore((s) => s.newWords);
  const reviewWords = useVocabularySessionStore((s) => s.reviewWords);
  const newWordCompletions = useVocabularySessionStore((s) => s.newWordCompletions);
  const reviewWordCompletions = useVocabularySessionStore((s) => s.reviewWordCompletions);
  const currentWordIndex = useVocabularySessionStore((s) => s.currentWordIndex);

  const isReview = phase === "review";
  const words = isReview ? reviewWords : newWords;
  const completions = isReview ? reviewWordCompletions : newWordCompletions;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const completedCount = Object.values(completions).filter((c) => c.isFullyCompleted).length;

  return (
    <div className="absolute inset-0 z-30">
      {/* 遮罩 — iOS 26 微模糊 */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "oklch(0 0 0 / 0.15)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      {/* 左贴边全高面板 — 毛玻璃 sheet */}
      <div
        className="absolute left-0 top-0 bottom-0 w-72 animate-slide-in-left"
        style={{
          background: "var(--glass-sheet-bg)",
          backdropFilter:
            "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
          WebkitBackdropFilter:
            "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
          borderRight: "1px solid var(--glass-sheet-border)",
          boxShadow: "var(--shadow-xl)",
          borderTopRightRadius: "var(--radius-2xl)",
          borderBottomRightRadius: "var(--radius-2xl)",
        }}
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-center pt-6 pb-5 px-4"
          style={{ borderBottom: "1px solid var(--glass-sheet-border)" }}
        >
          <h3 className="text-sm font-semibold text-foreground/85">
            本轮单词 ({completedCount}/{words.length})
          </h3>
        </div>
        {/* 列表 */}
        <div className="overflow-y-auto h-[calc(100%-100px)]">
          {words.map((word, index) => (
            <WordItem
              key={word.id}
              word={word}
              isCurrent={index === currentWordIndex}
              isCompleted={completions[word.id]?.isFullyCompleted ?? false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WordItem({
  word,
  isCurrent,
  isCompleted,
}: {
  word: Word;
  isCurrent: boolean;
  isCompleted: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-all duration-300 overflow-hidden",
        isCurrent && "border-l-[3px] border-l-primary",
        isCompleted && !isCurrent && "opacity-50"
      )}
      style={
        isCurrent
          ? { background: "oklch(0.55 0.195 252 / 0.08)" }
          : undefined
      }
    >
      {isCompleted ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500 mt-0.5" />
      ) : (
        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 mt-0.5" />
      )}
      <div className="min-w-0 flex-1 overflow-hidden">
        <p
          className={cn(
            "font-mono text-sm truncate",
            isCurrent ? "font-semibold text-primary" : "text-foreground"
          )}
        >
          {word.text}
        </p>
        <p className="truncate text-xs text-foreground/45">
          {word.definition}
        </p>
      </div>
    </div>
  );
}
