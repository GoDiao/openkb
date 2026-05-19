---

## id: "001"
title: 实现 FastAPI 后端与文件存储层
status: todo
priority: P0
assignee: ""
branch: main
created: "2026-05-20"
updated: "2026-05-20T00:00:00Z"
locked_by: ""
locked_at: ""
lock_expires: ""
tags: [backend, api]
related_files:
  - server/src/openkb/main.py

## Goal

提供 REST API 读写中心化 workspace，支持任务 CRUD、列移动、checkout 锁。

## Acceptance

- GET/POST projects
- 任务 CRUD + move column
- checkout / release 带 TTL 锁
- STATE.md 读写

## Context

见 decisions/D001-centralized-storage.md

## Notes