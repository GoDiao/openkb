---
phases: [p7, p10]
---

# D006: 交互式 Roadmap Graph V2

**Status:** Accepted  
**Date:** 2026-05-20  
**Supersedes:** D002 §2（DAG V1 静态 Mermaid）— Overview 优先、文档直达、decisions 仍有效

## Context

D002 规定 Roadmap 用静态 Mermaid flowchart。Phase 5c 后用户需要更细的关系图：phase 展开任务、链接 Plan/Decision/Kanban，且可缩放拖拽浏览长链 roadmap。

## Decision

1. **Graph 页主视图**：自定义 **DAG 画布**（`RoadmapGraph`），非 React Flow；按 `roadmap.yaml` 依赖分层 + 分叉布局。
2. **交互**：滚轮/控件缩放、拖拽平移；点击 phase 节点在 **画布上浮层** 展示详情（非页面底部面板）。
3. **链接**：弹层内 task → Kanban `?task=`；plan_ref → Plan `#anchor`；decisions → ADR `#id`。
4. **API**：`/api/projects/{slug}/roadmap` 返回 `enriched_phases`、`phase_depths`；Mermaid 降为 Graph 页折叠「导出视图」。
5. **roadmap.yaml** 扩展可选字段 `decisions: [D00x]`。

## Consequences

- 更新 Help/README 描述 Graph 交互；Agent 读 D006 而非 D002 的 Mermaid 条款。
- 前端 `roadmapNormalize.ts` 对旧 API 做 fallback。
- 后续 polish：引线、minimap、全 Hub 搜索见 Phase 10/9 任务。

## Related

- D002: `decisions/D002-overview-first-static-dag.md`
- D005: Phase 5c UX 评审
- 实现：`web/src/components/roadmap/RoadmapGraph.tsx`
