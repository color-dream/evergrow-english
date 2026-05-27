import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { cn } from "@/lib/utils";
import { WORD_LEARN_MODE_LABELS } from "@/types/vocabulary";
import type { WordLearnMode } from "@/types/vocabulary";

interface ProgressBarProps {
  /** 当前单词索引 */
  currentWordIndex: number;
  /** 总单词数 */
  totalWords: number;
  /** 当前模式索引 (0-3) */
  currentModeIndex: number;
  /** 是否为复习阶段 */
  isReview: boolean;
}

const MODE_KEYS: WordLearnMode[] = [
  "typeWithWord",
  "typeWithoutWord",
  "typeWithoutWordAndTranslation",
  "typeWithoutWordAndTranslationAndPhonetic",
];

export function ProgressBar({
  currentWordIndex,
  totalWords,
  currentModeIndex,
  isReview,
}: ProgressBarProps) {
  const isTyping = useVocabularySessionStore((s) => s.isTyping);

  const wordProgress =
    totalWords > 0
      ? Math.floor(((currentWordIndex + 1) / totalWords) * 100)
      : 0;

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
      {/* 模式进度：4个小圆点 */}
      <div className="mb-3 flex items-center justify-center gap-3">
        {MODE_KEYS.map((mode, index) => {
          const isCompleted = index < currentModeIndex;
          const isCurrent = index === currentModeIndex;
          return (
            <div key={mode} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  isCompleted
                    ? isReview
                      ? "bg-amber-400"
                      : "bg-indigo-400"
                    : isCurrent
                    ? isReview
                      ? "bg-amber-400 ring-2 ring-amber-200"
                      : "bg-indigo-400 ring-2 ring-indigo-200"
                    : "bg-gray-200 dark:bg-gray-600"
                )}
              />
              {isCurrent && (
                <span className="text-[10px] text-muted-foreground">
                  {index + 1}/4
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 当前模式名称 */}
      <div className="mb-2 text-center">
        <span className="text-xs text-muted-foreground">
          {WORD_LEARN_MODE_LABELS[MODE_KEYS[currentModeIndex]]}
        </span>
      </div>

      {/* 单词进度条 */}
      <div
        className={cn(
          "mb-1 flex h-2 overflow-hidden rounded-xl text-xs transition-all duration-300",
          bgColor
        )}
      >
        <div
          style={{ width: `${wordProgress}%` }}
          className={cn(
            "flex flex-col justify-center whitespace-nowrap rounded-xl text-center text-white shadow-none transition-all duration-300",
            barColor
          )}
        />
      </div>

      {/* 进度文字 */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground">
          {currentWordIndex + 1} / {totalWords}
          {isReview && " · 复习"}
        </span>
      </div>
    </div>
  );
}
