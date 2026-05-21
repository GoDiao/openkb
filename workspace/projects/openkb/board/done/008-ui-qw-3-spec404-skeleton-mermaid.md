---
assignee: ''
branch: main
created: '2026-05-20'
id: 008
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P1
related_files:
- web/src/pages/project/SpecPage.tsx
- web/src/pages/project/PlanPage.tsx
- web/src/pages/project/GraphPage.tsx
status: done
tags:
- ui
- quick-win
- phase-5c
title: '[UI-QW-3] 空/错/加载态：Spec404升级、Skeleton、Mermaid占位'
updated: '2026-05-20T07:08:10Z'
---

## Goal
Spec/Plan/Graph 在加载、缺失、错误时给出可操作的反馈，而非空白或裸 JSON 错误。

## Acceptance
- [ ] Spec/Plan 404 或 API 失败时展示友好错误页（原因 + `openkb doc verify` 提示 + 重试按钮）
- [ ] Markdown 加载中显示 Skeleton（标题行 + 段落块）
- [ ] Mermaid 渲染前显示占位/Spinner，失败时显示源码折叠区

## Context
Designer UX 评审 Quick Wins #4/#6。依赖 `doc_service` 已从 `repo_path` 读 Spec/Plan。

## Notes
- 2026-05-20 由 cursor-agent 从 UX 评审结论创建（Phase 5c）