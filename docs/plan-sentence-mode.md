# 句子学习模式 — 方案设计

## 概述

在现有单词打字学习模式基础上，新增**句子学习模式**。句子内容以 JSON 文件形式存储在 `src/assets/sentences/` 目录下，按"句子本 → 课 → 句"三层结构组织，与词库的 `src/assets/dicts/` 模式保持一致。

**参考项目**：[Earthworm（蚯蚓英语）](https://github.com/cuixueshe/earthworm)（10.8k ⭐）— 通过"连词构句法"学习英语，其数据模型、JSON 存储方案、数据管道设计均有重要借鉴价值。

---

## 目录

1. [JSON 数据结构](#1-json-数据结构)
2. [类型设计](#2-类型设计)
3. [文件组织](#3-文件组织)
4. [注册表与加载器](#4-注册表与加载器)
5. [内容质量标准](#5-内容质量标准)
6. [句子发音方案](#6-句子发音方案)
7. [首批句子本规划](#7-首批句子本规划)
8. [数据工具链](#8-数据工具链)
9. [进度追踪设计](#9-进度追踪设计)
10. [实施步骤](#10-实施步骤)
11. [设计决策记录](#11-设计决策记录)
12. [未来扩展](#12-未来扩展)

---

## 1. JSON 数据结构

### 1.1 核心设计思路（借鉴 Earthworm）

Earthworm 的核心创新是**连词构句法**：JSON 文件中不存一条条完整句子，而是存**逐步递增的词组链**，用户通过逐块拼接来构建完整句子。

> 示例 — Earthworm `01.json` 中的数据流：
> ```
> "I" → "I like" → "I like the food" → "I don't like the food" → "I don't like to do it now"
> ```
> 每个 statement 是教学过程中的一个"步骤"，从单词到短语到完整句逐步构建。

**本项目采用的折中方案**：
- 句子本中的句子是**完整句子**（适配打字学习模式，非字块拼接）
- 但引入 **`order` 字段**控制句子出现顺序，支持"渐进式难度"——同一课内短句在前、长句在后
- 每条句子携带 **`phonetic`（音标）**，为后续听写/朗读模式铺路（Earthworm 的 `soundmark` 每句必有）
- 每条句子标注 **`segments`（语法成分切分）**，将句子按主语/谓语/宾语/定语/状语等语法成分逐段标注——用户在打字学习的同时理解每个词在句中扮演什么角色
- 引入 **`lesson` 中间层**，对标 Earthworm 的 `course_pack → course → statement` 三层模型

### 1.2 句子本 JSON 文件格式（v2）

```jsonc
{
  "meta": {
    "id": "daily-a1",                            // SentenceBookId，文件命名的依据
    "label": "日常口语 A1",                       // 中文显示名
    "description": "入门级日常生活短句，涵盖问候、介绍、时间、购物等基础场景",
    "level": "A1",                                // CEFR 等级（句子继承此值）
    "topic": "daily",                             // 主题：daily / travel / work / social / academic / quote
    "version": "2.0",                             // 数据格式版本号（v1 无 phonetic/lessons）
    "language": "en-US"                           // 语音区域（决定 TTS 发音）
  },
  "lessons": [                                    // 👈 新增：课层（Earthworm 的 course）
    {
      "id": "greetings",                          // 课 ID（本子内唯一）
      "title": "问候与介绍",
      "description": "基本的问候语和自我介绍的句子",
      "sentences": [
        {
          "id": "greetings-001",                  // 全局唯一 ID：{lessonId}-{3位序号}
          "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890ab",  // 👈 新增：稳定 UUID，对应音频文件
          "text": "Hello, how are you?",
          "translation": "你好，你怎么样？",
          "phonetic": "həˈloʊ haʊ ɑːr juː",      // 👈 新增：音标（Earthworm 启发）
          "order": 1,                              // 👈 新增：课内排序
          "segments": [                            // 👈 新增：语法成分切分
            { "text": "Hello", "role": "interjection" },
            { "text": "how", "role": "predicative" },
            { "text": "are", "role": "linking-verb" },
            { "text": "you", "role": "subject" }
          ],
          "tags": ["greeting", "polite"]
        },
        {
          "id": "greetings-002",
          "uuid": "b2c3d4e5-f6a7-8901-bcde-f12345678901bc",
          "text": "Nice to meet you.",
          "translation": "很高兴认识你。",
          "phonetic": "naɪs tuː miːt juː",
          "order": 2,
          "segments": [
            { "text": "Nice", "role": "predicative" },
            { "text": "to meet", "role": "subject" },
            { "text": "you", "role": "object" }
          ],
          "tags": ["greeting"]
        }
      ]
    },
    {
      "id": "time",                                // 课 ID（本子内唯一）
      "title": "时间表达",
      "description": "询问和表达时间的常用句式",
      "sentences": [
        {
          "id": "time-001",
          "uuid": "c3d4e5f6-a7b8-9012-cdef-23456789012c",
          "text": "What time is it?",
          "translation": "现在几点了？",
          "phonetic": "wɑːt taɪm ɪz ɪt",
          "order": 1,
          "segments": [
            { "text": "What time", "role": "predicative" },
            { "text": "is", "role": "linking-verb" },
            { "text": "it", "role": "subject" }
          ],
          "tags": ["time", "question"]
        },
        {
          "id": "time-002",
          "uuid": "d4e5f6a7-b8c9-0123-defa-34567890123d",
          "text": "It is half past three in the afternoon.",
          "translation": "现在是下午三点半。",
          "phonetic": "ɪts hæf pæst θriː ɪn ðə æftərˈnuːn",
          "order": 2,
          "segments": [
            { "text": "It", "role": "subject" },
            { "text": "is", "role": "linking-verb" },
            { "text": "half past three", "role": "predicative" },
            { "text": "in the afternoon", "role": "adverbial" }
          ],
          "tags": ["time", "statement"]
        },
        {
          "id": "time-003",
          "uuid": "e5f6a7b8-c9d0-1234-efab-45678901234e",
          "text": "She gave me a beautiful gift yesterday.",
          "translation": "她昨天送了我一份漂亮的礼物。",
          "phonetic": "ʃiː ɡeɪv miː ə ˈbjuːtəfəl ɡɪft ˈjɛstərdeɪ",
          "order": 3,
          "segments": [
            { "text": "She", "role": "subject" },
            { "text": "gave", "role": "predicate" },
            { "text": "me", "role": "indirect-object" },
            { "text": "a beautiful gift", "role": "direct-object" },
            { "text": "yesterday", "role": "adverbial" }
          ],
          "tags": ["daily-life", "past-tense"]
        }
      ]
    }
  ]
}
```

### 1.3 字段说明

**meta 层：**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | `string` | ✓ | 唯一标识，对应 `SentenceBookId`，如 `"daily-a1"` |
| `label` | `string` | ✓ | 中文显示名 |
| `description` | `string` | ✓ | 一句话描述 |
| `level` | `DifficultyLevel` | ✓ | CEFR 等级：`A1` / `A2` / `B1` / `B2` / `C1` / `C2` |
| `topic` | `string` | ✓ | 主题分类：`daily` / `travel` / `work` / `social` / `academic` / `quote` |
| `version` | `string` | ✓ | 数据格式版本号 |
| `language` | `string` | | 语音区域，默认 `"en-US"` |

**lesson 层（中间层，对标 Earthworm 的 course）：**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | `string` | ✓ | 课 ID，本子内唯一 |
| `title` | `string` | ✓ | 中文课名，如 `"问候与介绍"` |
| `description` | `string` | | 课描述 |
| `sentences` | `SentenceEntry[]` | ✓ | 本课包含的句子 |

**sentence 条目（对标 Earthworm 的 statement）：**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | `string` | ✓ | 人类可读 ID：`{lessonId}-{3位序号}`，如 `"greetings-001"` |
| `uuid` | `string` | ✓ | 👈 新增：稳定的 v4 UUID，对应音频文件 `{uuid}.mp3` |
| `text` | `string` | ✓ | 英文句子文本 |
| `translation` | `string` | ✓ | 中文翻译 |
| `phonetic` | `string` | | 音标（整句），支持 IPA 格式 |
| `segments` | `SyntaxSegment[]` | | 👈 新增：语法成分切分，标注句子每个词组充当的语法角色 |
| `order` | `number` | ✓ | 课内排序号，从 1 开始 |
| `tags` | `string[]` | | 标签，如 `["greeting", "polite"]` |

### 1.4 语法成分切分（segments）

将句子按**语法成分**切分成连续词组段，标注每个段充当什么语法角色。这是中文英语教学中"划分句子成分"的数字化版本。

#### 语法成分角色（SyntaxRole）

| 枚举值 | 中文名 | 英文含义 | 示例段 |
|--------|--------|----------|--------|
| `subject` | 主语 | Subject — 动作发出者或被描述对象 | *She*, *The cat*, *It* |
| `predicate` | 谓语 | Predicate Verb — 动作（实义动词） | *runs*, *gave*, *bought* |
| `linking-verb` | 系动词 | Linking Verb — 连接主语和表语 | *is*, *am*, *are*, *looks*, *seems* |
| `object` | 宾语 | Object — 动作承受者 | *a book*, *him*, *the food* |
| `indirect-object` | 间接宾语 | Indirect Object — "给谁/为谁" | *me*（in *gave me a book*） |
| `direct-object` | 直接宾语 | Direct Object — "给了什么" | *a book*（in *gave me a book*） |
| `predicative` | 表语 | Predicative / Subject Complement — 系动词后的成分 | *happy*, *a teacher*, *on the desk* |
| `object-complement` | 宾补 | Object Complement — 补充说明宾语 | *captain*（in *made him captain*） |
| `attributive` | 定语 | Attributive — 修饰名词 | *beautiful*, *in the room*（修饰名词时） |
| `adverbial` | 状语 | Adverbial — 修饰动词/句子，表时间/地点/方式等 | *yesterday*, *in the park*, *slowly* |
| `conjunction` | 连词 | Conjunction — 连接词 | *and*, *but*, *because*, *that* |
| `interjection` | 感叹/呼语 | Interjection — 感叹词或呼唤 | *Hello*, *Oh*, *Wow* |

#### 切分示例

```
句子：The cat is on the table.
      ┌──────┬──┬───────────┐
      │ 主语  │系动│   表语     │
      └──────┴──┴───────────┘

句子：She gave me a beautiful gift yesterday.
      ┌──┬────┬──┬────────────────┬─────────┐
      │主语│谓语│间宾│    直宾（含定语）  │  状语   │
      └──┴────┴──┴────────────────┴─────────┘
```

#### 切分原则

- **按语法角色切分，而非按单词切分**：`"a beautiful gift"` 整体作为直接宾语（直宾），不做更细的切分；但 `"beautiful"` 如果单独分析也可标 `attributive`，取决于数据制作者的精细度偏好
- **segments 中各组段按原文顺序排列**，拼接后等于 `text`
- **每个段标一个 role**，不标嵌套关系（简化模型）
- **可选字段**：不填表示不标注成分，不影响学习功能；但标注后可支撑 UI 上的语法高亮展示
- **成分角色标注的是句子成分**（主语/谓语/宾语…），而非词性（名词/动词/形容词…）

### 1.5 设计要点

- **最小化冗余**：`wordCount` 由 loader 从 `text` 自动计算（`split(/\s+/)`），`difficulty` 继承 meta 的 `level`，`source` 统一为 `"builtin"`，不写入 JSON
- **不存时间戳**：`createdAt` / `updatedAt` 由 loader 在加载时统一设为 `0`（静态数据无时间语义）
- **phonetic 可选**：优先填，但 A1 简易句可不填；音标格式统一用 IPA
- **segments 可选但鼓励填写**：标注句子每个词组的语法成分（主语/谓语/宾语…），支撑语法高亮展示和成分分析学习；详见 §1.4
- **order 必须连续**：同一 lesson 内 order 从 1 递增，不可跳号；loader 加载时按 order 排序
- **ID 人类可读**：格式 `{lessonId}-{3位序号}`，方便数据制作时快速定位；跨本不重复
- **UUID 机器索引**：v4 UUID 作为音频文件的稳定引用键，不受句子重排序、ID 变更的影响
- **lessons 内句子扁平化**：虽然按课组织，但 loader 输出扁平 `Sentence[]`，`lessonId` 和 `lessonTitle` 透传至 `Sentence` 类型

---

## 2. 类型设计

### 2.1 新增类型（追加到 `src/types/vocabulary.ts` 或独立文件 `src/types/sentence.ts`）

```typescript
// ===== 句子本标识 =====
/** 句子本标识 — 联合类型，每新增一个本子加一项 */
export type SentenceBookId =
  | "daily-a1"
  | "daily-a2"
  | "daily-b1"
  | "travel-b1"
  | "work-b2"
  | "quotes-b2";

// ===== 语法成分 =====
/** 语法成分角色 — 用于标注句子中每个词组充当什么成分 */
export type SyntaxRole =
  | "subject"           // 主语
  | "predicate"         // 谓语（实义动词）
  | "linking-verb"      // 系动词（be/look/seem…）
  | "object"            // 宾语
  | "indirect-object"   // 间接宾语
  | "direct-object"     // 直接宾语
  | "predicative"       // 表语（系动词后的成分）
  | "object-complement" // 宾语补足语
  | "attributive"       // 定语
  | "adverbial"         // 状语
  | "conjunction"       // 连词
  | "interjection";     // 感叹/呼语

/** 语法成分角色的中文名称 */
export const SYNTAX_ROLE_LABELS: Record<SyntaxRole, string> = {
  subject: "主语",
  predicate: "谓语",
  "linking-verb": "系动词",
  object: "宾语",
  "indirect-object": "间宾",
  "direct-object": "直宾",
  predicative: "表语",
  "object-complement": "宾补",
  attributive: "定语",
  adverbial: "状语",
  conjunction: "连词",
  interjection: "感叹",
};

/** 单个语法成分段 */
export interface SyntaxSegment {
  text: string;         // 该成分的原文文本（一个或多个词）
  role: SyntaxRole;     // 该成分的语法角色
}

// ===== JSON 源数据 =====
/** JSON 文件中的单条句子 */
export interface SentenceEntry {
  id: string;
  uuid: string;                    // 👈 新增：稳定 UUID，对应音频文件
  text: string;
  translation: string;
  phonetic?: string;              // 音标（整句），IPA 格式
  segments?: SyntaxSegment[];     // 语法成分切分
  order: number;                  // 课内排序号
  tags?: string[];
}

/** JSON 文件中的 lesson */
export interface LessonEntry {
  id: string;
  title: string;
  description?: string;
  sentences: SentenceEntry[];
}

/** JSON 文件的完整元信息 */
export interface SentenceBookMeta {
  id: string;
  label: string;
  description: string;
  level: DifficultyLevel;
  topic: string;
  version: string;
  language?: string;
}

/** JSON 文件的完整结构 */
export interface SentenceBookJSON {
  meta: SentenceBookMeta;
  lessons: LessonEntry[];    // 👈 从 sentences[] 改为 lessons[]
}

// ===== 句子学习模式（后续阶段定义）=====
/**
 * 句子学习模式与单词的 4 种渐进式隐藏不同：
 * - 句子打字是"逐词输入"而非"逐字母输入"
 * - 模式定义留待交互设计阶段细化
 *
 * 初步设想（参考单词的 WORD_LEARN_MODE_SEQUENCE）：
 * - sentenceWithText         → 显示完整句子和翻译，逐词输入
 * - sentenceWithoutText      → 隐藏句子，显示翻译，逐词输入
 * - sentenceFullBlind        → 全隐藏，仅凭听力逐词输入
 */
export type SentenceLearnMode =
  | "sentenceWithText"
  | "sentenceWithoutText"
  | "sentenceFullBlind";

export const SENTENCE_LEARN_MODE_SEQUENCE: SentenceLearnMode[] = [
  "sentenceWithText",
  "sentenceWithoutText",
  "sentenceFullBlind",
];

export const SENTENCE_LEARN_MODE_LABELS: Record<SentenceLearnMode, string> = {
  sentenceWithText: "显示句子",
  sentenceWithoutText: "隐藏句子",
  sentenceFullBlind: "全隐藏（听写）",
};
```

### 2.2 domain.ts 中的 Sentence 类型更新

```typescript
// src/types/domain.ts — Sentence 接口更新
export interface Sentence {
  id: string;
  uuid: string;                                  // 👈 新增：稳定 UUID
  text: string;
  translation: string;
  phonetic?: string;                             // 音标
  segments?: SyntaxSegment[];                    // 语法成分切分
  audioUrl?: string;                             // loader 自动构造
  audioDuration?: number;
  difficulty: DifficultyLevel;
  source: "builtin" | "article" | "ai-generated" | "user-imported";
  tags: string[];
  wordCount: number;
  order: number;                              // 课内序号
  lessonId: string;                           // 所属课 ID
  lessonTitle: string;                        // 所属课名称
  bookId: string;                             // 所属句子本 ID
  createdAt: number;
  updatedAt: number;
}
```

---

## 3. 文件组织

```
src/assets/sentences/              ← 句子本 JSON 存储目录（新建）
├── daily-a1.json                  ← 日常口语 A1（2-3 课，40 句）
├── daily-a2.json                  ← 日常口语 A2（2-3 课，40 句）
├── daily-b1.json                  ← 日常口语 B1（2-3 课，40 句）
├── travel-b1.json                 ← 旅行英语 B1（2-3 课，30 句）
├── work-b2.json                   ← 职场英语 B2（2-3 课，30 句）
└── quotes-b2.json                 ← 经典名言 B2（1-2 课，20 句）

src/lib/
├── sentence-book-registry.ts      ← 新建：句子本注册（对标 word-book-registry.ts）
├── sentence-converter.ts          ← 新建：JSON → Sentence 转换（对标 word-converter.ts）
└── sentence-validator.ts          ← 新建：JSON 数据校验脚本（参考 Earthworm seed.ts）

scripts/                            ← 👈 新增：数据工具脚本目录
├── validate-sentences.ts           ← 校验所有句子本 JSON 的格式和完整性
├── stats-sentences.ts              ← 统计句子本数据（句数、等级分布、覆盖率）
└── migrate-sentences-v1-to-v2.ts   ← 一次性脚本：将 v1 格式（扁平 sentences）迁移到 v2（lessons 结构）
```

与现有词库的对照关系：

| 词库 | 句子本 |
|------|--------|
| `src/assets/dicts/CET4_T.json` | `src/assets/sentences/daily-a1.json` |
| `src/lib/word-book-registry.ts` | `src/lib/sentence-book-registry.ts` |
| `src/lib/word-converter.ts` | `src/lib/sentence-converter.ts` |
| — | `src/lib/sentence-validator.ts` |
| — | `scripts/` 目录（新增） |

---

## 4. 注册表与加载器

### 4.1 sentence-book-registry.ts

完全对标 `word-book-registry.ts` 的模式：

```typescript
import type { Sentence } from "@/types/domain";
import type { DifficultyLevel } from "@/types/domain";
import type { SentenceBookId } from "@/types/vocabulary";
import type { SentenceBookJSON } from "@/types/vocabulary";
import { convertToSentence } from "./sentence-converter";

export interface SentenceBookInfo {
  id: SentenceBookId;
  label: string;
  description: string;
  sentenceCount: number;
  lessonCount: number;
  level: DifficultyLevel;
  topic: string;
}

export const SENTENCE_BOOK_META: Record<SentenceBookId, SentenceBookInfo> = {
  "daily-a1": {
    id: "daily-a1",
    label: "日常口语 A1",
    description: "入门级日常生活短句，涵盖问候、介绍、时间、购物等基础场景",
    sentenceCount: 40,
    lessonCount: 3,
    level: "A1",
    topic: "daily",
  },
  "daily-a2": {
    id: "daily-a2",
    label: "日常口语 A2",
    description: "基础日常场景对话，涵盖问路、点餐、天气、计划等话题",
    sentenceCount: 40,
    lessonCount: 3,
    level: "A2",
    topic: "daily",
  },
  "daily-b1": {
    id: "daily-b1",
    label: "日常口语 B1",
    description: "中级日常对话，涵盖情感表达、观点陈述、建议请求等场景",
    sentenceCount: 40,
    lessonCount: 3,
    level: "B1",
    topic: "daily",
  },
  "travel-b1": {
    id: "travel-b1",
    label: "旅行英语 B1",
    description: "旅行场景常用句，涵盖机场、酒店、餐厅、问路等",
    sentenceCount: 30,
    lessonCount: 3,
    level: "B1",
    topic: "travel",
  },
  "work-b2": {
    id: "work-b2",
    label: "职场英语 B2",
    description: "职场常用表达，涵盖会议、邮件、汇报、协商等场景",
    sentenceCount: 30,
    lessonCount: 3,
    level: "B2",
    topic: "work",
  },
  "quotes-b2": {
    id: "quotes-b2",
    label: "经典名言 B2",
    description: "经典英语名言警句，提升语感和文化理解",
    sentenceCount: 20,
    lessonCount: 2,
    level: "B2",
    topic: "quote",
  },
};

export const SENTENCE_BOOK_OPTIONS: SentenceBookInfo[] =
  Object.values(SENTENCE_BOOK_META);

/** 动态 import JSON → 转换为 Sentence[] */
export async function loadSentenceBook(id: SentenceBookId): Promise<Sentence[]> {
  const module = await import(`@/assets/sentences/${id}.json`);
  const json = module.default as SentenceBookJSON;
  const sentences: Sentence[] = [];

  for (const lesson of json.lessons) {
    for (const entry of lesson.sentences) {
      sentences.push(convertToSentence(entry, json.meta, lesson));
    }
  }

  // 按 lesson.order + sentence.order 排序
  sentences.sort((a, b) => {
    if (a.lessonId !== b.lessonId) {
      // 按 lesson 在 json.lessons 中的出现顺序
      const aIdx = json.lessons.findIndex((l) => l.id === a.lessonId);
      const bIdx = json.lessons.findIndex((l) => l.id === b.lessonId);
      return aIdx - bIdx;
    }
    return a.order - b.order;
  });

  return sentences;
}
```

### 4.2 sentence-converter.ts

```typescript
import type { Sentence } from "@/types/domain";
import type {
  SentenceEntry,
  SentenceBookMeta,    // JSON 源数据的 meta 接口
  LessonEntry,
} from "@/types/vocabulary";

export function convertToSentence(
  entry: SentenceEntry,
  meta: SentenceBookMeta,   // 来自 JSON 的元信息
  lesson: LessonEntry,
): Sentence {
  return {
    id: entry.id,
    uuid: entry.uuid,                                // 👈 新增
    text: entry.text,
    translation: entry.translation,
    phonetic: entry.phonetic,                        // 音标
    segments: entry.segments,                        // 语法成分切分
    audioUrl: `${BASE_PATH}audio/sentences/${entry.uuid}.mp3`,  // 👈 新增：自动构造
    difficulty: meta.level,
    source: "builtin",
    tags: entry.tags ?? [],
    wordCount: entry.text.split(/\s+/).length,       // 自动计算
    order: entry.order,                              // 课内序号
    lessonId: lesson.id,                             // 所属课 ID
    lessonTitle: lesson.title,                       // 所属课名称
    bookId: meta.id,                                 // 所属句子本 ID
    createdAt: 0,
    updatedAt: 0,
  };
}
```

### 4.3 sentence-validator.ts（新建）

参考 Earthworm `seed.ts` 中数据校验的思路，提供一个校验工具：

```typescript
import type { SentenceBookJSON, SentenceEntry } from "@/types/vocabulary";

export interface ValidationError {
  file: string;
  lessonId?: string;
  sentenceId?: string;
  field: string;
  message: string;
}

export function validateSentenceBook(json: SentenceBookJSON, fileName: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // meta 校验
  if (!json.meta?.id) errors.push({ file: fileName, field: "meta.id", message: "缺少 meta.id" });
  if (!json.meta?.label) errors.push({ file: fileName, field: "meta.label", message: "缺少 meta.label" });

  // lessons 校验
  if (!json.lessons?.length) {
    errors.push({ file: fileName, field: "lessons", message: "lessons 数组为空" });
    return errors;
  }

  const seenIds = new Set<string>();
  for (const lesson of json.lessons) {
    if (!lesson.id) errors.push({ file: fileName, field: "lesson.id", message: "缺少 lesson.id" });
    if (!lesson.title) errors.push({ file: fileName, lessonId: lesson.id, field: "lesson.title", message: "缺少 lesson.title" });

    let expectedOrder = 1;
    for (const s of lesson.sentences) {
      // ID 唯一性
      if (seenIds.has(s.id)) {
        errors.push({ file: fileName, lessonId: lesson.id, sentenceId: s.id, field: "id", message: `ID 重复: ${s.id}` });
      }
      seenIds.add(s.id);

      // 必填字段
      if (!s.uuid) errors.push({ file: fileName, lessonId: lesson.id, sentenceId: s.id, field: "uuid", message: "缺少 uuid" });
      if (!s.text) errors.push({ file: fileName, lessonId: lesson.id, sentenceId: s.id, field: "text", message: "缺少 text" });
      if (!s.translation) errors.push({ file: fileName, lessonId: lesson.id, sentenceId: s.id, field: "translation", message: "缺少 translation" });

      // segments 校验
      if (s.segments) {
        const VALID_ROLES = ["subject", "predicate", "linking-verb", "object", "indirect-object", "direct-object", "predicative", "object-complement", "attributive", "adverbial", "conjunction", "interjection"];
        // 拼接 segments.text 应等于 s.text（忽略空格差异）
        const joined = s.segments.map((seg) => seg.text).join(" ");
        const normalizedJoined = joined.replace(/\s+/g, " ").trim();
        const normalizedText = s.text.replace(/\s+/g, " ").trim();
        if (normalizedJoined !== normalizedText) {
          errors.push({ file: fileName, lessonId: lesson.id, sentenceId: s.id, field: "segments", message: `segments 拼接结果 "${joined}" 与 text 不匹配` });
        }
        for (const seg of s.segments) {
          if (!seg.text) errors.push({ file: fileName, lessonId: lesson.id, sentenceId: s.id, field: "segments[].text", message: "segment.text 为空" });
          if (!VALID_ROLES.includes(seg.role)) {
            errors.push({ file: fileName, lessonId: lesson.id, sentenceId: s.id, field: "segments[].role", message: `无效的 role 值: ${seg.role}` });
          }
        }
      }

      // order 连续性
      if (s.order !== expectedOrder) {
        errors.push({ file: fileName, lessonId: lesson.id, sentenceId: s.id, field: "order", message: `order 不连续，期望 ${expectedOrder}，实际 ${s.order}` });
      }
      expectedOrder++;
    }
  }

  return errors;
}
```

---

## 5. 内容质量标准

参考 Earthworm 的课程内容组织原则，制定以下标准：

### 5.1 句子选择

| 维度 | A1 | A2 | B1 | B2 |
|------|-----|-----|-----|-----|
| 词数范围 | 3-8 词 | 5-12 词 | 8-20 词 | 12-30 词 |
| 时态复杂度 | 一般现在时为主 | 现在/过去/将来 | 完成时 + 被动 | 虚拟语气 + 倒装 |
| 句型复杂度 | 简单句 | 并列句 | 复合句（1-2 从句） | 多重复合句 |
| 词汇范围 | 基础 500 词 | 基础 1500 词 | 常用 3000 词 | 常用 5000 词 |

### 5.2 翻译要求

- 中文翻译准确自然，避免机翻感
- 保留原文的语气（疑问、感叹、委婉等）
- 习语和固定搭配采用地道中文对应

### 5.3 音标要求

- 使用 **IPA 国际音标**（美式发音优先）
- 整句标注，词间用空格分隔
- 弱读、连读可用括号标注，如 `"wɑːt taɪm ɪz ɪt"`
- A1/A2 等级优先填全音标，B2+ 可选填

### 5.4 语法成分切分规范

- **按词组切分，不按单词切分**：`"a beautiful gift"` 是一个直接宾语段，不需要拆成 `"a"` / `"beautiful"` / `"gift"` 三个段
- **segments 拼接后等于原文**：各段 `text` 按顺序拼接（空格分隔）后应与 `sentence.text` 一致，这是校验的基本规则
- **同一个词/词组可能在不同句子中标不同的角色**：`"in the room"` 在 *The cat is in the room.* 中是表语，在 *I saw the cat in the room.* 中是状语——取决于它在特定句子中的语法功能
- **简单句优先标注**：A1/A2 句子结构简单，成分边界清晰，应优先填写 segments
- **复合句建议标注**：含从句的句子可标注主句成分，从句内部标注举例说明即可——不要求穷尽所有嵌套层级
- **不明确时留空**：如果某句成分分析有争议或过于复杂，`segments` 可省略，不强制

### 5.5 标签规范

- 每句至少 1 个、最多 3 个标签
- 标签用小写英文，无空格（多词用连字符），如 `"daily-life"`
- 语义标签优先于结构标签（`"greeting"` > `"simple-sentence"`）

### 5.6 Lesson 划分原则

- 每课 5-15 句，太少失去分组意义，太多用户疲劳
- 按场景/话题/语法点聚合，而非随机堆砌
- 课内句子按长度和复杂度递增排序（`order` 从小到大）

---

## 6. 句子发音方案

### 6.1 总览：UUID → 本地音频文件

核心思路：每句分配一个**稳定的 UUID**，用 TTS 工具**预生成** MP3 音频文件存入 `public/` 目录，运行时通过 UUID 直接加载本地音频——不需要任何运行时 TTS 依赖。

```
┌──────────────────────────────────────────────────┐
│                  数据流                           │
│                                                   │
│  JSON                         public/audio/       │
│  ┌─────────────────────┐     ┌──────────────┐    │
│  │ "uuid": "a1b2-..."  │────→│ a1b2-....mp3 │    │
│  │ "text": "Hello..."  │     │ b2c3-....mp3 │    │
│  └─────────────────────┘     │ d3e4-....mp3 │    │
│         │                    └──────┬───────┘    │
│         │  loader 构造 URL          │             │
│         └──────────────→ audioUrl ─┘             │
│                                                   │
│  运行时：new Audio(sentence.audioUrl).play()      │
│  降级：  Web Speech API → 展示 phonetic 音标      │
└──────────────────────────────────────────────────┘
```

### 6.2 参考项目对比

| 维度 | Earthworm | 本方案 |
|------|-----------|--------|
| 音频来源 | 有道 API 运行时生成 | **TTS 预生成 → 本地静态文件** |
| 网络依赖 | 每次播放需网络 | 首次下载后零网络 |
| 音质 | 逐词拼接，无语调 | 取决于 TTS 引擎（推荐 Edge 神经语音） |
| 离线可用 | ❌ | ✅ |
| 首屏加载 | 无（按需请求） | 无（按需加载单个 MP3，~10-50KB/句） |
| 音标兜底 | `soundmark` 展示 | `phonetic` 展示 |

### 6.3 UUID 设计

```typescript
// 每句一个稳定的 v4 UUID，JSON 中作为主键的一部分
// 格式：标准的 36 字符 UUID，如 "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// 生成方式（数据制作时）：
import { v4 as uuidv4 } from "uuid";  // 或 crypto.randomUUID()
const sentenceUuid = crypto.randomUUID();
```

**UUID 的作用**：
- 文件名：`{uuid}.mp3`，与句子一一对应
- 跨文件唯一：不同句子本的句子 UUID 绝不重复
- 稳定不变：句子文本修改后 UUID 不变，只需重新生成对应音频文件覆盖旧文件
- 替代 `{lessonId}-{序号}` 作为**全局唯一引用键**（`sentence.id` 仍然保留为人类可读 ID）

### 6.4 文件组织

```
public/audio/sentences/          ← 预生成音频文件目录（.gitignore 或 Git LFS）
├── a1b2c3d4-e5f6-7890-abcd-ef1234567890ab.mp3
├── b2c3d4e5-f6a7-8901-bcde-f12345678901bc.mp3
└── ...

scripts/
└── generate-sentence-audio.ts   ← TTS 预生成脚本（新增）

src/assets/sentences/
├── daily-a1.json                ← JSON 中 sentence 条目新增 "uuid" 字段
└── ...
```

### 6.5 JSON 数据变更

每条句子新增 `uuid` 字段：

```jsonc
{
  "id": "greetings-001",
  "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890ab",  // 👈 新增
  "text": "Hello, how are you?",
  "translation": "你好，你怎么样？",
  "phonetic": "həˈloʊ haʊ ɑːr juː",
  "order": 1,
  "segments": [ ... ],
  "tags": ["greeting", "polite"]
}
```

### 6.6 类型变更

```typescript
// SentenceEntry（JSON 源数据）
export interface SentenceEntry {
  id: string;
  uuid: string;              // 👈 新增：稳定的 v4 UUID
  // ...其他字段不变
}

// Sentence（运行时）
export interface Sentence {
  id: string;
  uuid: string;              // 👈 新增
  audioUrl?: string;         // loader 自动构造，不写入 JSON
  // ...其他字段不变
}
```

### 6.7 Loader 构造 audioUrl

```typescript
// sentence-converter.ts

import { BASE_PATH } from "@/lib/constants";

export function convertToSentence(entry, meta, lesson): Sentence {
  return {
    // ...
    uuid: entry.uuid,
    audioUrl: `${BASE_PATH}audio/sentences/${entry.uuid}.mp3`,
    // audioUrl 示例："/audio/sentences/a1b2c3d4-e5f6-7890-abcd-ef1234567890ab.mp3"
    // 或带 basePath："/evergrow-english/audio/sentences/a1b2c3d4-....mp3"
  };
}
```

### 6.8 运行时播放策略

```
加载句子 → sentence.audioUrl 可用
              │
              ├─ Audio 元素加载 .mp3 → 成功 ✅ 播放
              │
              └─ 加载失败（文件不存在/网络错误）
                    │
                    ├─ Web Speech API → 成功 ✅ 播放
                    │
                    └─ 失败 → 展示 phonetic 音标文字
```

- **主路径**：本地 MP3 文件（预生成的 TTS 音频，音质最佳）
- **降级 1**：浏览器 `SpeechSynthesis`（无需网络，有自然语调）
- **降级 2**：展示 IPA 音标文字，用户自行朗读

```typescript
// src/services/audio/sentence-audio.ts（新建）

export class SentenceAudioService implements IAudioService {
  async speak(sentence: Sentence, options?: SpeakOptions): Promise<void> {
    // 1. 尝试本地 MP3
    try {
      await this.playAudioFile(sentence.audioUrl);
      return;
    } catch {
      // 音频文件不存在或加载失败
    }

    // 2. 降级到 Web Speech API
    try {
      await this.playWebSpeech(sentence.text, options);
      return;
    } catch {
      // 浏览器不支持
    }

    // 3. 最终降级：不做任何事，UI 层检测失败后展示 phonetic
  }
}
```

### 6.9 TTS 预生成脚本

```bash
# 首次生成全部音频
bun run scripts/generate-sentence-audio.ts

# 只生成缺失音频的句子
bun run scripts/generate-sentence-audio.ts --missing-only

# 指定句子本
bun run scripts/generate-sentence-audio.ts --book daily-a1
```

脚本流程：

```
1. 遍历 src/assets/sentences/*.json
2. 提取所有 sentence 的 uuid + text
3. 检查 public/audio/sentences/{uuid}.mp3 是否已存在
4. 对缺失的句子，调用 TTS 引擎生成 MP3
5. 写入 public/audio/sentences/{uuid}.mp3
```

**推荐的 TTS 引擎**：

| 引擎 | 费用 | 音质 | 部署 |
|------|------|------|------|
| **Edge TTS**（推荐） | 免费 | ⭐⭐⭐⭐ 神经语音 | `edge-tts` Python 包，CLI 一行命令 |
| Azure Speech | 按量付费 | ⭐⭐⭐⭐⭐ | SDK，需 Azure 账号 |
| OpenAI TTS | 按量付费 | ⭐⭐⭐⭐⭐ | API，需 API Key |

**Edge TTS 示例**（Python CLI）：
```bash
edge-tts --text "Hello, how are you?" \
         --voice en-US-AriaNeural \
         --write-media public/audio/sentences/a1b2c3d4.mp3
```

脚本可在 Node.js 中通过 `execSync` 调用，或直接写 Python 脚本放在 `scripts/` 下。

### 6.10 句子播放交互设计

| 场景 | 行为 |
|------|------|
| 进入新句子 | 自动播放一遍完整朗读（`autoPlay` 可由用户关闭） |
| 打字中途 | 用户按键触发重播（空格键 / 专用按钮） |
| 听写模式 | 隐藏句子文本，仅播放音频，用户凭听力逐词输入 |
| 逐词模式 | 每输入完一个词，可选播放该词的发音（复用现有有道 API 单词模式） |
| 播放失败 | 降级路径自动切换；全部失败则在句子卡片上展示 `phonetic` 音标文字 |

### 6.11 Git 管理策略

| 内容 | 策略 | 原因 |
|------|------|------|
| JSON 文件（含 UUID） | ✅ 提交 | 纯文本，体积小，需要版本控制 |
| `public/audio/sentences/*.mp3` | `.gitignore` 排除，或用 Git LFS | 200+ 文件，首次约 2-5MB，二进制不适合 Git |
| TTS 生成脚本 | ✅ 提交 | 任何贡献者可运行脚本生成本地音频 |

**新贡献者工作流**：
```bash
git clone ...
bun install
bun run scripts/generate-sentence-audio.ts  # 生成全部音频
bun run dev
```

---

## 7. 首批句子本规划

### 7.1 句子本总览

| 文件 | ID | 名称 | 等级 | 课数 | 目标句数 | 来源 |
|------|-----|------|------|------|----------|------|
| `daily-a1.json` | `daily-a1` | 日常口语 A1 | A1 | 3 | 40 | 种子迁移 + Tatoeba |
| `daily-a2.json` | `daily-a2` | 日常口语 A2 | A2 | 3 | 40 | 种子迁移 + Tatoeba |
| `daily-b1.json` | `daily-b1` | 日常口语 B1 | B1 | 3 | 40 | 种子迁移 + Tatoeba |
| `travel-b1.json` | `travel-b1` | 旅行英语 B1 | B1 | 3 | 30 | Tatoeba 筛选 |
| `work-b2.json` | `work-b2` | 职场英语 B2 | B2 | 3 | 30 | Tatoeba + AI |
| `quotes-b2.json` | `quotes-b2` | 经典名言 B2 | B2 | 2 | 20 | 公开名言整理 |

**总计**：6 个句子本，17 课，**200 句**。

### 7.2 种子数据迁移方案

`seed-data/sentences.ts` 中现有 50 句按等级拆入对应的 daily JSON：

```
A1 (20 句) → daily-a1.json
A2 (15 句) → daily-a2.json
B1 (15 句) → daily-b1.json
```

迁移步骤：
1. 为每句生成 `uuid`（`crypto.randomUUID()`），分配 `lessonId`、`order`，补充 `phonetic`，分析并填写 `segments`
2. 补齐 tags（现有 seed 数据已有 tags）
3. 写入对应 JSON 文件的对应 lesson 中
4. 删除 `seed-data/sentences.ts` 及 `seed-data/index.ts`
5. 运行 `scripts/generate-sentence-audio.ts` 生成首批音频文件

### 7.3 补充句子的数据来源

| 来源 | 说明 | 适合等级 |
|------|------|----------|
| [Tatoeba](https://tatoeba.org) | 开源多语种例句库，含中文翻译和音频 | A1-B2 |
| AI 生成 + 人工审核 | 用 LLM 批量生成指定场景的例句，人工筛选 | B1-B2 |
| 公开名言集 | BrainyQuote、Goodreads 等 | B2 |

---

## 8. 数据工具链

借鉴 Earthworm 的数据管理脚本体系（`seed.ts`、`addCourse.ts`、`resetCourseStatements.ts`），建立句子数据的维护工具。

### 8.1 validate-sentences.ts — 数据校验

```bash
bun run scripts/validate-sentences.ts
```

- 遍历 `src/assets/sentences/*.json`
- 校验 JSON 格式合法性
- 校验字段完整性（必填字段、order 连续性、ID 唯一性）
- 校验内容质量（音标格式、segments 拼接匹配 text、role 值合法性、标签规范、词数范围）
- 输出错误报告 + 统计摘要

### 8.2 stats-sentences.ts — 数据统计

```bash
bun run scripts/stats-sentences.ts
```

- 统计总句数、总课数、等级/主题分布
- 统计词频、平均句长
- 输出 CSV/JSON 摘要，方便数据评估

### 8.3 migrate-sentences-v1-to-v2.ts — 数据迁移（一次性）

将 v1 格式（扁平 `sentences` 数组）迁移到 v2 格式（`lessons` 嵌套结构）：

```bash
bun run scripts/migrate-sentences-v1-to-v2.ts
```

---

## 9. 进度追踪设计

### 9.1 方案对比

Earthworm 使用**简易指针模式**追踪进度——`user_course_progress.statementIndex` 记录用户在当前课中做到第几句，完成一课可解锁下一课。这种线性模型的优点是：

- 简单直观，一条记录即可定位"做到哪了"
- 适合句子学习这种"有序推进"的场景
- 无需 FSRS 的稳定性/难度计算

本项目的单词学习使用 **FSRS 间隔重复算法**追踪每张卡片的记忆状态。对于句子学习，采用**混合方案**：

| 追踪维度 | 方案 |
|----------|------|
| **句子进度**（做到第几句） | 简易指针模式：`SentenceProgress { bookId, lessonId, statementIndex }` |
| **句子掌握度**（记忆保留） | FSRS 卡片模式：将句子作为 `cardType: "sentence"` 的 `LearningCard` 纳入 FSRS 调度 |
| **课完成状态** | `SentenceLessonProgress { bookId, lessonId, completed, completedAt }` |

### 9.2 新增 Dexie 表（版本 3 迁移）

```typescript
// src/lib/db/database.ts — version(3)
this.version(3).stores({
  sentenceProgress: "bookId",                                     // 每条记录 = 一个用户在某个本子的进度
  sentenceLessonProgress: "[bookId+lessonId]",                    // 复合主键
});
```

### 9.3 Sentence Progress 类型

```typescript
// src/types/sentence.ts
export interface SentenceProgressRecord {
  bookId: string;
  lessonId: string;
  statementIndex: number;    // 当前做到该课的第几句（从 0 开始，-1 表示未开始）
  updatedAt: number;
}

export interface SentenceLessonProgressRecord {
  bookId: string;
  lessonId: string;
  completed: boolean;        // 该课是否已完成
  completedAt: number;       // 完成时间戳
  score: number;             // 该课得分（0-100）
}
```

### 9.4 LearningCard 改造 — 支持句子卡片

> ⚠️ **这是阶段二的核心 blocker**。现有 `LearningCard` 是纯单词模型，必须改造才能将句子纳入 FSRS 间隔重复。

**现有类型**（[src/lib/fsrs/types.ts](src/lib/fsrs/types.ts)）：

```typescript
export interface LearningCard {
  id: string;
  wordText: string;
  definition: string;
  usphone?: string;
  ukphone?: string;
  bookId: string;
  cardType: "word";    // ← 硬编码，无法区分句子
  fsrs: FSRSState;
  // ...
}
```

**改造方案：将 LearningCard 泛化为内容卡片**

```typescript
// src/lib/fsrs/types.ts — 改造后

/** 卡片承载的内容类型 */
export type CardContentType = "word" | "sentence";

/** 单词卡片特有字段 */
export interface WordCardContent {
  wordText: string;
  definition: string;
  usphone?: string;
  ukphone?: string;
}

/** 句子卡片特有字段 */
export interface SentenceCardContent {
  text: string;
  translation: string;
  phonetic?: string;
  segments?: SyntaxSegment[];
}

/** 统一的卡片类型（tagged union） */
export type ContentCard =
  | ({ cardType: "word" } & WordCardContent)
  | ({ cardType: "sentence" } & SentenceCardContent);

/** 学习卡片（Content + FSRS 元数据） */
export interface LearningCard {
  id: string;
  bookId: string;
  content: ContentCard;
  fsrs: FSRSState;
  notes: string;
  createdAt: number;
  updatedAt: number;
}
```

**迁移路径**（Dexie v3 → v4）：

```typescript
// database.ts — version(4)
this.version(4).stores({
  // learningCards 表结构不变，但 cardType 从 "word" 扩展为 "word" | "sentence"
  // 旧数据自动兼容（cardType: "word" 的卡片 content 中仍有 wordText/definition）
  learningCards: "id, bookId, content.cardType, fsrs.state, fsrs.lastReview",
  sentenceProgress: "bookId",
  sentenceLessonProgress: "[bookId+lessonId]",
});
```

**关键决策**：
- 保持单表 `learningCards`（不拆成 `wordCards` + `sentenceCards`），因为 FSRS 调度逻辑对两种卡片完全一致，查询 `getDueCards()` 需要跨类型排序
- 使用 tagged union（`cardType` 判别）而非泛型，因为 Dexie 表的行类型需要一致
- 旧 `wordText`/`definition` 字段迁移到 `content.wordText` / `content.definition`，需要写数据迁移函数

### 9.5 句子 Session Store 类型概要

> 句子学习的 session 管理与单词有本质差异：**逐词输入而非逐字母**、**3 种模式而非 4 种**、**统计维度不同**。因此需要**新建独立的 store**，不扩展现有 `vocabulary-session-store`。

#### 核心类型

```typescript
// src/stores/sentence-session-store.ts（新建）

// ── 句子完成追踪 ──
/** 单模式内的逐词结果 */
export interface SentenceModeResult {
  mode: SentenceLearnMode;
  wrongWordIndices: number[];     // 打错的词索引列表
  isCorrect: boolean;             // 本模式是否全对
}

/** 一句跨 3 种模式的完成状态 */
export interface SentenceCompletion {
  sentenceId: string;
  modeResults: SentenceModeResult[];
  currentModeIndex: number;       // 0-2
  isFullyCompleted: boolean;
}

// ── 一轮结束后的统计 ──
export interface SentenceResult {
  sentenceId: string;
  sentenceText: string;
  translation: string;
  wrongWordCount: number;         // 最差模式的错误词数
  isCorrect: boolean;             // 3 种模式全部正确？
  modeResults: SentenceModeResult[];
}

export interface SentenceSessionStats {
  totalTimeSec: number;
  accuracy: number;               // 正确词数 / 总词数
  wpm: number;                    // 词/分钟
  sentencesCompleted: number;
  sentencesCorrect: number;
}

// ── Store 状态 ──
interface SentenceSessionState {
  // 配置
  selectedBook: SentenceBookId | null;
  sentencesPerRound: number;

  // 阶段
  phase: "idle" | "learning" | "finished";

  // 句子队列
  sentences: Sentence[];
  completions: Record<string, SentenceCompletion>;

  // 当前位置
  currentSentenceIndex: number;
  currentMode: SentenceLearnMode;

  // 输入状态
  inputWords: string[];           // 用户当前已输入的词
  currentWordIndex: number;       // 当前正在输入第几个词
  isTyping: boolean;

  // 计时
  startTime: number | null;
  elapsedSeconds: number;

  // 统计
  sentenceResults: SentenceResult[];
  totalWordsTyped: number;
  totalCorrectWords: number;

  // Actions
  startSession: (sentences: Sentence[]) => void;
  submitWord: (word: string) => { isCorrect: boolean; advance: boolean };
  advanceMode: () => void;
  finishSession: () => void;
  resetSession: () => void;
  // ...
}
```

#### 与单词 store 的关键差异

| 维度 | 单词 store | 句子 store |
|------|-----------|-----------|
| 输入粒度 | 逐字母 → `LetterState[]` | 逐词 → `inputWords[]` + `currentWordIndex` |
| 模式数 | 4 种渐进隐藏 | 3 种（显示/隐藏/全盲） |
| 错误追踪 | `letterMistakes: Record<number, string[]>` | `wrongWordIndices: number[]` |
| 任务队列 | FSRS 优先级交错调度 | 线性顺序（做完第 N 句再做 N+1） |
| 复习阶段 | 独立的 `startReviewPhase` | 不需要——句子用 FSRS 卡片调度，不在 session 内混合新句和复习 |
| FSRS 集成 | session 内直接调用 `recordModeComplete` | session 结束后将 `SentenceResult[]` 批量写入 FSRS |

#### 为什么句子不用任务队列交错调度？

单词的 4 种模式需要跨词交替（避免同一词连续出现），因此需要 `taskQueue` + FSRS 优先级排序。句子学习是**线性推进**的——一气呵成做完一句的 3 种模式再进下一句，用户体验更自然（不必在句子间频繁跳转）。复习则由 FSRS 在独立时段触发，不与新句学习混合。

---

## 10. 实施步骤

### 阶段一：数据层搭建（本次方案聚焦）

| 步骤 | 内容 | 产出文件 |
|------|------|----------|
| 1.1 | 更新 `Sentence` 接口（`domain.ts`），新增字段 | `src/types/domain.ts` |
| 1.2 | 新增类型定义（`SentenceBookId`、`SentenceEntry`、`LessonEntry`、`SentenceBookJSON` 等） | `src/types/sentence.ts` |
| 1.3 | 创建 `sentence-converter.ts` | `src/lib/sentence-converter.ts` |
| 1.4 | 创建 `sentence-book-registry.ts` | `src/lib/sentence-book-registry.ts` |
| 1.5 | 创建 `sentence-validator.ts` | `src/lib/sentence-validator.ts` |
| 1.6 | 创建 `src/assets/sentences/` 目录 + 6 个 JSON 文件 | `src/assets/sentences/*.json` |
| 1.7 | 迁移种子数据 50 句 → 生成 uuid，补充 phonetic/lesson/segments | 修改 JSON 文件 |
| 1.8 | 补充剩余句子至目标数（200 句） | 修改 JSON 文件 |
| 1.9 | 创建校验/统计脚本，验证数据完整性 | `scripts/` 目录 |
| 1.10 | 删除 `seed-data/sentences.ts`，清理对它的引用 | 清理 |

### 阶段二：句子学习交互（后续）

| 步骤 | 内容 | 涉及文件 |
|------|------|----------|
| 2.1 | **LearningCard 改造**：`cardType` 扩展为 `"word" \| "sentence"`，新增 `ContentCard` tagged union，Dexie v4 迁移 | `src/lib/fsrs/types.ts`、`src/lib/db/database.ts` |
| 2.2 | **句子卡片内容类型**：补充 `SentenceCardContent`、`WordCardContent` 类型，改造 `upsertCard`/`getCardsByBookId` 兼容新字段 | `src/lib/fsrs/types.ts`、`src/lib/db/repository.ts` |
| 2.3 | **句子 Session Store**：新建 `sentence-session-store.ts`，实现 `SentenceCompletion`、`SentenceModeResult`、`SentenceResult` 类型及逐词输入状态管理 | `src/stores/sentence-session-store.ts` |
| 2.4 | **SentenceCard 组件**：逐词输入 UI（词框组 + 空格跳转 + 错误词高亮 + segments 语法色带），3 种模式切换 | `src/components/vocabulary/SentenceCard.tsx` |
| 2.5 | **ImmersiveSentencePage**：新建句子学习全屏页面，对标 `ImmersiveLearnPage` | `src/components/pages/ImmersiveSentencePage.tsx` |
| 2.6 | **句子 FSRS 集成**：session 结束后批量写入 FSRS 卡片，`cardType: "sentence"` | `src/hooks/useSentenceFSRSSync.ts` |
| 2.7 | **结果页**：`SentenceResultScreen` 展示句级统计和 segments 成分准确性 | `src/components/vocabulary/SentenceResultScreen.tsx` |
| 2.8 | **进度持久化**：Dexie v4 迁移 — 新增 `sentenceProgress` / `sentenceLessonProgress` 表 | `src/lib/db/database.ts` |

### 阶段三：入口与导航（后续）

| 步骤 | 内容 | 涉及文件 |
|------|------|----------|
| 3.1 | **路由注册**：新增 `ROUTES.SENTENCE = "/center/sentence"` 和 `ROUTES.SENTENCE_LEARN = "/learn-sentence"` | `src/lib/constants.ts` |
| 3.2 | **QUICK_ACTIONS 扩展**：新增「句子打字」快捷入口 | `src/lib/constants.ts` |
| 3.3 | **SentenceBookList 页面**：对标 `WordBookList`，展示句子本卡片 + 进度 | `src/components/vocabulary/SentenceBookList.tsx` |
| 3.4 | **SentenceBookCard 组件**：对标 `WordBookCard`，展示封面、课数、句数、进度条 | `src/components/vocabulary/SentenceBookCard.tsx` |
| 3.5 | **useSentenceBookStats hook**：对标 `useWordBookStats`，从 Dexie 查询句子卡片统计 | `src/hooks/useSentenceBookStats.ts` |
| 3.6 | **App.tsx 路由挂载**：注册 `VocabularySentencePage`（选择页）和 `ImmersiveSentencePage`（学习页）路由 | `src/app/App.tsx` |

> **阶段二、三为后续任务，本次方案聚焦阶段一。**

---

## 11. 设计决策记录

### 11.1 为什么引入 lesson 中间层？

- **对标 Earthworm**：`course_pack → course → statement` 三层模型已被验证有效
- **分组管理**：200 句平铺在一个列表中用户无所适从；按场景/语法点分课，每次学 5-15 句，体验更好
- **进度粒度**：以课为单位追踪完成状态，比"整个本子学完"更细粒度
- **可扩展**：后续可在课级别加解锁条件（完成前一课才能进入下一课）

### 11.2 为什么用 UUID 而非人类可读 ID 映射音频？

- **稳定性**：`sentence.id`（如 `"greetings-001"`）在句子重排序、跨课迁移时会变，但 UUID 永不改变，音频文件不需要重命名
- **跨本唯一**：UUID 天然全局唯一，不同句子本的句子即使 ID 碰巧相同也不会冲突
- **工具链友好**：TTS 生成脚本按 UUID 查找有无已有音频，逻辑简单——`检查 {uuid}.mp3 是否存在`
- **`id` 保留给人类**：`"greetings-001"` 帮助数据制作者在 JSON 中快速定位句子，不被 UUID 取代

### 11.3 为什么增加 phonetic 字段？

- **Earthworm 的 `soundmark` 每句必有** — 这是语言学习应用的基础字段
- 支撑后续**听写模式**和**朗读模式**
- 可选填，不给内容制作增加太大负担，但为功能扩展留有空间

### 11.4 为什么每个等级不做成一个文件？

- 文件体积可控（每文件 20-40 句，∼8-15KB）
- 主题分类清晰，用户可按场景选择（"我想练旅行英语"而非"我想练 B1"）
- 与词库的"一个 JSON = 一个可选本"模式一致
- 未来新增句子本只需加文件 + 注册一行，不影响已有数据

### 11.5 为什么不存 wordCount/createdAt 到 JSON？

- `wordCount` 可从 `text` 自动计算，属于冗余字段，避免人工维护时数据不一致
- `createdAt`/`updatedAt` 对静态数据无意义，loader 统一设为 0

### 11.6 为什么用 JSON 而不是数据库？

- 句子本是静态内容（类似词库），不需要用户修改
- JSON 文件支持 Vite 的 tree-shaking 和 code-splitting
- `import()` 动态按需加载，首页不加载全部句子
- 与现有词库架构一致
- **Earthworm 同样采用 JSON 文件作为数据源（尽管它也用 PostgreSQL）** — JSON 是编辑友好的源格式，数据库是运行时存储

### 11.7 为什么进度追踪不用纯 FSRS？

- 句子学习的推进天然是"线性的"——做完第 3 句再第 4 句，不像背单词可以随机
- **借鉴 Earthworm 的 `statementIndex` 指针模式**追踪"做到哪了"
- FSRS 用于追踪"句子记住了吗"——何时需要重新复习
- 两者互补而非替代：语句的线性推进 + 记忆的间隔重复

### 11.8 为什么用成分切分（segments）而不是整体句型标签？

- **成分标注比句型标签更精确**：标注"整体是 SVOO"只能告诉用户整句的类型，而 segments 精确到"哪个词是主语、哪个是谓语、哪个是直宾"——用户看到的不只是分类标签，而是每个词在句中的角色
- **UI 展示更直观**：segments 可以直接映射为语法高亮——主语用红色下划线、谓语用蓝色、宾语用绿色——比一个角落里的"主谓双宾"标签更有教学价值
- **一个句子可能有多种解读**：*I want to go.* 中的 `to go` 可以分析为宾语也可以分析为目的状语——segments 允许数据制作者按自己的教学意图标注，不给句子贴唯一标签
- **与 Earthworm 的渐近词组互补**：Earthworm 用递增词组教你"怎么拼"，我们用成分切分告诉你"每个词组在干什么"
- **可选字段**：对结构简单的 A1 句子优先标注，复杂句可留空，灵活渐进

### 11.9 为什么不用连词构句法（Earthworm 的核心教学法）？

- **产品定位不同**：Earthworm 是从零构建句子（词组拼接），本项目是通过打字**巩固**已有语言知识
- 打字模式更适合完整句子（判断逐词/逐字母输入的准确性），而非判断用户拼出的词组是否正确
- **未来可扩展**：`SentenceEntry` 预留了 `phonetic` 和 `segments` 字段，后续可基于音标做听写模式、基于成分切分做语法高亮和拖拽标注模式，但不作为第一阶段的重点

---

## 12. 未来扩展

- **更多句子本**：学术英语 C1、雅思口语句式、商务邮件模板等
- **语法高亮展示**：句子卡片上按 segments 的 role 用不同颜色/样式渲染每个成分（主语红色、谓语蓝色、宾语绿色…），打字时逐段高亮
- **成分分析学习模式**：用户不是打字，而是拖拽标注每个词组的语法成分——"把主语拖到第一个框"
- **按成分筛选练习**：按角色筛选含特定成分的句子（"只练含间接宾语的句子"），利用 segments 的 role 过滤
- **用户自定义句子本**：支持导入 CSV/JSON
- **连词构句模式**：借鉴 Earthworm，增加"字块拼接"学习模式——将长句拆成词组，用户逐步拼接构建完整句子
- **句子与单词关联**：`SentenceEntry` 增加 `linkedWordIds` 字段，将句子与 CET 词库打通，实现"学到某个句子时间步复习其中的生词"
- **句级音频**：TTS 自动生成或真人录音，支撑听写模式
- **课程市场**：参考 Earthworm 的 `game-data-sdk` 和 `shareLevel` 机制，未来支持用户分享自定义句子本
- **PDF/文本导入**：参考 Earthworm 的 `parsePDF/` 模块，支持从教材、文章自动提取句子
