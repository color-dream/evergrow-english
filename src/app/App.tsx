import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AudioProvider } from "./providers/AudioProvider";
import { AppShell } from "@/components/layout/AppShell";
import { CenterLayout } from "@/components/layout/CenterLayout";
import { SentenceCourseListPage } from "@/components/vocabulary/SentenceCourseListPage";
import { LandingPage } from "@/components/pages/LandingPage";
import { WelcomePage } from "@/components/pages/WelcomePage";
import { LearningCenterHub } from "@/components/pages/LearningCenterHub";
import { LearningPage } from "@/components/pages/LearningPage";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { WelcomeGuard } from "@/components/shared/WelcomeGuard";
import { ImmersiveLearnPage } from "@/components/pages/ImmersiveLearnPage";
import { ImmersiveSentencePage } from "@/components/pages/ImmersiveSentencePage";
import { ROUTES } from "@/lib/constants";
import { Settings } from "lucide-react";

export function App() {
  const basename = import.meta.env.VITE_BASE || "/";

  return (
    <QueryProvider>
      <ThemeProvider>
        <AudioProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              {/* 官网首页 — 全屏，无 AppShell */}
              <Route path={ROUTES.HOME} element={<LandingPage />} />

              {/* 欢迎页面 — 全屏，无 AppShell */}
              <Route path={ROUTES.WELCOME} element={<WelcomePage />} />

              <Route element={<AppShell />}>
                {/* 学习中心 — 嵌套布局，有昵称守卫 */}
                <Route element={<WelcomeGuard />}>
                  <Route path={ROUTES.CENTER} element={<CenterLayout />}>
                    <Route index element={<LearningCenterHub />} />
                    <Route path={ROUTES.LEARNING} element={<LearningPage />} />
                    <Route path={ROUTES.SENTENCE_COURSES} element={<SentenceCourseListPage />} />
                    {/* 旧路由重定向 */}
                    <Route path={ROUTES.VOCABULARY} element={<Navigate to={ROUTES.LEARNING} replace />} />
                    <Route path={ROUTES.SENTENCE} element={<Navigate to={ROUTES.LEARNING} replace />} />
                  </Route>
                </Route>

                {/* 设置 */}
                <Route
                  path={ROUTES.SETTINGS}
                  element={
                    <PagePlaceholder
                      title="设置"
                      description="个性化学习偏好"
                      icon={<Settings className="h-7 w-7" />}
                    />
                  }
                />

                {/* 兼容旧链接 */}
                <Route
                  path="/dashboard"
                  element={<Navigate to={ROUTES.CENTER} replace />}
                />
              </Route>

              {/* 全屏沉浸学习（无 AppShell） */}
              <Route path={ROUTES.LEARN} element={<ImmersiveLearnPage />} />
              <Route path={ROUTES.LEARN_SENTENCE} element={<ImmersiveSentencePage />} />

              {/* 404 */}
              <Route
                path="*"
                element={<Navigate to={ROUTES.HOME} replace />}
              />
            </Routes>
          </BrowserRouter>
        </AudioProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
