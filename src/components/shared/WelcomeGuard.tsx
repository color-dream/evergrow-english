import { Navigate, Outlet } from "react-router-dom";
import { useSettingsStore } from "@/stores/settings-store";
import { ROUTES } from "@/lib/constants";

/**
 * 路由守卫：未设置昵称时跳转到欢迎页
 *
 * 包裹 /center 路由，检查 localStorage 中是否已有昵称。
 * 若无 → Navigate 到 /welcome；若有 → 透传渲染子路由。
 */
export function WelcomeGuard() {
  const nickname = useSettingsStore((s) => s.nickname);

  if (!nickname) {
    return <Navigate to={ROUTES.WELCOME} replace />;
  }

  return <Outlet />;
}
