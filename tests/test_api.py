from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from openkb.api.app import app as api_app
from openkb.config import OpenKBConfig
from openkb.markdown_io import write_task_file
from openkb.models import TaskModel
from openkb.project_service import create_project


@pytest.fixture
def api_client(tmp_openkb_root: Path) -> TestClient:
    return TestClient(api_app)


@pytest.fixture
def api_project(tmp_openkb_root: Path, api_client: TestClient) -> str:
    cfg = OpenKBConfig.load()
    repo = tmp_openkb_root / "api_repo"
    repo.mkdir()
    create_project(cfg, "api-demo", "API Demo", str(repo))
    return "api-demo"


def test_list_projects(api_client: TestClient, api_project: str) -> None:
    response = api_client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(p["slug"] == api_project for p in data)


def test_create_project(api_client: TestClient, tmp_openkb_root: Path) -> None:
    repo = tmp_openkb_root / "new_repo"
    repo.mkdir()
    response = api_client.post(
        "/api/projects",
        json={
            "slug": "new-proj",
            "name": "New Project",
            "repo_path": str(repo),
            "description": "via api",
        },
    )
    assert response.status_code == 201
    project = response.json()
    assert project["slug"] == "new-proj"
    assert project["name"] == "New Project"


def test_get_board(api_client: TestClient, api_project: str) -> None:
    create = api_client.post(
        f"/api/projects/{api_project}/tasks",
        json={"title": "Board task", "priority": "P2"},
    )
    assert create.status_code == 201

    response = api_client.get(f"/api/projects/{api_project}/board")
    assert response.status_code == 200
    board = response.json()
    assert len(board["backlog"]) == 1
    assert board["backlog"][0]["title"] == "Board task"


def test_checkout_conflict_409(api_client: TestClient, api_project: str) -> None:
    cfg = OpenKBConfig.load()
    pdir = cfg.project_dir(api_project)
    path = pdir / "board" / "todo" / "001-locked.md"
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_task_file(
        path,
        TaskModel(
            id="001",
            slug="locked",
            title="Locked task",
            status="doing",
            created="2026-05-20",
            updated=now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            locked_by="agent-a",
            locked_at=now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            lock_expires=expires,
        ),
        column="doing",
    )

    response = api_client.post(
        f"/api/projects/{api_project}/tasks/001/checkout",
        json={"agent_id": "agent-b"},
    )
    assert response.status_code == 409
    data = response.json()
    assert data["error"] == "locked"
    assert data["owner"] == "agent-a"


def test_move_task(api_client: TestClient, api_project: str) -> None:
    created = api_client.post(
        f"/api/projects/{api_project}/tasks",
        json={"title": "Move me", "priority": "P1"},
    )
    task_id = created.json()["task"]["id"]

    response = api_client.post(
        f"/api/projects/{api_project}/tasks/{task_id}/move",
        json={"column": "todo"},
    )
    assert response.status_code == 200
    task = response.json()["task"]
    assert task["status"] == "todo"

    board = api_client.get(f"/api/projects/{api_project}/board").json()
    assert len(board["todo"]) == 1
    assert board["todo"][0]["id"] == task_id


def test_checkout_sets_lock_on_board(api_client: TestClient, api_project: str) -> None:
    created = api_client.post(
        f"/api/projects/{api_project}/tasks",
        json={"title": "Lock me", "priority": "P1"},
    )
    task_id = created.json()["task"]["id"]

    checkout = api_client.post(
        f"/api/projects/{api_project}/tasks/{task_id}/checkout",
        json={"agent_id": "agent-a"},
    )
    assert checkout.status_code == 200
    task = checkout.json()["task"]
    assert task["locked_by"] == "agent-a"
    assert task["lock_expires"]

    board = api_client.get(f"/api/projects/{api_project}/board").json()
    doing = [t for t in board["doing"] if t["id"] == task_id]
    assert len(doing) == 1
    assert doing[0]["locked_by"] == "agent-a"
    assert doing[0]["lock_expires"] == task["lock_expires"]


def test_done_advances_roadmap_phase_via_api_flow(
    api_client: TestClient,
    api_project: str,
    tmp_openkb_root: Path,
) -> None:
    from openkb.models import RoadmapModel, RoadmapPhase
    from openkb.roadmap_service import read_roadmap, write_roadmap
    from openkb import task_service

    cfg = OpenKBConfig.load()
    created = api_client.post(
        f"/api/projects/{api_project}/tasks",
        json={"title": "Phase closer", "priority": "P1"},
    )
    task_id = created.json()["task"]["id"]
    write_roadmap(
        cfg,
        api_project,
        RoadmapModel(
            phases=[
                RoadmapPhase(id="p1", title="Phase 1", status="active", tasks=[task_id]),
                RoadmapPhase(id="p2", title="Phase 2", status="pending", depends_on=["p1"]),
            ]
        ),
    )

    api_client.post(
        f"/api/projects/{api_project}/tasks/{task_id}/checkout",
        json={"agent_id": "agent-a"},
    )
    task_service.done(cfg, api_project, task_id, "agent-a")

    roadmap = api_client.get(f"/api/projects/{api_project}/roadmap").json()
    phases = {p["id"]: p["status"] for p in roadmap["roadmap"]["phases"]}
    assert phases["p1"] == "done"
    assert phases["p2"] == "active"


def test_get_missing_doc_404(api_client: TestClient, api_project: str) -> None:
    cfg = OpenKBConfig.load()
    from openkb.project_service import update_project_docs

    update_project_docs(cfg, api_project, plan="docs/does-not-exist.md")
    response = api_client.get(f"/api/projects/{api_project}/docs/plan")
    assert response.status_code == 404


def test_delete_task(api_client: TestClient, api_project: str) -> None:
    created = api_client.post(
        f"/api/projects/{api_project}/tasks",
        json={"title": "Delete me", "priority": "P2"},
    )
    task_id = created.json()["task"]["id"]
    response = api_client.delete(f"/api/projects/{api_project}/tasks/{task_id}")
    assert response.status_code == 204
    board = api_client.get(f"/api/projects/{api_project}/board").json()
    assert not any(t["id"] == task_id for col in board.values() for t in col)


def test_delete_done_requires_force(api_client: TestClient, api_project: str) -> None:
    from openkb import task_service

    cfg = OpenKBConfig.load()
    task = task_service.create_task(cfg, api_project, "Done task")
    task_service.checkout(cfg, api_project, task.id, "agent-a")
    task_service.done(cfg, api_project, task.id, "agent-a")

    blocked = api_client.delete(f"/api/projects/{api_project}/tasks/{task.id}")
    assert blocked.status_code == 400

    forced = api_client.delete(
        f"/api/projects/{api_project}/tasks/{task.id}",
        params={"force": True},
    )
    assert forced.status_code == 204


def test_delete_locked_task_409(api_client: TestClient, api_project: str) -> None:
    from datetime import datetime, timedelta, timezone

    from openkb.markdown_io import write_task_file
    from openkb.models import TaskModel

    cfg = OpenKBConfig.load()
    pdir = cfg.project_dir(api_project)
    path = pdir / "board" / "doing" / "001-locked.md"
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_task_file(
        path,
        TaskModel(
            id="001",
            slug="locked",
            title="Locked task",
            status="doing",
            created="2026-05-20",
            updated=now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            locked_by="agent-a",
            locked_at=now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            lock_expires=expires,
        ),
        column="doing",
    )

    response = api_client.delete(
        f"/api/projects/{api_project}/tasks/001",
        params={"agent_id": "agent-b"},
    )
    assert response.status_code == 409


def test_watch_websocket_notify_on_create(api_client: TestClient, api_project: str) -> None:
    with api_client.websocket_connect(f"/api/projects/{api_project}/watch") as ws:
        api_client.post(
            f"/api/projects/{api_project}/tasks",
            json={"title": "Watch me", "priority": "P2"},
        )
        message = ws.receive_json()
        assert "board" in message["kinds"]
