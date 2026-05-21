---
assignee: ''
branch: main
created: '2026-05-20'
id: '006'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P1
related_files:
- web/src/pages/project/OverviewPage.tsx
- web/src/components/AppShell.tsx
status: done
tags:
- ui
- quick-win
- phase-5c
title: '[UI-QW-1] Overview与导航：面包屑、列名中文化、Recent Done、blocker高亮'
updated: '2026-05-20T07:08:07Z'
---

## Goal
提升 Project Hub 首屏信息架构：用户进入项目后立刻知道「在哪、看什么、卡在哪」。

## Acceptance
- [ ] Overview Kanban 列名使用 `COLUMN_LABELS` 中文化（Backlog→待办 等）
- [ ] `AppShell` 增加面包屑：Projects → 项目名 → 当前 Tab
- [ ] Overview 展示 `recent_done`（最近完成，可折叠）
- [ ] STATE 中 `blocker` 非空时在 Overview 顶部高亮告警条

## Context
Designer UX 评审 Quick Wins #1/#2/#5。来源：`decisions/D005-frontend-ux-review-2026-05-20.md`。

## Notes
- 2026-05-20 由 cursor-agent 从 UX 评审结论创建（Phase 5c）