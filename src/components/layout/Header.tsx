import { NavLink, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookMarked,
  MessageSquareText,
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
  { to: ROUTES.SENTENCE, label: "句子", icon: MessageSquareText },
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
        {/* GitHub */}
        <a
          href="https://github.com/color-dream/evergrow-english"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="GitHub"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

        <ThemeToggle />
      </div>
    </header>
  );
}
