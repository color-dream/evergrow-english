import { useSentenceSessionStore } from "@/stores/sentence-session-store";
import { X } from "lucide-react";

interface SentenceListDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SentenceListDrawer({ open, onClose }: SentenceListDrawerProps) {
  const sentences = useSentenceSessionStore((s) => s.sentences);
  const sentenceResults = useSentenceSessionStore((s) => s.sentenceResults);
  const currentSentenceIndex = useSentenceSessionStore((s) => s.currentSentenceIndex);

  if (!open) return null;

  // 构建结果查找表
  const resultMap = new Map(sentenceResults.map((r) => [r.sentenceId, r]));

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
            const result = resultMap.get(s.id);
            const isCurrent = idx === currentSentenceIndex;
            const isPast = idx < currentSentenceIndex;

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
                    {s.english.length > 30 ? s.english.slice(0, 30) + "..." : s.english}
                  </span>
                  {/* 完成状态圆点 */}
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: result
                        ? result.isCorrect
                          ? "oklch(0.56 0.19 148)"
                          : "oklch(0.55 0.22 20)"
                        : "oklch(0.60 0.01 260 / 0.2)",
                    }}
                  />
                </div>
                {/* 翻译 */}
                <p className="mt-0.5 truncate pl-7 text-[10px] text-foreground/30">
                  {s.chinese}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
