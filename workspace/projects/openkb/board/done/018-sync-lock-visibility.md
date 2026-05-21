---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: 018
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P1
related_files:
- web/src/components/task/TaskSidebar.tsx
- web/src/components/board/
status: done
tags:
- ui
- multi-agent
- phase-8
title: '[SYNC-1] Kanban/TaskSidebar lock 可见性'
updated: '2026-05-20T18:00:23Z'
---

## Goal
人类在 Hub 上能一眼看到任务被谁 lock、何时过期，减少多 Agent 踩脚。

## Acceptance
- [ ] TaskCard 或 Sidebar 显示 locked_by、lock_expires（相对时间）
- [ ] lock 即将过期（如 <30min）视觉警告
- [ ] 无 lock 时不占位 clutter

## Context
PM 评审 P1 重要项 #6。

## Notes
- 2026-05-20 Phase 8