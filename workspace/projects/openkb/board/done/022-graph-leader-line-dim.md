---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '022'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P2
related_files:
- web/src/components/roadmap/RoadmapGraph.tsx
status: done
tags:
- ui
- graph
- phase-10
title: '[GRAPH-1] 弹层引线 + 选中 dim 非相关节点'
updated: '2026-05-20T18:27:45Z'
---

## Goal
Graph 视觉关联更强：选中 phase 时弹层与节点有引线，非相关节点/边降 opacity。

## Acceptance
- [ ] 选中节点时 SVG 或 overlay 绘制 node→popover 引线
- [ ] 非选中且无关节点 opacity ~0.35，相关边高亮
- [ ] 缩放/拖拽后引线位置正确更新

## Context
PM 评审 P2 / 设计重要项 #3。

## Notes
- 2026-05-20 Phase 10