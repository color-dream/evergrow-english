import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useVocabularySessionStore,
  getCurrentWord,
  getCurrentLearnMode,
} from "@/stores/vocabulary-session-store";
import type { ReviewWordMeta } from "@/stores/vocabulary-session-store";
import { useTimer } from "@/hooks/useTimer";
import { useWordCompletion } from "@/hooks/useWordCompletion";
import { useFSRSSync } from "@/hooks/useFSRSSync";
import { useLearningSessionPersistence } from "@/hooks/useLearningSessionPersistence";
import { loadWordBook } from "@/lib/word-book-registry";
import { shuffleArray, resolveWordsPerRound } from "@/lib/vocabulary-utils";
import { getDueCards } from "@/lib/fsrs";
import { getCardsByBookId } from "@/lib/db";
import type { FSRSState } from "@/types/domain";
import type { WordBookId } from "@/types/vocabulary";
import { WordCard } from "@/components/vocabulary/WordCard";
import { ProgressBar } from "@/components/vocabulary/ProgressBar";
import { SpeedBar } from "@/components/vocabulary/SpeedBar";
import { ResultScreen } from "@/components/vocabulary/ResultScreen";
import { WORDS_PER_ROUND_MAX, WORDS_PER_ROUND_MIN } from "@/lib/constants";
import { List, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { WordListDrawer } from "@/components/vocabulary/WordListDrawer";
import { ImmersiveSettingsPanel } from "@/components/vocabulary/ImmersiveSettingsPanel";

/** 从 FSRS 状态推导上次评分 */
function deriveRatingFromFSRS(fsrs: FSRSState): number {
  if (fsrs.state === "relearning" || fsrs.lapses > 2) return 1;
  if (fsrs.stability < 1) return 2;
  if (fsrs.stability < 5) return 3;
  return 4;
}

export function ImmersiveLearnPage() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("bookId") as WordBookId | null;
  const wordsPerRoundParam = searchParams.get("wordsPerRound");

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showWordList, setShowWordList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const phase = useVocabularySessionStore((s) => s.phase);
  const typingMode = useVocabularySessionStore((s) => s.typingMode);
  const startTime = useVocabularySessionStore((s) => s.startTime);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const newWords = useVocabularySessionStore((s) => s.newWords);
  const reviewWords = useVocabularySessionStore((s) => s.reviewWords);
  const reviewMeta = useVocabularySessionStore((s) => s.reviewMeta);
  const completedModeCount = useVocabularySessionStore((s) => s.completedModeCount);
  const regressionCount = useVocabularySessionStore((s) => s.regressionCount);
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);

  const startNewWordsPhase = useVocabularySessionStore((s) => s.startNewWordsPhase);
  const startReviewPhase = useVocabularySessionStore((s) => s.startReviewPhase);
  const finishSession = useVocabularySessionStore((s) => s.finishSession);
  const resetSession = useVocabularySessionStore((s) => s.resetSession);
  const addKeystrokes = useVocabularySessionStore((s) => s.addKeystrokes);
  const setElapsedSeconds = useVocabularySessionStore((s) => s.setElapsedSeconds);

  const progressBarPosition = useSettingsStore(
    (s) => s.preferences.progressBarPosition ?? "top"
  );

  const { recordModeComplete } = useWordCompletion();
  const { flushPendingSaves } = useFSRSSync();

  useLearningSessionPersistence(bookId);

  // 计时
  const elapsed = useTimer(
    phase === "new-words" || phase === "review" ? startTime : null
  );

  useEffect(() => {
    if (phase === "new-words" || phase === "review") {
      setElapsedSeconds(elapsed);
    }
  }, [elapsed, phase, setElapsedSeconds]);

  // 初始化：检查已保存会话或加载新词
  useEffect(() => {
    if (!bookId) {
      setInitError("缺少词库参数");
      setIsInitializing(false);
      return;
    }

    const init = async () => {
      // 已在 useLearningSessionPersistence 中恢复了会话
      const currentPhase = useVocabularySessionStore.getState().phase;
      if (currentPhase !== "idle") {
        setIsInitializing(false);
        return;
      }

      // 解析 wordsPerRound
      let wpr = useVocabularySessionStore.getState().wordsPerRound;
      if (wordsPerRoundParam) {
        const parsed = Number(wordsPerRoundParam);
        if (parsed >= WORDS_PER_ROUND_MIN && parsed <= WORDS_PER_ROUND_MAX) {
          wpr = parsed;
        }
      } else {
        // 无 URL 参数时从缓存读取（进行中的书直接进入的场景）
        wpr = await resolveWordsPerRound(bookId);
      }
      useVocabularySessionStore.getState().setWordsPerRound(wpr);

      try {
        // 加载词库
        const words = await loadWordBook(bookId);
        const selected = shuffleArray(words).slice(0, wpr);
        useVocabularySessionStore.getState().setSelectedWordBook(bookId);
        startNewWordsPhase(selected);
      } catch {
        setInitError("词库加载失败");
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [bookId, wordsPerRoundParam, startNewWordsPhase]);

  const loadReviewPhase = useCallback(async () => {
    if (!selectedBook) {
      finishSession();
      return;
    }

    try {
      const cards = await getCardsByBookId(selectedBook);
      const dueCards = await getDueCards(cards, Date.now());

      if (dueCards.length === 0) {
        finishSession();
        return;
      }

      const limit = useVocabularySessionStore.getState().wordsPerRound;
      const reviewWordsList = dueCards.slice(0, limit).map((card) => ({
        id: card.id,
        text: card.wordText,
        lemma: card.wordText,
        definition: card.definition,
        partOfSpeech: "other" as const,
        difficulty: "B1" as const,
        tags: [],
        createdAt: card.createdAt,
      }));

      const meta: Record<string, ReviewWordMeta> = {};
      for (const card of dueCards.slice(0, limit)) {
        meta[card.id] = {
          previousRating: deriveRatingFromFSRS(card.fsrs),
          lastReviewTime: card.fsrs.lastReview,
          stability: card.fsrs.stability,
          fsrs: card.fsrs,
        };
      }

      startReviewPhase(reviewWordsList, meta);
    } catch {
      finishSession();
    }
  }, [selectedBook, startReviewPhase, finishSession]);

  // 新词全部完成 → 加载复习阶段
  useEffect(() => {
    if (phase !== "new-words") return;
    if (newWords.length === 0) return;

    const allDone = Object.values(
      useVocabularySessionStore.getState().newWordCompletions
    ).every((c) => c.isFullyCompleted);

    if (allDone && selectedBook) {
      loadReviewPhase();
    }
  }, [phase, newWords, selectedBook, completedModeCount, loadReviewPhase, finishSession]);

  const onKeystroke = useCallback(
    (correct: boolean) => addKeystrokes(correct),
    [addKeystrokes]
  );

  const handleWrongChar = useCallback(() => {
    useVocabularySessionStore.getState().regressMode();
  }, []);

  // 重新开始同一词库
  const handleRepeat = useCallback(async () => {
    if (!selectedBook) return;
    try {
      const words = await loadWordBook(selectedBook);
      const selected = shuffleArray(words).slice(0, wordsPerRound);
      startNewWordsPhase(selected);
    } catch {
      // 静默失败
    }
  }, [selectedBook, wordsPerRound, startNewWordsPhase]);

  // 关闭窗口（先等待 FSRS 写入完成）
  const handleClose = useCallback(async () => {
    await flushPendingSaves(3000);
    resetSession();
    window.close();
  }, [resetSession, flushPendingSaves]);

  // 获取当前单词
  const state = useVocabularySessionStore.getState();
  const currentWordInfo = getCurrentWord(state);
  const isReviewPhase = phase === "review";
  const currentWord = currentWordInfo?.word ?? null;
  const currentLearnMode = currentWordInfo
    ? getCurrentLearnMode(currentWordInfo.completion)
    : "typeWithWord";
  const currentWords = isReviewPhase ? reviewWords : newWords;
  const totalModes = currentWords.length * 4 + regressionCount;

  // 错误状态
  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-foreground">{initError}</p>
          <button
            onClick={handleClose}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-white"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  // 加载中
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
      </div>
    );
  }

  const isInSession = phase === "new-words" || phase === "review";

  return (
    <div
      className="relative flex h-screen flex-col"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 40%, oklch(0.85 0.055 252 / 0.18), transparent 70%), linear-gradient(180deg, var(--color-background), oklch(0.96 0.008 275 / 0.5), var(--color-background))",
      }}
    >
      {/* ── 顶部贴边进度条 ── */}
      {progressBarPosition === "top" && isInSession && (
        <ProgressBar
          completedModes={completedModeCount}
          totalModes={totalModes}
          isReview={isReviewPhase}
        />
      )}

      {/* ── 浮动按钮 ── */}
      {isInSession && (
        <>
          <button
            onClick={() => setShowWordList((v) => !v)}
            className={cn(
              "absolute top-4 z-40 flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all duration-[400ms] hover:scale-105 active:scale-95",
              showWordList ? "rounded-full" : "rounded-r-full"
            )}
            style={{
              left: showWordList ? "18rem" : "0",
              background: "var(--glass-sheet-bg)",
              backdropFilter:
                "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter:
                "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-sheet-border)",
              boxShadow: showWordList ? "none" : "var(--shadow-sm)",
              color: "var(--color-foreground)",
              opacity: 0.75,
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            onMouseEnter={(e) => { (e.currentTarget.style.opacity = "1"); }}
            onMouseLeave={(e) => { if (!showWordList) (e.currentTarget.style.opacity = "0.75"); }}
            title={showWordList ? "关闭列表" : "单词列表"}
          >
            {showWordList ? (
              <X className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground/60 transition-all duration-300 hover:text-foreground hover:scale-105 active:scale-95"
            style={{
              background: "var(--glass-pill-bg)",
              backdropFilter:
                "blur(var(--glass-pill-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter:
                "blur(var(--glass-pill-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-pill-border)",
            }}
            title="设置"
          >
            <Settings className="h-4 w-4" />
          </button>
        </>
      )}

      {/* ── 学习区域 ── */}
      {isInSession && currentWord && (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <WordCard
            key={`${currentWord.id}-${currentLearnMode}`}
            word={currentWord}
            learnMode={currentLearnMode}
            typingMode={typingMode}
            onComplete={recordModeComplete}
            onKeystroke={onKeystroke}
            onWrongChar={handleWrongChar}
            isReview={isReviewPhase}
            reviewMeta={
              isReviewPhase ? reviewMeta[currentWord.id] : undefined
            }
            disabled={showWordList || showSettings}
          />
          <SpeedBar />
        </div>
      )}

      {/* ── 底部贴边进度条 ── */}
      {progressBarPosition === "bottom" && isInSession && (
        <ProgressBar
          completedModes={completedModeCount}
          totalModes={totalModes}
          isReview={isReviewPhase}
        />
      )}

      {/* ── 覆盖面板 ── */}
      <WordListDrawer
        open={showWordList}
        onClose={() => setShowWordList(false)}
      />
      <ImmersiveSettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* ── 结果页 ── */}
      {phase === "finished" && (
        <ResultScreen
          onRepeat={handleRepeat}
          onChangeBook={handleClose}
          onDictationRepeat={handleRepeat}
        />
      )}
    </div>
  );
}
