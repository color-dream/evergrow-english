import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookMarked,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { useUIStore } from "@/stores/ui-store";

const navItems = [
  { to: ROUTES.DASHBOARD, label: "仪表盘", icon: LayoutDashboard },
  { to: ROUTES.VOCABULARY, label: "词汇", icon: BookMarked },
  { to: ROUTES.SETTINGS, label: "设置", icon: Settings },
];

export function Sidebar() {
  const open = useUIStore((s) => s.sidebarOpen);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300",
        open ? "w-60" : "w-16"
      )}
    >
      {/* 品牌区 */}
      <div className="flex h-14 items-center justify-between px-4">
        {open && (
          <span className="text-lg font-bold tracking-tight text-primary">
            {APP_NAME}
          </span>
        )}
        <button
          onClick={toggle}
          className={cn(
            "rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
            !open && "mx-auto"
          )}
          aria-label={open ? "收起侧边栏" : "展开侧边栏"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              !open && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* 导航 */}
      <nav className="flex-1 space-y-0.5 px-2 py-2 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* 底部版本信息 */}
      {open && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground/60">
            Evergrow English v0.1.0
          </p>
        </div>
      )}
    </aside>
  );
}
