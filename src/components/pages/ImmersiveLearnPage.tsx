import { useEffect, useState, useCallback, useRef } from "react";
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
import { ResultScreen } from "@/components/vocabulary/ResultScreen";
import { List, X, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { WordListDrawer } from "@/components/vocabulary/WordListDrawer";
import { ImmersiveSettingsPanel } from "@/components/vocabulary/ImmersiveSettingsPanel";
import { LearnAnalyticsPanel } from "@/components/vocabulary/LearnAnalyticsPanel";
import { useAudio } from "@/app/providers/AudioProvider";

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

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showWordList, setShowWordList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const phase = useVocabularySessionStore((s) => s.phase);
  const isInSession = phase === "new-words" || phase === "review";
  const startTime = useVocabularySessionStore((s) => s.startTime);
  const selectedBook = useVocabularySessionStore((s) => s.selectedWordBook);
  const newWords = useVocabularySessionStore((s) => s.newWords);
  const reviewWords = useVocabularySessionStore((s) => s.reviewWords);
  const reviewMeta = useVocabularySessionStore((s) => s.reviewMeta);
  const completedModeCount = useVocabularySessionStore((s) => s.completedModeCount);
  const regressionCount = useVocabularySessionStore((s) => s.regressionCount);
  const wordsPerRound = useVocabularySessionStore((s) => s.wordsPerRound);
  const isTyping = useVocabularySessionStore((s) => s.isTyping);
  const setIsTyping = useVocabularySessionStore((s) => s.setIsTyping);
  const totalKeystrokes = useVocabularySessionStore((s) => s.totalKeystrokes);

  const startNewWordsPhase = useVocabularySessionStore((s) => s.startNewWordsPhase);
  const startReviewPhase = useVocabularySessionStore((s) => s.startReviewPhase);
  const finishSession = useVocabularySessionStore((s) => s.finishSession);
  const resetSession = useVocabularySessionStore((s) => s.resetSession);
  const addKeystrokes = useVocabularySessionStore((s) => s.addKeystrokes);
  const setElapsedSeconds = useVocabularySessionStore((s) => s.setElapsedSeconds);

  const progressBarPosition = useSettingsStore(
    (s) => s.preferences.progressBarPosition ?? "top"
  );
  const pronunciation = useSettingsStore((s) => s.preferences.pronunciation ?? "us");
  const audio = useAudio();

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

      // 从缓存恢复每轮单词数
      const wpr = await resolveWordsPerRound(bookId);
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
  }, [bookId, startNewWordsPhase]);

  // 学习中途修改每轮词数 → 重新洗牌并重启
  const prevWprRef = useRef<number | null>(null);
  useEffect(() => {
    const prev = prevWprRef.current;
    prevWprRef.current = wordsPerRound;
    // 跳过初始挂载（prev 为 null 表示首次）
    if (prev === null || prev === wordsPerRound) return;
    if (!bookId || !selectedBook) return;
    const phase = useVocabularySessionStore.getState().phase;
    if (phase !== "new-words" && phase !== "review") return;

    const restart = async () => {
      try {
        const words = await loadWordBook(bookId);
        const selected = shuffleArray(words).slice(0, wordsPerRound);
        startNewWordsPhase(selected);
      } catch {
        // 静默失败
      }
    };
    restart();
  }, [wordsPerRound]);

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
        usphone: card.usphone,
        ukphone: card.ukphone,
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

  // 窗口失焦 → 暂停
  useEffect(() => {
    const onBlur = () => setIsTyping(false);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [setIsTyping]);

  // 面板打开时禁用输入、关闭后进入暂停
  const prevShowWordList = useRef(showWordList);
  useEffect(() => {
    if (prevShowWordList.current && !showWordList) {
      setIsTyping(false);
    }
    prevShowWordList.current = showWordList;
  }, [showWordList, setIsTyping]);

  const prevShowSettings = useRef(showSettings);
  useEffect(() => {
    if (prevShowSettings.current && !showSettings) {
      setIsTyping(false);
    }
    prevShowSettings.current = showSettings;
  }, [showSettings, setIsTyping]);

  // 暂停蒙层：按任意键恢复
  useEffect(() => {
    if (!isInSession || isTyping) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // 面板打开时不恢复，关闭面板后会自动进入暂停
      if (showWordList || showSettings || showAnalytics) return;
      e.preventDefault();
      setIsTyping(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isInSession, isTyping, setIsTyping, showWordList, showSettings, showAnalytics]);

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

  // ── 快捷键 ──
  useEffect(() => {
    if (!isInSession) return;
    const handler = (e: KeyboardEvent) => {
      if (showWordList || showSettings || showAnalytics) return;
      if (!e.ctrlKey && !e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case "l":
          e.preventDefault();
          setShowWordList((v) => !v);
          break;
        case ",":
          e.preventDefault();
          setShowSettings((v) => !v);
          break;
        case "s":
          e.preventDefault();
          setShowAnalytics(true);
          setIsTyping(false);
          break;
        case "j": {
          e.preventDefault();
          const w = getCurrentWord(useVocabularySessionStore.getState())?.word;
          if (w?.text && audio.supported) {
            audio.speak(w.text, { rate: 0.8, accent: pronunciation }).catch(() => {});
          }
          break;
        }
        case "r":
          e.preventDefault();
          handleRepeat();
          break;
        case "w":
          e.preventDefault();
          handleClose();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isInSession, showWordList, showSettings, showAnalytics, setIsTyping, handleRepeat, handleClose, pronunciation, audio]);

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

  return (
    <div className="learn-page relative flex h-screen flex-col bg-background">
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
            className="absolute top-4 left-4 z-40 rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95 text-foreground/60 hover:text-foreground"
            style={{
              background: "var(--glass-sheet-bg)",
              backdropFilter:
                "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter:
                "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-sheet-border)",
              boxShadow: "var(--shadow-sm)",
            }}
            title={showWordList ? "关闭列表" : "单词列表"}
          >
            <span className="relative flex h-4 w-4">
              <X
                className={cn(
                  "absolute inset-0 h-4 w-4 transition-all duration-300",
                  showWordList ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                )}
              />
              <List
                className={cn(
                  "absolute inset-0 h-4 w-4 transition-all duration-300",
                  showWordList ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
                )}
              />
            </span>
          </button>

          <button
            onClick={() => {
              setShowAnalytics(true);
              setIsTyping(false);
            }}
            className="absolute bottom-4 right-4 z-40 rounded-full p-2.5 transition-all duration-300 hover:scale-110 active:scale-95 text-foreground/60 hover:text-foreground"
            style={{
              background: "var(--glass-sheet-bg)",
              backdropFilter:
                "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter:
                "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-sheet-border)",
              boxShadow: "var(--shadow-sm)",
            }}
            title="学习统计"
          >
            <BarChart3 className="h-5 w-5" />
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
            onComplete={recordModeComplete}
            onKeystroke={onKeystroke}
            onWrongChar={handleWrongChar}
            isReview={isReviewPhase}
            reviewMeta={
              isReviewPhase ? reviewMeta[currentWord.id] : undefined
            }
            disabled={showWordList || showSettings || showAnalytics}
          />
          {/* ── 统计 + 快捷键合并横条 ── */}
          <CombinedStatusBar
            setShowWordList={setShowWordList}
            setShowSettings={setShowSettings}
            setShowAnalytics={setShowAnalytics}
            setIsTyping={setIsTyping}
            handleRepeat={handleRepeat}
          />
        </div>
      )}

      {/* ── 暂停蒙层 ── */}
      {isInSession && (showWordList || showSettings || showAnalytics || !isTyping) && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{
            background: "oklch(0 0 0 / 0.12)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          {!isTyping && !showWordList && !showSettings && (
            <p className="select-none text-2xl font-medium text-foreground/80 animate-spring-scale">
              {totalKeystrokes > 0 ? "按任意键继续学习" : "按任意键开始学习"}
            </p>
          )}
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
      <LearnAnalyticsPanel
        open={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        bookId={bookId}
      />
      <ImmersiveSettingsPanel
        open={showSettings}
        onToggle={() => setShowSettings((v) => !v)}
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

// ── 统计 + 快捷键合并横条 ──
function CombinedStatusBar({
  setShowWordList,
  setShowSettings,
  setShowAnalytics,
  setIsTyping,
  handleRepeat,
}: {
  setShowWordList: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowSettings: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowAnalytics: (v: boolean) => void;
  setIsTyping: (v: boolean) => void;
  handleRepeat: () => void;
}) {
  const elapsed = useVocabularySessionStore((s) => s.elapsedSeconds);
  const totalK = useVocabularySessionStore((s) => s.totalKeystrokes);
  const newWordCompletions = useVocabularySessionStore((s) => s.newWordCompletions);
  const reviewWordCompletions = useVocabularySessionStore((s) => s.reviewWordCompletions);
  const pronunciation = useSettingsStore((s) => s.preferences.pronunciation ?? "us");
  const audio = useAudio();

  const correctModes = Object.values({ ...newWordCompletions, ...reviewWordCompletions }).reduce(
    (sum, comp) => sum + comp.modeResults.filter((mr) => mr.wrongCount === 0).length,
    0,
  );
  const wrongModes = Object.values({ ...newWordCompletions, ...reviewWordCompletions }).reduce(
    (sum, comp) => sum + comp.modeResults.filter((mr) => mr.wrongCount > 0).length,
    0,
  );
  const totalModes = correctModes + wrongModes;
  const accuracy = totalModes > 0 ? Math.round((correctModes / totalModes) * 100) : 0;
  const cpm = elapsed > 0 ? Math.round((totalK / elapsed) * 60) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div
      className="mx-auto mb-4 flex items-center gap-1 rounded-full px-4 py-2 animate-spring-up"
      style={{
        background: "var(--glass-card-bg)",
        backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
        border: "1px solid var(--glass-card-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* 统计 */}
      <StatChip value={`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`} label="时间" />
      <StatChip value={`${cpm}`} label="字母/分" />
      <StatChip value={`${correctModes}`} label="正确" />
      <StatChip value={`${wrongModes}`} label="错误" />
      <StatChip value={`${accuracy}%`} label="正确率" />

      {/* 分隔 */}
      <div className="mx-1.5 h-6 w-px shrink-0 rounded-full bg-foreground/8" />

      {/* 快捷键 */}
      {([
        { keys: "Ctrl L", label: "列表", action: () => setShowWordList((v) => !v) },
        { keys: "Ctrl ,", label: "设置", action: () => setShowSettings((v) => !v) },
        { keys: "Ctrl S", label: "统计", action: () => { setShowAnalytics(true); setIsTyping(false); } },
        { keys: "Ctrl J", label: "朗读", action: () => {
          const w = getCurrentWord(useVocabularySessionStore.getState())?.word;
          if (w?.text && audio.supported) {
            audio.speak(w.text, { rate: 0.8, accent: pronunciation }).catch(() => {});
          }
        }},
        { keys: "Ctrl R", label: "重置", action: () => handleRepeat() },
      ] as const).map(({ keys, label, action }) => (
        <button
          key={keys}
          onClick={action}
          className="flex flex-col items-center rounded-lg border border-foreground/10 px-2 py-0.5 transition-all duration-200 hover:border-foreground/20 hover:bg-foreground/5 active:scale-[0.97]"
        >
          <span className="font-mono text-[10px] font-semibold text-foreground/60 leading-none">{keys}</span>
          <span className="mt-0.5 text-[8px] text-foreground/35 leading-none">{label}</span>
        </button>
      ))}
    </div>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-0.5">
      <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[9px] font-medium text-foreground/40">{label}</span>
    </div>
  );
}
