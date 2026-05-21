from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from openkb.config import OpenKBConfig
from openkb.errors import OpenKBError
from openkb.models import RoadmapModel, RoadmapPhase, StateModel
from openkb.project_service import BOARD_COLUMNS, read_project, write_project_yaml
from openkb.roadmap_service import read_roadmap, write_roadmap
from openkb.state_service import write_state

DEFAULT_SPEC_REL = "docs/spec.md"
DEFAULT_PLAN_REL = "docs/plan.md"
TODO_MARKER = "[TODO:"


def spec_template(name: str, slug: str) -> str:
    return f"""# {name} — Design Spec

**Status:** Draft
**Project slug:** `{slug}`

> Agent：与用户讨论定稿后，替换下方 `[TODO: …]` 段落；定稿后将 Status 改为 Approved。

## Problem

[TODO: 要解决什么问题？]

## Goals

[TODO: V1 目标列表]

## Non-Goals

[TODO: 明确不做什么]

## Architecture

[TODO: 架构概览、关键模块、数据流]

## OpenKB 约定（可选）

[TODO: repo_path、分支策略、Agent 协作约定]
"""


def plan_template(name: str, slug: str, spec_rel: str) -> str:
    return f"""# {name} — Implementation Plan

**Status:** Draft
**Spec:** `{spec_rel}`

> Agent：讨论出实施步骤后更新本文；phase 标题建议与 `roadmap.yaml` 的 `plan_ref` 一致。

## Goal

[TODO: 一句话交付目标]

## Phase 0: 准备

[TODO: 环境、脚手架、首条 Kanban 任务]

## Phase 1: 核心功能

[TODO: 主要实现步骤]

## Phase 2: 验收

[TODO: 测试与 E2E 清单]
"""


def decision_readme_template(name: str) -> str:
    return f"""# Decisions — {name}

本目录存放架构/产品决策（`D001-简短标题.md`）。

**Status:** 模板说明文件，不是正式决策。

Agent 在讨论中做出重要抉择时，新建 `D001-….md`，格式：

```markdown
# D001: 标题
**Status:** Accepted | Proposed
**Date:** YYYY-MM-DD

## Context
## Decision
## Consequences
```
"""


def roadmap_template(name: str) -> RoadmapModel:
    return RoadmapModel(
        phases=[
            RoadmapPhase(
                id="spec",
                title="Spec 定稿",
                status="active",
                depends_on=[],
                plan_ref="Spec",
            ),
            RoadmapPhase(
                id="plan",
                title="Plan 定稿",
                status="pending",
                depends_on=["spec"],
                plan_ref="Plan",
            ),
            RoadmapPhase(
                id="build",
                title="开发与验收",
                status="pending",
                depends_on=["plan"],
                plan_ref="Build",
            ),
        ]
    )


def initial_state(name: str) -> StateModel:
    return StateModel(
        summary=f"[TODO: {name} 项目刚创建，补充一句话现状]",
        next_items=[
            "完成 Spec（编辑 docs/spec.md，去掉 [TODO]）",
            "完成 Plan（编辑 docs/plan.md，去掉 [TODO]）",
            "有架构抉择时新增 decisions/D00N-….md",
            "openkb task create 创建首条开发任务",
        ],
        watch_out=["Spec/Plan 定稿前勿大规模写代码"],
    )


@dataclass
class ScaffoldResult:
    slug: str
    repo_path: str
    created_files: list[str] = field(default_factory=list)
    pending: list[dict[str, str]] = field(default_factory=list)


def _has_todos(text: str) -> bool:
    return TODO_MARKER in text


def create_project_scaffold(
    cfg: OpenKBConfig,
    slug: str,
    name: str,
    repo_path: str,
    *,
    description: str = "",
    spec_rel: str = DEFAULT_SPEC_REL,
    plan_rel: str = DEFAULT_PLAN_REL,
    write_repo_templates: bool = True,
) -> ScaffoldResult:
    pdir = cfg.project_dir(slug)
    if pdir.exists() and (pdir / "project.yaml").is_file():
        raise OpenKBError(f"Project already exists: {slug}")

    repo = Path(repo_path).resolve()
    repo.mkdir(parents=True, exist_ok=True)

    for col in BOARD_COLUMNS:
        (pdir / "board" / col).mkdir(parents=True, exist_ok=True)
    (pdir / "decisions").mkdir(exist_ok=True)
    (pdir / "sessions").mkdir(exist_ok=True)

    created: list[str] = []

    if write_repo_templates:
        spec_path = repo / spec_rel
        plan_path = repo / plan_rel
        spec_path.parent.mkdir(parents=True, exist_ok=True)
        if not spec_path.is_file():
            spec_path.write_text(spec_template(name, slug), encoding="utf-8")
            created.append(str(spec_path))
        if not plan_path.is_file():
            plan_path.write_text(plan_template(name, slug, spec_rel), encoding="utf-8")
            created.append(str(plan_path))

    readme = pdir / "decisions" / "_README.md"
    if not readme.is_file():
        readme.write_text(decision_readme_template(name), encoding="utf-8")
        created.append(str(readme.relative_to(pdir)).replace("\\", "/"))

    write_project_yaml(
        cfg.root,
        slug,
        name=name,
        repo_path=str(repo),
        description=description,
        docs={"spec": spec_rel.replace("\\", "/"), "plan": plan_rel.replace("\\", "/")},
    )
    created.append(f"workspace/projects/{slug}/project.yaml")

    write_state(pdir / "STATE.md", initial_state(name), project_slug=slug)
    created.append(f"workspace/projects/{slug}/STATE.md")

    write_roadmap(cfg, slug, roadmap_template(name))
    created.append(f"workspace/projects/{slug}/roadmap.yaml")

    pending = compute_project_pending(cfg, slug)
    return ScaffoldResult(
        slug=slug,
        repo_path=str(repo),
        created_files=created,
        pending=pending,
    )


def compute_project_pending(cfg: OpenKBConfig, slug: str) -> list[dict[str, str]]:
    project = read_project(cfg, slug)
    items: list[dict[str, str]] = []
    repo = Path(project.repo_path)

    for kind, rel in (("spec", project.docs.spec), ("plan", project.docs.plan)):
        if not rel:
            items.append(
                {
                    "id": kind,
                    "status": "missing_config",
                    "path": "",
                    "action": f"openkb project set-docs --{kind} <path>",
                }
            )
            continue
        path = repo / rel
        if not path.is_file():
            items.append(
                {
                    "id": kind,
                    "status": "missing_file",
                    "path": rel,
                    "action": f"Agent 创建 {rel} 并登记路径",
                }
            )
        elif _has_todos(path.read_text(encoding="utf-8")):
            items.append(
                {
                    "id": kind,
                    "status": "template",
                    "path": rel,
                    "action": "Agent 与用户讨论后替换 [TODO] 内容",
                }
            )

    decisions_dir = cfg.project_dir(slug) / "decisions"
    decision_files = [f for f in decisions_dir.glob("D*.md") if f.is_file()]
    if not decision_files:
        items.append(
            {
                "id": "decisions",
                "status": "empty",
                "path": "decisions/",
                "action": "有抉择时 Agent 写 D001-标题.md",
            }
        )

    roadmap = read_roadmap(cfg, slug)
    for phase in roadmap.phases:
        if phase.status in ("active", "pending"):
            items.append(
                {
                    "id": f"roadmap:{phase.id}",
                    "status": phase.status,
                    "path": phase.title,
                    "action": f"完成后 openkb roadmap complete {phase.id}",
                }
            )

    from openkb import task_service

    board = task_service.list_board(cfg, slug)
    if sum(len(tasks) for tasks in board.values()) == 0:
        items.append(
            {
                "id": "kanban",
                "status": "empty",
                "path": "board/",
                "action": "openkb task create --title '…'",
            }
        )

    state_path = cfg.project_dir(slug) / "STATE.md"
    if state_path.is_file():
        from openkb.state_service import read_state

        state = read_state(state_path)
        if _has_todos(state.summary):
            items.append(
                {
                    "id": "state",
                    "status": "template",
                    "path": "STATE.md",
                    "action": "openkb state set --summary '…'",
                }
            )

    return items
