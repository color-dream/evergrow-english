import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AudioProvider } from "./providers/AudioProvider";
import { AppShell } from "@/components/layout/AppShell";
import { VocabularyPage } from "@/components/vocabulary/VocabularyPage";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { ROUTES } from "@/lib/constants";
import { Repeat, BookOpen, Headphones, Mic, Settings } from "lucide-react";

const HomePage = () => (
  <div className="flex h-full items-center justify-center px-4 py-16">
    <div className="text-center animate-fade-in">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-xs">
        <span className="text-2xl font-bold tracking-tight">EG</span>
      </div>
      <h2 className="text-2xl font-bold text-foreground">Evergrow English</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        专注英语能力的渐进式学习工具
      </p>
      <span className="mt-8 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90">
        从词汇打字开始 →
      </span>
    </div>
  </div>
);

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AudioProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route
                  path={ROUTES.REVIEW}
                  element={
                    <PagePlaceholder
                      title="今日复习"
                      description="基于 FSRS 遗忘曲线的智能调度复习"
                      icon={<Repeat className="h-7 w-7" />}
                    />
                  }
                />
                <Route path={ROUTES.VOCABULARY} element={<VocabularyPage />} />
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
                <Route
                  path="*"
                  element={<Navigate to={ROUTES.HOME} replace />}
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </AudioProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
