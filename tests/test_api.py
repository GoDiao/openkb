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
