import { useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

// ── 导航项配置 ──
const navItems = [
  { to: ROUTES.CENTER, end: true, label: "概览", icon: LayoutDashboard },
  { to: ROUTES.LEARNING, end: false, label: "学习", icon: GraduationCap },
  { to: ROUTES.SETTINGS, end: false, label: "设置", icon: Settings },
] as const;

// ── 收缩偏好 localStorage key ──
const STORAGE_KEY = "eg-sidebar-collapsed";

// ── 玻璃侧边栏样式 ──
const glassSidebar = {
  background: "var(--glass-sheet-bg)",
  backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
  borderRight: "1px solid var(--glass-sheet-border)",
} as const;

// ── spring 弹性曲线（与项目全局动画一致） ──
const springCurve = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// ── 收缩状态 Hook ──
function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // 忽略 quota 异常
      }
      return next;
    });
  }, []);

  return [collapsed, toggle];
}

export function Sidebar() {
  const [collapsed, toggle] = useSidebarCollapsed();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-full shrink-0 overflow-hidden",
        "transition-[width] duration-300"
      )}
      style={{
        width: collapsed ? "4rem" : "14rem",
        transitionTimingFunction: springCurve,
        ...glassSidebar,
      }}
    >
      {/* ── 品牌区（收缩时可只留 logo 位） ── */}
      <div
        className="flex h-14 shrink-0 items-center gap-2 overflow-hidden px-3"
        style={{ borderBottom: "1px solid var(--glass-sheet-border)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "oklch(0.55 0.195 252 / 0.12)" }}
        >
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "oklch(0.55 0.195 252)" }}
          >
            <path d="M12 3l4.5 4.5-1.5 1.5-3-3L12 3z" />
            <path d="M3 12l4.5-4.5 1.5 1.5-3 3L3 12z" />
            <path d="M21 12l-4.5-4.5-1.5 1.5 3 3L21 12z" />
            <path d="M12 21l-4.5-4.5 1.5-1.5 3 3L12 21z" />
          </svg>
        </div>
        <span
          className={cn(
            "text-sm font-bold tracking-tight text-foreground whitespace-nowrap",
            "transition-opacity duration-200",
            collapsed ? "opacity-0 delay-0" : "opacity-100 delay-100"
          )}
        >
          Evergrow
        </span>
      </div>

      {/* ── 导航链接 ── */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "whitespace-nowrap overflow-hidden",
                "transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.97]",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "transition-opacity duration-200",
                collapsed ? "opacity-0 delay-0" : "opacity-100 delay-100"
              )}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* ── 收缩切换按钮 ── */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: "1px solid var(--glass-sheet-border)" }}
      >
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
            "text-sm font-medium text-foreground/50",
            "transition-all duration-300",
            "hover:text-foreground hover:bg-foreground/5",
            "hover:scale-[1.02] active:scale-[0.97]",
            "overflow-hidden whitespace-nowrap"
          )}
          aria-label={collapsed ? "展开侧边栏" : "收缩侧边栏"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <PanelLeftClose className="h-5 w-5 shrink-0" />
          )}
          <span
            className={cn(
              "transition-opacity duration-200",
              collapsed ? "opacity-0 delay-0" : "opacity-100 delay-100"
            )}
          >
            收缩
          </span>
        </button>
      </div>
    </aside>
  );
}
