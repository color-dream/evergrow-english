# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
# 开发
bun run dev              # 启动开发服务器 (端口 10011)
bun run build            # 类型检查 + 生产构建

# 代码质量
bun run lint             # ESLint 检查
bun run lint:fix         # ESLint 自动修复
bun run format           # Prettier 格式化 src/**/*.{ts,tsx,css}
bun run format:check     # Prettier 仅检查不写入

# 测试
bun run test             # vitest run（单次运行）
bun run test:watch       # vitest watch 模式

# 预览
bun run preview          # 预览生产构建
```

## 路径别名

`@/` → `src/`，配置在 `vite.config.ts` 的 `resolve.alias` 和 `tsconfig.json` 中。

```tsx
import { useSettingsStore } from "@/stores/settings-store";
import { ROUTES } from "@/lib/constants";
import type { Word } from "@/types/domain";
```

## 架构概览

### 应用入口层级

```
main.tsx
 └─ StrictMode
     └─ App
         ├─ QueryProvider (TanStack React Query)
         │   └─ ThemeProvider (暗色模式 .dark 类切换)
         │       └─ AudioProvider (TTS 语音合成上下文)
         │           └─ BrowserRouter
         │               ├─ "/"       → LandingPage（官网首页，无 AppShell）
         │               ├─ "/welcome" → WelcomePage（欢迎页，无 AppShell）
         │               ├─ AppShell（侧边栏 + 顶栏布局）
         │               │   ├─ WelcomeGuard（昵称守卫，未设置昵称重定向 /welcome）
         │               │   │   └─ CenterLayout
         │               │   │       ├─ index  → LearningCenterHub
         │               │   │       ├─ "/center/learning" → LearningPage（词汇打写）
         │               │   │       └─ "/center/sentence/:bookId" → SentenceCourseListPage
         │               │   └─ "/settings" → PagePlaceholder（占位）
         │               ├─ "/learn"          → ImmersiveLearnPage（沉浸词汇，无 AppShell）
         │               └─ "/learn-sentence"  → ImmersiveSentencePage（沉浸句子，无 AppShell）
```

路由常量定义在 [src/lib/constants.ts](src/lib/constants.ts) 的 `ROUTES` 对象中。

### 状态管理 (Zustand)

| Store | 文件 | 持久化 | 职责 |
|-------|------|--------|------|
| `useSettingsStore` | [src/stores/settings-store.ts](src/stores/settings-store.ts) | localStorage (`eg-settings`) | 用户偏好、每日目标、昵称、每词库单词数 |
| `useUIStore` | [src/stores/ui-store.ts](src/stores/ui-store.ts) | 否 | 主题解析（system→light/dark） |
| `useVocabularySessionStore` | [src/stores/vocabulary-session-store.ts](src/stores/vocabulary-session-store.ts) | 否 | 词汇学习会话：任务队列、4模式推进、计时、击键统计 |
| `useSentenceSessionStore` | [src/stores/sentence-session-store.ts](src/stores/sentence-session-store.ts) | 否 | 句子学习会话：当前句子索引、结果记录 |

### 数据库 (Dexie/IndexedDB)

`EvergrowDB` 单例定义在 [src/lib/db/database.ts](src/lib/db/database.ts)，通过 `getDB()` 获取。

目前 3 个版本：

- **v1**: `learningCards`（FSRS 记忆卡片）+ `studySessions`（学习会话记录）
- **v2**: `learningSessions`（按词库维度的学习进度，key 为 `bookId`）
- **v3**: `sentenceProgress` + `sentenceLessonProgress`（句子学习进度追踪）

核心类型：
- `LearningCard`（[src/lib/fsrs/types.ts](src/lib/fsrs/types.ts)）：统一卡片模型，`cardType: "word" | "sentence"`，包装 FSRS 状态
- `FSRSState`（[src/types/domain.ts](src/types/domain.ts)）：stability, difficulty, elapsedDays, scheduledDays, reps, lapses, lastReview, state

### FSRS 间隔重复系统

位于 [src/lib/fsrs/](src/lib/fsrs/)：

| 文件 | 职责 |
|------|------|
| `algorithm.ts` | 核心算法：`createNewFSRSState()` 初始状态、`applyFSRS()` 评分更新（纯函数）、`getRetrievability()` 可提取性 |
| `parameters.ts` | FSRS 参数常量（初始稳定性、难度增量、最大间隔等） |
| `rating.ts` | 从击键正确率推导 FSRS 评分 (1=重来, 2=困难, 3=良好, 4=简单) |
| `scheduler.ts` | 复习调度：`getDueCards()` 筛选到期卡片、`getTodayReviewedCount()`、`getMasteredCount()` |
| `learning-scheduler.ts` | 会话内任务队列：`createNewWordTaskQueue()`（随机打乱）、`createReviewTaskQueue()`（按 retrievability 排序）、`sortQueueByPriority()` |
| `types.ts` | Dexie 持久化的 `LearningCard` 和 `StudySessionRecord` 类型 |

FSRS 评分决策流程：用户输入 → 击键正确率 → `deriveFSRSRating()` → `applyFSRS()` → 写入 Dexie → 下次复习间隔由 `stabilityToInterval()` 计算。

### 学习模式

#### 词汇学习（4 模式渐进隐藏）

定义在 [src/types/vocabulary.ts](src/types/vocabulary.ts)，固定顺序：

1. `typeWithWord` — 照单词输入（可见单词、翻译、音标）
2. `typeWithoutWord` — 隐藏单词
3. `typeWithoutWordAndTranslation` — 隐藏单词和翻译
4. `typeWithoutWordAndTranslationAndPhonetic` — 全部隐藏

每个单词的 4 种模式由 `VocabularySessionStore` 的任务队列驱动。任一模式错误超过 `SKIP_WRONG_THRESHOLD`（4 次）则重置回模式 0。4 种模式全部通过后聚合为 `WordResult`。新词阶段结束后自动进入复习阶段（FSRS 到期卡片）。

核心 hooks：
- `useWordTyping` — 单词语音播放 + 逐字母状态机
- `useWordCompletion` — 监听完成事件写入 Dexie
- `useFSRSSync` — 将 `WordResult[]` 转为 FSRS 评分并更新卡片
- `useLearningSessionPersistence` — 页面刷新时从 Dexie 恢复进度

#### 句子学习（Earthworm 风格）

用户在中文提示下逐词输入英文句子，对标 [Earthworm](https://earthworm.xyz) 的打字体验。

JSON 数据位于 `public/sentences/{bookId}/` 目录，每条记录为 `{ chinese, english, soundmark }`。

核心 hooks：
- `useSentenceTyping` — 逐词匹配、错误高亮、自动前进
- `useSentenceFSRSSync` — 句子完成后的 FSRS 更新

### 词库注册

- **词汇词库**: [src/lib/word-book-registry.ts](src/lib/word-book-registry.ts) — 定义 `WordBookId`（当前 `"cet4" | "cet6"`）及 JSON 路径映射
- **句子词库**: [src/lib/sentence-book-registry.ts](src/lib/sentence-book-registry.ts) — 定义 `SentenceBookId`（当前 `"xingrong"`）及课程元数据

### 语音服务

[src/services/audio/](src/services/audio/) 提供 TTS 抽象：

- `web-speech.ts` — 基于 `SpeechSynthesis` API 的浏览器原生 TTS
- `youdao.ts` — 有道词典 TTS API（单词发音更准确）
- `types.ts` — `AudioService` 接口定义

`AudioProvider`（[src/app/providers/AudioProvider.tsx](src/app/providers/AudioProvider.tsx)）在应用顶层提供统一的 `playWord()` / `playSentence()` 方法。

### 键盘捕获

全局键盘事件通过 `useKeyboardCapture`（[src/hooks/useKeyboardCapture.ts](src/hooks/useKeyboardCapture.ts)）实现，过滤修饰键、防重复、处理 Enter 提交。辅助函数在 [src/lib/keyboard-utils.ts](src/lib/keyboard-utils.ts)：`isLegal()` 过滤合法字符、`isChineseSymbol()` 过滤中文符号。

### 持久化约定

- **用户设置** → `localStorage`（Zustand `persist` 中间件，key: `eg-settings`）
- **学习数据** → `IndexedDB`（Dexie，数据库名: `evergrow-english`）
- **会话状态** → 内存（Zustand 无 persist），刷新后通过 `useLearningSessionPersistence` 从 Dexie 恢复

---

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
- **开发端口**: 固定 `10011`，配置在 `vite.config.ts` 中 `server.port: 10011` + `strictPort: true`。端口被占用时不会降级到其他端口，需手动杀掉旧进程后重试。
- 代码注释和文档使用中文。
