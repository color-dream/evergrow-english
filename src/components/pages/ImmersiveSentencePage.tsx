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
import { useAudio } from "@/app/providers/AudioProvider";
import { List, X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImmersiveSentencePage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const bookId = searchParams.get("bookId") as SentenceBookId | null;
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showSentenceList, setShowSentenceList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const phase = useSentenceSessionStore((s) => s.phase);
  const isInSession = phase === "learning";
  const startTime = useSentenceSessionStore((s) => s.startTime);
  const sentences = useSentenceSessionStore((s) => s.sentences);
  const currentSentenceIndex = useSentenceSessionStore((s) => s.currentSentenceIndex);
  const isTyping = useSentenceSessionStore((s) => s.isTyping);
  const sentenceResults = useSentenceSessionStore((s) => s.sentenceResults);

  const startSession = useSentenceSessionStore((s) => s.startSession);
  const completeSentence = useSentenceSessionStore((s) => s.completeSentence);
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

  // Ctrl+H 切换答案显示
  useEffect(() => {
    if (!isInSession) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setShowAnswer((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isInSession]);

  // 句子切换时重置答案隐藏
  useEffect(() => {
    setShowAnswer(false);
  }, [currentSentenceIndex]);

  const handleClose = useCallback(() => { resetSession(); window.close(); }, [resetSession]);
  const handleRepeat = useCallback(async () => {
    if (!courseId || !bookId) return;
    try { const sents = await loadSingleCourse(courseId, bookId); startSession(sents, bookId); } catch { /* */ }
  }, [courseId, bookId, startSession]);

  const audio = useAudio();
  const currentSentence = useSentenceSessionStore(getCurrentSentence);

  const handlePlaySound = useCallback(() => {
    if (currentSentence) {
      audio.speak(currentSentence.english, { rate: 0.8 }).catch(() => {});
    }
  }, [currentSentence, audio]);

  const totalSentences = sentences.length;
  const progress = currentSentenceIndex;

  // 句子完成后自动推进到下一句
  const handleComplete = useCallback(
    (wrongWordIndices: number[]) => {
      completeSentence(wrongWordIndices);
      // 短暂延迟后自动推进
      setTimeout(() => {
        const isLast = advanceSentence();
        if (isLast) finishSession();
      }, wrongWordIndices.length === 0 ? 600 : 1200);
    },
    [completeSentence, advanceSentence, finishSession],
  );

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
      {isInSession && <ProgressBar completedModes={progress} totalModes={totalSentences} isReview={false} />}

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
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
          <SentenceCard
            key={currentSentence.id}
            sentence={currentSentence}
            isTyping={isTyping}
            onComplete={handleComplete}
          />
        </div>
      )}

      {/* ── 底部键盘提示栏 ── */}
      {isInSession && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-2xl border px-5 py-3"
          style={{
            background: "var(--glass-sheet-bg)",
            backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
            WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
            borderColor: "var(--glass-sheet-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* 答案显示 */}
          {showAnswer && currentSentence && (
            <p className="mb-3 text-center text-sm text-foreground/55 animate-spring-up select-all">
              {currentSentence.english}
            </p>
          )}

          <div className="flex items-center gap-6">
            {/* 播放按钮 */}
            <button
              onClick={handlePlaySound}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-200 hover:bg-foreground/5"
            >
              <Volume2 className="h-4 w-4 text-foreground/45" />
              <span className="text-[11px] text-foreground/45">朗读</span>
            </button>
            <span className="h-7 w-px rounded-full bg-foreground/8" />
            {/* 快捷键提示 */}
            <div className="flex items-center gap-3">
              <kbd className="flex flex-col items-center rounded-lg border border-b-[3px] px-3 py-1"
                style={{ background: "oklch(0.985 0.002 275)", borderColor: "oklch(0.55 0.01 260 / 0.3)", boxShadow: "0 2px 0 oklch(0.55 0.01 260 / 0.15)" }}
              >
                <span className="text-xs font-mono font-medium" style={{ color: "oklch(0.35 0.01 260)" }}>Enter</span>
                <span className="text-[10px] text-foreground/40">提交</span>
              </kbd>
              <kbd className="flex flex-col items-center rounded-lg border border-b-[3px] px-3 py-1"
                style={{ background: "oklch(0.985 0.002 275)", borderColor: "oklch(0.55 0.01 260 / 0.3)", boxShadow: "0 2px 0 oklch(0.55 0.01 260 / 0.15)" }}
              >
                <span className="text-xs font-mono font-medium" style={{ color: "oklch(0.35 0.01 260)" }}>Space</span>
                <span className="text-[10px] text-foreground/40">修正</span>
              </kbd>
              {/* 分隔 */}
              <span className="h-7 w-px rounded-full bg-foreground/8" />
              <kbd
                className="flex cursor-pointer flex-col items-center rounded-lg border border-b-[3px] px-3 py-1 transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: "oklch(0.985 0.002 275)", borderColor: "oklch(0.55 0.01 260 / 0.3)", boxShadow: "0 2px 0 oklch(0.55 0.01 260 / 0.15)" }}
                onClick={() => setShowAnswer((v) => !v)}
              >
                <span className="text-[10px] font-mono font-medium" style={{ color: "oklch(0.35 0.01 260)" }}>Ctrl H</span>
                <span className="text-[10px] text-foreground/40">{showAnswer ? "隐藏" : "显示"}</span>
              </kbd>
            </div>
          </div>
        </div>
      )}

      {/* ── 暂停蒙层 ── */}
      {(showSentenceList || showSettings || !isTyping) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "oklch(0 0 0 / 0.12)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
          {!isTyping && !showSentenceList && !showSettings && (
            <p className="select-none text-2xl font-medium text-foreground/80 animate-spring-scale">
              按任意键开始学习
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
