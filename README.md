<p align="center">
  <img src="https://img.shields.io/badge/React-19-oklch(0.55_0.195_252)?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/github/license/color-dream/evergrow-english" />
  <img src="https://img.shields.io/github/deployments/color-dream/evergrow-english/github-pages?label=deploy" />
</p>

<h1 align="center">
  ✨ Evergrow English
</h1>

<p align="center">
  <strong>AI 驱动的英语学习工具</strong><br/>
  科学记忆 × 沉浸体验，让每一次练习都成为成长的养料
</p>

<p align="center">
  <a href="https://color-dream.github.io/evergrow-english/">🌐 在线体验</a>
  &nbsp;·&nbsp;
  <a href="#-快速开始">🚀 快速开始</a>
  &nbsp;·&nbsp;
  <a href="#-功能特性">✨ 功能特性</a>
</p>

---

## ✨ 功能特性

<table>
  <tr>
    <td width="50%">
      <h4>📝 词汇打字</h4>
      <p>逐字母输入，配合语音朗读，强化拼写记忆。覆盖 CET4/CET6 词库，A1~C2 六级难度。</p>
    </td>
    <td width="50%">
      <h4>🧠 科学复习</h4>
      <p>基于 <strong>FSRS</strong>（Free Spaced Repetition Scheduler）算法，在遗忘临界点精准复习，最大化记忆效率。</p>
    </td>
  </tr>
  <tr>
    <td>
      <h4>🎯 沉浸模式</h4>
      <p>全屏逐字母打字，专注高效。实时统计击键数、正确率，学习反馈即时可见。</p>
    </td>
    <td>
      <h4>🌓 暗色模式</h4>
      <p>亮色 / 暗色 / 跟随系统，三种主题自由切换。OKLCH 高色度色彩 + 毛玻璃质感。</p>
    </td>
  </tr>
  <tr>
    <td>
      <h4>📊 进度追踪</h4>
      <p>实时统计掌握单词数、连续学习天数，见证每一步成长。</p>
    </td>
    <td>
      <h4>📱 PWA 离线可用</h4>
      <p>基于 IndexedDB 本地存储，无需网络也能学习。数据完全掌控在你自己手中。</p>
    </td>
  </tr>
</table>

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 |
| 语言 | TypeScript 6 |
| 构建 | Vite 8 |
| 样式 | TailwindCSS v4 |
| 路由 | React Router v7 |
| 状态管理 | Zustand 5 + TanStack React Query |
| 表单 | React Hook Form + Zod |
| 本地存储 | Dexie (IndexedDB) |
| 记忆算法 | FSRS |
| 图标 | Lucide React |
| 字体 | Inter + JetBrains Mono + MiSans |

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/color-dream/evergrow-english.git
cd evergrow-english

# 安装依赖（需安装 Bun）
bun install

# 启动开发服务器
bun run dev

# 构建生产版本
bun run build

# 运行测试
bun run test
```

> **环境要求**：[Bun](https://bun.sh/) ≥ 1.0、Node.js ≥ 18

## 📁 项目结构

```
evergrow-english/
├── src/
│   ├── app/              # 应用入口 + Provider
│   │   └── providers/    # Theme / Audio / Query Provider
│   ├── components/
│   │   ├── layout/       # AppShell / Header / CenterLayout
│   │   ├── pages/        # LandingPage / LearningCenterHub
│   │   ├── vocabulary/   # 词库选择 / 沉浸学习
│   │   └── shared/       # 通用组件
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 常量 / 工具函数 / DB / FSRS
│   ├── stores/           # Zustand Store
│   ├── styles/           # 全局样式
│   └── types/            # TypeScript 类型
├── tests/                # 测试
├── .github/workflows/    # CI / CD
└── vite.config.ts
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/amazing-feature`
3. 提交更改：`git commit -m 'feat: 添加某功能'`
4. 推送分支：`git push origin feat/amazing-feature`
5. 提交 Pull Request

## 📄 许可

本项目基于 [MIT License](LICENSE) 开源。

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/color-dream">color-dream</a>
</p>
