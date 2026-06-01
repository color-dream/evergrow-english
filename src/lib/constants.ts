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
  progressBarPosition: "top",
  pronunciation: "us",
};

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

// ── 词汇学习 ──

export const DEFAULT_WORDS_PER_ROUND = 20;
export const WORDS_PER_ROUND_MIN = 5;
export const WORDS_PER_ROUND_MAX = 50;
export const WORDS_PER_ROUND_STEP = 5;

/** 打错后重置延迟 (ms) */
export const WRONG_RESET_DELAY_MS = 300;

/** 跳过按钮出现的错误次数阈值 */
export const SKIP_WRONG_THRESHOLD = 4;

/** 模式切换延迟 (ms) */
export const MODE_TRANSITION_DELAY_MS = 600;

/** 单词切换延迟 (ms) */
export const WORD_TRANSITION_DELAY_MS = 400;

// ── 路由 ──

export const ROUTES = {
  HOME: "/",
  CENTER: "/center",
  VOCABULARY: "/center/vocabulary",
  REVIEW: "/center/review",
  READING: "/center/reading",
  LISTENING: "/center/listening",
  SPEAKING: "/center/speaking",
  SETTINGS: "/settings",
  LEARN: "/learn",
} as const;

// ── 快捷入口（首页 + 学习中心共享） ──

import { BookMarked, Repeat, BookOpen, Headphones, Mic } from "lucide-react";

export const QUICK_ACTIONS = [
  {
    to: ROUTES.VOCABULARY,
    label: "词汇打字",
    desc: "逐字母输入，强化拼写记忆",
    icon: BookMarked,
    color: "oklch(0.55 0.195 252 / 0.1)",
    iconColor: "text-primary",
    shadow: "0 4px 16px oklch(0.55 0.195 252 / 0.15)",
  },
  {
    to: ROUTES.REVIEW,
    label: "今日复习",
    desc: "基于遗忘曲线智能调度",
    icon: Repeat,
    color: "oklch(0.62 0.18 158 / 0.1)",
    iconColor: "text-accent",
    shadow: "0 4px 16px oklch(0.62 0.18 158 / 0.15)",
  },
  {
    to: ROUTES.READING,
    label: "阅读理解",
    desc: "精读文章，积累词汇",
    icon: BookOpen,
    color: "oklch(0.72 0.18 85 / 0.12)",
    iconColor: "text-warning",
    shadow: "0 4px 16px oklch(0.72 0.18 85 / 0.15)",
  },
  {
    to: ROUTES.LISTENING,
    label: "听力训练",
    desc: "盲听 + 听写双重练习",
    icon: Headphones,
    color: "oklch(0.56 0.19 148 / 0.1)",
    iconColor: "text-success",
    shadow: "0 4px 16px oklch(0.56 0.19 148 / 0.15)",
  },
  {
    to: ROUTES.SPEAKING,
    label: "口语练习",
    desc: "跟读模仿，改善发音",
    icon: Mic,
    color: "oklch(0.52 0.2 18 / 0.1)",
    iconColor: "text-destructive",
    shadow: "0 4px 16px oklch(0.52 0.2 18 / 0.15)",
  },
];
