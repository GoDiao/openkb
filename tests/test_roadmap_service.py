from __future__ import annotations

from pathlib import Path

import pytest

from openkb.config import OpenKBConfig
from openkb.errors import NotFoundError
from openkb.models import RoadmapModel, RoadmapPhase
from openkb.project_service import create_project
from openkb.roadmap_service import (
    complete_phase,
    enrich_phases,
    phase_depths,
    read_roadmap,
    roadmap_payload,
    roadmap_to_mermaid,
    set_phase_status,
    write_roadmap,
    _slugify_plan_anchor,
)


@pytest.fixture
def project_slug(tmp_openkb_root: Path) -> str:
    cfg = OpenKBConfig.load()
    slug = "roadmap"
    create_project(cfg, slug, "Roadmap", str(tmp_openkb_root / "roadmap_repo"))
    write_roadmap(
        cfg,
        slug,
        RoadmapModel(
            phases=[
                RoadmapPhase(id="p0", title="Start", status="done"),
                RoadmapPhase(id="p1", title="Build", status="active", depends_on=["p0"]),
                RoadmapPhase(id="p2", title="Ship", status="pending", depends_on=["p1"]),
            ]
        ),
    )
    return slug


def test_read_and_payload(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    payload = roadmap_payload(cfg, project_slug)
    assert payload["progress"]["total"] == 3
    assert payload["progress"]["done"] == 1
    assert payload["active_phases"][0]["id"] == "p1"
    assert "flowchart TB" in payload["mermaid"]
    assert len(payload["enriched_phases"]) == 3
    assert payload["phase_depths"]["p2"] == 2


def test_enrich_phases_and_mermaid_tasks(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    write_roadmap(
        cfg,
        project_slug,
        RoadmapModel(
            phases=[
                RoadmapPhase(
                    id="p0",
                    title="Start",
                    status="active",
                    plan_ref="Phase 0",
                    tasks=["001"],
                    decisions=["D001"],
                ),
            ]
        ),
    )
    roadmap = read_roadmap(cfg, project_slug)
    enriched = enrich_phases(cfg, project_slug, roadmap)
    assert enriched[0]["plan_anchor"] == "phase-0"
    assert enriched[0]["task_details"][0]["id"] == "001"
    assert enriched[0]["decision_details"][0]["id"] == "D001"
    mermaid = roadmap_to_mermaid(roadmap, {"001": "First task"})
    assert "p0__001" in mermaid
    assert "First task" in mermaid


def test_phase_depths_parallel() -> None:
    phases = [
        RoadmapPhase(id="a", title="A", depends_on=[]),
        RoadmapPhase(id="b", title="B", depends_on=["a"]),
        RoadmapPhase(id="c", title="C", depends_on=["a"]),
        RoadmapPhase(id="d", title="D", depends_on=["b", "c"]),
    ]
    depths = phase_depths(phases)
    assert depths == {"a": 0, "b": 1, "c": 1, "d": 2}


def test_slugify_plan_anchor() -> None:
    assert _slugify_plan_anchor("Phase 5c") == "phase-5c"
    assert _slugify_plan_anchor("  Hello World!  ") == "hello-world"


def test_complete_phase_activates_next(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    phase, activated = complete_phase(cfg, project_slug, "p1")
    assert phase.status == "done"
    assert activated == ["p2"]
    roadmap = read_roadmap(cfg, project_slug)
    assert roadmap.phases[2].status == "active"


def test_set_phase_status(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    phase = set_phase_status(cfg, project_slug, "p2", "blocked")
    assert phase.status == "blocked"


def test_missing_phase_raises(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    with pytest.raises(NotFoundError):
        complete_phase(cfg, project_slug, "missing")
