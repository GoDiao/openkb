from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from openkb.config import OpenKBConfig
from openkb.errors import DeleteForbiddenError, LockConflictError, NotFoundError
from openkb.markdown_io import read_task_file, write_task_file
from openkb.models import RoadmapModel, RoadmapPhase, StateModel, TaskModel
from openkb.project_service import create_project
from openkb.roadmap_service import read_roadmap, write_roadmap
from openkb.session_service import append_session
from openkb.state_service import read_state, write_state
from openkb import task_service


@pytest.fixture
def project_slug(tmp_openkb_root: Path) -> str:
    cfg = OpenKBConfig.load()
    slug = "tasks"
    create_project(cfg, slug, "Tasks", str(tmp_openkb_root / "tasks_repo"))
    return slug


def test_create_and_list_board(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, project_slug, "First task", priority="P1")
    assert task.status == "backlog"
    assert task.priority == "P1"

    board = task_service.list_board(cfg, project_slug)
    assert len(board["backlog"]) == 1
    assert board["backlog"][0].id == task.id


def test_get_task_and_move(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, project_slug, "Move me")
    moved = task_service.move_task(cfg, project_slug, task.id, "todo")
    assert moved.status == "todo"
    assert task_service.get_task(cfg, project_slug, task.id).status == "todo"


def test_checkout_updates_lock_and_state(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, project_slug, "Checkout me")
    checked = task_service.checkout(cfg, project_slug, task.id, "agent-a")
    assert checked.status == "doing"
    assert checked.locked_by == "agent-a"
    assert checked.lock_expires

    state = read_state(cfg.project_dir(project_slug) / "STATE.md")
    assert state.now.owner == "agent-a"
    assert state.now.active_task == f"{task.id}-{task.slug}"


def test_checkout_conflict(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, project_slug, "Locked task")
    task_service.checkout(cfg, project_slug, task.id, "agent-a")
    with pytest.raises(LockConflictError) as exc:
        task_service.checkout(cfg, project_slug, task.id, "agent-b")
    assert exc.value.owner == "agent-a"


def test_expired_lock_takeover(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    pdir = cfg.project_dir(project_slug)
    path = pdir / "board" / "doing" / "001-stale.md"
    expired = (datetime.now(timezone.utc) - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    stale = TaskModel(
        id="001",
        slug="stale",
        title="Stale lock",
        status="doing",
        created="2026-05-20",
        updated=expired,
        locked_by="old-agent",
        locked_at=expired,
        lock_expires=expired,
    )
    write_task_file(path, stale, column="doing")

    taken = task_service.checkout(cfg, project_slug, "001", "agent-b")
    assert taken.locked_by == "agent-b"
    assert "takeover" in taken.notes.lower()


def test_release_and_done(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, project_slug, "Finish me")
    task_service.checkout(cfg, project_slug, task.id, "agent-a")

    released = task_service.release(cfg, project_slug, task.id, "agent-a")
    assert released.status == "todo"
    assert released.locked_by == ""
    assert list((cfg.project_dir(project_slug) / "sessions").glob("*.md"))

    task_service.checkout(cfg, project_slug, task.id, "agent-a")
    completed = task_service.done(cfg, project_slug, task.id, "agent-a")
    assert completed.task.status == "done"
    state = read_state(cfg.project_dir(project_slug) / "STATE.md")
    assert any("Finish me" in item for item in state.recent_done)


def test_release_wrong_agent_raises(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, project_slug, "Owned")
    task_service.checkout(cfg, project_slug, task.id, "agent-a")
    with pytest.raises(LockConflictError):
        task_service.release(cfg, project_slug, task.id, "agent-b")


def test_next_task_priority_and_skip_locked(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    pdir = cfg.project_dir(project_slug)
    low = task_service.create_task(cfg, project_slug, "Low", priority="P3")
    high = task_service.create_task(cfg, project_slug, "High", priority="P0")

    locked_path = pdir / "board" / "doing" / "099-locked.md"
    future = (datetime.now(timezone.utc) + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    locked = TaskModel(
        id="099",
        slug="locked",
        title="Locked doing",
        status="doing",
        priority="P0",
        created="2026-05-20",
        updated=future,
        locked_by="other",
        locked_at=future,
        lock_expires=future,
    )
    write_task_file(locked_path, locked, column="doing")

    nxt = task_service.next_task(cfg, project_slug, "agent-x")
    assert nxt is not None
    assert nxt.id == high.id

    task_service.checkout(cfg, project_slug, high.id, "agent-x")
    nxt2 = task_service.next_task(cfg, project_slug, "agent-x")
    assert nxt2 is not None
    assert nxt2.id == low.id


def test_get_missing_task_raises(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    with pytest.raises(NotFoundError):
        task_service.get_task(cfg, project_slug, "999")


def test_done_advances_next_item(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    pdir = cfg.project_dir(project_slug)
    write_state(
        pdir / "STATE.md",
        StateModel(next_items=["First next", "Second next"]),
        project_slug=project_slug,
    )
    task = task_service.create_task(cfg, project_slug, "Finish me")
    task_service.checkout(cfg, project_slug, task.id, "agent-a")
    outcome = task_service.done(cfg, project_slug, task.id, "agent-a")
    assert outcome.removed_next_item == "First next"
    state = read_state(pdir / "STATE.md")
    assert state.next_items == ["Second next"]


def test_done_auto_completes_roadmap_phase(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, project_slug, "Phase task")
    write_roadmap(
        cfg,
        project_slug,
        RoadmapModel(
            phases=[
                RoadmapPhase(id="p1", title="Phase 1", status="active", tasks=[task.id]),
                RoadmapPhase(id="p2", title="Phase 2", status="pending", depends_on=["p1"]),
            ]
        ),
    )
    task_service.checkout(cfg, project_slug, task.id, "agent-a")
    outcome = task_service.done(cfg, project_slug, task.id, "agent-a")
    assert outcome.phases_completed == ["p1"]
    assert outcome.phases_activated == ["p2"]
    roadmap = read_roadmap(cfg, project_slug)
    assert get_phase_status(roadmap, "p1") == "done"
    assert get_phase_status(roadmap, "p2") == "active"


def get_phase_status(roadmap: RoadmapModel, phase_id: str) -> str:
    for phase in roadmap.phases:
        if phase.id == phase_id:
            return phase.status
    raise AssertionError(f"missing phase {phase_id}")


def test_append_session(tmp_path: Path) -> None:
    project_dir = tmp_path / "proj"
    project_dir.mkdir()
    path = append_session(project_dir, "agent-1", "001", "test", "Summary line.")
    assert path.is_file()
    text = path.read_text(encoding="utf-8")
    assert "agent-1" in text
    assert "Summary line." in text


def test_delete_task(project_slug: str) -> None:
    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, project_slug, "Remove me")
    task_service.delete_task(cfg, project_slug, task.id, "agent-a")
    board = task_service.list_board(cfg, project_slug)
    assert not any(t.id == task.id for tasks in board.values() for t in tasks)

    task2 = task_service.create_task(cfg, project_slug, "Done remove")
    task_service.checkout(cfg, project_slug, task2.id, "agent-a")
    task_service.done(cfg, project_slug, task2.id, "agent-a")
    with pytest.raises(DeleteForbiddenError):
        task_service.delete_task(cfg, project_slug, task2.id, "agent-a")
    task_service.delete_task(cfg, project_slug, task2.id, "agent-a", force=True)
