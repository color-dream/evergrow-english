import { useEffect, useState } from "react";
import { X, TrendingUp } from "lucide-react";

interface LearnAnalyticsPanelProps {
  open: boolean;
  onClose: () => void;
}

type AnalyticsTab = "session" | "overall";

const tabs: { key: AnalyticsTab; label: string }[] = [
  { key: "session", label: "本节分析" },
  { key: "overall", label: "整体分析" },
];

export function LearnAnalyticsPanel({ open, onClose }: LearnAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("session");

  // ── 打开时重置 Tab ──
  useEffect(() => {
    if (open) setActiveTab("session");
  }, [open]);

  // ── Escape 关闭 ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* ── 蒙层 ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "oklch(0 0 0 / 0.2)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      />

      {/* ── 面板 ── */}
      <div
        className="absolute inset-4 flex flex-col overflow-hidden rounded-3xl animate-spring-in"
        style={{
          background: "var(--glass-sheet-bg)",
          backdropFilter:
            "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
          WebkitBackdropFilter:
            "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
          border: "1px solid var(--glass-sheet-border)",
          boxShadow: "var(--shadow-2xl)",
        }}
      >
        {/* ── 标题栏 ── */}
        <div
          className="flex h-14 shrink-0 items-center justify-between px-5"
          style={{
            borderBottom: "1px solid var(--glass-sheet-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp
              className="h-5 w-5"
              style={{ color: "oklch(0.55 0.195 252)" }}
            />
            {/* Tab 切换 */}
            <div className="flex items-center gap-0.5">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] ${
                    activeTab === key
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/50 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/40 transition-all duration-300 hover:text-foreground hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── 内容区 ── */}
        <div
          key={activeTab}
          className="flex flex-1 items-center justify-center animate-spring-up"
        >
          <div className="text-center">
            <TrendingUp className="mx-auto h-10 w-10 text-foreground/15" />
            <p className="mt-4 text-sm font-medium text-foreground/30">
              {activeTab === "session" ? "本节统计数据即将上线" : "整体统计数据即将上线"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
