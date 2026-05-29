import { useEffect, useMemo } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { WORD_BOOK_META } from "@/lib/word-book-registry";
import type { WordCompletion } from "@/types/vocabulary";
import { WORD_LEARN_MODE_SEQUENCE } from "@/types/vocabulary";

import { X, Heart, ThumbsUp, AlertTriangle } from "lucide-react";

interface ResultScreenProps {
  onRepeat: () => void;
  onChangeBook: () => void;
  onDictationRepeat: () => void;
}

/** 每个模式的最终得分状态 */
type ModeStatus = "perfect" | "passed" | "failed" | "unreached";

interface WordDetail {
  wordId: string;
  wordText: string;
  definition: string;
  modes: ModeStatus[];
}

function getModeStatus(completion: WordCompletion | undefined, modeIndex: number): ModeStatus {
  if (!completion || completion.modeResults.length === 0) return "unreached";

  // 取该模式最后一次结果（regress 时会重复）
  const modeName = WORD_LEARN_MODE_SEQUENCE[modeIndex];
  let lastResult = undefined;
  for (let i = completion.modeResults.length - 1; i >= 0; i--) {
    if (completion.modeResults[i].mode === modeName) {
      lastResult = completion.modeResults[i];
      break;
    }
  }
  if (!lastResult) return "unreached";

  if (lastResult.wrongCount === 0) return "perfect";
  if (lastResult.wrongCount < 4) return "passed";
  return "failed";
}

const DOT_COLORS: Record<ModeStatus, string> = {
  perfect: "bg-green-400",
  passed: "bg-amber-400",
  failed: "bg-red-400",
  unreached: "bg-foreground/10",
};

export function ResultScreen({
  onRepeat,
  onChangeBook,
}: ResultScreenProps) {
  const wordResults = useVocabularySessionStore((s) => s.wordResults);
  const newCompletions = useVocabularySessionStore((s) => s.newWordCompletions);
  const reviewCompletions = useVocabularySessionStore((s) => s.reviewWordCompletions);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const setIsTyping = useVocabularySessionStore((s) => s.setIsTyping);

  // 按模式级别统计正确/错误
  const { correctModes, totalModes } = useMemo(() => {
    let correct = 0;
    let total = 0;
    const allCompletions = { ...newCompletions, ...reviewCompletions };
    for (const comp of Object.values(allCompletions)) {
      for (const mr of comp.modeResults) {
        total++;
        if (mr.wrongCount === 0) correct++;
      }
    }
    return { correctModes: correct, totalModes: total };
  }, [newCompletions, reviewCompletions]);
  const accuracy = totalModes > 0
    ? Math.round((correctModes / totalModes) * 100)
    : 0;

  const cpm = elapsed > 0 ? Math.round((totalK / elapsed) * 60) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const bookMeta = selectedBook ? WORD_BOOK_META[selectedBook] : null;
  const wrongWords = wordResults.filter((r) => !r.isCorrect);

  // 合并新词+复习的 completion，按 wordResults 顺序排列
  const wordDetails: WordDetail[] = useMemo(() => {
    const allCompletions = { ...newCompletions, ...reviewCompletions };
    return wordResults.map((wr) => {
      const comp = allCompletions[wr.wordId];
      const modes: ModeStatus[] = WORD_LEARN_MODE_SEQUENCE.map(
        (_, i) => getModeStatus(comp, i),
      );
      return {
        wordId: wr.wordId,
        wordText: wr.wordText,
        definition: wr.definition,
        modes,
      };
    });
  }, [wordResults, newCompletions, reviewCompletions]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Enter") {
        e.preventDefault();
        setIsTyping(true);
        onRepeat();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsTyping(true);
        onRepeat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRepeat, setIsTyping]);

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto">
      {/* 遮罩 — iOS 26 蓝色调模糊 */}
      <div
        className="absolute inset-0"
        style={{
          background: "oklch(0.55 0.195 252 / 0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />

      <div className="flex h-screen items-center justify-center">
        <div
          className="fixed flex w-[90vw] max-w-4xl flex-col pb-14 pl-10 pr-5 pt-10 animate-spring-in md:w-4/5"
          style={{
            background: "var(--glass-sheet-bg)",
            backdropFilter:
              "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
            WebkitBackdropFilter:
              "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
            border: "1px solid var(--glass-sheet-border)",
            borderRadius: "var(--radius-4xl)",
            boxShadow: "var(--shadow-2xl)",
          }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onChangeBook}
            className="absolute right-5 top-5 rounded-full p-1.5 text-foreground/40 transition-all duration-300 hover:text-foreground hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 标题 */}
          <h2 className="text-center font-sans text-xl font-normal text-foreground md:text-2xl">
            {bookMeta?.label ?? "词库"}
          </h2>

          {/* 主体 */}
          <div className="mt-10 flex gap-6">
            {/* 左侧：统计环 */}
            <div className="flex flex-shrink-0 flex-col gap-3">
              <RemarkRing
                value={accuracy}
                label="正确率"
                unit="%"
                showRing
                color={
                  accuracy >= 85
                    ? "text-green-500"
                    : accuracy >= 70
                      ? "text-yellow-500"
                      : "text-red-500"
                }
              />
              <RemarkRing
                value={`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
                label="时间"
              />
              <RemarkRing value={`${cpm}`} label="字母/分" />
            </div>

            {/* 右侧：单词详细学习状况 */}
            <div
              className="flex flex-1 flex-col rounded-2xl p-4"
              style={{
                background: "oklch(0.55 0.195 252 / 0.06)",
                border: "1px solid oklch(0.55 0.195 252 / 0.08)",
              }}
            >
              {/* 图例 + 结语 */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-foreground/40">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400" /> 全对
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> 有错
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-400" /> 失败
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-foreground/10" /> 未到
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: "oklch(0.55 0.195 252 / 0.12)",
                    color: "var(--color-primary)",
                  }}
                >
                  <ConclusionIcon
                    accuracy={accuracy}
                    wrongCount={totalModes - correctModes}
                  />
                  <ConclusionMessage
                    accuracy={accuracy}
                    wrongCount={totalModes - correctModes}
                  />
                </div>
              </div>

              {/* 单词列表 */}
              <div className="max-h-72 overflow-y-auto glass-scrollbar pr-1">
                <div className="mb-1.5 flex items-center gap-4 px-1 text-[11px] text-foreground/20">
                  <span className="w-10 shrink-0">模式</span>
                  <span className="w-24 shrink-0">单词</span>
                  <span>释义</span>
                </div>
                <div className="flex flex-col">
                  {wordDetails.map((wd) => (
                    <div
                      key={wd.wordId}
                      className="flex items-center gap-4 rounded-lg px-1 py-1 transition-colors duration-200 hover:bg-foreground/[0.03]"
                    >
                      <span className="inline-flex w-10 shrink-0 gap-0.5">
                        {wd.modes.map((status, i) => (
                          <span
                            key={i}
                            className={`inline-block h-2.5 w-2.5 rounded-full ${DOT_COLORS[status]}`}
                            title={`模式${i + 1}: ${
                              status === "perfect" ? "全对" :
                              status === "passed" ? "有错" :
                              status === "failed" ? "失败" : "未到达"
                            }`}
                          />
                        ))}
                      </span>
                      <span className="w-24 shrink-0 font-mono text-[13px] text-foreground/75">
                        {wd.wordText}
                      </span>
                      <span className="truncate text-[12px] text-foreground/40">
                        {wd.definition}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="mt-10 flex justify-center gap-4">
            <PrimaryButton
              onClick={() => {
                setIsTyping(true);
                onRepeat();
              }}
            >
              再来一轮
            </PrimaryButton>
            <button
              onClick={onChangeBook}
              className="flex items-center justify-center rounded-full px-6 py-2 text-base font-medium text-primary transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "var(--glass-pill-bg)",
                backdropFilter: "blur(var(--glass-pill-blur))",
                WebkitBackdropFilter: "blur(var(--glass-pill-blur))",
                border: "1px solid var(--glass-card-border)",
              }}
            >
              休息一下
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 统计环 */
function RemarkRing({
  value,
  label,
  unit,
  showRing,
  color,
}: {
  value: string | number;
  label: string;
  unit?: string;
  showRing?: boolean;
  color?: string;
}) {
  const displayColor = color ?? "text-foreground";
  const glowColor =
    color === "text-green-500"
      ? "oklch(0.55 0.19 148 / 0.15)"
      : color === "text-yellow-500"
        ? "oklch(0.72 0.18 85 / 0.15)"
        : "oklch(0.52 0.2 18 / 0.15)";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex h-28 w-28 items-center justify-center"
        style={
          showRing
            ? {
                borderRadius: "50%",
                border: "4px solid oklch(0.55 0.195 252 / 0.2)",
                background: "oklch(0.55 0.195 252 / 0.04)",
                boxShadow: `inset 0 0 20px ${glowColor}`,
              }
            : {}
        }
      >
        <div className="text-center">
          <span className={`text-xl font-bold tabular-nums ${displayColor}`}>
            {value}
            {unit && <span className="text-sm">{unit}</span>}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function ConclusionIcon({
  accuracy,
  wrongCount,
}: {
  accuracy: number;
  wrongCount: number;
}) {
  if (wrongCount === 0) return <Heart className="h-3.5 w-3.5" />;
  if (accuracy >= 70) return <ThumbsUp className="h-3.5 w-3.5" />;
  return <AlertTriangle className="h-3.5 w-3.5" />;
}

function ConclusionMessage({
  accuracy,
  wrongCount,
}: {
  accuracy: number;
  wrongCount: number;
}) {
  if (wrongCount === 0) return <span>全对了，完美！</span>;
  if (accuracy >= 85) return <span>表现不错！只错了 {wrongCount} 次</span>;
  if (accuracy >= 70) return <span>有些小问题哦，下一次可以做得更好！</span>;
  return <span>错误太多，再来一次如何？</span>;
}

function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-full px-8 py-2.5 text-base font-medium text-white transition-all duration-300 hover:scale-105 active:scale-95"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.55 0.195 252), oklch(0.5 0.17 265))",
        boxShadow: "0 4px 16px oklch(0.55 0.195 252 / 0.35)",
      }}
    >
      {children}
    </button>
  );
}
