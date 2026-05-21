# OpenKB Agent Patch 格式规范

版本：**v1** · Patch ID：`openkb-onboarding`

## 目标

在 **Coding Agent 根配置**（`AGENTS.md` / `CLAUDE.md` 等）中嵌入可幂等安装、可一键卸载的 OpenKB 说明块。  
**不**写入业务 repo；由 OpenKB 安装器统一管理。

## Marker 块（必须完整匹配）

```markdown
<!-- openkb:patch v=1 id=openkb-onboarding begin -->
（Markdown 正文，UTF-8）
<!-- openkb:patch v=1 id=openkb-onboarding end -->
```

| 字段 | 规则 |
|------|------|
| `v` | 整数，与 `agent/manifest.yaml` 中 `patch.version` 一致 |
| `id` | 与 `patch.id` 一致，卸载/升级时精确匹配 |
| `begin` / `end` | 各占一行，前后无其它字符 |

## 安装规则

1. **已存在同 id 块**：整段替换（升级 patch 版本时更新 `v=` 与正文）。
2. **文件存在、无块**：在文件末尾追加 `\n\n` + 块。
3. **文件不存在、父目录存在**：创建文件，可选文件头注释 + 块。
4. **记录状态**：`agent/install-state.json` 记录 `target_id`、绝对路径、版本、时间。

## 卸载规则

1. 删除匹配 `id=openkb-onboarding` 的 begin…end 块（含 marker 行）。
2. 若文件只剩空白，保留空文件或仅留一行说明（不自动删文件，避免误伤）。
3. 从 `install-state.json` 移除对应条目。

## 正文占位符

安装时将 `{OPENKB_ROOT}` 替换为当前 `OPENKB_ROOT` 绝对路径（正斜杠）。

## CLI

```powershell
openkb agent scan              # 检测 ~/ 下常见 Agent 配置路径
openkb agent install           # 交互式选择目标
openkb agent install --all -y  # 全部可用目标
openkb agent uninstall --all -y
openkb agent status
openkb agent print-patch       # 输出块内容（调试）
```
