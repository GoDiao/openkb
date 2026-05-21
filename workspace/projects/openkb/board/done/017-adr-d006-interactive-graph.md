---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '017'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P0
related_files:
- workspace/projects/openkb/decisions/D006-interactive-roadmap-graph.md
- workspace/projects/openkb/decisions/D002-overview-first-static-dag.md
- README.md
- web/src/i18n/en.ts
- web/src/i18n/zh-CN.ts
status: done
tags:
- adr
- docs
- phase-7
title: '[ADR-1] D006 交互 Graph V2 + 更新 D002/Help/README'
updated: '2026-05-20T16:05:00Z'
---

## Goal

文档与实现一致：交互 DAG、画布缩放/拖拽、节点弹层详情；D002 标注 superseded。

## Acceptance

- [x] 新增 `decisions/D006-interactive-roadmap-graph.md`
- [x] D002 顶部注明已被 D006 部分取代（静态 Mermaid → 交互 Graph）
- [x] Help i18n `help.pages.graph` 描述缩放/弹层/Plan·Task·Decision 链接
- [x] README Web UI 段提及 Roadmap 交互图

## Context

PM 评审阻断项 #2。

## Notes

- 2026-05-20 完成
