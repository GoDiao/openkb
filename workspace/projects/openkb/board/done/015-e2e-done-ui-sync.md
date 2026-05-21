---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '015'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P0
related_files:
- web/src/hooks/
- server/src/openkb/task_service.py
status: done
tags:
- e2e
- phase-7
title: '[E2E-3] done 后 UI 3s 内同步 STATE/Kanban/Roadmap'
updated: '2026-05-20T16:52:13Z'
---

## Goal
Agent CLI `done` 或 move 后，Web UI 在 3 秒内反映 Kanban、STATE、roadmap phase 变化。

## Acceptance
- [ ] Playwright 或 API+poll：CLI 将任务移至 done → UI Kanban 3s 内更新
- [ ] phase 内全部 task done → roadmap phase 自动 complete 在 UI 可见（Graph/Overview）
- [ ] STATE.md active_task / Recent Done 与 UI 一致

## Context
PM 评审 P0。005 核心验收项之一。

## Notes
- 2026-05-20 自 005 拆分