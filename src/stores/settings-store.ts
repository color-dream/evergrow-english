import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPreferences, DifficultyLevel } from "@/types/domain";
import { DEFAULT_PREFERENCES } from "@/lib/constants";

interface SettingsState {
  preferences: UserPreferences;
  dailyGoal: number;
  targetDifficulty: DifficultyLevel;
  /** 按词书记忆每轮单词数，持久化到 localStorage */
  bookWordsPerRound: Record<string, number>;
  /** 用户昵称 */
  nickname: string;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setDailyGoal: (goal: number) => void;
  setTargetDifficulty: (d: DifficultyLevel) => void;
  setBookWordsPerRound: (bookId: string, value: number) => void;
  setNickname: (name: string) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      dailyGoal: 20,
      targetDifficulty: "A2",
      bookWordsPerRound: {},
      nickname: "",

      setPreferences: (prefs) =>
        set((s) => ({ preferences: { ...s.preferences, ...prefs } })),

      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      setTargetDifficulty: (d) => set({ targetDifficulty: d }),

      setBookWordsPerRound: (bookId, value) =>
        set((s) => ({
          bookWordsPerRound: { ...s.bookWordsPerRound, [bookId]: value },
        })),

      setNickname: (name) => set({ nickname: name }),

      reset: () =>
        set({
          preferences: DEFAULT_PREFERENCES,
          dailyGoal: 20,
          targetDifficulty: "A2",
          bookWordsPerRound: {},
          nickname: "",
        }),
    }),
    { name: "eg-settings" }
  )
);
