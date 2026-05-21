---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '014'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P0
related_files:
- server/src/openkb/task_service.py
- tests/
status: done
tags:
- e2e
- phase-7
- cli
title: '[E2E-2] CLI checkout / lock 冲突与过期'
updated: '2026-05-20T16:52:11Z'
---

## Goal
验证多 Agent 场景下 task lock 的 checkout、冲突拒绝、过期后可再 checkout。

## Acceptance
- [ ] 集成测试或脚本：Agent A checkout task → Agent B checkout 同 task 失败并返回明确错误
- [ ] lock 过期（或 mock TTL）后可被 Agent B checkout
- [ ] `openkb status` / board API 反映 locked_by、lock_expires

## Context
PM 评审 P0 / 多 Agent 核心。可与 pytest 集成，不必 Playwright。

## Notes
- 2026-05-20 自 005 拆分