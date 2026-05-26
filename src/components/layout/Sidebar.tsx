import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Headphones,
  Mic,
  BookMarked,
  Repeat,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { useUIStore } from "@/stores/ui-store";

const navItems = [
  { to: ROUTES.DASHBOARD, label: "仪表盘", icon: LayoutDashboard },
  { to: ROUTES.REVIEW, label: "今日复习", icon: Repeat },
  { to: ROUTES.VOCABULARY, label: "词汇", icon: BookMarked },
  { to: ROUTES.READING, label: "阅读", icon: BookOpen },
  { to: ROUTES.LISTENING, label: "听力", icon: Headphones },
  { to: ROUTES.SPEAKING, label: "口语", icon: Mic },
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
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        {open && (
          <span className="font-bold text-primary text-lg truncate">
            {APP_NAME}
          </span>
        )}
        <button
          onClick={toggle}
          className="rounded-md p-1.5 hover:bg-muted transition-colors cursor-pointer"
          aria-label={open ? "收起侧边栏" : "展开侧边栏"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              !open && "rotate-180"
            )}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {open && (
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            Evergrow English v0.1.0
          </p>
        </div>
      )}
    </aside>
  );
}
