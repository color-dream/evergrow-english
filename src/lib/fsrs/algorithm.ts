import type { FSRSState, FSRSRating } from "@/types/domain";
import { FSRS_PARAMETERS, stabilityToInterval } from "./parameters";

/** 创建新卡片的初始 FSRS 状态 */
export function createNewFSRSState(): FSRSState {
  return {
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReview: 0,
    state: "new",
  };
}

/**
 * 对一张卡片进行评分，返回更新后的 FSRS 状态。
 * 纯函数，不产生副作用。
 */
export function applyFSRS(
  current: FSRSState,
  rating: FSRSRating,
  now: number
): FSRSState {
  const {
    initialStability,
    stabilityMultiplier,
    difficultyDelta,
    minimumStability,
    maximumInterval,
    requestedRetention,
  } = FSRS_PARAMETERS;

  const elapsedDays =
    current.lastReview > 0
      ? (now - current.lastReview) / (24 * 60 * 60 * 1000)
      : 0;

  // ── 难度更新 ──
  const oldDifficulty = current.state === "new" ? 0.3 : current.difficulty;
  const dDelta = (rating - 3) * difficultyDelta * (1 - oldDifficulty);
  const difficulty = Math.max(0, Math.min(1, oldDifficulty + dDelta));

  // ── 稳定性更新 ──
  let stability: number;
  let nextState: FSRSState["state"];

  if (current.state === "new") {
    // 首次学习
    stability = initialStability[rating - 1];
    nextState = "learning";
  } else if (rating === 1) {
    // 又忘了 → 重新学习
    stability = Math.max(
      minimumStability,
      current.stability * stabilityMultiplier[0]
    );
    nextState = "relearning";
    const newLapses = current.lapses + 1;
    return {
      stability,
      difficulty,
      elapsedDays: Math.round(elapsedDays),
      scheduledDays: Math.min(
        maximumInterval,
        Math.round(stabilityToInterval(stability, requestedRetention))
      ),
      reps: current.reps + 1,
      lapses: newLapses,
      lastReview: now,
      state: nextState,
    };
  } else {
    // 记住了（评分 2/3/4）
    stability = Math.max(
      minimumStability,
      current.stability * stabilityMultiplier[rating - 1]
    );
    nextState = "review";
  }

  const scheduledDays = Math.min(
    maximumInterval,
    Math.round(stabilityToInterval(stability, requestedRetention))
  );

  return {
    stability,
    difficulty,
    elapsedDays: Math.round(elapsedDays),
    scheduledDays,
    reps: current.reps + 1,
    lapses: current.lapses,
    lastReview: now,
    state: nextState,
  };
}

/**
 * 计算卡片在当前时刻的可提取性（retrievability）。
 * 即用户当前能回忆起来的概率，0-1。
 */
export function getRetrievability(fsrs: FSRSState, now: number): number {
  if (fsrs.lastReview === 0 || fsrs.stability === 0) return 0;
  const elapsedDays = (now - fsrs.lastReview) / (24 * 60 * 60 * 1000);
  return Math.exp((Math.log(0.9) * elapsedDays) / fsrs.stability);
}
