from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

from openkb.config import OpenKBConfig
from openkb.errors import NotFoundError
from openkb.models import PhaseStatus, RoadmapModel, RoadmapPhase
from openkb.project_service import read_project

_STATUS_STYLE = {
    "done": "fill:#7eb09a,stroke:#5a8f76,color:#1c1b19",
    "active": "fill:#c9a87c,stroke:#9a7b4f,color:#1c1b19",
    "pending": "fill:#8b909a,stroke:#6b6560,color:#fff",
    "blocked": "fill:#d4847f,stroke:#c45c56,color:#fff",
}


def read_roadmap(cfg: OpenKBConfig, slug: str) -> RoadmapModel:
    read_project(cfg, slug)
    path = cfg.project_dir(slug) / "roadmap.yaml"
    if not path.is_file():
        return RoadmapModel()
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return RoadmapModel.model_validate(data)


def _slugify_plan_anchor(text: str) -> str:
    import re

    lowered = text.strip().lower()
    lowered = re.sub(r"[^\w\u4e00-\u9fff]+", "-", lowered)
    return lowered.strip("-")


def _task_index(cfg: OpenKBConfig, slug: str) -> dict[str, dict]:
    from openkb import task_service

    board = task_service.list_board(cfg, slug)
    index: dict[str, dict] = {}
    for column, tasks in board.items():
        for task in tasks:
            index[task.id] = {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
            }
    return index


def _decision_index(cfg: OpenKBConfig, slug: str) -> dict[str, dict]:
    from openkb import doc_service

    index: dict[str, dict] = {}
    for item in doc_service.list_decisions(cfg, slug):
        index[item["id"]] = {"id": item["id"], "title": item.get("title", item["id"])}
    return index


def enrich_phases(cfg: OpenKBConfig, slug: str, roadmap: RoadmapModel) -> list[dict]:
    tasks_by_id = _task_index(cfg, slug)
    decisions_by_id = _decision_index(cfg, slug)
    enriched: list[dict] = []
    for phase in roadmap.phases:
        task_details: list[dict] = []
        for tid in phase.tasks:
            if tid in tasks_by_id:
                task_details.append(tasks_by_id[tid])
            else:
                task_details.append({"id": tid, "title": tid, "status": "backlog", "priority": "P2"})
        decision_details: list[dict] = []
        for did in phase.decisions:
            if did in decisions_by_id:
                decision_details.append(decisions_by_id[did])
            else:
                decision_details.append({"id": did, "title": did})
        plan_anchor = _slugify_plan_anchor(phase.plan_ref or phase.title)
        enriched.append(
            {
                **phase.model_dump(),
                "task_details": task_details,
                "decision_details": decision_details,
                "plan_anchor": plan_anchor,
            }
        )
    return enriched


def phase_depths(phases: list[RoadmapPhase]) -> dict[str, int]:
    by_id = {p.id: p for p in phases}
    memo: dict[str, int] = {}

    def depth(phase_id: str) -> int:
        if phase_id in memo:
            return memo[phase_id]
        phase = by_id.get(phase_id)
        if phase is None or not phase.depends_on:
            memo[phase_id] = 0
        else:
            memo[phase_id] = 1 + max(depth(dep) for dep in phase.depends_on if dep in by_id)
        return memo[phase_id]

    for p in phases:
        depth(p.id)
    return memo


def roadmap_to_mermaid(roadmap: RoadmapModel, task_titles: dict[str, str] | None = None) -> str:
    if not roadmap.phases:
        return "flowchart TB\n  empty[\"No roadmap yet\"]"

    lines = ["flowchart TB"]
    for phase in roadmap.phases:
        label = phase.title.replace('"', "'")
        lines.append(f'  subgraph {phase.id}["{label}"]')
        lines.append("    direction TB")
        if phase.tasks:
            for tid in phase.tasks:
                short = (task_titles or {}).get(tid, tid)
                short = short.replace('"', "'")
                if len(short) > 28:
                    short = f"{short[:25]}…"
                lines.append(f'    {phase.id}__{tid}["{tid} · {short}"]')
        else:
            lines.append(f'    {phase.id}__core["phase"]')
        lines.append("  end")

    for phase in roadmap.phases:
        for dep in phase.depends_on:
            lines.append(f"  {dep} --> {phase.id}")

    for phase in roadmap.phases:
        style = _STATUS_STYLE.get(phase.status, _STATUS_STYLE["pending"])
        lines.append(f"  style {phase.id} {style}")

    return "\n".join(lines)


def roadmap_progress(roadmap: RoadmapModel) -> dict[str, int | float]:
    total = len(roadmap.phases)
    if total == 0:
        return {"total": 0, "done": 0, "active": 0, "percent": 0.0}
    done = sum(1 for p in roadmap.phases if p.status == "done")
    active = sum(1 for p in roadmap.phases if p.status == "active")
    return {
        "total": total,
        "done": done,
        "active": active,
        "percent": round(done / total * 100, 1),
    }


def _roadmap_path(cfg: OpenKBConfig, slug: str) -> Path:
    return cfg.project_dir(slug) / "roadmap.yaml"


def write_roadmap(cfg: OpenKBConfig, slug: str, roadmap: RoadmapModel) -> None:
    read_project(cfg, slug)
    path = _roadmap_path(cfg, slug)
    data = roadmap.model_dump(exclude_none=True)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        yaml.safe_dump(data, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )
    from openkb.watch_service import notify_project_change

    notify_project_change(slug, ["roadmap"])


def get_phase(roadmap: RoadmapModel, phase_id: str) -> RoadmapPhase:
    for phase in roadmap.phases:
        if phase.id == phase_id:
            return phase
    raise NotFoundError(f"Roadmap phase not found: {phase_id}")


def _done_phase_ids(roadmap: RoadmapModel) -> set[str]:
    return {phase.id for phase in roadmap.phases if phase.status == "done"}


def _activate_ready_phases(roadmap: RoadmapModel) -> list[str]:
    done_ids = _done_phase_ids(roadmap)
    activated: list[str] = []
    for phase in roadmap.phases:
        if phase.status != "pending":
            continue
        if phase.depends_on and not all(dep in done_ids for dep in phase.depends_on):
            continue
        phase.status = "active"
        activated.append(phase.id)
    return activated


def set_phase_status(
    cfg: OpenKBConfig,
    slug: str,
    phase_id: str,
    status: PhaseStatus,
) -> RoadmapPhase:
    roadmap = read_roadmap(cfg, slug)
    phase = get_phase(roadmap, phase_id)
    phase.status = status
    if status == "done":
        _activate_ready_phases(roadmap)
    write_roadmap(cfg, slug, roadmap)
    return get_phase(read_roadmap(cfg, slug), phase_id)


def complete_phase(cfg: OpenKBConfig, slug: str, phase_id: str) -> tuple[RoadmapPhase, list[str]]:
    roadmap = read_roadmap(cfg, slug)
    phase = get_phase(roadmap, phase_id)
    phase.status = "done"
    activated = _activate_ready_phases(roadmap)
    write_roadmap(cfg, slug, roadmap)
    return get_phase(read_roadmap(cfg, slug), phase_id), activated


@dataclass
class RoadmapAdvanceResult:
    phases_completed: list[str] = field(default_factory=list)
    phases_activated: list[str] = field(default_factory=list)


def maybe_complete_phases_for_task(
    cfg: OpenKBConfig,
    slug: str,
    task_id: str,
    *,
    done_task_ids: set[str],
) -> RoadmapAdvanceResult:
    roadmap = read_roadmap(cfg, slug)
    if not roadmap.phases:
        return RoadmapAdvanceResult()

    result = RoadmapAdvanceResult()
    changed = False

    for phase in roadmap.phases:
        if phase.status in ("done", "blocked") or not phase.tasks:
            continue
        if task_id not in phase.tasks:
            continue
        if not all(tid in done_task_ids for tid in phase.tasks):
            continue
        phase.status = "done"
        result.phases_completed.append(phase.id)
        changed = True

    if changed:
        result.phases_activated = _activate_ready_phases(roadmap)
        write_roadmap(cfg, slug, roadmap)
    return result


def roadmap_payload(cfg: OpenKBConfig, slug: str) -> dict:
    roadmap = read_roadmap(cfg, slug)
    tasks_by_id = _task_index(cfg, slug)
    task_titles = {tid: info["title"] for tid, info in tasks_by_id.items()}
    enriched = enrich_phases(cfg, slug, roadmap)
    depths = phase_depths(roadmap.phases)
    return {
        "phases": [phase.model_dump() for phase in roadmap.phases],
        "enriched_phases": enriched,
        "phase_depths": depths,
        "progress": roadmap_progress(roadmap),
        "mermaid": roadmap_to_mermaid(roadmap, task_titles),
        "active_phases": [
            {"id": phase.id, "title": phase.title}
            for phase in roadmap.phases
            if phase.status == "active"
        ],
    }
