import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AudioProvider } from "./providers/AudioProvider";
import { AppShell } from "@/components/layout/AppShell";
import { CenterLayout } from "@/components/layout/CenterLayout";
import { VocabularyPage } from "@/components/vocabulary/VocabularyPage";
import { LandingPage } from "@/components/pages/LandingPage";
import { ReviewPage } from "@/components/pages/ReviewPage";
import { LearningCenterHub } from "@/components/pages/LearningCenterHub";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { ImmersiveLearnPage } from "@/components/pages/ImmersiveLearnPage";
import { ROUTES } from "@/lib/constants";
import { BookOpen, Headphones, Mic, Settings } from "lucide-react";

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AudioProvider>
          <BrowserRouter>
            <Routes>
              {/* 官网首页 — 全屏，无 AppShell */}
              <Route path={ROUTES.HOME} element={<LandingPage />} />

              <Route element={<AppShell />}>
                {/* 学习中心 — 嵌套布局 */}
                <Route path={ROUTES.CENTER} element={<CenterLayout />}>
                  <Route index element={<LearningCenterHub />} />
                  <Route path={ROUTES.VOCABULARY} element={<VocabularyPage />} />
                  <Route path={ROUTES.REVIEW} element={<ReviewPage />} />
                  <Route
                    path={ROUTES.READING}
                    element={
                      <PagePlaceholder
                        title="阅读理解"
                        description="精读文章，在语境中积累词汇"
                        icon={<BookOpen className="h-7 w-7" />}
                      />
                    }
                  />
                  <Route
                    path={ROUTES.LISTENING}
                    element={
                      <PagePlaceholder
                        title="听力训练"
                        description="盲听 + 听写双重练习，提升听力理解"
                        icon={<Headphones className="h-7 w-7" />}
                      />
                    }
                  />
                  <Route
                    path={ROUTES.SPEAKING}
                    element={
                      <PagePlaceholder
                        title="口语练习"
                        description="跟读模仿，改善发音与流利度"
                        icon={<Mic className="h-7 w-7" />}
                      />
                    }
                  />
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
