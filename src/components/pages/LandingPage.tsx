import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Library,
  Gamepad2,
  BarChart3,
} from "lucide-react";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

// ── 玻璃样式 ──

const glassNav = {
  background: "var(--glass-sheet-bg)",
  backdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
  WebkitBackdropFilter: "blur(var(--glass-sheet-blur)) saturate(var(--glass-sheet-saturate))",
  borderBottom: "1px solid var(--glass-sheet-border)",
} as const;

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

// ── 子组件 ──

/** 顶部导航栏 */
function LandingNav() {
  return (
    <nav
      className="sticky top-0 z-50 flex h-14 items-center justify-between px-4 lg:px-6"
      style={glassNav}
    >
      {/* 品牌 */}
      <Link
        to={ROUTES.HOME}
        className="flex items-center gap-2.5 transition-all duration-300 hover:scale-[1.02]"
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: "oklch(0.55 0.195 252 / 0.12)",
          }}
        >
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          {APP_NAME}
        </span>
      </Link>

      {/* 右侧：主题切换 */}
      <ThemeToggle />
    </nav>
  );
}

/** Hero 区域 */
function HeroSection() {
  return (
    <section
      className="relative flex min-h-[calc(100dvh-56px)] items-center justify-center overflow-hidden px-6 py-20"
    >
      {/* 装饰光晕 */}
      <div
        className="pointer-events-none absolute -top-1/3 left-1/4 h-[600px] w-[600px] rounded-full opacity-70 dark:opacity-40"
        style={{
          background: "oklch(0.55 0.195 252 / 0.15)",
          filter: "blur(120px)",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-1/4 h-[500px] w-[500px] rounded-full opacity-60 dark:opacity-35"
        style={{
          background: "oklch(0.62 0.18 158 / 0.12)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full opacity-50 dark:opacity-30"
        style={{
          background: "oklch(0.72 0.18 85 / 0.1)",
          filter: "blur(90px)",
        }}
      />

      {/* 内容 */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* 眼眉徽章 */}
        <div
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 animate-spring-in"
          style={glassPill}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium text-foreground/70">
            AI 驱动的英语学习
          </span>
        </div>

        {/* 主标题 */}
        <h1
          className="mb-6 text-5xl font-extrabold tracking-tight leading-tight sm:text-6xl lg:text-7xl animate-spring-in"
          style={{ animationDelay: "100ms" }}
        >
          <span
            className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, oklch(0.55 0.195 252), oklch(0.62 0.18 158))",
            }}
          >
            Evergrow
          </span>{" "}
          <span className="text-foreground">English</span>
        </h1>

        {/* 副标题 */}
        <p
          className="mx-auto mb-10 max-w-xl text-lg text-foreground/55 sm:text-xl animate-spring-in"
          style={{ animationDelay: "200ms" }}
        >
          让每一次练习，都成为成长的养料。
          <br />
          科学记忆 × 沉浸体验，轻松提升英语能力。
        </p>

        {/* CTA 双按钮 */}
        <div
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-spring-up"
          style={{ animationDelay: "350ms" }}
        >
          <Link
            to={ROUTES.CENTER}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              boxShadow: "0 8px 30px oklch(0.55 0.195 252 / 0.35)",
            }}
          >
            免费开始
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              border: "1.5px solid oklch(0.55 0.195 252 / 0.3)",
              color: "oklch(0.55 0.195 252)",
            }}
          >
            了解更多
          </a>
        </div>
      </div>
    </section>
  );
}

const landingFeatures = [
  {
    icon: Brain,
    label: "科学记忆",
    desc: "FSRS 间隔重复算法，在遗忘临界点精准复习，最大化记忆效率",
    color: "oklch(0.56 0.17 230 / 0.1)",
    iconColor: "text-primary",
  },
  {
    icon: BarChart3,
    label: "进度追踪",
    desc: "实时统计掌握单词数、连续学习天数，见证每一步成长",
    color: "oklch(0.62 0.18 158 / 0.1)",
    iconColor: "text-accent",
  },
  {
    icon: Gamepad2,
    label: "沉浸练习",
    desc: "全屏逐字母打字输入，配合语音朗读，专注高效学习体验",
    color: "oklch(0.72 0.18 85 / 0.1)",
    iconColor: "text-warning",
  },
  {
    icon: Library,
    label: "精选词库",
    desc: "覆盖 A1 入门到 C2 精通六个等级，按需选择学习内容",
    color: "oklch(0.52 0.2 18 / 0.08)",
    iconColor: "text-destructive",
  },
];

/** 功能介绍 */
function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-24">
      {/* 标题 */}
      <div className="mb-14 text-center animate-fade-in">
        <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
          为什么选择 {APP_NAME}
        </h2>
        <p className="text-foreground/50">
          科学方法 + 沉浸体验，让每一次练习都高效且愉快
        </p>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {landingFeatures.map(({ label, desc, icon: Icon, color, iconColor }, i) => (
          <div
            key={label}
            className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] animate-spring-up"
            style={{
              ...glassCard,
              animationDelay: `${i * 100}ms`,
            }}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: color }}
            >
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-foreground">
              {label}
            </h3>
            <p className="text-sm text-foreground/50 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 三步开始 */
function StepsSection() {
  const steps = [
    {
      num: "01",
      icon: Library,
      title: "选择词库",
      desc: "从内置词库中挑选适合你水平的单词书，覆盖入门到精通六个等级",
      color: "oklch(0.55 0.195 252 / 0.1)",
      iconColor: "text-primary",
    },
    {
      num: "02",
      icon: Gamepad2,
      title: "沉浸练习",
      desc: "逐字母打字输入，配合语音朗读，在全屏沉浸模式中强化拼写记忆",
      color: "oklch(0.62 0.18 158 / 0.1)",
      iconColor: "text-accent",
    },
    {
      num: "03",
      icon: BarChart3,
      title: "科学复习",
      desc: "FSRS 算法根据你的记忆曲线自动调度复习，在遗忘前精准巩固",
      color: "oklch(0.72 0.18 85 / 0.1)",
      iconColor: "text-warning",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      {/* 标题 */}
      <div className="mb-14 text-center animate-fade-in">
        <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
          三步开始学习
        </h2>
        <p className="text-foreground/50">
          无需注册，打开即用。选择词库，马上进入沉浸式学习体验
        </p>
      </div>

      {/* 步骤 */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {steps.map(({ num, icon: Icon, title, desc, color, iconColor }, i) => (
          <div
            key={num}
            className="relative text-center animate-fade-in"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {/* 序号 */}
            <div
              className="mx-auto mb-5 font-mono text-5xl font-bold select-none"
              style={{ color: "oklch(0.55 0.195 252 / 0.12)" }}
            >
              {num}
            </div>
            {/* 图标 */}
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: color }}
            >
              <Icon className={`h-7 w-7 ${iconColor}`} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-sm text-foreground/50 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** CTA 卡片 */
function CTASection() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div
        className="relative overflow-hidden rounded-4xl p-10 text-center sm:p-14 animate-spring-up"
        style={{
          ...glassCard,
          boxShadow:
            "var(--shadow-lg), 0 0 80px oklch(0.55 0.195 252 / 0.08)",
        }}
      >
        {/* 背景光晕 */}
        <div
          className="pointer-events-none absolute -top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full"
          style={{
            background: "oklch(0.55 0.195 252 / 0.06)",
            filter: "blur(80px)",
          }}
        />

        <h2 className="relative mb-3 text-3xl font-bold text-foreground sm:text-4xl">
          准备好开始了吗？
        </h2>
        <p className="relative mb-8 text-foreground/50">
          完全免费，无需注册。选择词库，即刻开始学习。
        </p>
        <Link
          to={ROUTES.CENTER}
          className="relative inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 animate-breathe"
          style={{
            boxShadow: "0 8px 30px oklch(0.55 0.195 252 / 0.4)",
          }}
        >
          进入学习中心
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

/** 页脚 */
function LandingFooter() {
  return (
    <footer
      className="mx-auto max-w-6xl px-6 py-8"
      style={{ borderTop: "1px solid var(--glass-card-border)" }}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-foreground/30">
          {APP_NAME} v0.1.0
        </p>

        <p className="text-sm text-foreground/30">
          © {new Date().getFullYear()} Evergrow English
        </p>
      </div>
    </footer>
  );
}

// ── 主页组件 ──

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <StepsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
