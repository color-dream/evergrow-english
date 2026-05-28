import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AudioProvider } from "./providers/AudioProvider";
import { AppShell } from "@/components/layout/AppShell";
import { VocabularyPage } from "@/components/vocabulary/VocabularyPage";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { ReviewPage } from "@/components/pages/ReviewPage";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";
import { ImmersiveLearnPage } from "@/components/pages/ImmersiveLearnPage";
import { ROUTES } from "@/lib/constants";
import { BookOpen, Headphones, Mic, Settings } from "lucide-react";

const HomePage = () => (
  <div className="flex h-full items-center justify-center px-4 py-16">
    <div className="text-center animate-spring-scale">
      <div
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-primary shadow-xs"
        style={{
          background: "var(--glass-card-bg)",
          backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
          WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
          border: "1px solid var(--glass-card-border)",
        }}
      >
        <span className="text-2xl font-bold tracking-tight">EG</span>
      </div>
      <h2 className="text-2xl font-bold text-foreground">Evergrow English</h2>
      <p className="mt-2 text-sm text-foreground/55">
        专注英语能力的渐进式学习工具
      </p>
      <span className="mt-8 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        style={{ boxShadow: "0 4px 16px oklch(0.55 0.195 252 / 0.35)" }}>
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
                <Route path={ROUTES.REVIEW} element={<ReviewPage />} />
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
              </Route>
              <Route path={ROUTES.LEARN} element={<ImmersiveLearnPage />} />
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
