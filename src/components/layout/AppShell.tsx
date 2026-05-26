import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUIStore } from "@/stores/ui-store";

export function AppShell() {
  const sidebarForceHidden = useUIStore((s) => s.sidebarForceHidden);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!sidebarForceHidden && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!sidebarForceHidden && <Header />}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
