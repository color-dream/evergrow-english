import { useCallback, useEffect, useState } from "react";
import {
  useVocabularySessionStore,
  getCurrentWord,
  getCurrentLearnMode,
} from "@/stores/vocabulary-session-store";
import type { ReviewWordMeta } from "@/stores/vocabulary-session-store";
import { useTimer } from "@/hooks/useTimer";
import { useWordBook } from "@/hooks/useWordBook";
import { useWordCompletion } from "@/hooks/useWordCompletion";
import { addStudySession, getCardsByBookId } from "@/lib/db";
import { getDueCards } from "@/lib/fsrs";
import { shuffleArray } from "@/lib/vocabulary-utils";
import { VocabularyHeader } from "./VocabularyHeader";
import { WordCard } from "./WordCard";
import { ProgressBar } from "./ProgressBar";
import { SpeedBar } from "./SpeedBar";
import { ResultScreen } from "./ResultScreen";
import type { WordBookId } from "@/types/vocabulary";
import type { FSRSState } from "@/types/domain";
import { useUIStore } from "@/stores/ui-store";
import { WordBookList } from "./WordBookList";
import { PreSettingsDialog } from "./PreSettingsDialog";
import { WORD_BOOK_META } from "@/lib/word-book-registry";

/** 从 FSRS 状态推导上次评分（用于展示） */
function deriveFSRSRatingFromState(fsrs: FSRSState): number {
  if (fsrs.state === "relearning" || fsrs.lapses > 2) return 1;
  if (fsrs.stability < 1) return 2;
  if (fsrs.stability < 5) return 3;
  return 4;
}

export function VocabularyPage() {
  const phase = useVocabularySessionStore((s) => s.phase);
  const typingMode = useVocabularySessionStore((s) => s.typingMode);
  const startTime = useVocabularySessionStore((s) => s.startTime);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);
  const newWords = useVocabularySessionStore((s) => s.newWords);
  const newWordCompletions = useVocabularySessionStore(
    (s) => s.newWordCompletions
  );
  const reviewWords = useVocabularySessionStore((s) => s.reviewWords);
  const reviewMeta = useVocabularySessionStore((s) => s.reviewMeta);
  const completedModeCount = useVocabularySessionStore(
    (s) => s.completedModeCount
  );
  const regressionCount = useVocabularySessionStore(
    (s) => s.regressionCount
  );

  const [preSettingsBookId, setPreSettingsBookId] =
    useState<WordBookId | null>(null);

  const resetSession = useVocabularySessionStore((s) => s.resetSession);
  const finishSession = useVocabularySessionStore((s) => s.finishSession);
  const startNewWordsPhase = useVocabularySessionStore(
    (s) => s.startNewWordsPhase
  );
  const startReviewPhase = useVocabularySessionStore(
    (s) => s.startReviewPhase
  );
  const addKeystrokes = useVocabularySessionStore((s) => s.addKeystrokes);
  const setElapsedSeconds = useVocabularySessionStore(
    (s) => s.setElapsedSeconds
  );

  const { selectBook } = useWordBook();
  const { recordModeComplete } = useWordCompletion();

  // 进入学习时隐藏侧边栏
  useEffect(() => {
    if (phase === "new-words" || phase === "review") {
      useUIStore.getState().setSidebarForceHidden(true);
      return () => {
        useUIStore.getState().setSidebarForceHidden(false);
      };
    }
    useUIStore.getState().setSidebarForceHidden(false);
  }, [phase]);

  const elapsed = useTimer(
    phase === "new-words" || phase === "review" ? startTime : null
  );

  // 会话结束时记录 StudySession
  useEffect(() => {
    if (phase === "finished" && startTime) {
      const wordResults = useVocabularySessionStore.getState().wordResults;
      const wordsCorrect = wordResults.filter((r) => r.isCorrect).length;
      addStudySession({
        sessionType: "learn-new",
        startTime,
        endTime: Date.now(),
        cardsReviewed: wordResults.length,
        cardsCorrect: wordsCorrect,
        totalTimeSpentMs: Date.now() - startTime,
      }).catch(() => {});
    }
  }, [phase, startTime]);

  useEffect(() => {
    if (phase === "new-words" || phase === "review") {
      setElapsedSeconds(elapsed);
    }
  }, [elapsed, phase, setElapsedSeconds]);

  // 新词全部完成 → 加载复习阶段
  useEffect(() => {
    if (phase !== "new-words") return;

    const allDone =
      newWords.length > 0 &&
      Object.values(newWordCompletions).every((c) => c.isFullyCompleted);

    if (allDone) {
      loadReviewPhase();
    }
  }, [phase, newWords, newWordCompletions]);

  const loadReviewPhase = useCallback(async () => {
    if (!selectedBook) {
      finishSession();
      return;
    }

    try {
      const cards = await getCardsByBookId(selectedBook);
      const dueCards = getDueCards(cards, Date.now());

      if (dueCards.length === 0) {
        finishSession();
        return;
      }

      const limit = useVocabularySessionStore.getState().wordsPerRound;
      const reviewWordsList = dueCards
        .slice(0, limit)
        .map((card) => ({
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
          previousRating: deriveFSRSRatingFromState(card.fsrs),
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

  const startLearningWithBook = useCallback(
    async (bookId: WordBookId) => {
      const loadedWords = await selectBook(bookId);
      const count = useVocabularySessionStore.getState().wordsPerRound;
      const newRoundWords = shuffleArray(loadedWords).slice(0, count);
      startNewWordsPhase(newRoundWords);
    },
    [selectBook, startNewWordsPhase]
  );

  const handleSelectBook = useCallback(
    async (id: WordBookId) => {
      if (phase === "idle") {
        setPreSettingsBookId(id);
      } else {
        await startLearningWithBook(id);
      }
    },
    [phase, startLearningWithBook]
  );

  const handlePreSettingsConfirm = useCallback(
    (wordsPerRoundValue: number) => {
      const store = useVocabularySessionStore.getState();
      store.setWordsPerRound(wordsPerRoundValue);
      const bookId = preSettingsBookId;
      setPreSettingsBookId(null);
      if (bookId) {
        startLearningWithBook(bookId);
      }
    },
    [preSettingsBookId, startLearningWithBook]
  );

  const handlePreSettingsCancel = useCallback(() => {
    setPreSettingsBookId(null);
  }, []);

  const onKeystroke = useCallback(
    (correct: boolean) => {
      addKeystrokes(correct);
    },
    [addKeystrokes]
  );

  const handleWrongChar = useCallback(() => {
    useVocabularySessionStore.getState().regressMode();
  }, []);

  // 获取当前单词信息
  const state = useVocabularySessionStore.getState();
  const currentWordInfo = getCurrentWord(state);
  const isReviewPhase = phase === "review";

  const currentWord = currentWordInfo?.word ?? null;
  const currentLearnMode = currentWordInfo
    ? getCurrentLearnMode(currentWordInfo.completion)
    : "typeWithWord";
  const currentWords = isReviewPhase ? reviewWords : newWords;
  const totalModes = currentWords.length * 4 + regressionCount;

  return (
    <div className="flex h-full flex-col">
      {/* Header 工具栏 */}
      <VocabularyHeader />

      {/* 空闲：单词本列表 */}
      {phase === "idle" && (
        <WordBookList onSelectBook={handleSelectBook} />
      )}

      {/* 选书预设弹窗 */}
      {preSettingsBookId && (
        <PreSettingsDialog
          open={true}
          bookName={WORD_BOOK_META[preSettingsBookId].label}
          initialWordsPerRound={wordsPerRound}
          onConfirm={handlePreSettingsConfirm}
          onCancel={handlePreSettingsCancel}
        />
      )}

      {/* 学习中（新词或复习） */}
      {(phase === "new-words" || phase === "review") && currentWord && (
        <div className="flex flex-1 flex-col items-center">
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

      {/* 结束阶段 */}
      {phase === "finished" && (
        <>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">本轮完成</p>
            </div>
          </div>
          <ResultScreen
            onRepeat={() => {
              if (selectedBook) startLearningWithBook(selectedBook);
            }}
            onChangeBook={() => {
              resetSession();
            }}
            onDictationRepeat={() => {
              if (selectedBook) startLearningWithBook(selectedBook);
            }}
          />
        </>
      )}
    </div>
  );
}
