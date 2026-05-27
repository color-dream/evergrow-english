import { useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { WORD_BOOK_META } from "@/lib/word-book-registry";

import { X, Heart, ThumbsUp, AlertTriangle } from "lucide-react";

interface ResultScreenProps {
  onRepeat: () => void;
  onChangeBook: () => void;
  onDictationRepeat: () => void;
}

export function ResultScreen({
  onRepeat,
  onChangeBook,
}: ResultScreenProps) {
  const wordResults = useVocabularySessionStore((s) => s.wordResults);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const correctK = useVocabularySessionStore((s) => s.totalCorrectKeystrokes);
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const setIsTyping = useVocabularySessionStore((s) => s.setIsTyping);

  const accuracy = totalK > 0 ? Math.round((correctK / totalK) * 100) : 0;
  const wpm = elapsed > 0 ? Math.round((wordResults.length / elapsed) * 60) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const bookMeta = selectedBook ? WORD_BOOK_META[selectedBook] : null;
  const wrongWords = wordResults.filter((r) => !r.isCorrect);

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
      <div className="absolute inset-0 bg-gray-300 opacity-80 dark:bg-gray-600" />

      <div className="flex h-screen items-center justify-center">
        <div className="my-card fixed flex w-[90vw] max-w-3xl flex-col rounded-3xl bg-card pb-14 pl-10 pr-5 pt-10 shadow-my-card animate-fade-in md:w-4/5">
          {/* 关闭按钮 */}
          <button
            onClick={onChangeBook}
            className="absolute right-5 top-5 rounded-lg p-1 text-muted-foreground hover:bg-muted"
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
              <RemarkRing value={`${wpm}`} label="WPM" />
            </div>

            {/* 中间：错误词列表 */}
            <div className="flex flex-1 flex-col rounded-xl bg-indigo-50 p-4 dark:bg-gray-700">
              <div className="max-h-80 overflow-y-auto">
                {wrongWords.length === 0 ? (
                  <div className="flex h-full items-center justify-center py-10 text-sm text-muted-foreground">
                    全部正确，没有错误单词！
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {wrongWords.map((r) => (
                      <WordChip
                        key={r.wordId}
                        word={r.wordText}
                        wrongCount={r.wrongCount}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 结语 */}
              <div className="mt-auto flex items-center gap-2 rounded-xl bg-indigo-200 px-4 py-3 text-sm font-medium text-indigo-800 dark:bg-indigo-400 dark:text-indigo-100">
                <ConclusionIcon
                  accuracy={accuracy}
                  wrongCount={wrongWords.length}
                />
                <ConclusionMessage
                  accuracy={accuracy}
                  wrongCount={wrongWords.length}
                />
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
              重复本章节
            </PrimaryButton>
            <PrimaryButton onClick={onChangeBook}>更换词库</PrimaryButton>
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
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded-full ${showRing ? "border-8 border-indigo-200" : ""} flex h-28 w-28 items-center justify-center`}
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

/** 错误词标签 */
function WordChip({ word, wrongCount }: { word: string; wrongCount: number }) {
  return (
    <span
      title={`错误 ${wrongCount} 次`}
      className="word-chip inline-flex h-10 cursor-pointer flex-row items-center justify-center rounded-md border-2 border-solid border-indigo-400 bg-card px-3 py-0.5 font-mono text-xl font-light text-foreground transition-colors duration-100 hover:bg-indigo-100 dark:border-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 md:h-12 md:px-5"
    >
      {word}
    </span>
  );
}

function ConclusionIcon({
  accuracy,
  wrongCount,
}: {
  accuracy: number;
  wrongCount: number;
}) {
  if (wrongCount === 0) return <Heart className="h-5 w-5" />;
  if (accuracy >= 70) return <ThumbsUp className="h-5 w-5" />;
  return <AlertTriangle className="h-5 w-5" />;
}

function ConclusionMessage({
  accuracy,
  wrongCount,
}: {
  accuracy: number;
  wrongCount: number;
}) {
  if (wrongCount === 0) return <span>全对了，完美！</span>;
  if (accuracy >= 85) return <span>表现不错！只错了 {wrongCount} 个单词</span>;
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
      className="my-btn-primary flex items-center justify-center rounded-lg bg-indigo-400 px-6 py-2 text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
