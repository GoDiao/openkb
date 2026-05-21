---
phases: [p5b]
---

# D002: 项目工作台 — Overview 优先 + 静态 DAG

**Date:** 2026-05-20  
**Status:** Accepted（Graph 渲染方式已由 **D006** 取代）  
**Context:** 单项目页仅 STATE + Kanban，管理维度不足；用户要求事无巨细的工程管理中枢。

> **Note (2026-05-20):** 下文 §2「静态 Mermaid DAG V1」已被 [D006](D006-interactive-roadmap-graph.md) 的交互画布 Graph 取代。Overview 默认入口、Spec/Plan/Decisions 路由不变。

## Decision

1. **默认入口**：进入 `/projects/:slug` 显示 **Overview**，Kanban 移至 `/projects/:slug/kanban` 子路由。
2. **DAG V1**（~~静态 Mermaid~~ → **见 D006 交互 Graph**）：使用 `roadmap.yaml` 定义 Phase 与依赖。
3. **文档直达**：Spec / Plan 在 SPA 内 Markdown 渲染；Plan 解析 Phase/Task 为可导航索引。
4. **决策记录**：所有产品/架构决策写入 `workspace/projects/{slug}/decisions/D*.md`，供后续 Agent 与人类查阅。

## Consequences

- 项目 SPA 路由：`overview | kanban | spec | plan | graph`
- `project.yaml` 增加 `docs.spec` / `docs.plan` 指向 repo 内 markdown
- 新增 API：`/api/projects/{slug}/docs/{kind}`、`/api/projects/{slug}/roadmap`
- Agent Skill 后续需更新：会话开始读 Overview 摘要 + roadmap 状态

## Related

- Spec: `docs/superpowers/specs/2026-05-20-openkb-design.md`
- Plan: `docs/superpowers/plans/2026-05-20-openkb.md`
