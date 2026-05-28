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
  const progress =
    totalModes > 0 ? Math.floor((completedModes / totalModes) * 100) : 0;

  const barColor = isReview
    ? "bg-amber-400 dark:bg-amber-500"
    : "bg-indigo-400 dark:bg-indigo-500";

  const bgColor = isReview
    ? "bg-amber-100 dark:bg-amber-200"
    : "bg-indigo-100 dark:bg-indigo-200";

  return (
    <div className={cn("w-full shrink-0", bgColor)}>
      <div
        style={{ width: `${progress}%` }}
        className={cn(
          "h-[3px] transition-all duration-300",
          barColor
        )}
      />
    </div>
  );
}
