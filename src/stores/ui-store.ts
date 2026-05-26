import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarForceHidden: boolean;
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarForceHidden: (forceHidden: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setResolvedTheme: (t: "light" | "dark") => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  sidebarForceHidden: false,
  theme: "system",
  resolvedTheme: "light",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarForceHidden: (forceHidden) =>
    set({ sidebarForceHidden: forceHidden }),
  setTheme: (theme) => set({ theme }),
  setResolvedTheme: (t) => set({ resolvedTheme: t }),
}));
