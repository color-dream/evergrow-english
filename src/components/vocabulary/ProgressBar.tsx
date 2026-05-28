import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 已完成的模式数 */
  completedModes: number;
  /** 总模式数 (= 单词数 × 4) */
  totalModes: number;
  /** 是否为复习阶段 */
  isReview: boolean;
}

export function ProgressBar({
  completedModes,
  totalModes,
  isReview,
}: ProgressBarProps) {
  const isTyping = useVocabularySessionStore((s) => s.isTyping);

  const progress =
    totalModes > 0 ? Math.floor((completedModes / totalModes) * 100) : 0;

  const barColor = isReview
    ? "bg-amber-400 dark:bg-amber-500"
    : "bg-indigo-400 dark:bg-indigo-500";

  const bgColor = isReview
    ? "bg-amber-100 dark:bg-amber-200"
    : "bg-indigo-100 dark:bg-indigo-200";

  return (
    <div
      className={cn(
        "container mx-auto mb-10 w-1/3 pt-1 transition-opacity duration-300",
        isTyping ? "opacity-100" : "opacity-0"
      )}
    >
      {/* 模式进度条 */}
      <div
        className={cn(
          "mb-1 flex h-2 overflow-hidden rounded-xl text-xs transition-all duration-300",
          bgColor
        )}
      >
        <div
          style={{ width: `${progress}%` }}
          className={cn(
            "flex flex-col justify-center whitespace-nowrap rounded-xl text-center text-white shadow-none transition-all duration-300",
            barColor
          )}
        />
      </div>

      {/* 进度文字 */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground">
          {completedModes} / {totalModes}
          {isReview && " · 复习"}
        </span>
      </div>
    </div>
  );
}
