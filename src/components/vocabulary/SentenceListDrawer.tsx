import { useSentenceSessionStore } from "@/stores/sentence-session-store";
import { X } from "lucide-react";

interface SentenceListDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SentenceListDrawer({ open, onClose }: SentenceListDrawerProps) {
  const sentences = useSentenceSessionStore((s) => s.sentences);
  const completions = useSentenceSessionStore((s) => s.completions);
  const currentSentenceIndex = useSentenceSessionStore((s) => s.currentSentenceIndex);

  if (!open) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* 抽屉面板 */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto shadow-2xl animate-slide-in-right"
        style={{
          background: "var(--glass-sheet-bg)",
          backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
          WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
          borderRight: "1px solid var(--glass-sheet-border)",
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">句子列表</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 句子列表 */}
        <div className="px-3 pb-6">
          {sentences.map((s, idx) => {
            const comp = completions[s.id];
            const isCurrent = idx === currentSentenceIndex;
            const isPast = idx < currentSentenceIndex;
            const completedModes = comp?.modeResults.length ?? 0;

            return (
              <div
                key={s.id}
                className="mb-1 rounded-xl px-3 py-2.5 transition-all"
                style={{
                  background: isCurrent
                    ? "oklch(0.55 0.195 252 / 0.08)"
                    : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 font-mono text-[10px] text-foreground/30 w-5 text-right">
                    {idx + 1}
                  </span>
                  <span
                    className="truncate text-xs flex-1"
                    style={{
                      color: isCurrent
                        ? "oklch(0.55 0.195 252)"
                        : isPast
                          ? "var(--color-foreground)"
                          : "var(--color-foreground)",
                      opacity: isPast ? 0.6 : isCurrent ? 1 : 0.35,
                    }}
                  >
                    {s.text.length > 30 ? s.text.slice(0, 30) + "..." : s.text}
                  </span>
                  {/* 进度圆点 */}
                  <span className="flex shrink-0 gap-0.5">
                    {[0, 1, 2].map((mode) => (
                      <span
                        key={mode}
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            completedModes > mode
                              ? comp?.modeResults[mode]?.isCorrect
                                ? "oklch(0.56 0.19 148)"
                                : "oklch(0.55 0.22 20)"
                              : "oklch(0.60 0.01 260 / 0.2)",
                        }}
                      />
                    ))}
                  </span>
                </div>
                {/* 翻译 */}
                <p className="mt-0.5 truncate pl-7 text-[10px] text-foreground/30">
                  {s.translation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
