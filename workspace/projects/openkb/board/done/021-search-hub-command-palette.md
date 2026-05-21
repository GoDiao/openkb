---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '021'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P2
related_files:
- web/src/components/layout/CommandPalette.tsx
status: done
tags:
- ui
- search
- phase-9
title: '[SEARCH-1] Ctrl+K 全 Hub 搜索'
updated: '2026-05-20T18:05:06Z'
---

## Goal
命令面板扩展：除跳转外可搜 task 标题、phase、ADR、Plan 章节标题。

## Acceptance
- [ ] Ctrl+K 输入关键词返回 task / phase / decision / plan section 结果
- [ ] 选择结果跳转到 Kanban?task= / graph#phase / decisions# / plan#
- [ ] 空结果与 loading 态

## Context
PM 评审 P2 重要项 #1。

## Notes
- 2026-05-20 Phase 9