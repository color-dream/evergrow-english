import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 覆盖当前进度（用于非 vocabulary 页面） */
  current?: number;
  /** 覆盖总数（用于非 vocabulary 页面） */
  total?: number;
}

export function ProgressBar({
  current,
  total: totalOverride,
}: ProgressBarProps) {
  const storeCurrent = useVocabularySessionStore((s) => s.currentIndex);
  const storeTotal = useVocabularySessionStore((s) => s.words.length);
  const isTyping = useVocabularySessionStore((s) => s.isTyping);

  const currentIndex = current ?? storeCurrent;
  const total = totalOverride ?? storeTotal;

  const progress =
    total > 0 ? Math.floor(((currentIndex + 1) / total) * 100) : 0;

  const phase =
    progress < 33
      ? "bg-indigo-200 dark:bg-indigo-300"
      : progress < 67
        ? "bg-indigo-300 dark:bg-indigo-400"
        : "bg-indigo-400 dark:bg-indigo-500";

  return (
    <div
      className={cn(
        "container mx-auto mb-10 w-1/4 pt-1 transition-opacity duration-300",
        isTyping ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="mb-4 flex h-2 overflow-hidden rounded-xl bg-indigo-100 text-xs transition-all duration-300 dark:bg-indigo-200">
        <div
          style={{ width: `${progress}%` }}
          className={cn(
            "flex flex-col justify-center whitespace-nowrap rounded-xl text-center text-white shadow-none transition-all duration-300",
            phase
          )}
        />
      </div>
    </div>
  );
}
