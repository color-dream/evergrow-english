import { useCallback, useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useTimer } from "@/hooks/useTimer";
import { useWordBook } from "@/hooks/useWordBook";
import { VocabularyHeader } from "./VocabularyHeader";
import { WordCard } from "./WordCard";
import { ProgressBar } from "./ProgressBar";
import { SpeedBar } from "./SpeedBar";
import { ResultScreen } from "./ResultScreen";
import type { WordResult } from "@/types/vocabulary";
import { useUIStore } from "@/stores/ui-store";
import { BookMarked } from "lucide-react";

export function VocabularyPage() {
  const phase = useVocabularySessionStore((s) => s.phase);
  const mode = useVocabularySessionStore((s) => s.mode);
  const dictation = useVocabularySessionStore((s) => s.dictation);
  const words = useVocabularySessionStore((s) => s.words);
  const currentIndex = useVocabularySessionStore((s) => s.currentIndex);
  const startTime = useVocabularySessionStore((s) => s.startTime);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);

  const advanceWord = useVocabularySessionStore((s) => s.advanceWord);
  const addWordResult = useVocabularySessionStore((s) => s.addWordResult);
  const addKeystrokes = useVocabularySessionStore((s) => s.addKeystrokes);
  const resetSession = useVocabularySessionStore((s) => s.resetSession);
  const setElapsedSeconds = useVocabularySessionStore((s) => s.setElapsedSeconds);

  // 进入学习时隐藏侧边栏，获得沉浸式体验
  useEffect(() => {
    if (phase === "active") {
      useUIStore.getState().setSidebarForceHidden(true);
      return () => {
        useUIStore.getState().setSidebarForceHidden(false);
      };
    }
    useUIStore.getState().setSidebarForceHidden(false);
  }, [phase]);

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
  const prevWord = currentIndex > 0 ? words[currentIndex - 1] : null;
  const nextWord =
    currentIndex < words.length - 1 ? words[currentIndex + 1] : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header 工具栏 */}
      <VocabularyHeader
        onStart={startRound}
        onSelectBook={selectBook}
        isLoading={isLoading}
      />

      {/* 空闲：词库选择占位 */}
      {phase === "idle" && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <BookMarked className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">词汇打字</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedBook
                ? "词库已就绪，点击上方开始按钮"
                : "请从上方选择词库开始学习"}
            </p>
          </div>
        </div>
      )}

      {/* 学习中 */}
      {phase === "active" && currentWord && (
        <div className="flex flex-1 flex-col items-center">
          <WordCard
            key={`${currentWord.id}-${mode}-${dictation.type}`}
            word={currentWord}
            prevWord={prevWord}
            nextWord={nextWord}
            mode={mode}
            dictation={dictation}
            onComplete={onComplete}
            onKeystroke={onKeystroke}
          />
          <ProgressBar />
          <SpeedBar />
        </div>
      )}

      {/* 结束阶段（背景 + 全屏遮罩） */}
      {phase === "finished" && (
        <>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">本轮完成</p>
            </div>
          </div>
          <ResultScreen
            onRepeat={() => {
              startRound();
            }}
            onChangeBook={() => {
              resetSession();
            }}
            onDictationRepeat={() => {
              startRound();
            }}
          />
        </>
      )}
    </div>
  );
}
