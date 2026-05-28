import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useUIStore } from "@/stores/ui-store";

export function Header() {
  const { setting, setTheme } = useTheme();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <header
      className="flex h-14 items-center justify-between px-6"
      style={{
        background: "var(--glass-sheet-bg)",
        backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
        borderBottom: "1px solid var(--glass-sheet-border)",
      }}
    >
      <div className="flex items-center gap-2">
        {!sidebarOpen && (
          <span className="font-bold text-primary text-lg">EG</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div
          className="flex rounded-full p-0.5"
          style={{
            background: "var(--glass-pill-bg)",
            backdropFilter: "blur(var(--glass-pill-blur))",
            WebkitBackdropFilter: "blur(var(--glass-pill-blur))",
            border: "1px solid var(--glass-pill-border)",
          }}
        >
          {(["light", "system", "dark"] as const).map((t) => {
            const Icon = t === "light" ? Sun : t === "system" ? Monitor : Moon;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "rounded-full p-1.5 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95",
                  setting === t
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/40 hover:text-foreground"
                )}
                aria-label={`${t === "light" ? "亮色" : t === "system" ? "跟随系统" : "暗色"}模式`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
