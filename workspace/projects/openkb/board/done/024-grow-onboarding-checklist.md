---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '024'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P3
related_files:
- web/src/pages/ProjectListPage.tsx
- web/src/pages/project/OverviewPage.tsx
status: done
tags:
- ui
- onboarding
- phase-11
title: '[GROW-1] Onboarding checklist（项目列表 + Overview）'
updated: '2026-05-20T18:27:49Z'
---

## Goal
30 秒上手：新用户看到「装 patch → 建项目 → 看 Overview → 指派 Agent」步骤清单。

## Acceptance
- [ ] 项目列表空态或首项目 Overview 显示可勾选 checklist（localStorage 进度）
- [ ] 每步链到 /help 对应段或复制 CLI 命令
- [ ] 完成后可 dismiss

## Context
PM 评审 P3。

## Notes
- 2026-05-20 Phase 11