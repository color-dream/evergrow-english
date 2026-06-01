import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCards, upsertCard, addStudySession } from "@/lib/db";
import { getDueCards, applyFSRS } from "@/lib/fsrs";
import { WordCard } from "@/components/vocabulary/WordCard";
import { ROUTES, FSRS_RATING_LABELS } from "@/lib/constants";
import type { LearningCard } from "@/lib/fsrs/types";
import type { Word } from "@/types/domain";
import type { WordModeResult } from "@/types/vocabulary";
import type { FSRSRating } from "@/types/domain";
import { Repeat, CheckCircle, ArrowRight } from "lucide-react";

type ReviewPhase = "loading" | "empty" | "active" | "rating" | "finished";

export function ReviewPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ReviewPhase>("loading");
  const [dueCards, setDueCards] = useState<LearningCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<WordModeResult[]>([]);
  const [startTime, setStartTime] = useState<number>(0);

  // 加载到期卡片
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await getAllCards();
        const due = getDueCards(all, Date.now());
        if (cancelled) return;
        if (due.length === 0) {
          setPhase("empty");
        } else {
          setDueCards(due);
          setPhase("active");
          setStartTime(Date.now());
        }
      } catch {
        if (!cancelled) setPhase("empty");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentCard = dueCards[currentIdx] ?? null;

  // 从 LearningCard 构造 Word 对象供 WordCard 使用
  const currentWord: Word | null = useMemo(() => {
    if (!currentCard) return null;
    return {
      id: currentCard.id,
      text: currentCard.wordText,
      lemma: currentCard.wordText,
      definition: currentCard.definition,
      partOfSpeech: "other",
      difficulty: "B1",
      tags: [],
      createdAt: currentCard.createdAt,
    };
  }, [currentCard]);

  // 打字完成后 → 进入评分阶段
  const onComplete = useCallback((result: WordModeResult) => {
    setResults((prev) => [...prev, result]);
    setPhase("rating");
  }, []);

  // 用户评分
  const onRate = useCallback(
    async (rating: FSRSRating) => {
      if (!currentCard) return;

      const now = Date.now();
      const updated: LearningCard = {
        ...currentCard,
        fsrs: applyFSRS(currentCard.fsrs, rating, now),
        updatedAt: now,
      };

      // fire-and-forget 持久化
      upsertCard(updated).catch(() => {});

      const nextIdx = currentIdx + 1;
      if (nextIdx >= dueCards.length) {
        // 全部完成
        const endTime = Date.now();
        await upsertCard(updated);
        addStudySession({
          sessionType: "review",
          startTime,
          endTime,
          cardsReviewed: dueCards.length,
          cardsCorrect:
            results.filter((r) => r.isCorrect).length + (rating > 1 ? 1 : 0),
          totalTimeSpentMs: endTime - startTime,
        }).catch(() => {});
        setPhase("finished");
      } else {
        setCurrentIdx(nextIdx);
        setPhase("active");
      }
    },
    [currentCard, currentIdx, dueCards, startTime, results]
  );

  // 加载中
  if (phase === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">加载复习卡片...</p>
      </div>
    );
  }

  // 无到期卡片
  if (phase === "empty") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 animate-spring-scale">
        <CheckCircle className="h-12 w-12 text-success" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">今日复习已完成</h2>
          <p className="mt-1 text-sm text-foreground/55">
            暂无到期的复习卡片，去学些新词吧
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.VOCABULARY)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            boxShadow: "0 4px 16px oklch(0.55 0.195 252 / 0.35)",
          }}
        >
          去学新词
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // 全部复习完毕
  if (phase === "finished") {
    const wordsCorrect = results.filter((r) => r.isCorrect).length;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 animate-spring-scale">
        <CheckCircle className="h-12 w-12 text-success" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">复习完成</h2>
          <p className="mt-1 text-sm text-foreground/55">
            共复习 {dueCards.length} 个单词，正确 {wordsCorrect} 个
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.CENTER)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            boxShadow: "0 4px 16px oklch(0.55 0.195 252 / 0.35)",
          }}
        >
          返回仪表盘
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // 评分阶段 — 在卡片上叠加评分按钮
  if (phase === "rating" && currentWord) {
    return (
      <div className="relative flex h-full flex-col">
        <WordCard
          key={`${currentWord.id}-rating`}
          word={currentWord}
          learnMode="typeWithWord"
onComplete={() => {}}
          onKeystroke={() => {}}
        />
        {/* 评分遮罩 — iOS 26 毛玻璃面板 */}
        <div className="absolute inset-0 z-20 flex items-end justify-center pb-20">
          <div
            className="flex flex-col items-center gap-4 rounded-3xl px-8 py-6 animate-spring-up"
            style={{
              background: "var(--glass-sheet-bg)",
              backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
              border: "1px solid var(--glass-sheet-border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <p className="text-sm text-foreground/70">
              {currentWord.text} — 你的掌握程度？
            </p>
            <div className="flex gap-3">
              {([1, 2, 3, 4] as FSRSRating[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onRate(r)}
                  className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={
                    r === 1
                      ? { background: "oklch(0.52 0.2 18 / 0.12)", color: "oklch(0.52 0.2 18)", border: "1px solid oklch(0.52 0.2 18 / 0.2)" }
                      : r === 2
                        ? { background: "oklch(0.72 0.18 85 / 0.12)", color: "oklch(0.55 0.14 80)", border: "1px solid oklch(0.72 0.18 85 / 0.2)" }
                        : r === 3
                          ? { background: "oklch(0.55 0.195 252 / 0.1)", color: "oklch(0.55 0.195 252)", border: "1px solid oklch(0.55 0.195 252 / 0.2)" }
                          : { background: "oklch(0.56 0.19 148 / 0.1)", color: "oklch(0.56 0.19 148)", border: "1px solid oklch(0.56 0.19 148 / 0.2)" }
                  }
                >
                  {FSRS_RATING_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 学习中
  if (phase === "active" && currentWord) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-6 pt-4">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
            style={{
              background: "var(--glass-pill-bg)",
              backdropFilter: "blur(var(--glass-pill-blur))",
              WebkitBackdropFilter: "blur(var(--glass-pill-blur))",
              border: "1px solid var(--glass-pill-border)",
            }}
          >
            <Repeat className="h-4 w-4 text-foreground/50" />
            <span className="text-foreground/60">
              复习 {currentIdx + 1} / {dueCards.length}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center">
          <WordCard
            key={`${currentWord.id}-${currentIdx}`}
            word={currentWord}
            learnMode="typeWithWord"
    onComplete={onComplete}
            onKeystroke={() => {}}
          />
        </div>
      </div>
    );
  }

  return null;
}

