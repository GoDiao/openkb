---
assignee: ''
branch: main
created: '2026-05-20'
id: 009
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P2
related_files:
- web/src/pages/project/PlanPage.tsx
- web/src/components/TaskSidebar.tsx
- web/src/components/Modal.tsx
status: done
tags:
- ui
- quick-win
- phase-5c
title: '[UI-QW-4] 交互细节：Plan目录scroll、Esc关闭、TaskSidebar debounce'
updated: '2026-05-20T07:08:12Z'
---

## Goal
补齐高频交互细节，减少误操作与无反馈编辑。

## Acceptance
- [ ] Plan 页左侧目录点击后 scroll-to-section（锚点平滑滚动 + 当前节高亮）
- [ ] Modal / TaskSidebar 支持 Esc 关闭（焦点陷阱内优先）
- [ ] TaskSidebar 标题编辑 blur 时 debounce 保存（避免每键 PATCH）

## Context
Designer UX 评审 Quick Wins #7/#9/#10。

## Notes
- 2026-05-20 由 cursor-agent 从 UX 评审结论创建（Phase 5c）