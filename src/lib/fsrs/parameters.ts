/**
 * FSRS-5 默认参数。
 * 参考：https://github.com/open-spaced-repetition/fsrs.js
 */
export const FSRS_PARAMETERS = {
  /** 期望保留率 */
  requestedRetention: 0.9,

  /** 初始稳定性（按评分 1-4） */
  initialStability: [0.5, 1.2, 2.5, 5.0] as const,

  /** 复习时稳定性乘数（按评分 1-4） */
  stabilityMultiplier: [0.3, 0.9, 2.0, 3.5] as const,

  /** 难度调整系数 */
  difficultyDelta: 0.1,

  /** 最小稳定性 */
  minimumStability: 0.1,

  /** 最大间隔（天数），约 10 年 */
  maximumInterval: 3650,

  /** 难度取值范围 */
  difficultyClamp: [0, 1] as const,
} as const;

/** 根据当前稳定性和期望保留率计算下次复习间隔（天数） */
export function stabilityToInterval(
  stability: number,
  retention: number
): number {
  // I = S × ln(retention) / ln(0.9)
  return (stability * Math.log(retention)) / Math.log(0.9);
}
