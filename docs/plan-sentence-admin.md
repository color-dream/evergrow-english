# 管理端句子内容管理 — 方案设计

## 1. 数据模型分析

### 1.1 句子本 JSON 结构

三层嵌套：`句子本 → 课 → 句子`

```
SentenceBookJSON
├── meta: { id, label, description, level, topic, version, language }
└── lessons: [
    ├── { id, title, description, sentences: [
    │     { id, uuid, text, translation, phonetic?, segments?, order, tags[] }
    │   ]}
    ]
```

### 1.2 词汇 vs 句子管理复杂度对比

| 维度 | 词汇管理 | 句子管理 |
|------|---------|---------|
| 结构 | 平铺数组 | 三层嵌套 |
| 字段数 | 5 个 | 9 个 + segments 嵌套 |
| segments | 无 | 可选语法成分标注 |
| uuid | 无 | 必须，用于音频映射 |
| 编辑粒度 | 单行 | 需要课级/句级两级展开 |
| 排序 | 字母序 | 课内 order 连续递增 |
| 导入导出 | JSON 数组 | JSON 文件（按本） |

## 2. 管理端架构

### 2.1 现有架构模式（对标词汇管理）

```
src/features/dict/
├── pages/DictPage.tsx      ← Table + 搜索 + 筛选 + CRUD
├── components/WordFormModal.tsx ← 新增/编辑表单

src/stores/dict-store.ts    ← Zustand store + REST API
src/types/dict.ts           ← DictWord 类型

src/app/App.tsx             ← 路由注册
src/components/layout/Sidebar.tsx ← 菜单项
src/lib/constants.ts        ← ROUTES
```

### 2.2 句子管理对标新增

```
src/features/sentence/
├── pages/SentencePage.tsx           ← 句子本列表 + 课展开 + 句编辑
├── components/SentenceBookFormModal.tsx ← 新建/编辑句子本
├── components/LessonPanel.tsx       ← 课内句子编辑面板
├── components/SentenceFormModal.tsx ← 新增/编辑单句
├── components/SegmentEditor.tsx     ← segments 语法成分编辑器

src/stores/sentence-admin-store.ts   ← Zustand store + API
src/types/sentence-admin.ts          ← 管理端专用类型
```

## 3. 页面设计

### 3.1 主页面布局

```
┌─────────────────────────────────────────────────────────┐
│ 句子内容管理                                               │
│ 管理 6 个句子本，100 句，支持层级编辑和导入导出     [新建句子本] │
├─────────────────────────────────────────────────────────┤
│ [按等级▼] [按主题▼] [搜索...]          [导入JSON] [导出] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ daily-a1 ─── 日常口语 A1 ─── A1 ─── 3 课 22 句 ───┐ │
│ │ 课: 问候与介绍 (8句) · 日常生活 (8句) · 时间与天气 (6句)│ │
│ │ [展开编辑] [导出JSON] [删除]                          │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ daily-a2 ─── 日常口语 A2 ─── A2 ─── 3 课 15 句 ───┐ │
│ │ 课: 日常生活 (5) · 出行与交通 (5) · 社交与情感 (5)    │ │
│ │ [展开编辑] [导出JSON] [删除]                          │ │
│ └──────────────────────────────────────────────────────┘ │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### 3.2 展开后的课-句编辑视图

```
┌─ daily-a1 ──────────────────────────────────────────────┐
│ 📚 课: 问候与介绍 (8句)              [+添加句子]         │
│                                                         │
│  #1 Hello, how are you?                     [编辑][删除] │
│     翻译: 你好，你怎么样？                                │
│     音标: həˈloʊ haʊ ɑːr juː                           │
│     segments: Hello(叹) how(表) are(系) you(主)    [编辑成分] │
│     tags: greeting, polite                               │
│ ─────────────────────────────────────────────────────── │
│  #2 My name is Sarah.                        [编辑][删除] │
│     翻译: 我的名字是 Sarah。                              │
│     ...                                                 │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ 📚 课: 日常生活 (8句)                  [+添加句子]       │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

## 4. 类型设计

```typescript
// src/types/sentence-admin.ts

import type { DifficultyLevel, SyntaxRole } from "@/types/domain";

// 从 evergrow-english 项目复用的类型
export type { SentenceBookId, SentenceEntry, LessonEntry, SentenceBookJSON } from "@/types/sentence";

// 管理端专用类型
export interface SentenceBookSummary {
  id: string;
  label: string;
  description: string;
  level: DifficultyLevel;
  topic: string;
  lessonCount: number;
  sentenceCount: number;
  version: string;
}

export interface SentenceFormData {
  id: string;           // 可编辑（保持前缀格式）
  uuid: string;         // 自动生成，可手动覆盖
  text: string;
  translation: string;
  phonetic: string;
  order: number;
  tags: string[];
  segments: SegmentFormData[];
}

export interface SegmentFormData {
  text: string;
  role: SyntaxRole;
}

export interface LessonFormData {
  id: string;
  title: string;
  description: string;
  sentences: SentenceFormData[];
}

export interface SentenceBookFormData {
  meta: {
    id: string;
    label: string;
    description: string;
    level: DifficultyLevel;
    topic: string;
    version: string;
    language: string;
  };
  lessons: LessonFormData[];
}
```

## 5. API 设计

对标现有词汇 API 模式 (`/api/words`)：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/sentences` | 获取所有句子本摘要列表 |
| GET | `/api/sentences/:bookId` | 获取单个句子本完整 JSON |
| PUT | `/api/sentences/:bookId` | 保存单个句子本完整 JSON |
| DELETE | `/api/sentences/:bookId` | 删除句子本 |
| POST | `/api/sentences/import` | 导入 JSON 文件（覆盖同名） |
| POST | `/api/sentences/export/:bookId` | 导出到 books/sentences/ |

## 6. Store 设计

```typescript
// src/stores/sentence-admin-store.ts

interface SentenceAdminState {
  books: SentenceBookSummary[];
  currentBook: SentenceBookJSON | null;
  loading: boolean;

  // 列表
  loadBooks: () => Promise<void>;
  // CRUD
  loadBook: (bookId: string) => Promise<SentenceBookJSON>;
  saveBook: (bookId: string, data: SentenceBookJSON) => Promise<void>;
  createBook: (data: SentenceBookJSON) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  // 导入导出
  importBook: (file: File) => Promise<void>;
  exportBook: (bookId: string) => Promise<void>;
}
```

## 7. SegmentEditor 组件

最复杂的部分是语法成分（segments）的编辑。需要：

```
句子: Hello, how are you?
成分: [Hello_______] [how______] [are_____] [you____]
      ↓ 下拉选择 role          ↓          ↓        ↓
      [感叹 ▼]       [表语 ▼]    [系动词▼] [主语 ▼]

预览: Hello(叹) how(表) are(系) you(主)
```

交互方式：
1. 先自动按空格分词，生成初始 segments
2. 用户可拖拽合并/拆分段
3. 每个段用下拉选择角色（SyntaxRole）
4. 实时校验拼接后是否等于原文本

## 8. 实施步骤

### 阶段一：基础 CRUD

| 步骤 | 内容 |
|------|------|
| 1 | 新建 `src/types/sentence-admin.ts` |
| 2 | 新建 `src/stores/sentence-admin-store.ts` |
| 3 | 新建 `src/features/sentence/pages/SentencePage.tsx`（列表 + 展开） |
| 4 | 新建 `src/features/sentence/components/SentenceBookFormModal.tsx` |
| 5 | 新建 `src/features/sentence/components/SentenceFormModal.tsx` |
| 6 | 注册路由 `/sentences`、菜单项 |
| 7 | 后端 API 实现（读写 JSON 文件） |

### 阶段二：Segments 编辑

| 步骤 | 内容 |
|------|------|
| 8 | 新建 `SegmentEditor` 组件 |
| 9 | 句子表单中集成 segments 编辑 |

## 9. 技术要点

- **API 直接操作文件系统**：句子本 JSON 存储在 `evergrow-english/src/assets/sentences/` 下，管理端 API 直接读写该目录
- **uuid 自动生成**：新建句子时自动用 `crypto.randomUUID()`
- **order 自动维护**：新增/删除句时自动重编号保证连续
- **前端校验**：复用 `evergrow-english` 的 `sentence-validator.ts` 逻辑（或共享包）
