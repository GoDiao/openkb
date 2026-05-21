---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '025'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P3
related_files:
- workspace/projects/openkb/decisions/
- web/src/pages/project/DecisionsPage.tsx
- web/src/components/roadmap/RoadmapGraph.tsx
status: done
tags:
- traceability
- phase-11
title: '[TRACE-1] ADR ↔ phase 双向链接'
updated: '2026-05-20T18:27:51Z'
---

## Goal
决策与实施闭环：ADR 声明关联 phase；Decisions 页显示 phase chip；Graph 已有 decision 链。

## Acceptance
- [ ] ADR frontmatter 或正文约定 `phases: [p5c]` 字段
- [ ] Decisions 列表/详情显示关联 phase，可链到 graph#phase
- [ ] doc_service 解析 phases 供 API（若需要）

## Context
PM 评审 P3 建议项 #4。

## Notes
- 2026-05-20 Phase 11