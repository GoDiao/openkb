---
assignee: ''
branch: main
created: '2026-05-20'
id: '007'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P1
related_files:
- web/src/components/ThemeToggle.tsx
- web/src/pages/project/OverviewPage.tsx
status: done
tags:
- ui
- quick-win
- phase-5c
title: '[UI-QW-2] 术语与品牌：全站中英文统一、主题切换 tooltip'
updated: '2026-05-20T07:08:09Z'
---

## Goal
消除中英混用造成的认知负担，统一 OpenKB 产品术语与主题切换提示。

## Acceptance
- [ ] 全站统一术语表：Frontier→前沿 / Next→下一步 / STATE→项目状态 等（Overview、Kanban、STATE 面板一致）
- [ ] 主题切换按钮 tooltip：晨光 / 静夜（或等价中文文案）
- [ ] 空 Tab 或占位文案不再出现裸英文 slug

## Context
Designer UX 评审 Quick Wins #3/#8。与 D002 Overview 优先策略一致。

## Notes
- 2026-05-20 由 cursor-agent 从 UX 评审结论创建（Phase 5c）