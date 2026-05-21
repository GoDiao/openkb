---
assignee: ''
branch: main
created: '2026-05-20'
id: '010'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P2
related_files:
- web/src/components/
- web/src/pages/project/GraphPage.tsx
- web/src/pages/project/OverviewPage.tsx
status: done
tags:
- ui
- medium
- phase-5c
title: '[UI-M-1] 组件与布局：EmptyState、StatePanel整合、Graph图例token'
updated: '2026-05-20T07:08:14Z'
---

## Goal
抽取可复用 UI 基元，整合 STATE 编辑体验，Graph 视觉与 design token 对齐。

## Acceptance
- [ ] 新增 `EmptyState` / `Skeleton` 共享组件并在 Kanban、Decisions、Graph 复用
- [ ] Overview 右侧 STATE 与 Next 编辑整合为 `StatePanel`（减少重复 API 调用）
- [ ] Graph 节点/边颜色使用 CSS 变量（双主题一致），可选图例说明 phase 状态

## Context
Designer UX 评审 Medium 项。可在 006–009 完成后批量 refactor。

## Notes
- 2026-05-20 由 cursor-agent 从 UX 评审结论创建（Phase 5c）