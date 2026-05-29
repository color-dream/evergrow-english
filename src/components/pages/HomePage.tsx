import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookMarked,
  Repeat,
  BookOpen,
  Headphones,
  Mic,
  TrendingUp,
  Flame,
  Target,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { getAllCards } from "@/lib/db";
import { getDueCards, getMasteredCount } from "@/lib/fsrs";

const glassCardStyle = {
  background: "var(--glass-card-bg)",
  backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  border: "1px solid var(--glass-card-border)",
} as const;

const quickActions = [
  {
    to: ROUTES.VOCABULARY,
    label: "词汇打字",
    desc: "逐字母输入，强化拼写记忆",
    icon: BookMarked,
    color: "oklch(0.55 0.195 252 / 0.1)",
    iconColor: "text-primary",
    shadow: "0 4px 16px oklch(0.55 0.195 252 / 0.15)",
  },
  {
    to: ROUTES.REVIEW,
    label: "今日复习",
    desc: "基于遗忘曲线智能调度",
    icon: Repeat,
    color: "oklch(0.62 0.18 158 / 0.1)",
    iconColor: "text-accent",
    shadow: "0 4px 16px oklch(0.62 0.18 158 / 0.15)",
  },
  {
    to: ROUTES.READING,
    label: "阅读理解",
    desc: "精读文章，积累词汇",
    icon: BookOpen,
    color: "oklch(0.72 0.18 85 / 0.12)",
    iconColor: "text-warning",
    shadow: "0 4px 16px oklch(0.72 0.18 85 / 0.15)",
  },
  {
    to: ROUTES.LISTENING,
    label: "听力训练",
    desc: "盲听 + 听写双重练习",
    icon: Headphones,
    color: "oklch(0.56 0.19 148 / 0.1)",
    iconColor: "text-success",
    shadow: "0 4px 16px oklch(0.56 0.19 148 / 0.15)",
  },
  {
    to: ROUTES.SPEAKING,
    label: "口语练习",
    desc: "跟读模仿，改善发音",
    icon: Mic,
    color: "oklch(0.52 0.2 18 / 0.1)",
    iconColor: "text-destructive",
    shadow: "0 4px 16px oklch(0.52 0.2 18 / 0.15)",
  },
];

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

export function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ mastered: 0, due: 0, streak: 0 });
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting("夜深了");
    else if (hour < 12) setGreeting("早上好");
    else if (hour < 18) setGreeting("下午好");
    else setGreeting("晚上好");

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
    <div
      className="flex min-h-full flex-col px-6 py-10"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 40%, oklch(0.85 0.055 252 / 0.18), transparent 70%), linear-gradient(180deg, var(--color-background), oklch(0.96 0.008 275 / 0.5), var(--color-background))",
      }}
    >
      {/* ── 欢迎区 ── */}
      <div className="mb-10 animate-spring-in">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm"
            style={glassCardStyle}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {greeting}，Noah
            </h1>
            <p className="mt-0.5 text-sm text-foreground/55">
              新的一天，从巩固旧知识开始
            </p>
          </div>
        </div>
      </div>

      {/* ── 统计卡片 ── */}
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

      {/* ── 快捷入口 ── */}
      <h2 className="mb-4 text-sm font-semibold text-foreground/50 animate-spring-up">
        开始练习
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-spring-up">
        {quickActions.map(
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
