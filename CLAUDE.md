# Evergrow English

## 项目概述

前端 React 应用，基于 Vite + TypeScript + TailwindCSS v4 构建。

## 技术栈

- **框架**: React 19 + TypeScript 6
- **构建**: Vite 8
- **样式**: TailwindCSS v4
- **路由**: React Router v7
- **状态**: Zustand + TanStack React Query
- **表单**: React Hook Form + Zod
- **本地存储**: Dexie (IndexedDB)
- **测试**: Vitest + Testing Library

## 设计哲学

整体 UI 风格遵循 **iOS 26 设计语言**：毛玻璃质感、活力色彩、弹性动画、半透明层叠、精致间距。

### 色彩系统

使用 **OKLCH 色彩空间**，以高色度（chroma ≥ 0.18）获得生动饱和的视觉效果。

- **品牌主色**：`oklch(0.55 0.195 252)` — vivid sky blue (hue=252)，替换传统 indigo
- **强调色**：`oklch(0.62 0.18 158)` — vivid mint green
- **背景**：`oklch(0.975 0.004 275)` — 微微暖调，避免冷灰
- **表面色**：muted/secondary 统一使用 hue=275 协同背景
- **语义色**：success/destructive 比传统方案色度更高，反馈更强烈
- **字母色**：correct/wrong 使用高色度值，学习反馈即时鲜明

原则：宁可用 `text-foreground/55`（前景色降透明度）也不用 `text-muted-foreground`（独立灰色），保持色彩一致性。

### 毛玻璃 (Glassmorphism)

三档玻璃透明系统，定义在 `globals.css` 的 `:root` / `.dark` 中：

| 层级 | Token | 用途 | blur |
|------|-------|------|------|
| Sheet | `--glass-sheet-*` | 全高面板、抽屉、结果卡片 | 24px |
| Card | `--glass-card-*` | 暂停遮罩、统计栏、设置浮条 | 16px |
| Pill | `--glass-pill-*` | 浮动按钮、胶囊控件 | 12px |

**组件中使用模式**（Tailwind 类 + inline style）：
```tsx
<div
  className="rounded-full"
  style={{
    background: "var(--glass-pill-bg)",
    backdropFilter: "blur(var(--glass-pill-blur)) saturate(1.8)",
    WebkitBackdropFilter: "blur(var(--glass-pill-blur)) saturate(1.8)",  // Safari
    border: "1px solid var(--glass-pill-border)",
  }}
>
```

**原则**：
- 玻璃表面不设 `hover:bg-muted`，hover 改用文本颜色变化 + `scale` 微动效
- 每个玻璃表面需同时设置 `backdropFilter` 和 `WebkitBackdropFilter`
- 暗色模式下玻璃背景透明度略高（`/0.78` vs 亮色 `/0.72`），确保可读性
- 同一页面最多 4 层玻璃叠加（当前设计：暂定遮罩 + 统计栏 + 抽屉 + 设置浮条），GPU 加速可承受

### 阴影

阴影带有**蓝色调**（而非中性灰黑），创造柔和深度感。亮色模式阴影以 `oklch(0.55 0.195 252 / ...)` 为基准，暗色模式使用 `oklch(0 0 0 / ...)` 但比重加大。

尺度递增：`xs → sm → md → lg → xl → 2xl`，对应弥散半径逐步加大（2px → 56px）。

原则：能用 `shadow-sm` 不用 `shadow-md`，能用 `shadow-lg` 不用 `shadow-xl`。面板/抽屉等高叠加元素才用大阴影。

### 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `rounded-lg` (8px) | `radius-lg` | 卡片内元素、小型控件 |
| `rounded-xl` (12px) | `radius-xl` | 标签、芯片 |
| `rounded-2xl` (16px) | `radius-2xl` | 面板侧边、容器 |
| `rounded-3xl` (20px) | `radius-3xl` | 暂停提示卡片 |
| `rounded-4xl` (24px) | `radius-4xl` | 结果卡片 |
| `rounded-full` | — | 胶囊按钮、浮条、进度条、统计栏 |

原则：交互元素用 `rounded-full`（pill 形状），静态容器用 `rounded-2xl` 以上。

### 动画

全部使用 **spring 弹性曲线** (`cubic-bezier(0.34, 1.56, 0.64, 1)`) 替代 `ease-out`，产生自然的回弹感。

| 动画 | 用途 | 时长 |
|------|------|------|
| `animate-slide-in-left/right` | 面板滑入 | 0.4s spring |
| `animate-spring-in` | 卡片弹入（缩放+位移） | 0.45s spring |
| `animate-spring-up` | 底部弹入 | 0.5s spring |
| `animate-spring-scale` | 缩放弹入 | 0.4s spring |
| `animate-shimmer` | 进度条流光 | 2.5s 循环 |
| `animate-breathe` | 播放中脉动 | 2s 循环 |
| `animate-shake` | 错误抖动 | 0.82s |

**过渡微交互**：所有可点击元素加 `transition-all duration-300`，hover 加 `scale-105`，active 加 `scale-95`。不使用 `opacity` 作为主要 hover 反馈（毛玻璃下效果不佳）。

### 排版

- **正文**：Inter (`font-sans`)，font-weight 偏轻（`font-normal` / `font-medium`）
- **等宽**：JetBrains Mono (`font-mono`)，用于单词拼写、数字统计
- **字母盒**：`font-medium tracking-tight` + 微妙 `textShadow`，比传统 `font-normal` 更有存在感
- **层级**：避免多级字重混用（同一区域最多 2 种 weight）

### 暗色模式

全局通过 `.dark` 类切换。设计原则：
- 玻璃背景透明度调高（保证可读性）
- 阴影改为纯黑但比重加大（蓝色调在暗色下不可见）
- 色彩保持相同的 OKLCH 色度值，仅调整亮度

### 组件设计原则

- **按钮**：`rounded-full` pill 形状，`transition-all duration-300`，`hover:scale-105 active:scale-95`
- **分隔线**：`w-px h-5` 或 `h-px w-full`，颜色用 `var(--glass-*-border)` 统一
- **图标**：lucide-react，默认 `text-foreground/50`，激活 `text-primary`，尺寸 `h-4 w-4`（小）/ `h-5 w-5`（常规）
- **文字颜色**：优先用 `text-foreground/N`（父色降透明度），其次 `text-muted-foreground`（独立灰）

## 约定

- **包管理器**: 始终使用 `bun` — `bun install`、`bun run dev`、`bun run build` 等。不要使用 npm/yarn/pnpm。
- **开发端口**: 固定 `10011`，配置在 `vite.config.ts` 中 `server.port: 10011` + `strictPort: true`。端口被占用时不会降级到其他端口，需手动杀掉旧进程后重试。启动时自动检测：`Get-NetTCPConnection -LocalPort 10011` 有结果则 `Stop-Process`。
- 代码注释和文档使用中文。
