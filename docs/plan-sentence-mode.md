# 句子学习模式 — 方案设计

## 概述

在现有单词打字学习模式基础上，新增**句子学习模式**。句子内容按 CEFR 等级组织，以 JSON 文件形式存储在 `src/assets/sentences/` 目录下，与词库的 `src/assets/dicts/` 模式保持一致。

---

## 1. JSON 数据结构

### 句子本 JSON 文件格式

每个 JSON 文件是一个独立的"句子本"，包含元信息和句子数组：

```json
{
  "meta": {
    "id": "daily-a1",
    "label": "日常口语 A1",
    "description": "入门级日常生活短句，涵盖问候、介绍、时间、购物等基础场景",
    "level": "A1",
    "topic": "daily",
    "version": "1.0"
  },
  "sentences": [
    {
      "id": "a1-daily-001",
      "text": "Hello, how are you?",
      "translation": "你好，你怎么样？",
      "tags": ["greeting"]
    }
  ]
}
```

### 字段说明

**meta 层：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 唯一标识，对应 SentenceBookId，如 `"daily-a1"` |
| `label` | `string` | 中文显示名，如 `"日常口语 A1"` |
| `description` | `string` | 一句话描述 |
| `level` | `DifficultyLevel` | CEFR 等级：`A1` / `A2` / `B1` / `B2` / `C1` |
| `topic` | `string` | 主题分类：`daily` / `travel` / `work` / `social` / `academic` / `quote` |
| `version` | `string` | 数据版本号 |

**sentences 数组每条记录：**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | `string` | ✓ | 句子唯一 ID，格式 `{bookId}-{序号}`，如 `"a1-daily-001"` |
| `text` | `string` | ✓ | 英文句子文本 |
| `translation` | `string` | ✓ | 中文翻译 |
| `tags` | `string[]` | | 标签，如 `["greeting", "formal"]` |

### 设计要点

- **最小化冗余**：`wordCount` 由 loader 从 `text` 自动计算，`difficulty` 继承 meta 的 `level`，`source` 统一为 `"builtin"`，不写入 JSON
- **不存时间戳**：`createdAt` / `updatedAt` 由 loader 在加载时统一设为 `0`（静态数据无时间语义）
- **标签可选**：不强制，但鼓励加标签以支持后续的筛选、搜索功能
- **ID 规则**：`{bookId}-{3位序号}`，如 `daily-a1-001`，确保全局唯一

---

## 2. 文件组织

```
src/assets/sentences/          ← 句子本 JSON 存储目录（新建）
├── daily-a1.json              ← 日常口语 A1
├── daily-a2.json              ← 日常口语 A2
├── daily-b1.json              ← 日常口语 B1
├── travel-b1.json             ← 旅行英语 B1
├── work-b2.json               ← 职场英语 B2
└── quotes-b2.json             ← 经典名言 B1-B2

src/lib/
├── word-book-registry.ts      ← 已有：词库注册
├── sentence-book-registry.ts  ← 新建：句子本注册（对标上面）
└── sentence-converter.ts      ← 新建：JSON → Sentence 转换

src/types/
└── domain.ts                  ← Sentence 接口已存在，可能需要微调
```

与现有词库的对照关系：

| 词库 | 句子本 |
|------|--------|
| `src/assets/dicts/CET4_T.json` | `src/assets/sentences/daily-a1.json` |
| `src/lib/word-book-registry.ts` | `src/lib/sentence-book-registry.ts` |
| `src/lib/word-converter.ts` | `src/lib/sentence-converter.ts` |

---

## 3. 类型设计

### 新增类型

```typescript
// src/types/vocabulary.ts（或新文件 src/types/sentence.ts）

/** 句子本标识 — 联合类型，每新增一个本子加一项 */
export type SentenceBookId = 
  | "daily-a1"
  | "daily-a2" 
  | "daily-b1"
  | "travel-b1"
  | "work-b2"
  | "quotes-b2";

/** JSON 文件中的原始句子条目 */
export interface SentenceEntry {
  id: string;
  text: string;
  translation: string;
  tags?: string[];
}

/** JSON 文件中的元信息 */
export interface SentenceBookJSONMeta {
  id: string;
  label: string;
  description: string;
  level: DifficultyLevel;
  topic: string;
  version: string;
}

/** JSON 文件的完整结构 */
export interface SentenceBookJSON {
  meta: SentenceBookJSONMeta;
  sentences: SentenceEntry[];
}
```

`Sentence` 接口（`domain.ts` 中已存在）作为运行时类型，由 loader 从 `SentenceEntry` 转换而来。

### 句子学习模式定义（后续阶段设计）

句子学习模式的打字交互与单词不同——是逐词输入而非逐字母。模式定义留待交互设计阶段细化，初步设想：

```
sentenceWithText       → 显示完整句子和翻译，逐词输入
sentenceWithoutText    → 不显示句子（隐藏），显示翻译，逐词输入
sentenceFullBlind      → 全隐藏，仅凭听力逐词输入
```

---

## 4. 注册表与加载器设计

### sentence-book-registry.ts

完全对标 `word-book-registry.ts` 的模式：

```typescript
import type { Sentence } from "@/types/domain";
import type { SentenceBookId } from "@/types/vocabulary";
import type { SentenceBookJSON } from "@/types/vocabulary";
import { convertToSentence } from "./sentence-converter";

export interface SentenceBookMeta {
  id: SentenceBookId;
  label: string;
  description: string;
  sentenceCount: number;
  level: DifficultyLevel;
  topic: string;
}

export const SENTENCE_BOOK_META: Record<SentenceBookId, SentenceBookMeta> = {
  "daily-a1": {
    id: "daily-a1",
    label: "日常口语 A1",
    description: "入门级日常生活短句",
    sentenceCount: 0,  // 填入后更新
    level: "A1",
    topic: "daily",
  },
  // ...其他句子本
};

export const SENTENCE_BOOK_OPTIONS: SentenceBookMeta[] = 
  Object.values(SENTENCE_BOOK_META);

export async function loadSentenceBook(id: SentenceBookId): Promise<Sentence[]> {
  const module = await import(`@/assets/sentences/${id}.json`);
  const json = module.default as SentenceBookJSON;
  return json.sentences.map((entry) => convertToSentence(entry, json.meta));
}
```

### sentence-converter.ts

```typescript
import type { Sentence } from "@/types/domain";
import type { SentenceEntry, SentenceBookJSONMeta } from "@/types/vocabulary";

export function convertToSentence(
  entry: SentenceEntry,
  meta: SentenceBookJSONMeta
): Sentence {
  return {
    id: entry.id,
    text: entry.text,
    translation: entry.translation,
    difficulty: meta.level,
    source: "builtin",
    tags: entry.tags ?? [],
    wordCount: entry.text.split(/\s+/).length,  // 自动计算
    createdAt: 0,
    updatedAt: 0,
  };
}
```

---

## 5. 首批句子本规划

首批创建 **6 个句子本**，覆盖 A1-B2 四个等级：

| 文件 | ID | 名称 | 等级 | 主题 | 计划句数 | 内容来源 |
|------|-----|------|------|------|----------|----------|
| `daily-a1.json` | `daily-a1` | 日常口语 A1 | A1 | daily | 50 | 种子数据迁移 + Tatoeba 补充 |
| `daily-a2.json` | `daily-a2` | 日常口语 A2 | A2 | daily | 50 | 种子数据迁移 + Tatoeba 补充 |
| `daily-b1.json` | `daily-b1` | 日常口语 B1 | B1 | daily | 50 | 种子数据迁移 + Tatoeba 补充 |
| `travel-b1.json` | `travel-b1` | 旅行英语 B1 | B1 | travel | 40 | Tatoeba 筛选 |
| `work-b2.json` | `work-b2` | 职场英语 B2 | B2 | work | 40 | Tatoeba 筛选 + AI 补充 |
| `quotes-b2.json` | `quotes-b2` | 经典名言 B1-B2 | B1-B2 | quote | 30 | 经典英语名言整理 |

**现有种子数据迁移方案：**

`seed-data/sentences.ts` 中的 50 句按等级拆分到对应的 daily JSON 文件：
- A1 20 句 → `daily-a1.json`
- A2 15 句 → `daily-a2.json`
- B1 15 句 → `daily-b1.json`

剩余数量从 Tatoeba 开源数据集补充。

**总句数**：50（种子迁移）+ 210（新增）= **260 句**作为起点。

### 句子内容质量标准

1. 每句 3-15 词（A1 偏短，B2 可稍长）
2. 中文翻译准确自然
3. 覆盖对应等级的典型语法结构
4. 同一本内避免高度重复的句式
5. tags 至少 1 个，最多 3 个

---

## 6. 实施步骤

### 阶段一：数据层搭建

| 步骤 | 内容 | 产出 |
|------|------|------|
| 1.1 | 新增类型定义 `SentenceBookId`、`SentenceEntry`、`SentenceBookJSONMeta`、`SentenceBookJSON` | `types/vocabulary.ts` 或新建 `types/sentence.ts` |
| 1.2 | 创建 `sentence-converter.ts` | 转换函数 |
| 1.3 | 创建 `sentence-book-registry.ts` | 注册表 + 加载函数 |
| 1.4 | 创建 `src/assets/sentences/` 目录 + 6 个 JSON 文件 | 句子本数据 |
| 1.5 | 将种子数据 50 句迁移到对应 JSON，删除 `seed-data/sentences.ts` | 数据统一 |
| 1.6 | 补充剩余句子至目标数量 | 完整句子本 |

### 阶段二：句子学习交互

| 步骤 | 内容 |
|------|------|
| 2.1 | 设计句子学习 UI 与交互（逐词 vs 逐字母、模式定义） |
| 2.2 | 实现 `SentenceCard` 组件 |
| 2.3 | 实现句子学习 store / session 管理 |
| 2.4 | 句子 FSRS 卡片集成 |
| 2.5 | 句子学习结果页 |

### 阶段三：入口与导航

| 步骤 | 内容 |
|------|------|
| 3.1 | 学习中心增加句子模式入口 |
| 3.2 | 句子本选择页面 |
| 3.3 | 路由与导航 |

> **阶段二、三为后续任务，本次方案聚焦阶段一。**

---

## 7. 设计决策记录

### 为什么每个 CEFR 等级不做成一个文件？

- 文件体积可控（每文件 40-50 句，∼5-10KB）
- 主题分类清晰，用户可按场景选择
- 与词库的"一个 JSON = 一个可选本"模式一致
- 未来新增句子本只需加文件 + 注册一行，不影响已有数据

### 为什么不存 wordCount 到 JSON？

- 可从 `text` 自动计算，属于冗余字段
- 避免人工维护时数据不一致
- loader 中一行 `.split(/\s+/).length` 即可

### 为什么不用数据库存句子？

- 句子本是静态内容（类似词库），不需要用户修改
- JSON 文件支持 Vite 的 tree-shaking 和 code-splitting
- dynamic `import()` 可以按需加载，首页不加载全部句子
- 与现有词库架构一致

---

## 8. 未来扩展

- **更多句子本**：学术英语 C1、雅思口语、商务邮件等
- **用户自定义句子本**：支持导入 CSV/JSON
- **句子与单词关联**：`SentenceEntry` 增加 `linkedWordIds` 字段，将句子与 CET 词库打通
- **句子音频**：TTS 自动生成或真人录音
