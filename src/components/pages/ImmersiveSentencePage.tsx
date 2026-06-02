import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useSentenceSessionStore,
  getCurrentSentence,
} from "@/stores/sentence-session-store";
import { useTimer } from "@/hooks/useTimer";
import { useSentenceFSRSSync } from "@/hooks/useSentenceFSRSSync";
import { loadSentenceBook } from "@/lib/sentence-book-registry";
import type { SentenceBookId } from "@/types/sentence";
import { SentenceCard } from "@/components/vocabulary/SentenceCard";
import { ProgressBar } from "@/components/vocabulary/ProgressBar";
import { X } from "lucide-react";

export function ImmersiveSentencePage() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("bookId") as SentenceBookId | null;
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

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
    const sentenceMap = new Map(allSentences.map((s) => [s.uuid, s]));
    for (const r of results) {
      const s = sentenceMap.get(r.sentenceUuid);
      saveSentenceResult({ result: r, bookId, segments: s?.segments, phonetic: s?.phonetic });
    }
  }, [phase, bookId, saveSentenceResult]);

  // 初始化
  useEffect(() => {
    if (!bookId) { setInitError("缺少句子本参数"); setIsInitializing(false); return; }
    const init = async () => {
      if (useSentenceSessionStore.getState().phase !== "idle") { setIsInitializing(false); return; }
      try {
        const allSentences = await loadSentenceBook(bookId);
        if (allSentences.length === 0) { setInitError("该句子本暂未添加内容"); setIsInitializing(false); return; }
        startSession(allSentences, bookId);
      } catch { setInitError("句子本加载失败"); }
      finally { setIsInitializing(false); }
    };
    init();
  }, [bookId, startSession]);

  // 键盘监听：按任意键开始 / 恢复打字
  useEffect(() => {
    if (!isInSession || isTyping) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      setIsTyping(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isInSession, isTyping, setIsTyping]);

  const handleClose = useCallback(() => { resetSession(); window.close(); }, [resetSession]);
  const handleRepeat = useCallback(async () => {
    if (!bookId) return;
    try { const sents = await loadSentenceBook(bookId); startSession(sents, bookId); } catch { /* */ }
  }, [bookId, startSession]);

  const currentSentence = useSentenceSessionStore(getCurrentSentence);

  const totalModes = sentences.length * 3;
  const completedModes = currentSentenceIndex * 3 +
    (currentSentence ? (useSentenceSessionStore.getState().completions[currentSentence.id]?.modeResults.length ?? 0) : 0);

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
      {isInSession && (
        <div className="flex items-center justify-between px-4 py-2">
          <p className="text-xs text-foreground/40">第 {currentSentenceIndex + 1} / {sentences.length} 句</p>
          <button onClick={handleClose} className="rounded-full p-1.5 text-foreground/40 hover:text-foreground transition-all duration-300 hover:scale-105 active:scale-95" title="关闭"><X className="h-4 w-4" /></button>
        </div>
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
              // 检查是否 3 种模式全部完成 → 推进到下一句
              const updated = useSentenceSessionStore.getState();
              const comp = updated.completions[currentSentence.id];
              if (comp?.isFullyCompleted) {
                setTimeout(() => {
                  const isLast = advanceSentence();
                  if (isLast) finishSession();
                }, 1500);
              }
            }}
          />
        </div>
      )}
      {/* 暂停蒙层 */}
      {isInSession && !isTyping && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "oklch(0 0 0 / 0.12)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
          <p className="select-none text-2xl font-medium text-foreground/80 animate-spring-scale">
            {currentSentenceIndex > 0 || completedModes > 0 ? "按任意键继续学习" : "按任意键开始学习"}
          </p>
        </div>
      )}
    </div>
  );
}
