import { cn } from "@/lib/utils";

interface ProgressBarProps {
  completedModes: number;
  totalModes: number;
  isReview: boolean;
}

export function ProgressBar({
  completedModes,
  totalModes,
  isReview,
}: ProgressBarProps) {
  const progress =
    totalModes > 0 ? Math.floor((completedModes / totalModes) * 100) : 0;

  const fillColor = isReview ? "bg-amber-400" : "bg-primary";

  return (
    <div
      className="w-full shrink-0 px-2 py-1.5"
      style={{
        background: "var(--glass-pill-bg)",
        backdropFilter:
          "blur(var(--glass-pill-blur)) saturate(var(--glass-sheet-saturate))",
        WebkitBackdropFilter:
          "blur(var(--glass-pill-blur)) saturate(var(--glass-sheet-saturate))",
      }}
    >
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          style={{ width: `${progress}%` }}
          className={cn(
            "h-full rounded-full transition-all duration-500",
            fillColor
          )}
        />
      </div>
    </div>
  );
}
