import type { DifficultyLevel, UserPreferences } from "@/types/domain";

export const APP_NAME = "Evergrow English";

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  A1: "入门",
  A2: "基础",
  B1: "中级",
  B2: "进阶",
  C1: "高级",
  C2: "精通",
};

export const FSRS_RATING_LABELS: Record<number, string> = {
  1: "重来",
  2: "困难",
  3: "良好",
  4: "简单",
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  ttsSpeed: 1,
  ttsVoice: "",
  autoPlay: true,
  caseStrict: false,
  punctuationStrict: false,
  dailyReminderEnabled: false,
  dailyReminderTime: "09:00",
};

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

// ── 词汇学习 ──

export const DEFAULT_WORDS_PER_ROUND = 20;
export const WORDS_PER_ROUND_MIN = 5;
export const WORDS_PER_ROUND_MAX = 50;
export const WORDS_PER_ROUND_STEP = 5;

/** 严格模式：打错后重置延迟 (ms) */
export const WRONG_RESET_DELAY_MS = 300;

/** 宽松模式：输完对比有错后重置延迟 (ms) */
export const LOOSE_WRONG_RESET_DELAY_MS = 1500;

/** 跳过按钮出现的错误次数阈值 */
export const SKIP_WRONG_THRESHOLD = 4;

/** 模式切换延迟 (ms) */
export const MODE_TRANSITION_DELAY_MS = 600;

/** 单词切换延迟 (ms) */
export const WORD_TRANSITION_DELAY_MS = 400;

// ── 路由 ──

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  REVIEW: "/review",
  VOCABULARY: "/vocabulary",
  READING: "/reading",
  LISTENING: "/listening",
  SPEAKING: "/speaking",
  SETTINGS: "/settings",
  LEARN: "/learn",
} as const;
