import { useState, useEffect } from "react";
import { getAllCards, getRecentSessions } from "@/lib/db";
import { getMasteredCount } from "@/lib/fsrs";
import { WORD_BOOK_OPTIONS } from "@/lib/word-book-registry";

export interface DailyActivity {
  date: string;
  learned: number;
  reviewed: number;
}

export interface ForecastDay {
  date: string;
  count: number;
}

export interface AnalyticsData {
  mastered: number;
  learning: number;
  remaining: number;
  totalWords: number;
  dailyActivity: DailyActivity[];
  forecast: ForecastDay[];
  isLoading: boolean;
}

const MS_PER_DAY = 86400000;
const FORECAST_DAYS = 7;

/** 格式化日期为 YYYY-MM-DD（本地时间） */
function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 获取某天 00:00:00 的时间戳 */
function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 获取某天 23:59:59 的时间戳 */
function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function useAnalyticsData(): AnalyticsData {
  const [data, setData] = useState<AnalyticsData>({
    mastered: 0,
    learning: 0,
    remaining: 0,
    totalWords: 0,
    dailyActivity: [],
    forecast: [],
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      try {
        // ── 并行获取卡片和会话 ──
        const [cards, sessions] = await Promise.all([
          getAllCards(),
          getRecentSessions(1000), // 获取足够多的会话记录
        ]);

        if (cancelled) return;

        const now = Date.now();
        const totalWords = WORD_BOOK_OPTIONS.reduce(
          (sum, b) => sum + b.wordCount,
          0
        );

        // ── 进度计算 ──
        const mastered = getMasteredCount(cards);
        const newCardCount = cards.filter(
          (c) => c.fsrs.state === "new"
        ).length;
        const learning = cards.length - mastered - newCardCount;
        const remaining = Math.max(0, totalWords - cards.length + newCardCount);

        // ── 每日活动（自然年：1月1日 → 今天） ──
        const dailyMap = new Map<
          string,
          { learned: number; reviewed: number }
        >();

        const yearStart = new Date(new Date().getFullYear(), 0, 1);
        const todayEnd = endOfDay(now);
        // 预填全年每一天
        for (let d = new Date(yearStart); d.getTime() <= todayEnd; d.setDate(d.getDate() + 1)) {
          dailyMap.set(fmtDate(d), { learned: 0, reviewed: 0 });
        }

        const yearStartTs = yearStart.getTime();
        for (const s of sessions) {
          if (s.startTime < yearStartTs) break;
          const date = fmtDate(new Date(s.startTime));
          const entry = dailyMap.get(date);
          if (!entry) continue;
          if (s.sessionType === "learn-new") {
            entry.learned += s.cardsReviewed;
          } else {
            entry.reviewed += s.cardsReviewed;
          }
        }

        const dailyActivity: DailyActivity[] = Array.from(
          dailyMap.entries()
        ).map(([date, val]) => ({
          date,
          ...val,
        }));

        // ── 复习预报（未来 FORECAST_DAYS 天，连续） ──
        const forecastMap = new Map<string, number>();

        // 预填未来连续 N 天
        const tomorrow = new Date(now + MS_PER_DAY);
        for (let i = 0; i < FORECAST_DAYS; i++) {
          const d = new Date(tomorrow);
          d.setDate(d.getDate() + i);
          forecastMap.set(fmtDate(d), 0);
        }

        const forecastEnd = tomorrow.getTime() + FORECAST_DAYS * MS_PER_DAY;
        for (const card of cards) {
          if (card.fsrs.state === "new") continue;
          const nextReview =
            card.fsrs.lastReview + card.fsrs.scheduledDays * MS_PER_DAY;
          if (nextReview <= todayEnd) continue;
          if (nextReview >= forecastEnd) continue;

          const date = fmtDate(new Date(startOfDay(nextReview)));
          const entry = forecastMap.get(date);
          if (entry !== undefined) {
            forecastMap.set(date, entry + 1);
          }
        }

        const forecast: ForecastDay[] = Array.from(forecastMap.entries())
          .map(([date, count]) => ({ date, count }));

        if (!cancelled) {
          setData({
            mastered,
            learning,
            remaining,
            totalWords,
            dailyActivity,
            forecast,
            isLoading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setData((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    compute();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
