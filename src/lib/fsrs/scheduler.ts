import type { LearningCard } from "./types";

/**
 * 筛选今日本待复习的卡片。
 * 规则：state 为 "learning" | "review" | "relearning"，
 * 且 lastReview + scheduledDays <= todayEnd（已到期）。
 */
export function getDueCards(
  cards: LearningCard[],
  now: number
): LearningCard[] {
  const todayStart = getStartOfDay(now);
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  return cards
    .filter((card) => {
      // 新卡片不在复习队列中
      if (card.fsrs.state === "new") return false;

      // 检查是否到期：上次复习时间 + 间隔 <= 今日结束
      const dueTime =
        card.fsrs.lastReview + card.fsrs.scheduledDays * 24 * 60 * 60 * 1000;
      return dueTime <= todayEnd;
    })
    .sort((a, b) => {
      // 按稳定性升序排列（不稳定的先复习）
      return a.fsrs.stability - b.fsrs.stability;
    });
}

/** 获取今日已复习的卡片数 */
export function getTodayReviewedCount(
  cards: LearningCard[],
  now: number
): number {
  const todayStart = getStartOfDay(now);
  return cards.filter((c) => c.fsrs.lastReview >= todayStart).length;
}

/** 统计已掌握的卡片数（state 为 "review" 且 stability > 5 天） */
export function getMasteredCount(cards: LearningCard[]): number {
  return cards.filter((c) => c.fsrs.state === "review" && c.fsrs.stability > 5)
    .length;
}

function getStartOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
