---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '028'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P2
related_files:
- server/src/openkb/task_service.py
- server/src/openkb/api/routes/tasks.py
- server/src/openkb/cli/main.py
- tests/test_api.py
- tests/test_cli.py
status: done
tags:
- maint
- api
- e2e
title: '[MAINT] Task delete API / CLI（测试与清理）'
updated: '2026-05-20T20:00:00Z'
---

## Goal

提供 `DELETE /api/projects/{slug}/tasks/{id}` 与 `openkb task delete <id>`，便于 E2E 探针清理与误建任务回收；替代仅依赖 filesystem glob cleanup。

## Acceptance

- [x] 仅允许删除 backlog/todo/doing/review（禁止删 done 或需 `--force`）
- [x] lock 冲突时 409；集成测试 + CLI 测试
- [x] E2E globalTeardown 可改用 API delete（可选）

## Context

E2E 同步测试曾污染 openkb 看板 026–043；当前用 Playwright setup/teardown 删文件。

## Notes

- 2026-05-20 完成：`openkb task delete` + DELETE API + tests
