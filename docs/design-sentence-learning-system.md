# 句子学习系统 — 数据结构与管理系统设计

> 参考 [earthworm](https://github.com/cuixueshe/earthworm) 项目的设计模式，抽象出通用的句子学习数据结构、内容管理方式和后台管理系统方案。

---

## 1. 核心数据模型

### 1.1 实体关系总览

```
CoursePack (课程包)
  │
  ├── 1:N ── Course (课程/单元)
  │            │
  │            ├── 1:N ── Statement (句子/短语)  ← 最小学习单元
  │            │
  │            └── N:N ── User (via 进度/历史/掌握)
  │
  └── 聚合：同一主题/难度/系列的课程集合
```

### 1.2 Statement（句子/短语）— 最小学习单元

核心数据表，存储用户需要打字的每一条内容。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string (PK) | ✅ | 唯一标识，推荐 cuid2 自动生成 |
| `order` | integer | ✅ | 课内排序序号，从 1 开始递增 |
| `chinese` | text | ✅ | 中文翻译/提示（用户看到的提示） |
| `english` | text | ✅ | 英文句子（用户打字的目标） |
| `soundmark` | text | ✅ | 音标，逐词格式如 `/wi/ /wɑnt/ /tə/ /ʃɑp/` |
| `courseId` | string (FK) | ✅ | 所属课程 ID |
| `createdAt` | timestamp | ✅ | 创建时间 |
| `updatedAt` | timestamp | ❌ | 更新时间（自动维护） |

**设计要点**：
- 字段极少（3 个内容字段 + 排序 + 关联），保持简单
- `soundmark` 采用**逐词切片**格式（词间空格分隔，每词 `/.../` 包裹），天然对齐 `english` 的分词结果，便于前端逐词高亮 + TTS 逐词朗读
- `order` 用于控制学习顺序，支持渐进式构建（单词→短语→完整句）

**JSON 源数据格式**（用于导入/导出）：

```json
[
  { "chinese": "我喜欢这个食物", "english": "I like the food", "soundmark": "/aɪ/ /laɪk/ /ðə/ /fud/" },
  { "chinese": "我不喜欢", "english": "I don't like", "soundmark": "/aɪ/ /dont/ /laɪk/" }
]
```

**渐进式构建示例** — 同一课内从碎片到完整的递进：

```json
[
  { "chinese": "购物",              "english": "to shop",                    "soundmark": "/tə/ /ʃɑp/" },
  { "chinese": "我们想要购物",       "english": "we want to shop",            "soundmark": "/wi/ /wɑnt/ /tə/ /ʃɑp/" },
  { "chinese": "在市场",            "english": "at the market",               "soundmark": "/ət/ /ðə/ /'mɑrkɪt/" },
  { "chinese": "在市场购物",         "english": "to shop at the market",       "soundmark": "/tə/ /ʃɑp/ /ət/ /ðə/ /'mɑrkɪt/" },
  { "chinese": "我们想要在市场购物",  "english": "we want to shop at the market", "soundmark": "..." }
]
```

### 1.3 Course（课程/单元）

课程是 Statement 的容器，代表一组有序的句子。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string (PK) | ✅ | 唯一标识 |
| `title` | varchar(256) | ✅ | 课程标题，如"第一课"、"购物" |
| `description` | text | ❌ | 课程简介 |
| `order` | integer | ✅ | 课程包内排序序号 |
| `video` | text | ❌ | 关联教学视频 URL |
| `coursePackId` | string (FK) | ✅ | 所属课程包 ID |
| `createdAt` | timestamp | ✅ | 创建时间 |
| `updatedAt` | timestamp | ❌ | 更新时间 |

**设计要点**：
- 课程本身**不存储 Statement 数量**（运行时查询），保证数据一致性
- `video` 字段支持视频教程，扩展了纯文字学习的场景
- `order` 控制课程的排列顺序，前端按 `order ASC` 获取

### 1.4 CoursePack（课程包）

课程包是 Course 的顶层容器，代表一个完整的学习系列。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string (PK) | ✅ | 唯一标识 |
| `title` | text | ✅ | 课程包标题，如"星荣零基础学英语" |
| `description` | text | ❌ | 课程包简介 |
| `order` | integer | ✅ | 全局排序（决定首页展示顺序） |
| `isFree` | boolean | ✅ | 是否免费 |
| `cover` | text | ❌ | 封面图 URL |
| `creatorId` | string | ✅ | 创建者 ID（用于权限控制） |
| `shareLevel` | text | ✅ | 共享级别：`public` / `private` / `founder_only` |
| `createdAt` | timestamp | ✅ | 创建时间 |
| `updatedAt` | timestamp | ❌ | 更新时间 |

**设计要点**：
- `shareLevel` 三级权限模型：公开/私有/创始会员专属，支持商业化
- `creatorId` 支持用户自定义课程包，不仅是平台官方内容
- `isFree` 支持免费+付费混合模式
- `cover` 用于首页卡片展示，提升视觉体验

---

## 2. 用户进度与追踪

### 2.1 UserCourseProgress（用户课程进度）

记录用户在课程包中**当前学到哪一课、哪一句**。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 唯一标识 |
| `userId` | string | 用户 ID |
| `coursePackId` | string | 课程包 ID |
| `courseId` | string | 当前课程 ID |
| `statementIndex` | integer | 当前 Statement 的 order（0-based） |

**唯一约束**：`(userId, coursePackId)` — 每个用户在每个课程包中只有一个进度位置。

**设计要点**：
- 进度粒度是**课程包内唯一定位**（哪个 course 的哪个 statement）
- `statementIndex` 用 order 而非数据库 ID，因为 order 是连续可预期的
- 完成课程后自动 upsert 到下一课的第一个 statement（index=0）

### 2.2 CourseHistory（课程完成历史）

记录用户**完成了多少次**某门课程。支持重复学习同一门课。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 唯一标识 |
| `userId` | string | 用户 ID |
| `coursePackId` | string | 课程包 ID |
| `courseId` | string | 课程 ID |
| `completionCount` | integer | 完成次数（upsert 时 +1） |

**唯一约束**：`(userId, courseId, coursePackId)`

**设计要点**：
- 不记录每次完成的详细信息（开始时间、用时、准确率等），保持轻量
- 如果需要详细记录，配合 UserLearningActivities 表

### 2.3 MasteredElements（已掌握内容）

用户标记为"已掌握"的句子，学习时可自动跳过。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 唯一标识 |
| `userId` | string | 用户 ID |
| `content` | jsonb | 掌握的内容，如 `{ "english": "I like the food" }` |
| `masteredAt` | timestamp | 掌握时间 |

**设计要点**：
- 使用 JSONB 存储内容，不直接外键关联 Statement（支持跨课程识别同一句子）
- 前端加载课程时，对每个 statement 检查 `english` 是否在 masteredElements 中存在，标记 `isMastered`
- 跳转逻辑：`toNextStatement()` 自动跳过 `isMastered` 的句子

### 2.4 UserLearningActivities（用户学习活动）

记录用户每天的学习行为，用于日历热力图、学时统计。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 唯一标识 |
| `userId` | string | 用户 ID |
| `date` | date | 学习日期 |
| `activityType` | string | 活动类型：`learn` / `review` / `challenge` |
| `courseId` | string | 关联课程 ID（可选） |
| `duration` | integer | 学习时长（秒） |
| `metadata` | jsonb | 扩展元数据（准确率、完成数等） |

**唯一约束**：`(userId, date, activityType)`

---

## 3. 课程内容管理方式

### 3.1 三种内容来源

```
┌──────────────────────────────────────────────────┐
│              课程内容来源                           │
│                                                    │
│  ① JSON 文件导入                                   │
│     data/courses/01.json  ──→  seed.ts  ──→  DB  │
│     data/courses/02.json                           │
│                                                    │
│  ② PDF 教材解析                                    │
│     data/pdf/01.pdf  ──→  parser.ts  ──→  JSON   │
│                           (提取 中文/英文/音标)     │
│                                                    │
│  ③ 管理端手动输入                                   │
│     运营后台  ──→  API  ──→  DB                    │
└──────────────────────────────────────────────────┘
```

### 3.2 JSON 文件管理规范

**目录结构**：

```
packages/courses/
├── data/
│   ├── courses/
│   │   ├── 01.json       ← 文件名 = course order 序号
│   │   ├── 02.json
│   │   └── ...
│   └── pdf/
│       ├── 01.pdf        ← PDF 教材原文件
│       └── ...
└── src/
    ├── seed.ts           ← 全量初始化脚本
    ├── addCourse.ts      ← 单课追加脚本
    ├── resetCourseStatements.ts  ← 课程内容重置
    └── parsePDF/
        └── parser.ts     ← PDF → JSON 解析器
```

**命名约定**：
- JSON 文件名用数字序号（`01.json`, `02.json`...），对应 Course 的 `order`
- 一文件 = 一课，内容为 Statement 的 JSON 数组
- 文件编码 UTF-8

### 3.3 Seed 脚本设计

全量初始化流程：

```
1. DELETE 所有 statements + courses + coursePacks（清空旧数据）
2. INSERT coursePack（创建课程包元信息）
3. FOR EACH JSON 文件:
   3.1 INSERT course（创建课程记录）
   3.2 读取 JSON → Statement[]
   3.3 FOR EACH statement:
         INSERT statement（order 从 1 重新编号，关联 courseId）
4. 完成
```

**关键设计**：
- 全量重建，保证数据干净一致（适合非生产环境的课程准备）
- 对于生产环境，使用 `addCourse.ts` 单独追加
- Statement 的 `order` 由脚本重新编号（不从 JSON 中读取），避免手工维护排序

### 3.4 PDF 解析管道

从 PDF 教材中**半自动提取**课程 JSON：

```
PDF 文本
  → 按 \n 切分
  → 定位起始标记 "中文 英文 K.K.音标"
  → 定位结束标记 "中文 原形 第三人称单数 过去式 ing形式"
  → 中英文交替解析：
      中文行 → chinese 字段
      英文+音标行 → english + soundmark 字段（按 / 分割）
  → 输出 JSON 数组 [{ chinese, english, soundmark }]
```

适用场景：将传统教材 PDF 快速转化为句子学习数据。

### 3.5 工具脚本矩阵

| 脚本 | 用途 | 执行方式 |
|------|------|---------|
| `seed.ts` | 全量初始化（清空+重建整个课程包） | `pnpm db:upload` |
| `addCourse.ts` | 追加单门课（不破坏已有数据） | 手动编辑参数后执行 |
| `resetCourseStatements.ts` | 重置某课的全部 Statement | 修改内容后重新导入 |
| `migrate.ts` | DDL 迁移（建表/改表） | `pnpm db:init` |
| `parser.ts` | PDF 文本 → JSON | 独立运行，输出到 stdout |

---

## 4. 课程内容管理系统设计

### 4.1 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     管理后台 (Admin Panel)                │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 课程包管理 │ │ 课程管理  │ │ 句子编辑器 │ │ 导入导出  │  │
│  │ CRUD      │ │ CRUD     │ │ 批量编辑  │ │ JSON/PDF │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                      API Layer (REST)                    │
│                                                         │
│  CoursePackController  CourseController  ToolController │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     Database (PostgreSQL)                │
│                                                         │
│  course_packs  courses  statements  ...                 │
└─────────────────────────────────────────────────────────┘
```

### 4.2 API 设计

#### 课程包 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/course-packs` | 获取所有课程包列表 | 公开（按 shareLevel 过滤） |
| `GET` | `/api/course-packs/:id` | 获取课程包详情（含课程列表） | 公开/私有校验 |
| `POST` | `/api/course-packs` | 创建课程包 | 登录用户 |
| `PUT` | `/api/course-packs/:id` | 更新课程包信息 | 创建者 |
| `DELETE` | `/api/course-packs/:id` | 删除课程包（级联删除课程+句子） | 创建者 |

#### 课程 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/course-packs/:packId/courses` | 获取课程包下所有课程 | 同课程包权限 |
| `GET` | `/api/course-packs/:packId/courses/:courseId` | 获取课程详情（含所有 Statement） | 同课程包权限 |
| `POST` | `/api/course-packs/:packId/courses` | 创建课程 | 课程包创建者 |
| `PUT` | `/api/course-packs/:packId/courses/:courseId` | 更新课程信息 | 课程包创建者 |
| `DELETE` | `/api/course-packs/:packId/courses/:courseId` | 删除课程（级联删除 Statement） | 课程包创建者 |
| `POST` | `/api/course-packs/:packId/courses/:courseId/complete` | 完成课程（用户侧） | 登录用户 |

#### Statement API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/courses/:courseId/statements` | 获取课程所有句子 | 同课程权限 |
| `POST` | `/api/courses/:courseId/statements` | 添加句子 | 课程包创建者 |
| `PUT` | `/api/statements/:id` | 更新句子 | 课程包创建者 |
| `DELETE` | `/api/statements/:id` | 删除句子 | 课程包创建者 |
| `PUT` | `/api/courses/:courseId/statements/reorder` | 批量调整句子顺序 | 课程包创建者 |

#### 导入/导出 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/courses/:courseId/import` | 导入 JSON 文件到指定课程（替换全部 Statement） |
| `GET` | `/api/courses/:courseId/export` | 导出课程全部 Statement 为 JSON 下载 |
| `POST` | `/api/course-packs/:packId/export` | 导出课程包下所有课程（打包下载） |

### 4.3 管理端页面设计

#### 4.3.1 课程包列表页

```
┌─────────────────────────────────────────────────────────────┐
│  课程包管理                                    [+ 新建课程包] │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📦 星荣零基础学英语         公开 · 免费 · 55 课          ││
│  │ 最适合零基础入门的课程            [编辑] [导出] [删除]    ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 📦 四级翻译训练             公开 · 免费 · 20 课          ││
│  │ CET-4 翻译真题训练               [编辑] [导出] [删除]   ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 📦 我的自定义课程包         私有 · 免费 · 5 课           ││
│  │ ...                                                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.2 课程包详情页（含课程列表）

```
┌─────────────────────────────────────────────────────────────┐
│  ← 返回    星荣零基础学英语                    [+ 新建课程]  │
│                                                             │
│  课程包信息                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 标题: 星荣零基础学英语      共享: 公开                   ││
│  │ 简介: 最适合零基础入门的课程  封面: [图片]               ││
│  │                           [编辑课程包信息]               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  课程列表 (55 门)                                            │
│  ┌──────┬────────────────┬────────┬──────────────────────┐ │
│  │ 序号 │ 标题            │ 句子数 │ 操作                  │ │
│  ├──────┼────────────────┼────────┼──────────────────────┤ │
│  │  1   │ 第一课          │   45   │ [编辑句子] [导出] [删]│ │
│  │  2   │ 第二课          │   52   │ [编辑句子] [导出] [删]│ │
│  │  3   │ 第三课          │   48   │ [编辑句子] [导出] [删]│ │
│  │  ... │ ...            │  ...   │                       │ │
│  └──────┴────────────────┴────────┴──────────────────────┘ │
│                                                             │
│  [导入 JSON] [批量导出全部]                                  │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.3 句子编辑器（课程详情页展开）

```
┌─────────────────────────────────────────────────────────────┐
│  ← 返回课程列表    编辑：第一课 (45 句)        [+ 添加句子]  │
│                                                             │
│  批量操作栏                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [全选] [批量删除] [导入 JSON 替换] [导出 JSON]           ││
│  │ 搜索: [_______________] 🔍                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  句子列表                                                    │
│  ┌────┬───────────────────────────────────────────────────┐ │
│  │ #1 │ 中文: 我                                          │ │
│  │    │ 英文: I                      音标: /aɪ/           │ │
│  │    │                            [编辑] [删除] [↓↑拖拽] │ │
│  ├────┼───────────────────────────────────────────────────┤ │
│  │ #2 │ 中文: 我喜欢                                       │ │
│  │    │ 英文: I like                 音标: /aɪ/ /laɪk/    │ │
│  │    │                            [编辑] [删除] [↓↑拖拽] │ │
│  ├────┼───────────────────────────────────────────────────┤ │
│  │ #3 │ 中文: 我喜欢这个食物                               │ │
│  │    │ 英文: I like the food                             │ │
│  │    │ 音标: /aɪ/ /laɪk/ /ðə/ /fud/                      │ │
│  │    │                            [编辑] [删除] [↓↑拖拽] │ │
│  └────┴───────────────────────────────────────────────────┘ │
│                                                             │
│  [保存排序]                                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.4 句子编辑弹窗

```
┌──────────────────────────────────┐
│  编辑句子                    [×]  │
│                                  │
│  中文                             │
│  ┌──────────────────────────────┐│
│  │ 我喜欢这个食物                ││
│  └──────────────────────────────┘│
│                                  │
│  英文                             │
│  ┌──────────────────────────────┐│
│  │ I like the food              ││
│  └──────────────────────────────┘│
│                                  │
│  音标（逐词，空格分隔）           │
│  ┌──────────────────────────────┐│
│  │ /aɪ/ /laɪk/ /ðə/ /fud/      ││
│  └──────────────────────────────┘│
│                                  │
│      [取消]           [保存]     │
└──────────────────────────────────┘
```

### 4.4 导入流程设计

#### JSON 文件导入

```
用户选择 JSON 文件
  → 前端校验 JSON 格式（必须是 Statement 数组，含 chinese/english/soundmark）
  → 展示预览（前 10 条）
  → 确认导入策略：
      [替换全部] — 删除该课现有 Statement，全部替换
      [追加到末尾] — 保留现有 Statement，追加新数据
  → 发送到 API
  → 后端：解析 → 校验每一行 → 批量 INSERT → 返回结果
  → 前端：刷新列表，显示导入统计（成功 N 条，失败 M 条）
```

#### PDF 导入

```
用户上传 PDF 文件 + 选择目标课程
  → 后端调用 parser 提取文本
  → 前端展示提取结果预览（可编辑的表格）
  → 用户手动修正解析错误
  → 确认导入
```

### 4.5 排序管理

**设计原则**：Statement 的 `order` 由系统自动维护，无需用户手动输入序号。

**新增句子**：
- 默认 `order = MAX(order) + 1`（追加到末尾）
- 可选指定插入位置，系统自动重排后续序号

**删除句子**：
- 级联删除，不产生空洞（后续序号自动前移）

**拖拽排序**：
- 前端拖拽后，批量发送 `[{ id, newOrder }]` 到 reorder API
- 后端事务中批量 UPDATE

### 4.6 校验规则

| 规则 | 说明 |
|------|------|
| `chinese` 非空 | 不允许空中文 |
| `english` 非空 | 不允许空英文 |
| `soundmark` 格式 | 必须是 `/.../ /.../` 格式（每词一个音标） |
| `soundmark` 与 `english` 词数一致 | 音标数量 = 英文单词数 |
| 去重检查 | 同一课程内 `english` 不允许重复 |

---

## 5. 技术选型建议

| 层 | 推荐方案 | 说明 |
|------|---------|------|
| 数据库 | PostgreSQL | JSONB 支持，适合 semi-structured 内容 |
| ORM | Drizzle 或 Prisma | Drizzle 更轻量，Prisma 生态更成熟 |
| API | RESTful | 课程内容管理场景不需要 GraphQL |
| 文件存储 | 文件系统 + 数据库 | JSON 源文件放仓库（版本控制），运行时数据在 DB |
| 管理前端 | React + Ant Design | 表格/表单/拖拽组件现成 |
| 搜索 | 数据库 LIKE/ILIKE | 句子量级在万级以下，不需要 Elasticsearch |

---

## 6. 核心设计原则总结

1. **Statement 是原子单元**：数据模型以句子（而非单词）为最小粒度，`chinese` + `english` + `soundmark` 三字段即可完整描述一条练习内容。

2. **三层嵌套，平铺存储**：课程包→课程→句子 的逻辑层级清晰，但 Statement 表本身是平铺的（不嵌套 JSON），保证了查询效率和数据独立性。

3. **音标逐词切片**：`/aɪ/ /laɪk/ /ðə/ /fud/` 格式天然对齐英文分词结果，前端渲染逐词音标、TTS 逐词朗读都无需额外解析。

4. **渐进式构建**：课程内句子从单词→短语→完整句递进排列，同一句子的变体相邻出现，符合"搭积木"认知规律。

5. **JSON 源文件 = 单一事实来源**：课程内容的权威版本是仓库中的 JSON 文件，数据库是运行时副本。支持 Git 版本管理、diff review、CI 校验。

6. **权限分层**：公开/私有/付费 三级共享模型，支持从个人工具到商业化平台的演进。

7. **进度与内容解耦**：用户进度（UserCourseProgress/CourseHistory）与课程内容（Statement/Course）完全独立，修改课程内容不影响已有学习记录。

8. **工具链优先**：seed 脚本、addCourse 脚本、PDF 解析器等命令行工具是内容管理的一等公民，管理后台是对它们的 Web 封装，而非替代品。
