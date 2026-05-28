import { useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, Circle } from "lucide-react";
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
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      {/* 左贴边全高面板 */}
      <div className="absolute left-0 top-0 bottom-0 w-64 border-r border-border bg-card shadow-lg animate-slide-in-left rounded-r-xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <h3 className="text-sm font-medium text-foreground">
            本轮单词 ({completedCount}/{words.length})
          </h3>
          <button
            onClick={onClose}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* 列表 */}
        <div className="overflow-y-auto h-[calc(100%-45px)]">
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
        "flex items-center gap-2.5 px-3 py-2 transition-colors",
        isCurrent && "border-l-2 border-l-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
        isCompleted && !isCurrent && "opacity-50"
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
      ) : (
        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
      )}
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "font-mono text-sm tabular-nums",
            isCurrent ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-foreground"
          )}
        >
          {word.text}
        </span>
        <span className="ml-2 truncate text-xs text-muted-foreground">
          {word.definition}
        </span>
      </div>
    </div>
  );
}
