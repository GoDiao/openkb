# Project State

> Read first, update last. Maintained by agents and humans via OpenKB.
> Last updated: 2026-05-20 00:00 by system
> OpenKB path: `workspace/projects/openkb/`

## Now

- **Active task**: none
- **Owner**: —
- **Branch**: main
- **Blocker**: none

## Summary

OpenKB 刚启动：中心化 workspace + API + Kanban UI + Agent Skill 协议。

## Next

1. 完成后端 API 与 checkout 锁
2. Kanban 前端 UI
3. 编写 openkb-sync Skill

## Recent Done

- [x] 2026-05-20 确定中心化架构与协议

## Decisions

- [D001] 中心化存储于 OpenKB/workspace → `decisions/D001-centralized-storage.md`

## Watch Out

- 所有 agent 写状态到 OpenKB，不要各项目散落 .openkb/
