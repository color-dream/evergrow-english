import { useState, useRef, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useSettingsStore } from "@/stores/settings-store";

const themes = [
  { key: "light" as const, label: "亮色", icon: Sun },
  { key: "system" as const, label: "跟随系统", icon: Monitor },
  { key: "dark" as const, label: "暗色", icon: Moon },
];

export function ThemeToggle() {
  const { setting, setTheme } = useTheme();
  const setPreferences = useSettingsStore((s) => s.setPreferences);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const ActiveIcon = themes.find((t) => t.key === setting)?.icon ?? Monitor;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="切换主题"
      >
        <ActiveIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-36 rounded-2xl p-1.5 shadow-lg animate-spring-in origin-top-right"
          style={{
            background: "var(--glass-pill-bg)",
            backdropFilter: "blur(var(--glass-pill-blur)) saturate(1.8)",
            WebkitBackdropFilter: "blur(var(--glass-pill-blur)) saturate(1.8)",
            border: "1px solid var(--glass-pill-border)",
          }}
        >
          {themes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setTheme(key);
                setPreferences({ theme: key });
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]",
                setting === key
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
