# Project State



> Read first, update last. Maintained by agents and humans via OpenKB.

> Last updated: 2026-05-20 by cursor-agent

> OpenKB path: `workspace/projects/openkb/`



## Now



- **Active task**: none

- **Owner**: —

- **Branch**: main

- **Blocker**: none



## Summary



Roadmap **p0–p11 完成**；维护项 **026–029 已完成**（CLI UTF-8、Kanban 文档、task delete、WebSocket V2）。



## Next



- 按需迭代；无 backlog 阻塞项



## Recent Done



- [x] 2026-05-20 [MAINT] WebSocket 实时同步 V2（029）

- [x] 2026-05-20 [MAINT] Task delete API/CLI（028）

- [x] 2026-05-20 [MAINT] Kanban 拖拽 vs CLI 文档（027）

- [x] 2026-05-20 [MAINT] Windows CLI UTF-8（026）

- [x] 2026-05-20 Phase 7–11 收尾（001–025 + 005）



## Decisions



- [D001] 中心化存储 → `decisions/D001-centralized-storage.md`

- [D002] Overview 优先（Graph 见 D006）→ `decisions/D002-overview-first-static-dag.md`

- [D005] 前端 UX 评审 Phase 5c → `decisions/D005-frontend-ux-review-2026-05-20.md`

- [D006] 交互 Roadmap Graph V2 → `decisions/D006-interactive-roadmap-graph.md`



## Watch Out



- 开发 API 8788；改后端需重启 `openkb serve`（WebSocket 在 serve 进程）

- E2E Chromium：`PLAYWRIGHT_BROWSERS_PATH=E:\playwright-browsers`

- Kanban 拖到 Done ≠ `openkb done`；Agent 必须用 CLI

- E2E 探针：Playwright setup/teardown 或 `openkb task delete`

