import { useCallback, useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useTimer } from "@/hooks/useTimer";
import { seedWords } from "@/lib/seed-data/words";
import { VOCABULARY_ROUND_SIZES } from "@/lib/constants";
import { ProgressHeader } from "./ProgressHeader";
import { WordCard } from "./WordCard";
import type { WordResult } from "@/types/vocabulary";
import type { DictationType } from "@/types/vocabulary";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const DICTATION_OPTIONS: { key: DictationType; label: string }[] = [
  { key: "hideAll", label: "全部隐藏" },
  { key: "hideVowel", label: "隐藏元音" },
  { key: "hideConsonant", label: "隐藏辅音" },
  { key: "randomHide", label: "随机隐藏" },
];

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

  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);
  const mode = useVocabularySessionStore((s) => s.mode);
  const dictation = useVocabularySessionStore((s) => s.dictation);
  const words = useVocabularySessionStore((s) => s.words);
  const currentIndex = useVocabularySessionStore((s) => s.currentIndex);
  const wordResults = useVocabularySessionStore((s) => s.wordResults);
  const totalKeystrokes = useVocabularySessionStore((s) => s.totalKeystrokes);
  const correctKeystrokes = useVocabularySessionStore(
    (s) => s.totalCorrectKeystrokes
  );
  const elapsedSeconds = useVocabularySessionStore((s) => s.elapsedSeconds);
  const startTime = useVocabularySessionStore((s) => s.startTime);

  const setWordsPerRound = useVocabularySessionStore((s) => s.setWordsPerRound);
  const setMode = useVocabularySessionStore((s) => s.setMode);
  const setDictation = useVocabularySessionStore((s) => s.setDictation);
  const startSession = useVocabularySessionStore((s) => s.startSession);
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

  // ── 闲置阶段：配置面板 ──
  if (phase === "idle") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 animate-fade-in">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-foreground">词汇打字</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            逐字母输入，强化单词记忆
          </p>
        </div>

        {/* 配置卡片 */}
        <div className="space-y-8 rounded-xl border border-border bg-card p-6 shadow-xs">
          {/* 每轮词数 */}
          <fieldset>
            <legend className="mb-3 text-sm font-medium">每轮词数</legend>
            <div className="flex gap-2">
              {VOCABULARY_ROUND_SIZES.map((n) => (
                <button
                  key={n}
                  onClick={() => setWordsPerRound(n)}
                  className={cn(
                    "flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all",
                    wordsPerRound === n
                      ? "border-primary/40 bg-primary/8 text-primary shadow-xs"
                      : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 打字模式 */}
          <fieldset>
            <legend className="mb-3 text-sm font-medium">打字模式</legend>
            <div className="flex gap-2">
              {(["strict", "loose"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all",
                    mode === m
                      ? "border-primary/40 bg-primary/8 text-primary shadow-xs"
                      : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                  )}
                >
                  {m === "strict" ? "严格模式" : "宽松模式"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {mode === "strict"
                ? "打错即重置当前词，防止形成错误肌肉记忆"
                : "允许退格修正，输完后再整体比对"}
            </p>
          </fieldset>

          {/* 听写模式 */}
          <fieldset>
            <legend className="mb-3 flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={dictation.enabled}
                onChange={(e) => setDictation({ enabled: e.target.checked })}
                className="h-4 w-4 rounded accent-primary"
              />
              听写模式
            </legend>
            {dictation.enabled && (
              <div className="ml-7 flex flex-wrap gap-2">
                {DICTATION_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDictation({ type: key })}
                    className={cn(
                      "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all",
                      dictation.type === key
                        ? "border-primary/40 bg-primary/8 text-primary shadow-xs"
                        : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </fieldset>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={() => startSession(seedWords)}
          className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:opacity-90 active:scale-[0.98]"
        >
          开始学习
        </button>
      </div>
    );
  }

  // ── 进行中 ──
  if (phase === "active" && currentWord) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 animate-fade-in">
        <ProgressHeader />
        <WordCard
          key={currentWord.id}
          word={currentWord}
          mode={mode}
          dictation={dictation}
          onComplete={onComplete}
          onKeystroke={onKeystroke}
        />
      </div>
    );
  }

  // ── 完成阶段：统计面板 ──
  if (phase === "finished") {
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

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={() => startSession(seedWords)}
            className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:opacity-90 active:scale-[0.98]"
          >
            再来一轮
          </button>
          <button
            onClick={resetSession}
            className="rounded-xl border border-border px-6 py-3.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            返回配置
          </button>
        </div>
      </div>
    );
  }

  return null;
}
