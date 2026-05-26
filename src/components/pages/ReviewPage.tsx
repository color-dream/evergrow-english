import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCards, upsertCard, addStudySession } from "@/lib/db";
import { getDueCards, applyFSRS } from "@/lib/fsrs";
import { WordCard } from "@/components/vocabulary/WordCard";
import { ProgressBar } from "@/components/vocabulary/ProgressBar";
import { ROUTES, FSRS_RATING_LABELS } from "@/lib/constants";
import type { LearningCard } from "@/lib/fsrs/types";
import type { Word } from "@/types/domain";
import type { WordResult } from "@/types/vocabulary";
import type { FSRSRating } from "@/types/domain";
import { Repeat, CheckCircle, ArrowRight } from "lucide-react";

type ReviewPhase = "loading" | "empty" | "active" | "rating" | "finished";

export function ReviewPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ReviewPhase>("loading");
  const [dueCards, setDueCards] = useState<LearningCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<WordResult[]>([]);
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
  const onComplete = useCallback((result: WordResult) => {
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
      <div className="flex h-full flex-col items-center justify-center gap-4 animate-fade-in">
        <CheckCircle className="h-12 w-12 text-green-400" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">今日复习已完成</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            暂无到期的复习卡片，去学些新词吧
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.VOCABULARY)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
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
      <div className="flex h-full flex-col items-center justify-center gap-4 animate-fade-in">
        <CheckCircle className="h-12 w-12 text-green-400" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">复习完成</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            共复习 {dueCards.length} 个单词，正确 {wordsCorrect} 个
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          返回仪表盘
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // 评分阶段 — 在卡片上叠加评分按钮
  if (phase === "rating" && currentWord) {
    const lastResult = results[results.length - 1];
    return (
      <div className="relative flex h-full flex-col">
        <WordCard
          key={`${currentWord.id}-rating`}
          word={currentWord}
          mode="strict"
          dictation={{ enabled: false, type: "hideAll" }}
          onComplete={() => {}}
          onKeystroke={() => {}}
        />
        {/* 评分遮罩 */}
        <div className="absolute inset-0 z-20 flex items-end justify-center pb-20">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-card/95 px-8 py-6 shadow-lg backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">
              {lastResult?.wordText ?? ""} — 你的掌握程度？
            </p>
            <div className="flex gap-3">
              {([1, 2, 3, 4] as FSRSRating[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onRate(r)}
                  className={cn(
                    "rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95",
                    r === 1 &&
                      "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300",
                    r === 2 &&
                      "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
                    r === 3 &&
                      "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
                    r === 4 &&
                      "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                  )}
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Repeat className="h-4 w-4" />
            <span>
              复习 {currentIdx + 1} / {dueCards.length}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center">
          <WordCard
            key={`${currentWord.id}-${currentIdx}`}
            word={currentWord}
            mode="strict"
            dictation={{ enabled: false, type: "hideAll" }}
            onComplete={onComplete}
            onKeystroke={() => {}}
          />
          <ProgressBar current={currentIdx} total={dueCards.length} />
        </div>
      </div>
    );
  }

  return null;
}

/** 拼接 class 名的小工具，避免额外 import */
function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
