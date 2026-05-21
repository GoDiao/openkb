---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '016'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P0
related_files:
- server/src/openkb/doc_service.py
- web/src/pages/project/SpecPage.tsx
- web/src/pages/project/PlanPage.tsx
status: done
tags:
- e2e
- phase-7
title: '[E2E-4] doc verify + Hub Spec/Plan 从 repo_path 加载'
updated: '2026-05-20T16:52:15Z'
---

## Goal
端到端验证业务仓 Spec/Plan 路径配置正确时，CLI verify 与 Hub 页面均可加载。

## Acceptance
- [ ] `openkb doc verify` 对 openkb 项目返回成功（或 documented 预期）
- [ ] Playwright：Spec/Plan 页显示 markdown 内容，非 DocErrorPanel
- [ ] project.yaml docs.spec / docs.plan 路径错误时 UI 错误页可测

## Context
PM 评审 P0。005 最后一项。

## Notes
- 2026-05-20 自 005 拆分