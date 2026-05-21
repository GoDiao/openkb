---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '013'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P0
related_files:
- web/
- tests/e2e/
status: done
tags:
- e2e
- phase-7
title: '[E2E-1] Playwright 基础设施 + Kanban 拖拽 + 主题持久化'
updated: '2026-05-20T16:45:35Z'
---

## Goal
建立可重复的 Web E2E 基线：Playwright 配置、CI 可跑、覆盖 Kanban 拖拽与明暗主题持久化。

## Acceptance
- [x] `web/` 可 `npm run test:e2e`（Playwright 配置 + e2e/hub.spec.ts）
- [x] 用例：Kanban 拖拽（pointer 模拟 + waitForResponse /move）
- [x] 用例：主题切换持久化（hub.spec.ts）
- [x] README 注明 E2E 前置与 PLAYWRIGHT_BROWSERS_PATH

## Context
PM 评审 P0。自原 005 拆分。依赖 API 8788 + web 5175。

## Notes
- 2026-05-20 scaffold：playwright.config.ts、testid、hub.spec.ts；Chromium 下载至 E:\playwright-browsers