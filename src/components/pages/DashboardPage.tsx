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
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

const quickActions = [
  {
    to: ROUTES.VOCABULARY,
    label: "词汇打字",
    desc: "逐字母输入，强化拼写记忆",
    icon: BookMarked,
    color: "text-primary",
    bg: "bg-primary/6",
  },
  {
    to: ROUTES.REVIEW,
    label: "今日复习",
    desc: "基于遗忘曲线智能调度",
    icon: Repeat,
    color: "text-accent",
    bg: "bg-accent/6",
  },
  {
    to: ROUTES.READING,
    label: "阅读理解",
    desc: "精读文章，积累词汇",
    icon: BookOpen,
    color: "text-warning",
    bg: "bg-warning/8",
  },
  {
    to: ROUTES.LISTENING,
    label: "听力训练",
    desc: "盲听 + 听写双重练习",
    icon: Headphones,
    color: "text-success",
    bg: "bg-success/6",
  },
  {
    to: ROUTES.SPEAKING,
    label: "口语练习",
    desc: "跟读模仿，改善发音",
    icon: Mic,
    color: "text-destructive",
    bg: "bg-destructive/6",
  },
];

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 animate-fade-in">
      {/* 欢迎区 */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, Noah
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          新的一天，从巩固旧知识开始
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-2 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">连续天数</span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums">0</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">已掌握</span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums">0</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-2 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">今日待复习</span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums">0</p>
        </div>
      </div>

      {/* 快捷入口 */}
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
        开始练习
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {quickActions.map(({ to, label, desc, icon: Icon, color, bg }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-xs transition-all hover:border-primary/20 hover:shadow-sm active:scale-[0.99]"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="font-medium text-foreground">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
