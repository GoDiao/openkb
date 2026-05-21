---
phases: [p6]
---

# D004: Agent 执笔内容资产，禁止机械 Bootstrap

**Status:** Accepted  
**Date:** 2026-05-20  
**Supersedes in part:** D003 中 Spec/Plan「人类专属、Agent 只读」表述

## Context

Spec/Plan 路径因项目而异，不一定来自 Superpowers。用户明确：**不要用代码从 Plan 解析生成 Roadmap/Kanban**——易错；Spec、Plan、Decision、流程图（roadmap）应由 **Agent 理解项目后直接撰写**。

## Decision

### 内容资产 → Agent 直接写文件

| 资产 | 位置 | 方式 |
|------|------|------|
| Spec | 业务 repo，`project.yaml` → `docs.spec` | Agent Write |
| Plan | 业务 repo，`docs.plan` | Agent Write |
| Decision | `workspace/projects/{slug}/decisions/` | Agent Write |
| Roadmap / DAG | `workspace/projects/{slug}/roadmap.yaml` | Agent Write |

`openkb project set-docs` **只登记路径**，不生成文档正文。

### 运行态 → Agent 用 CLI

| 资产 | 方式 |
|------|------|
| Kanban `board/*` | `task create/checkout/done` 等 |
| `STATE.md` | `state set` / `done` 副作用 |
| Roadmap phase **状态**推进 | `roadmap complete/set` 或 `done` 联动；**phase 结构**仍由 Agent 写 yaml |

### 明确不做

- 不提供、不使用「从 Plan 解析 Phase/Task 写入 roadmap/Kanban」的 bootstrap CLI
- OpenKB 不把 Plan Markdown 当作 roadmap 的 machine-readable 源

### 与 Superpowers

可选用于生成 Spec/Plan 初稿；登记路径后 Hub 展示。与 OpenKB 运行态无关。

## Consequences

- `openkb-sync` Skill 以「Agent 执笔 + CLI 运行态」为单一叙事
- Plan 页 phase ✓ 依赖 Agent 手写 `plan_ref` 与 Plan 标题一致，非自动同步
