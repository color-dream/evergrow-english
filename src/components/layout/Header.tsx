import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useUIStore } from "@/stores/ui-store";

export function Header() {
  const { setting, setTheme } = useTheme();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        {!sidebarOpen && (
          <span className="font-bold text-primary text-lg">EG</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="flex rounded-lg border border-border p-0.5">
          {(["light", "system", "dark"] as const).map((t) => {
            const Icon = t === "light" ? Sun : t === "system" ? Monitor : Moon;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "rounded-md p-1.5 transition-colors cursor-pointer",
                  setting === t
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
