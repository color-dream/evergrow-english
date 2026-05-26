import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";

type Theme = "light" | "dark";
type ThemeSetting = Theme | "system";

const ThemeContext = createContext<{
  setting: ThemeSetting;
  resolved: Theme;
  setTheme: (t: ThemeSetting) => void;
} | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function resolveTheme(setting: ThemeSetting): Theme {
  if (setting !== "system") return setting;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUIStore((s) => s.theme);
  const resolved = useUIStore((s) => s.resolvedTheme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setResolved = useUIStore((s) => s.setResolvedTheme);
  const prefsTheme = useSettingsStore((s) => s.preferences.theme);

  useEffect(() => {
    if (prefsTheme) setTheme(prefsTheme);
  }, [prefsTheme, setTheme]);

  useEffect(() => {
    const resolvedValue = resolveTheme(theme);
    setResolved(resolvedValue);
    document.documentElement.classList.toggle("dark", resolvedValue === "dark");
  }, [theme, setResolved]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        const r = resolveTheme("system");
        setResolved(r);
        document.documentElement.classList.toggle("dark", r === "dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, setResolved]);

  return (
    <ThemeContext.Provider value={{ setting: theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
