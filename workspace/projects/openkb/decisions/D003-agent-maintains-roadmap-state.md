---
phases: [p6]
---

# D003: Agent 自动维护 Roadmap / STATE / Next

**Status:** Accepted  
**Date:** 2026-05-20

## Context

多 Agent 并行开发时需要高度自动化，减少人类手工改 YAML/Markdown。用户明确要求：Roadmap、Next、Kanban 状态主要由 Agent 通过 CLI 维护。

## Decision

### Agent 必读 Roadmap

- 会话开始执行 `openkb context --json`（含 roadmap 摘要）和 `openkb roadmap --json`。
- Skill `skill/openkb-sync/SKILL.md` 规定此流程。

### Roadmap 由 Agent 通过 CLI 更新

- `openkb roadmap complete <phase_id>` — 标记阶段完成，并激活依赖已满足的 pending 阶段。
- `openkb roadmap set <phase_id> <status>` — 手动调整状态。
- 禁止 Agent 为 **运行态** 直接编辑 `board/*`、`STATE.md`（用 CLI）。**roadmap.yaml 结构与 decisions 由 Agent 直接撰写**（见 D004）。

### Next 列表自动推进

- `openkb done` 成功后，**自动移除 STATE Next 的第一项**。
- Agent 可用 `openkb state set --next ...` 批量重写 Next。

### Phase 与 Task 联动

- `roadmap.yaml` 中 phase 可选 `tasks: ["001", "002"]`。
- 当其中最后一个 task `done` 时，**自动**将该 phase 标为 `done` 并激活下游 phase。

### 分工

| 维度 | Agent | Human (UI) |
|------|-------|------------|
| Kanban / 锁 | CLI | 可 override |
| STATE Summary/Next | CLI 主维护 | 可编辑 |
| Roadmap phase 状态 | CLI complete/set + done 联动 | 只读展示 |
| Roadmap phase 结构 | **直接写 roadmap.yaml** | 只读展示 |
| Spec / Plan 正文 | **直接写业务 repo 文件** + set-docs | 可编辑 |
| Decisions | **直接写 decisions/*.md** | 定稿拍板 |

详见 D004：禁止 Plan→Roadmap 机械 bootstrap。

## Consequences

- `done` API/CLI 响应增加 `removed_next_item`、`phases_completed`、`phases_activated`。
- 新增 CLI：`roadmap`、`state set`。
- Agent Skill 成为 onboarding 单一入口。
