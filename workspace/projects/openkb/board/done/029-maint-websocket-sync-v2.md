---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '029'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P3
related_files:
- server/src/openkb/watch_service.py
- server/src/openkb/api/routes/watch.py
- web/src/hooks/useProjectWatch.ts
- web/src/hooks/useBoard.ts
- README.md
status: done
tags:
- maint
- sync
- websocket
title: '[MAINT] 实时同步 WebSocket（V2，替代 2s 轮询）'
updated: '2026-05-20T20:00:00Z'
---

## Goal

Agent CLI 写入后 Hub 近实时刷新，无需 2s polling；保留 polling 作 fallback。

## Acceptance

- [x] FastAPI WebSocket `/api/projects/{slug}/watch` 广播 board/state/roadmap 变更
- [x] CLI / API mutation 后 publish 事件
- [x] 前端 `useProjectWatch` 订阅 + invalidate queries
- [x] ADR 或 Help 说明 V1 polling → V2 WS

## Context

Phase 8 用 invalidate + 2s poll 作为 V1 折中；README 已注明无 WebSocket。

## Notes

- 2026-05-20 完成：WS + HTTP notify（CLI 跨进程）+ 30s fallback poll
