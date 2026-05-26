import type { FSRSRating } from "@/types/domain";

/**
 * 从打字错误次数推导 FSRS 评分（1-4）。
 * - 0 次错误 = 4（简单）
 * - 1 次错误 = 3（良好）
 * - 2-3 次错误 = 2（困难）
 * - 4+ 次错误或跳过 = 1（重来）
 */
export function deriveFSRSRating(
  wrongCount: number,
  skipped: boolean
): FSRSRating {
  if (skipped) return 1;
  if (wrongCount === 0) return 4;
  if (wrongCount === 1) return 3;
  if (wrongCount <= 3) return 2;
  return 1;
}
