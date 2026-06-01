import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { useSettingsStore } from "@/stores/settings-store";

// ── 玻璃样式 ──

const glassCard = {
  background: "var(--glass-card-bg)",
  backdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-card-blur)) saturate(var(--glass-sheet-saturate))",
  border: "1px solid var(--glass-card-border)",
} as const;

const glassPill = {
  background: "var(--glass-pill-bg)",
  backdropFilter: "blur(var(--glass-pill-blur))",
  WebkitBackdropFilter: "blur(var(--glass-pill-blur))",
  border: "1px solid var(--glass-pill-border)",
} as const;

// ── 欢迎页组件 ──

export function WelcomePage() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nickname = useSettingsStore((s) => s.nickname);
  const setNickname = useSettingsStore((s) => s.setNickname);
  const navigate = useNavigate();

  const trimmed = name.trim();

  // 已有昵称 → 直接进入学习中心
  useEffect(() => {
    if (nickname) {
      navigate(ROUTES.CENTER, { replace: true });
    }
  }, [nickname, navigate]);

  const handleSubmit = useCallback(() => {
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    setNickname(trimmed);
    // 短暂延迟让动画收尾
    setTimeout(() => {
      navigate(ROUTES.CENTER, { replace: true });
    }, 200);
  }, [trimmed, isSubmitting, setNickname, navigate]);

  const handleSkip = useCallback(() => {
    setNickname("学习者");
    navigate(ROUTES.CENTER, { replace: true });
  }, [setNickname, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      {/* 装饰光晕 */}
      <div
        className="pointer-events-none absolute -top-1/4 left-1/4 h-[500px] w-[500px] rounded-full opacity-60 dark:opacity-35"
        style={{
          background: "oklch(0.55 0.195 252 / 0.12)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-1/5 h-[400px] w-[400px] rounded-full opacity-50 dark:opacity-30"
        style={{
          background: "oklch(0.62 0.18 158 / 0.1)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full opacity-40 dark:opacity-25"
        style={{
          background: "oklch(0.72 0.18 85 / 0.08)",
          filter: "blur(70px)",
        }}
      />

      {/* 玻璃卡片 */}
      <div
        className="relative z-10 w-full max-w-md rounded-4xl p-10 text-center sm:p-12"
        style={{
          ...glassCard,
          boxShadow:
            "var(--shadow-lg), 0 0 80px oklch(0.55 0.195 252 / 0.06)",
        }}
      >
        {/* 背景光晕 */}
        <div
          className="pointer-events-none absolute -top-1/2 left-1/2 h-[250px] w-[250px] -translate-x-1/2 rounded-full"
          style={{
            background: "oklch(0.55 0.195 252 / 0.05)",
            filter: "blur(60px)",
          }}
        />

        {/* 图标 */}
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl animate-spring-in"
          style={{
            background: "oklch(0.55 0.195 252 / 0.12)",
          }}
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        {/* 标题 */}
        <h1
          className="relative mb-2 text-2xl font-bold text-foreground animate-spring-in"
          style={{ animationDelay: "100ms" }}
        >
          欢迎来到 {APP_NAME}
        </h1>

        {/* 副标题 */}
        <p
          className="relative mb-8 text-sm text-foreground/50 animate-spring-in"
          style={{ animationDelay: "200ms" }}
        >
          取一个昵称，开始你的英语学习之旅
        </p>

        {/* 输入框 */}
        <div
          className="relative mb-5 animate-spring-up"
          style={{ animationDelay: "300ms" }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的昵称…"
            maxLength={20}
            autoFocus
            disabled={isSubmitting}
            className="w-full rounded-xl px-5 py-3.5 text-center text-lg font-medium text-foreground placeholder:text-foreground/25 outline-none transition-all duration-300 focus:ring-2 focus:ring-primary"
            style={{
              ...glassPill,
              background: "var(--glass-pill-bg)",
            }}
          />
        </div>

        {/* 提交按钮 */}
        <div
          className="relative mb-5 animate-spring-up"
          style={{ animationDelay: "400ms" }}
        >
          <button
            onClick={handleSubmit}
            disabled={!trimmed || isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            style={{
              boxShadow: trimmed
                ? "0 8px 30px oklch(0.55 0.195 252 / 0.35)"
                : "none",
            }}
          >
            开始学习
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* 跳过链接 */}
        <p
          className="relative animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-sm text-foreground/30 transition-colors duration-300 hover:text-foreground/50"
          >
            稍后再说
          </button>
        </p>
      </div>

      {/* 底部版本 */}
      <p className="relative z-10 mt-10 text-sm text-foreground/20 select-none">
        {APP_NAME} v0.1.0
      </p>
    </div>
  );
}
