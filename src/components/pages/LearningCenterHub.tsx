import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Flame, Target } from "lucide-react";
import { QUICK_ACTIONS } from "@/lib/constants";
import { getAllCards } from "@/lib/db";
import { getDueCards, getMasteredCount } from "@/lib/fsrs";

const glassCardStyle = {
  background: "var(--glass-card-bg)",
  backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  border: "1px solid var(--glass-card-border)",
} as const;

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div
      className="rounded-2xl p-4 text-center shadow-sm transition-all duration-300 hover:scale-[1.02]"
      style={glassCardStyle}
    >
      <div className="mb-2 flex justify-center">{icon}</div>
      <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-foreground/45">{label}</p>
    </div>
  );
}

export function LearningCenterHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ mastered: 0, due: 0, streak: 0 });

  useEffect(() => {
    (async () => {
      try {
        const all = await getAllCards();
        if (all.length === 0) return;
        const now = Date.now();
        setStats({
          mastered: getMasteredCount(all),
          due: getDueCards(all, now).length,
          streak: 0,
        });
      } catch {
        // 静默处理
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 animate-fade-in">
      {/* 统计卡片 */}
      <div className="mb-10 grid grid-cols-3 gap-4 animate-spring-up">
        <StatCard
          icon={
            <Flame
              className="h-5 w-5"
              style={{ color: "oklch(0.72 0.18 85)" }}
            />
          }
          label="连续天数"
          value={stats.streak}
        />
        <StatCard
          icon={
            <TrendingUp
              className="h-5 w-5"
              style={{ color: "oklch(0.56 0.19 148)" }}
            />
          }
          label="已掌握"
          value={stats.mastered}
        />
        <StatCard
          icon={
            <Target
              className="h-5 w-5"
              style={{ color: "oklch(0.55 0.195 252)" }}
            />
          }
          label="待复习"
          value={stats.due}
        />
      </div>

      {/* 快捷入口 */}
      <h2 className="mb-4 text-sm font-semibold text-foreground/50 animate-spring-up">
        开始练习
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-spring-up">
        {QUICK_ACTIONS.map(
          ({ to, label, desc, icon: Icon, color, iconColor, shadow }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="group flex items-start gap-4 rounded-2xl p-4 text-left shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                ...glassCardStyle,
                boxShadow: `var(--shadow-sm), ${shadow}`,
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: color }}
              >
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="font-medium text-foreground">{label}</p>
                <p className="mt-0.5 text-xs text-foreground/45">{desc}</p>
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
}
