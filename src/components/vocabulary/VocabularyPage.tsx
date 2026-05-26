import { useCallback, useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useTimer } from "@/hooks/useTimer";
import { useWordBook } from "@/hooks/useWordBook";
import { ProgressHeader } from "./ProgressHeader";
import { WordCard } from "./WordCard";
import { SettingsPanel } from "./SettingsPanel";
import type { WordResult } from "@/types/vocabulary";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function VocabularyPage() {
  const phase = useVocabularySessionStore((s) => s.phase);

  useEffect(() => {
    if (phase === "active") {
      useUIStore.getState().setSidebarForceHidden(true);
      return () => {
        useUIStore.getState().setSidebarForceHidden(false);
      };
    }
    useUIStore.getState().setSidebarForceHidden(false);
  }, [phase]);

  const mode = useVocabularySessionStore((s) => s.mode);
  const dictation = useVocabularySessionStore((s) => s.dictation);
  const words = useVocabularySessionStore((s) => s.words);
  const currentIndex = useVocabularySessionStore((s) => s.currentIndex);
  const startTime = useVocabularySessionStore((s) => s.startTime);

  const advanceWord = useVocabularySessionStore((s) => s.advanceWord);
  const addWordResult = useVocabularySessionStore((s) => s.addWordResult);
  const addKeystrokes = useVocabularySessionStore((s) => s.addKeystrokes);
  const resetSession = useVocabularySessionStore((s) => s.resetSession);

  const setElapsedSeconds = useVocabularySessionStore(
    (s) => s.setElapsedSeconds
  );
  const elapsed = useTimer(phase === "active" ? startTime : null);

  useEffect(() => {
    if (phase === "active") {
      setElapsedSeconds(elapsed);
    }
  }, [elapsed, phase, setElapsedSeconds]);

  const { isLoading, selectBook, startRound } = useWordBook();

  const onComplete = useCallback(
    (result: WordResult) => {
      addWordResult(result);
      setTimeout(() => {
        advanceWord();
      }, 400);
    },
    [addWordResult, advanceWord]
  );

  const onKeystroke = useCallback(
    (correct: boolean) => {
      addKeystrokes(correct);
    },
    [addKeystrokes]
  );

  const currentWord = words[currentIndex] ?? null;

  return (
    <div className="flex h-full">
      {/* 左侧：主内容区 */}
      <div className="flex-1 overflow-y-auto">
        {phase === "idle" && <IdlePlaceholder />}
        {phase === "active" && currentWord && (
          <div className="mx-auto max-w-2xl px-4 py-6 animate-fade-in">
            <ProgressHeader />
            <WordCard
              key={`${currentWord.id}-${mode}`}
              word={currentWord}
              mode={mode}
              dictation={dictation}
              onComplete={onComplete}
              onKeystroke={onKeystroke}
            />
          </div>
        )}
        {phase === "finished" && <FinishedStats />}
        {phase === null && null}
      </div>

      {/* 右侧：设置面板（始终可见） */}
      <SettingsPanel
        onStart={startRound}
        onNewRound={startRound}
        onChangeBook={resetSession}
        onSelectBook={selectBook}
        isLoading={isLoading}
      />
    </div>
  );
}

/** 闲置阶段：提示用户从右侧选择词库 */
function IdlePlaceholder() {
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground">词汇打字</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {selectedBook
            ? "词库已就绪，点击右侧按钮开始"
            : "请从右侧面板选择词库开始学习"}
        </p>
      </div>
    </div>
  );
}

/** 完成阶段：统计面板 */
function FinishedStats() {
  const wordResults = useVocabularySessionStore((s) => s.wordResults);
  const totalKeystrokes = useVocabularySessionStore((s) => s.totalKeystrokes);
  const correctKeystrokes = useVocabularySessionStore(
    (s) => s.totalCorrectKeystrokes
  );
  const elapsedSeconds = useVocabularySessionStore((s) => s.elapsedSeconds);

  const accuracy =
    totalKeystrokes > 0
      ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
      : 0;
  const wpm =
    elapsedSeconds > 0
      ? Math.round((wordResults.length / elapsedSeconds) * 60)
      : 0;
  const wordsCorrect = wordResults.filter((r) => r.isCorrect).length;
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 animate-slide-up">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-foreground">本轮完成</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {wordsCorrect === wordResults.length
            ? "全部正确，太棒了！"
            : `完成 ${wordResults.length} 个单词`}
        </p>
      </div>

      {/* 统计卡片网格 */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center shadow-xs">
          <p className="font-mono text-3xl font-bold tabular-nums text-foreground">
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">用时</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center shadow-xs">
          <p
            className={cn(
              "font-mono text-3xl font-bold tabular-nums",
              accuracy >= 90
                ? "text-success"
                : accuracy >= 70
                  ? "text-warning"
                  : "text-destructive"
            )}
          >
            {accuracy}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">准确率</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center shadow-xs">
          <p className="font-mono text-3xl font-bold tabular-nums text-foreground">
            {wpm}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">WPM</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center shadow-xs">
          <p
            className={cn(
              "font-mono text-3xl font-bold tabular-nums",
              wordsCorrect === wordResults.length
                ? "text-success"
                : wordsCorrect === 0
                  ? "text-destructive"
                  : "text-foreground"
            )}
          >
            {wordsCorrect}/{wordResults.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">完全正确</p>
        </div>
      </div>

      {/* 出错词列表 */}
      {wordResults.some((r) => !r.isCorrect) && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold">出错词汇</h2>
          <div className="overflow-hidden rounded-xl border border-border shadow-xs">
            {wordResults
              .filter((r) => !r.isCorrect)
              .map((r, i) => (
                <div
                  key={r.wordId}
                  className={cn(
                    "flex items-center justify-between bg-card px-4 py-3",
                    i !== 0 && "border-t border-border"
                  )}
                >
                  <span className="font-mono font-medium">{r.wordText}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.definition}
                  </span>
                  <span className="text-xs font-medium text-destructive">
                    错误 {r.wrongCount} 次
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
