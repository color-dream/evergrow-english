import { useCallback, useEffect } from "react";
import { useVocabularySessionStore } from "@/stores/vocabulary-session-store";
import { useTimer } from "@/hooks/useTimer";
import { useWordBook } from "@/hooks/useWordBook";
import { useFSRSSync } from "@/hooks/useFSRSSync";
import { addStudySession, getCardsByBookId } from "@/lib/db";
import { getDueCards } from "@/lib/fsrs";
import { shuffleArray } from "@/lib/vocabulary-utils";
import { FIXED_WORDS_PER_ROUND } from "@/lib/constants";
import { VocabularyHeader } from "./VocabularyHeader";
import { WordCard } from "./WordCard";
import { ProgressBar } from "./ProgressBar";
import { SpeedBar } from "./SpeedBar";
import { ResultScreen } from "./ResultScreen";
import type { WordResult, WordBookId } from "@/types/vocabulary";
import { useUIStore } from "@/stores/ui-store";
import { WordBookList } from "./WordBookList";

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
  const setLearnMode = useVocabularySessionStore((s) => s.setLearnMode);
  const setElapsedSeconds = useVocabularySessionStore(
    (s) => s.setElapsedSeconds
  );

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
    if (phase === "active") {
      setElapsedSeconds(elapsed);
    }
  }, [elapsed, phase, setElapsedSeconds]);

  const { selectBook } = useWordBook();
  const startSession = useVocabularySessionStore((s) => s.startSession);
  const { saveWordResult } = useFSRSSync();

  const handleSelectBook = useCallback(
    async (id: WordBookId) => {
      const loadedWords = await selectBook(id);
      const cards = await getCardsByBookId(id);
      const dueCards = getDueCards(cards, Date.now());
      const mode = dueCards.length > 0 ? "mixed" : "new";
      setLearnMode(mode);

      // 直接构建本轮单词并启动，避免闭包问题
      let roundWords;
      if (mode === "mixed") {
        const dueWords = dueCards.slice(0, FIXED_WORDS_PER_ROUND).map((card) => ({
          id: card.id,
          text: card.wordText,
          lemma: card.wordText,
          definition: card.definition,
          partOfSpeech: "other" as const,
          difficulty: "B1" as const,
          tags: [],
          createdAt: card.createdAt,
        }));
        const dueCount = Math.min(dueWords.length, Math.floor(FIXED_WORDS_PER_ROUND / 2));
        const newCount = FIXED_WORDS_PER_ROUND - dueCount;
        const newPart = shuffleArray(loadedWords).slice(0, newCount);
        roundWords = [...dueWords.slice(0, dueCount), ...newPart];
      } else {
        roundWords = shuffleArray(loadedWords).slice(0, FIXED_WORDS_PER_ROUND);
      }

      startSession(roundWords);
    },
    [selectBook, setLearnMode, startSession]
  );

  const onComplete = useCallback(
    (result: WordResult) => {
      addWordResult(result);
      // fire-and-forget: 将结果写入 FSRS 卡片
      saveWordResult(result, selectedBook ?? "");
      setTimeout(() => {
        advanceWord();
      }, 400);
    },
    [addWordResult, advanceWord, saveWordResult, selectedBook]
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
      <VocabularyHeader />

      {/* 空闲：单词本列表 */}
      {phase === "idle" && (
        <WordBookList onSelectBook={handleSelectBook} />
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
              if (selectedBook) handleSelectBook(selectedBook);
            }}
            onChangeBook={() => {
              resetSession();
            }}
            onDictationRepeat={() => {
              if (selectedBook) handleSelectBook(selectedBook);
            }}
          />
        </>
      )}
    </div>
  );
}
