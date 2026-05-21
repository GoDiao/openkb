---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: 019
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P1
related_files:
- web/src/hooks/useBoard.ts
- web/src/hooks/useProjectHub.ts
- web/src/hooks/useState.ts
status: done
tags:
- ui
- sync
- phase-8
title: '[SYNC-2] mutation 后即时刷新（Kanban/STATE/Roadmap）'
updated: '2026-05-20T18:00:28Z'
---

## Goal
减少 5s 轮询带来的「Agent 刚 done 人还看到旧板」体感；关键写操作后立即 invalidate。

## Acceptance
- [ ] moveTask / createTask 成功后立即 refetch board + state + roadmap
- [ ] 文档说明：CLI 写入仍依赖轮询或手动刷新（可选：缩短 refetchInterval 至 2s）
- [ ] 与 015 E2E 用例不冲突

## Context
PM 评审 P1 重要项 #2。

## Notes
- 2026-05-20 Phase 8