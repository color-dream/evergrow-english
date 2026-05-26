import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AudioProvider } from "./providers/AudioProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/constants";
import { VocabularyPage } from "@/components/vocabulary/VocabularyPage";

// 懒加载占位，Phase 1 逐步替换为真实页面
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-1 items-center justify-center">
    <div className="text-center animate-fade-in">
      <h2 className="text-2xl font-bold text-muted-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">即将上线</p>
    </div>
  </div>
);

const HomePage = () => <Placeholder title="Evergrow English" />;
const DashboardPage = () => <Placeholder title="学习仪表盘" />;
const ReviewPage = () => <Placeholder title="复习" />;
const ReadingPage = () => <Placeholder title="阅读理解" />;
const ListeningPage = () => <Placeholder title="听力练习" />;
const SpeakingPage = () => <Placeholder title="口语练习" />;
const SettingsPage = () => <Placeholder title="设置" />;

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
                <Route path={ROUTES.READING} element={<ReadingPage />} />
                <Route path={ROUTES.LISTENING} element={<ListeningPage />} />
                <Route path={ROUTES.SPEAKING} element={<SpeakingPage />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
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
