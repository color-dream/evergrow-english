# Evergrow English — 产品与技术方案

## 1. 产品定位

一款以**句子为核心**的英语语感学习工具。核心理念：通过"听声音 → 手动输入 → 获得反馈"的闭环练习，反复刺激语感形成。

- **前期**：纯前端网页版，浏览器即可使用
- **后期**：Tauri 封装为桌面应用（Windows / macOS / Linux）

## 2. 功能蓝图

### 核心学习循环（C位功能）

```
播放句子音频 → 用户听写输入 → 系统对比打分 → 差异高亮反馈 → 间隔重复调度
```

- 拼写容错（Levenshtein 距离，可配置阈值）
- 标点/大小写规范化（可配置严格度）
- 多答案变体支持（如 "I'm" / "I am"）
- 部分输入按比例评分
- 音频播放失败时优雅降级

### 功能模块

| 模块 | 说明 | 优先级 |
|------|------|--------|
| 间隔重复复习 | FSRS v5 算法调度，每日复习队列，学习日历 | Phase 2 |
| 词汇学习 | 从句子自动提取单词，闪卡复习，单词详情页 | Phase 3 |
| 阅读理解 | 文章阅读 + 点击查词 + 完形填空 + TTS 朗读 | Phase 4 |
| 听力听写 | 纯音频听写、可配速播放、逐词准确率报告 | Phase 5 |
| 口语练习 | 语音识别跟读、发音对比反馈 | Phase 6 |
| AI 辅助 | AI 对话、智能纠错、内容生成（云端/本地双模式） | Phase 8 |

## 3. 技术架构

### 3.1 技术栈

| 层面 | 选型 | 理由 |
|------|------|------|
| 框架 | React 19 + TypeScript | Tauri 生态最完善 |
| 构建 | Vite | Tauri 默认推荐，HMR 极快 |
| 样式 | Tailwind CSS v4 + shadcn/ui | 组件源码可控，适合 WebView |
| 路由 | React Router v7 | 桌面 SPA 无需 SSR |
| 状态管理 | Zustand (UI) + TanStack Query (数据) | 轻量组合，无 boilerplate |
| 表单 | React Hook Form + Zod | 核心输入环节性能与校验 |
| 数据存储 | Dexie.js → 后期迁移 SQLite | IndexedDB ~250MB，远超 localStorage |
| 文字转语音 | Web Speech API → 后期 tauri-plugin-tts | 接口抽象，实现可替换 |
| 语音识别 | Web Speech API → 后期 Whisper.cpp | 同上 |
| 间隔重复 | femto-fsrs (FSRS v5) | 比 SM-2 准确率提升约 80% |

### 3.2 服务抽象层（Tauri 迁移关键）

所有平台相关能力通过 TypeScript 接口访问，运行时按平台动态选择实现：

```
IAudioService       →  WebSpeechAudioService  /  TauriTtsAudioService
IDatabaseService    →  DexieRepository         /  TauriSqlRepository
ISpeechRecognition  →  WebSTTService           /  WhisperService
```

平台检测：`window.__TAURI_INTERNALS__` 是否存在。

### 3.3 数据持久化路径

1. **Phase 1-6**：Dexie.js → IndexedDB（异步、大容量、复合索引）
2. **Phase 7**：Tauri 初始化时，Rust 命令读取 IndexedDB → 写入 SQLite → 验证 → 切换
3. 全程不使用 localStorage 存储持久数据

## 4. 核心数据模型

```
User (1) ────< (N) StudySession
User (1) ────< (N) LearningCard
User (1) ────< (N) Attempt

Sentence (1) ────< (N) SentenceWord >──── (1) Word
Sentence (1) ────< (N) LearningCard
Sentence (1) ────< (N) Exercise

Article (1) ────< (N) ArticleWord >──── (1) Word
Article (1) ────< (N) ClozeExercise

Exercise (1) ────< (N) Attempt
```

### 关键实体

```typescript
Sentence       { id, text, translation, audioUrl?, difficulty, tags, ... }
Word           { id, text, lemma, definition, partOfSpeech, ... }
LearningCard   { id, cardType, contentId, fsrs: FSRSState }
Article        { id, title, content, difficulty, ... }
Exercise       { id, exerciseType, prompt, correctAnswer, acceptableAnswers?, ... }
Attempt        { id, exerciseId, userInput, isCorrect, score, mistakeDetails?, ... }
StudySession   { id, sessionType, startTime, cardsReviewed, totalTimeSpent, ... }
User           { id, name, dailyGoal, preferences, streakDays, ... }
```

### FSRS 状态

```typescript
FSRSState {
  stability, difficulty, elapsedDays, scheduledDays,
  reps, lapses, lastReview, state
}
```

## 5. 分阶段交付计划

### Phase 0：项目脚手架 [已完成]

- Vite + React 19 + TypeScript 初始化
- Tailwind CSS v4 + 主题系统（亮色/暗色/跟随系统）
- React Router v7 + AppShell 布局（可折叠侧边栏）
- Zustand 状态管理 + Web Speech API 音频抽象
- 核心领域类型定义 + 种子数据（50 句 + 35 词）
- ESLint + Prettier + husky + lint-staged

### Phase 1：核心学习循环 [下一步]

- Dexie.js 数据库建表 + 种子数据导入
- 音频服务完善（TTS 播放、速度控制、多语音选择）
- SentenceCard + SentenceInput + FeedbackOverlay 三大核心组件
- 字符串比较引擎（Levenshtein 距离 + 词级 diff + 部分评分）
- FSRS 评分按钮（Again / Hard / Good / Easy）
- 基础仪表盘

### Phase 2：间隔重复引擎

- FSRS v5 调度算法集成
- 到期卡片查询 + 复习队列（新卡与到期卡混合）
- ReviewSession 会话管理（开始、结束、统计）
- 每日连续天数 + 学习日历热力图

### Phase 3：词汇模块

- 词表浏览（按难度、词性、标签筛选）
- 单词详情页（释义、例句、发音、SRS 状态）
- 单词闪卡复习（翻转动画）
- 从句子自动提取词汇

### Phase 4：阅读理解

- 文章阅读器（Markdown 渲染 + 点击查词 + TTS 朗读）
- 完形填空练习（可配置空格频率 + 渐进提示）
- 文章库（按难度和主题筛选）

### Phase 5：听力与听写

- 听写视图（纯音频 + 可配置重播次数限制）
- 逐词准确率可视化报告
- 播放速度控制（0.5x - 2x）
- 听力理解模式（短文 + 问题）

### Phase 6：口语练习

- Web Speech API 语音识别集成
- 跟读对比（转录 vs 目标句，词级准确率）
- 录音状态可视化
- 浏览器兼容检测 + 优雅降级

### Phase 7：Tauri 桌面封装

- src-tauri/ 初始化 + Rust 插件集成
- TauriTtsAudioService + TauriSqlRepository 实现
- IndexedDB → SQLite 数据迁移
- 原生通知 + 系统托盘 + 全局快捷键
- 跨平台构建（.exe / .dmg / .AppImage）
- 自动更新（GitHub Releases）

### Phase 8：AI 功能

- IChatService / IGrammarService 接口定义
- AI 对话练习（角色扮演场景）
- 智能错误分析 + 针对性练习生成
- 内容生成（句子、完形填空、个性化阅读）
- 本地 AI 选项（Ollama / llama.cpp）

## 6. 项目结构

```
evergrow-english/
├── src/
│   ├── app/                        # 应用级配置
│   │   ├── providers/              # ThemeProvider, QueryProvider, AudioProvider
│   │   ├── App.tsx                 # 根组件
│   │   └── router.tsx              # (路由定义内嵌于 App.tsx)
│   ├── components/                 # 共享 UI 组件
│   │   ├── ui/                     # shadcn/ui 原语（按需添加）
│   │   ├── layout/                 # AppShell, Sidebar, Header
│   │   ├── audio/                  # PlayButton, RecordButton, WaveformPlayer
│   │   ├── sentence/               # SentenceCard, SentenceInput, FeedbackOverlay
│   │   ├── flashcard/              # FlashCard, RatingButtons, CardStack
│   │   └── exercise/               # DictationExercise, ClozeExercise, ReadingPassage
│   ├── features/                   # 功能模块（每模块含 components/hooks/services/types）
│   │   ├── vocabulary/             # 词汇学习
│   │   ├── reading/                # 阅读理解
│   │   ├── listening/              # 听力听写
│   │   ├── speaking/               # 口语练习
│   │   ├── review/                 # 间隔重复复习
│   │   └── dashboard/              # 学习仪表盘
│   ├── services/                   # 基础设施服务
│   │   ├── db/                     # 数据库抽象（dexie/ + tauri/）
│   │   ├── audio/                  # 音频抽象（web-speech / tauri-tts）
│   │   ├── speech-recognition/     # 语音识别抽象
│   │   └── srs/                    # FSRS 引擎
│   ├── stores/                     # Zustand 全局状态
│   │   ├── settings-store.ts       # 用户偏好
│   │   ├── ui-store.ts             # UI 状态（侧边栏、主题）
│   │   └── learning-store.ts       # 当前学习会话
│   ├── hooks/                      # 共享 hooks
│   ├── lib/                        # 工具函数 + 常量 + 种子数据
│   ├── types/                      # TypeScript 类型定义
│   └── styles/                     # 全局样式（Tailwind v4）
├── src-tauri/                      # Tauri 后端（Phase 7）
├── tests/                          # unit / integration / e2e
└── 配置文件...
```

## 7. 关键风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Web Speech API 浏览器兼容性差 | 高 | 中 | 特性检测 + 优雅降级；Phase 7 迁移到 tauri-plugin-tts |
| IndexedDB 存储配额超限 | 低 | 高 | `navigator.storage.estimate()` 监控；数据导出功能 |
| FSRS 用于句子学习需调参 | 中 | 中 | 外层封装可自定义调度逻辑；充分测试复习间隔 |
| Tauri WebView 渲染差异 | 中 | 低 | shadcn/ui (Radix 原语) 跨浏览器测试充分 |
| 语音识别口音准确率差异 | 高 | 中 | 可配置 WER 阈值；手动纠正选项；后期 Whisper.cpp |

## 8. 当前进度

| 阶段 | 状态 | 开始日期 | 完成日期 |
|------|------|----------|----------|
| Phase 0：项目脚手架 | ✅ 已完成 | 2026-05-26 | 2026-05-26 |
| Phase 1：核心学习循环 | 🔜 下一步 | - | - |
| Phase 2-8 | ⏳ 待开始 | - | - |
