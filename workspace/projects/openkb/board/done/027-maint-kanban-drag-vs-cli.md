---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '027'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P2
related_files:
- web/src/pages/HelpPage.tsx
- web/src/i18n/en.ts
- web/src/i18n/zh-CN.ts
- web/src/pages/project/KanbanPage.tsx
- skill/openkb-sync/SKILL.md
- README.md
status: done
tags:
- maint
- docs
- kanban
title: '[MAINT] 文档：Kanban 人工拖拽 vs CLI done 副作用'
updated: '2026-05-20T20:00:00Z'
---

## Goal

Help / skill 明确说明：UI 拖拽只改列与 task 文件；不会自动更新 STATE、lock、roadmap、session。Agent 应使用 CLI `checkout` / `done`。

## Acceptance

- [x] Help 新增一小节（中英）：拖拽 vs CLI 差异表
- [x] skill `openkb-sync` 或 README 链到 Help
- [x] 可选：拖拽到 done 时 UI 提示「未写 STATE / session」

## Context

用户曾问 Kanban 拖拽对 Agent 的影响；当前行为正确但未文档化。

## Notes

- 2026-05-20 完成
