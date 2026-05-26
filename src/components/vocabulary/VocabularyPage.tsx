import { useCallback, useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useTimer } from "@/hooks/useTimer";
import { seedWords } from "@/lib/seed-data/words";
import { VOCABULARY_ROUND_SIZES } from "@/lib/constants";
import { ProgressHeader } from "./ProgressHeader";
import { WordCard } from "./WordCard";
import type { WordResult } from "@/types/vocabulary";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function VocabularyPage() {
  const phase = useVocabularySessionStore((s) => s.phase);

  // 打词练习阶段隐藏侧边栏，提供沉浸式体验
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

  // 计时器
  const setElapsedSeconds = useVocabularySessionStore(
    (s) => s.setElapsedSeconds
  );
  const elapsed = useTimer(phase === "active" ? startTime : null);

  // 同步 useTimer 到 store
  useEffect(() => {
    if (phase === "active") {
      setElapsedSeconds(elapsed);
    }
  }, [elapsed, phase, setElapsedSeconds]);

  const onComplete = useCallback(
    (result: WordResult) => {
      addWordResult(result);
      // 使用 setTimeout 给用户短暂看到结果
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
      <div className="mx-auto max-w-xl px-4 py-12 animate-fade-in">
        <h1 className="mb-2 text-center text-2xl font-bold">词汇打字</h1>
        <p className="mb-10 text-center text-sm text-muted-foreground">
          通过逐字母输入来强化单词记忆
        </p>

        {/* 每轮词数 */}
        <div className="mb-8">
          <label className="mb-2 block text-sm font-medium">每轮词数</label>
          <div className="flex gap-2">
            {VOCABULARY_ROUND_SIZES.map((n) => (
              <button
                key={n}
                onClick={() => setWordsPerRound(n)}
                className={cn(
                  "flex-1 rounded-md border py-2 text-sm font-medium transition-colors",
                  wordsPerRound === n
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* 打字模式 */}
        <div className="mb-8">
          <label className="mb-2 block text-sm font-medium">打字模式</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("strict")}
              className={cn(
                "flex-1 rounded-md border py-2 text-sm font-medium transition-colors",
                mode === "strict"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              严格模式
            </button>
            <button
              onClick={() => setMode("loose")}
              className={cn(
                "flex-1 rounded-md border py-2 text-sm font-medium transition-colors",
                mode === "loose"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              宽松模式
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "strict"
              ? "打错即重置当前词，防止形成错误肌肉记忆"
              : "允许退格修正，输完后再对比"}
          </p>
        </div>

        {/* 听写模式 */}
        <div className="mb-10">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={dictation.enabled}
              onChange={(e) => setDictation({ enabled: e.target.checked })}
              className="rounded"
            />
            听写模式
          </label>
          {dictation.enabled && (
            <div className="ml-6 flex flex-wrap gap-2">
              {(
                [
                  { key: "hideAll", label: "全部隐藏" },
                  { key: "hideVowel", label: "隐藏元音" },
                  { key: "hideConsonant", label: "隐藏辅音" },
                  { key: "randomHide", label: "随机隐藏" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDictation({ type: key })}
                  className={cn(
                    "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                    dictation.type === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 开始按钮 */}
        <button
          onClick={() => startSession(seedWords)}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          开始学习
        </button>
      </div>
    );
  }

  // ── 进行中 ──
  if (phase === "active" && currentWord) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
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
      <div className="mx-auto max-w-xl px-4 py-12 animate-slide-up">
        <h1 className="mb-8 text-center text-2xl font-bold">本轮完成</h1>

        {/* 统计卡片 */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4 text-center">
            <p className="text-3xl font-bold font-mono tabular-nums">
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">用时</p>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <p className="text-3xl font-bold text-success font-mono tabular-nums">
              {accuracy}%
            </p>
            <p className="text-xs text-muted-foreground">准确率</p>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <p className="text-3xl font-bold font-mono tabular-nums">{wpm}</p>
            <p className="text-xs text-muted-foreground">WPM</p>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <p className="text-3xl font-bold font-mono tabular-nums">
              {wordsCorrect}/{wordResults.length}
            </p>
            <p className="text-xs text-muted-foreground">完全正确</p>
          </div>
        </div>

        {/* 出错词列表 */}
        {wordResults.some((r) => !r.isCorrect) && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold">出错词汇</h2>
            <div className="rounded-lg border border-border">
              {wordResults
                .filter((r) => !r.isCorrect)
                .map((r) => (
                  <div
                    key={r.wordId}
                    className="flex items-center justify-between border-b border-border px-4 py-2 last:border-0"
                  >
                    <span className="font-mono font-medium">{r.wordText}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.definition}
                    </span>
                    <span className="text-xs text-destructive">
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
            className="flex-1 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            再来一轮
          </button>
          <button
            onClick={resetSession}
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            返回配置
          </button>
        </div>
      </div>
    );
  }

  return null;
}
