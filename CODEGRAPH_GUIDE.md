# CodeGraph 配置完成指南

## 当前状态
✅ **CodeGraph 已成功配置** 在你的 `evergrow-english` 项目中

### 已完成的配置：
1. **CodeGraph 已安装并索引项目**
   - 索引文件：59 个
   - 节点：456 个
   - 关系：1,082 条
   - 支持语言：TypeScript (37), TSX (21), JavaScript (1)

2. **Claude Code MCP 配置已更新**
   - 在 `~/.claude.json` 中添加了 CodeGraph MCP 服务
   - 配置为使用 `npx` 启动 CodeGraph 服务

3. **项目已同步**
   - 最新变更已同步到索引

## 在 VS Code + Claude Code 中使用

### 启动步骤：
1. 在 VS Code 中打开项目：`C:\Users\noahs\Documents\color-dream\evergrow-english`
2. 确保 Claude Code 插件已安装并启用
3. 重启 VS Code 或重新加载窗口（Ctrl+Shift+P → "Developer: Reload Window"）

### 验证 CodeGraph 是否工作：
在 Claude Code 聊天窗口中尝试以下查询：

1. **探索 App 组件**：
   ```
   帮我分析一下 App 组件的结构和依赖
   ```

2. **查找函数调用关系**：
   ```
   找出所有调用 handleLogin 的函数
   ```

3. **影响分析**：
   ```
   修改 UserService 会影响哪些文件？
   ```

### 可用的 MCP 工具：
Claude Code 现在可以通过 MCP 调用以下 CodeGraph 工具：

| 工具 | 用途 | 示例 |
|------|------|------|
| `codegraph_explore` | 探索符号定义和关系 | `codegraph_explore("App")` |
| `codegraph_search` | 全文搜索 | `codegraph_search("login")` |
| `codegraph_callers` | 查找调用者 | `codegraph_callers("handleLogin")` |
| `codegraph_callees` | 查找被调用者 | `codegraph_callees("UserService")` |
| `codegraph_impact` | 影响分析 | `codegraph_impact("UserService")` |
| `codegraph_context` | 为任务构建上下文 | `codegraph_context("重构认证模块")` |

## 日常使用建议

### 开发场景：
1. **理解新模块**：让 Claude Code 用 `codegraph_explore` 快速了解模块结构
2. **安全重构**：修改前先用 `codegraph_impact` 分析影响范围
3. **定位 Bug**：用 `codegraph_callers`/`codegraph_callees` 追踪调用链
4. **代码搜索**：用 `codegraph_search` 替代 `grep`，更智能的搜索

### 维护命令：
```bash
# 查看索引状态
npx @colbymchenry/codegraph status

# 同步变更（CodeGraph 会自动监听，但也可手动）
npx @colbymchenry/codegraph sync

# 搜索符号
npx @colbymchenry/codegraph query "组件名"
```

## 故障排除

### 如果 Claude Code 看不到 CodeGraph 工具：
1. **重启 VS Code**
2. **检查 MCP 配置**：确保 `~/.claude.json` 中的 `mcpServers` 配置正确
3. **手动启动服务**：
   ```bash
   cd C:\Users\noahs\Documents\color-dream\evergrow-english
   npx @colbymchenry/codegraph serve --mcp
   ```

### 索引问题：
```bash
# 重建索引
npx @colbymchenry/codegraph index

# 查看详细状态
npx @colbymchenry/codegraph status --verbose
```

## 性能预期
根据官方测试，接入 CodeGraph 后：
- 工具调用次数减少 70-94%
- 探索耗时提升 46-82%
- Token 消耗减少 35-78%

现在你的项目已经准备好享受 AI 编程的"地图导航"体验了！