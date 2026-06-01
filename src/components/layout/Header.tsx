import { NavLink, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookMarked,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const glassHeader = {
  background: "var(--glass-sheet-bg)",
  backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
  borderBottom: "1px solid var(--glass-sheet-border)",
} as const;

const centerTabs = [
  { to: ROUTES.CENTER, end: true, label: "概览", icon: LayoutDashboard },
  { to: ROUTES.VOCABULARY, label: "词汇", icon: BookMarked },
];

export function Header() {
  const location = useLocation();
  const inCenter = location.pathname.startsWith(ROUTES.CENTER);

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between gap-4 px-4 lg:px-6"
      style={glassHeader}
    >
      {/* ── 左侧：品牌 ── */}
      <Link
        to={ROUTES.HOME}
        className="flex shrink-0 items-center gap-2 transition-all duration-300 hover:scale-[1.02]"
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "oklch(0.55 0.195 252 / 0.12)" }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="hidden text-base font-bold tracking-tight text-foreground sm:inline">
          {APP_NAME}
        </span>
      </Link>

      {/* ── 中间：学习中心 Tab 导航 ── */}
      {inCenter && (
        <nav className="flex flex-1 items-center justify-center gap-0.5 overflow-x-auto">
          {centerTabs.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                )
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {/* ── 右侧：设置 + 主题切换 ── */}
      <div className="flex shrink-0 items-center gap-1">
        {/* 设置按钮 */}
        <NavLink
          to={ROUTES.SETTINGS}
          className={({ isActive }) =>
            cn(
              "rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground/40 hover:text-foreground hover:bg-foreground/5"
            )
          }
          aria-label="设置"
        >
          <Settings className="h-4 w-4" />
        </NavLink>

        {/* 主题切换 */}
        <ThemeToggle />
      </div>
    </header>
  );
}
