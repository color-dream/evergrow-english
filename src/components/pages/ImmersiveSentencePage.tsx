import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useSentenceSessionStore,
  getCurrentSentence,
} from "@/stores/sentence-session-store";
import { useTimer } from "@/hooks/useTimer";
import { useSentenceFSRSSync } from "@/hooks/useSentenceFSRSSync";
import { loadSingleCourse } from "@/lib/sentence-book-registry";
import type { SentenceBookId } from "@/types/sentence";
import { SentenceCard } from "@/components/vocabulary/SentenceCard";
import { SentenceListDrawer } from "@/components/vocabulary/SentenceListDrawer";
import { ImmersiveSettingsPanel } from "@/components/vocabulary/ImmersiveSettingsPanel";
import { ProgressBar } from "@/components/vocabulary/ProgressBar";
import { List, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImmersiveSentencePage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const bookId = searchParams.get("bookId") as SentenceBookId | null;
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showSentenceList, setShowSentenceList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const phase = useSentenceSessionStore((s) => s.phase);
  const isInSession = phase === "learning";
  const startTime = useSentenceSessionStore((s) => s.startTime);
  const sentences = useSentenceSessionStore((s) => s.sentences);
  const currentSentenceIndex = useSentenceSessionStore((s) => s.currentSentenceIndex);
  const currentMode = useSentenceSessionStore((s) => s.currentMode);
  const isTyping = useSentenceSessionStore((s) => s.isTyping);
  const sentenceResults = useSentenceSessionStore((s) => s.sentenceResults);

  const startSession = useSentenceSessionStore((s) => s.startSession);
  const completeMode = useSentenceSessionStore((s) => s.completeMode);
  const advanceSentence = useSentenceSessionStore((s) => s.advanceSentence);
  const finishSession = useSentenceSessionStore((s) => s.finishSession);
  const resetSession = useSentenceSessionStore((s) => s.resetSession);
  const setIsTyping = useSentenceSessionStore((s) => s.setIsTyping);
  const setElapsedSeconds = useSentenceSessionStore((s) => s.setElapsedSeconds);
  const tickTimer = useSentenceSessionStore((s) => s.tickTimer);
  const { saveSentenceResult } = useSentenceFSRSSync();

  // 计时
  const elapsed = useTimer(isInSession ? startTime : null);
  useEffect(() => { if (isInSession) setElapsedSeconds(elapsed); }, [elapsed, isInSession, setElapsedSeconds]);
  useEffect(() => {
    if (!isInSession) return;
    const interval = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(interval);
  }, [isInSession, tickTimer]);

  // FSRS 持久化
  useEffect(() => {
    if (phase !== "finished" || !bookId) return;
    const results = useSentenceSessionStore.getState().sentenceResults;
    const allSentences = useSentenceSessionStore.getState().sentences;
    const sentenceMap = new Map(allSentences.map((s) => [s.english, s]));
    for (const r of results) {
      const s = sentenceMap.get(r.sentenceEnglish);
      saveSentenceResult({ result: r, bookId, soundmark: s?.soundmark });
    }
  }, [phase, bookId, saveSentenceResult]);

  // 初始化
  useEffect(() => {
    if (!courseId) { setInitError("缺少课程参数"); setIsInitializing(false); return; }
    if (!bookId) { setInitError("缺少分册参数"); setIsInitializing(false); return; }
    const init = async () => {
      if (useSentenceSessionStore.getState().phase !== "idle") { setIsInitializing(false); return; }
      try {
        const allSentences = await loadSingleCourse(courseId, bookId);
        if (allSentences.length === 0) { setInitError("该课程暂未添加内容"); setIsInitializing(false); return; }
        startSession(allSentences, bookId);
      } catch { setInitError("课程加载失败"); }
      finally { setIsInitializing(false); }
    };
    init();
  }, [courseId, bookId, startSession]);

  // 面板关闭后进入暂停
  const prevShowList = useRef(showSentenceList);
  useEffect(() => {
    if (prevShowList.current && !showSentenceList) setIsTyping(false);
    prevShowList.current = showSentenceList;
  }, [showSentenceList, setIsTyping]);
  const prevShowSettings = useRef(showSettings);
  useEffect(() => {
    if (prevShowSettings.current && !showSettings) setIsTyping(false);
    prevShowSettings.current = showSettings;
  }, [showSettings, setIsTyping]);

  // 键盘监听：按任意键开始 / 恢复打字
  useEffect(() => {
    if (!isInSession || isTyping) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (showSentenceList || showSettings) return;
      e.preventDefault();
      setIsTyping(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isInSession, isTyping, setIsTyping, showSentenceList, showSettings]);

  const handleClose = useCallback(() => { resetSession(); window.close(); }, [resetSession]);
  const handleRepeat = useCallback(async () => {
    if (!bookId) return;
    try { const sents = await loadSentenceBook(bookId); startSession(sents, bookId); } catch { /* */ }
  }, [bookId, startSession]);

  const currentSentence = useSentenceSessionStore(getCurrentSentence);

  // 当前句是否 3 种模式全部完成（作为 effect 触发源）
  const isCurrentFullyCompleted = useSentenceSessionStore((s) => {
    const idx = s.currentSentenceIndex;
    const sen = s.sentences[idx];
    if (!sen) return false;
    return s.completions[sen.id]?.isFullyCompleted ?? false;
  });

  const totalModes = sentences.length * 3;
  const completedModes = currentSentenceIndex * 3 +
    (currentSentence ? (useSentenceSessionStore.getState().completions[currentSentence.id]?.modeResults.length ?? 0) : 0);

  // 当前句全部完成 → 自动推进到下一句
  useEffect(() => {
    if (!isInSession || !isCurrentFullyCompleted) return;
    const isLast = advanceSentence();
    if (isLast) finishSession();
  }, [isCurrentFullyCompleted, isInSession, advanceSentence, finishSession]);

  // ═══ 条件渲染 ═══

  if (initError) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="text-center">
      <p className="text-lg text-foreground">{initError}</p>
      <button onClick={handleClose} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-white">关闭</button>
    </div></div>;
  }
  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
    </div>;
  }

  if (phase === "finished") {
    const correctCount = sentenceResults.filter((r) => r.isCorrect).length;
    return <div className="flex h-screen flex-col items-center justify-center gap-8 bg-background px-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">学习完成！</h2>
      <div className="grid grid-cols-3 gap-6 text-center">
        {[{ v: sentenceResults.length, l: "完成句数" }, { v: correctCount, l: "全对句数" }, { v: sentenceResults.length > 0 ? `${Math.round((correctCount / sentenceResults.length) * 100)}%` : "0%", l: "正确率" }].map(({ v, l }) => (
          <div key={l}><p className="font-mono text-3xl font-bold text-foreground">{v}</p><p className="mt-1 text-xs text-foreground/45">{l}</p></div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={handleRepeat} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95">再来一轮</button>
        <button onClick={handleClose} className="rounded-full px-6 py-2.5 text-sm font-medium text-foreground/60 transition-all duration-300 hover:scale-105 active:scale-95" style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-card-border)" }}>关闭</button>
      </div>
    </div>;
  }

  return (
    <div className="learn-page relative flex h-screen flex-col bg-background">
      {isInSession && <ProgressBar completedModes={completedModes} totalModes={totalModes} isReview={false} />}

      {/* ── 浮动按钮 ── */}
      {isInSession && (
        <>
          <button
            onClick={() => setShowSentenceList((v) => !v)}
            className="absolute top-4 left-4 z-40 rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95 text-foreground/60 hover:text-foreground"
            style={{
              background: "var(--glass-sheet-bg)",
              backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-sheet-border)",
              boxShadow: "var(--shadow-sm)",
            }}
            title={showSentenceList ? "关闭列表" : "句子列表"}
          >
            <span className="relative flex h-4 w-4">
              <X className={cn("absolute inset-0 h-4 w-4 transition-all duration-300", showSentenceList ? "opacity-100 rotate-0" : "opacity-0 rotate-90")} />
              <List className={cn("absolute inset-0 h-4 w-4 transition-all duration-300", showSentenceList ? "opacity-0 -rotate-90" : "opacity-100 rotate-0")} />
            </span>
          </button>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-40 rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95 text-foreground/60 hover:text-foreground"
            style={{
              background: "var(--glass-sheet-bg)",
              backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-sheet-border)",
              boxShadow: "var(--shadow-sm)",
            }}
            title="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}

      {isInSession && currentSentence && (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <SentenceCard
            key={`${currentSentence.id}-${currentMode}`}
            sentence={currentSentence}
            learnMode={currentMode}
            isTyping={isTyping}
            onComplete={(wrongWordIndices) => {
              completeMode(wrongWordIndices);
            }}
          />
        </div>
      )}

      {/* ── 暂停蒙层 ── */}
      {isInSession && (showSentenceList || showSettings || !isTyping) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "oklch(0 0 0 / 0.12)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
          {!isTyping && !showSentenceList && !showSettings && (
            <p className="select-none text-2xl font-medium text-foreground/80 animate-spring-scale">
              {currentSentenceIndex > 0 || completedModes > 0 ? "按任意键继续学习" : "按任意键开始学习"}
            </p>
          )}
        </div>
      )}

      {/* ── 覆盖面板 ── */}
      <SentenceListDrawer open={showSentenceList} onClose={() => setShowSentenceList(false)} />
      <ImmersiveSettingsPanel open={showSettings} onToggle={() => setShowSettings((v) => !v)} />
    </div>
  );
}
