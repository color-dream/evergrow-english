import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPreferences, DifficultyLevel } from "@/types/domain";
import { DEFAULT_PREFERENCES } from "@/lib/constants";

interface SettingsState {
  preferences: UserPreferences;
  dailyGoal: number;
  targetDifficulty: DifficultyLevel;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setDailyGoal: (goal: number) => void;
  setTargetDifficulty: (d: DifficultyLevel) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      dailyGoal: 20,
      targetDifficulty: "A2",

      setPreferences: (prefs) =>
        set((s) => ({ preferences: { ...s.preferences, ...prefs } })),

      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      setTargetDifficulty: (d) => set({ targetDifficulty: d }),

      reset: () =>
        set({
          preferences: DEFAULT_PREFERENCES,
          dailyGoal: 20,
          targetDifficulty: "A2",
        }),
    }),
    { name: "eg-settings" }
  )
);
