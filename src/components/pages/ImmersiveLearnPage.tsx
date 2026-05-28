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
import { WORD_BOOK_META } from "@/lib/word-book-registry";
import { WORDS_PER_ROUND_MAX, WORDS_PER_ROUND_MIN } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";

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
  const [isClosing, setIsClosing] = useState(false);

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
  }, [phase, newWords, selectedBook]);

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
    setIsClosing(true);
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
            className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white"
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const bookLabel = selectedBook ? WORD_BOOK_META[selectedBook]?.label : "";

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* 顶部栏：词库名 + 关闭按钮 */}
      <header className="flex h-12 items-center justify-between border-b border-border px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            disabled={isClosing}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            title="返回主窗口"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {bookLabel}
          </span>
          {isReviewPhase && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              复习
            </span>
          )}
        </div>
      </header>

      {/* 学习中 */}
      {(phase === "new-words" || phase === "review") && currentWord && (
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
          />
          <ProgressBar
            completedModes={completedModeCount}
            totalModes={totalModes}
            isReview={isReviewPhase}
          />
          <SpeedBar />
        </div>
      )}

      {/* 结束 */}
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
