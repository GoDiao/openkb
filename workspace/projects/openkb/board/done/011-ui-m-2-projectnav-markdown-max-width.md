---
assignee: ''
branch: main
created: '2026-05-20'
id: '011'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P2
related_files:
- web/src/components/ProjectNav.tsx
- web/src/pages/project/SpecPage.tsx
- web/src/pages/project/PlanPage.tsx
status: done
tags:
- ui
- medium
- phase-5c
title: '[UI-M-2] 移动端与阅读：ProjectNav折叠、Markdown max-width'
updated: '2026-05-20T07:08:15Z'
---

## Goal
窄屏可用 + 长文可读性：Hub 在笔记本与平板宽度下仍能有效导航与阅读 Spec/Plan。

## Acceptance
- [ ] ProjectNav 在 `<768px` 折叠为汉堡菜单或底部 Tab
- [ ] Spec/Plan Markdown 正文 `max-width: ~72ch`，居中或左对齐留白
- [ ] ProjectCard（项目列表）可选展示健康指标：active phase、blocker 点

## Context
Designer UX 评审 Medium：移动端 Nav、ProjectCard 健康指标、阅读宽度。

## Notes
- 2026-05-20 由 cursor-agent 从 UX 评审结论创建（Phase 5c）