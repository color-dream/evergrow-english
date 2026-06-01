import { create } from "zustand";

interface UIState {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
  setResolvedTheme: (t: "light" | "dark") => void;
}

export const useUIStore = create<UIState>()((set) => ({
  theme: "system",
  resolvedTheme: "light",
  setTheme: (theme) => set({ theme }),
  setResolvedTheme: (t) => set({ resolvedTheme: t }),
}));
