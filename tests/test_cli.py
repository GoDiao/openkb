from __future__ import annotations

import json
from pathlib import Path

import pytest
from typer.testing import CliRunner

from openkb.cli.main import app
from openkb.config import OpenKBConfig
from openkb.markdown_io import write_task_file
from openkb.models import TaskModel
from openkb.project_service import create_project

runner = CliRunner()


@pytest.fixture
def cli_env(tmp_openkb_root: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    cfg = OpenKBConfig.load()
    repo = tmp_openkb_root / "work_repo"
    repo.mkdir()
    create_project(cfg, "demo", "Demo Project", str(repo))
    monkeypatch.chdir(repo)
    monkeypatch.setenv("OPENKB_AGENT_ID", "test-agent")
    monkeypatch.delenv("OPENKB_PROJECT", raising=False)
    return repo


def test_project_list_json(cli_env: Path, tmp_openkb_root: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_openkb_root)
    result = runner.invoke(app, ["project", "list", "--json"])
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert len(data["projects"]) == 1
    assert data["projects"][0]["slug"] == "demo"


def test_project_link(cli_env: Path) -> None:
    result = runner.invoke(app, ["project", "link", "--slug", "demo", "--json"])
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["slug"] == "demo"
    assert (cli_env / ".openkb-link").read_text(encoding="utf-8").strip() == "demo"


def test_project_create_with_templates(tmp_openkb_root: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    repo = tmp_openkb_root / "created_repo"
    repo.mkdir()
    monkeypatch.chdir(repo)
    result = runner.invoke(
        app,
        [
            "project",
            "create",
            "--slug",
            "fresh",
            "--name",
            "Fresh Project",
            "--repo-path",
            str(repo),
            "--link",
            "--json",
        ],
    )
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["slug"] == "fresh"
    assert (repo / "docs" / "spec.md").is_file()
    assert len(data["pending"]) >= 1
    assert (repo / ".openkb-link").read_text(encoding="utf-8").strip() == "fresh"

    show = runner.invoke(app, ["project", "show", "--json"])
    assert show.exit_code == 0
    assert "pending" in json.loads(show.stdout)


def test_doc_verify_after_create(tmp_openkb_root: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    repo = tmp_openkb_root / "verify_repo"
    repo.mkdir()
    monkeypatch.chdir(repo)
    monkeypatch.setenv("OPENKB_AGENT_ID", "test-agent")
    runner.invoke(
        app,
        ["project", "create", "--slug", "v", "--name", "V", "--repo-path", str(repo), "--json"],
    )
    result = runner.invoke(app, ["doc", "verify", "--json"])
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["all_hub_visible"] is True


def test_context_json(cli_env: Path) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    result = runner.invoke(app, ["context", "--json"])
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["project"] == "demo"
    assert "state" in data
    assert "docs" in data
    assert "roadmap" in data
    assert data["checked_out_by_me"] is False


def test_task_create_and_status(cli_env: Path) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    create = runner.invoke(
        app,
        ["task", "create", "--title", "CLI task", "--priority", "P1", "--json"],
    )
    assert create.exit_code == 0
    task = json.loads(create.stdout)["task"]
    assert task["title"] == "CLI task"
    assert task["priority"] == "P1"

    status = runner.invoke(app, ["status", "--json"])
    assert status.exit_code == 0
    board = json.loads(status.stdout)
    assert len(board["backlog"]) == 1


def test_checkout_note_check_done_flow(cli_env: Path) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    cfg = OpenKBConfig.load()
    task_path = cfg.project_dir("demo") / "board" / "todo" / "001-flow.md"
    write_task_file(
        task_path,
        TaskModel(
            id="001",
            slug="flow",
            title="Flow task",
            status="todo",
            priority="P1",
            created="2026-05-20",
            updated="2026-05-20T00:00:00Z",
            acceptance=["- [ ] Step one", "- [ ] Step two"],
        ),
        column="todo",
    )

    checkout = runner.invoke(app, ["checkout", "001", "--json"])
    assert checkout.exit_code == 0
    assert json.loads(checkout.stdout)["task"]["status"] == "doing"

    context = runner.invoke(app, ["context", "--json"])
    assert json.loads(context.stdout)["checked_out_by_me"] is True

    note = runner.invoke(app, ["note", "001", "Progress update", "--json"])
    assert note.exit_code == 0
    assert "Progress update" in json.loads(note.stdout)["task"]["notes"]

    check = runner.invoke(app, ["check", "001", "1", "--json"])
    assert check.exit_code == 0
    assert json.loads(check.stdout)["task"]["acceptance"][0] == "- [x] Step one"

    done = runner.invoke(app, ["done", "001", "--json"])
    assert done.exit_code == 0
    assert json.loads(done.stdout)["task"]["status"] == "done"


def test_next_task(cli_env: Path) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    runner.invoke(app, ["task", "create", "--title", "Next me", "--priority", "P0", "--json"])
    result = runner.invoke(app, ["next", "--json"])
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["task"]["title"] == "Next me"


def test_release(cli_env: Path) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    runner.invoke(app, ["task", "create", "--title", "Release me", "--json"])
    runner.invoke(app, ["checkout", "001", "--json"])
    result = runner.invoke(app, ["release", "001", "--json"])
    assert result.exit_code == 0
    assert json.loads(result.stdout)["task"]["status"] == "todo"


def test_checkout_lock_conflict_exit_2(cli_env: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    cfg = OpenKBConfig.load()
    from datetime import datetime, timedelta, timezone

    future = (datetime.now(timezone.utc) + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    task_path = cfg.project_dir("demo") / "board" / "doing" / "001-locked.md"
    write_task_file(
        task_path,
        TaskModel(
            id="001",
            slug="locked",
            title="Locked",
            status="doing",
            created="2026-05-20",
            updated=future,
            locked_by="other-agent",
            locked_at=future,
            lock_expires=future,
        ),
        column="doing",
    )

    monkeypatch.setenv("OPENKB_AGENT_ID", "test-agent")
    result = runner.invoke(app, ["checkout", "001", "--json"])
    assert result.exit_code == 2
    data = json.loads(result.stdout)
    assert data["error"] == "locked"
    assert data["owner"] == "other-agent"


def test_status_reflects_lock_after_checkout(cli_env: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    monkeypatch.setenv("OPENKB_AGENT_ID", "agent-a")
    runner.invoke(app, ["task", "create", "--title", "Lock status", "--json"])
    runner.invoke(app, ["checkout", "001", "--json"])

    status = runner.invoke(app, ["status", "--json"])
    assert status.exit_code == 0
    board = json.loads(status.stdout)
    assert len(board["doing"]) == 1
    task = board["doing"][0]
    assert task["locked_by"] == "agent-a"
    assert task["lock_expires"]


def test_roadmap_and_state_cli(cli_env: Path) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    cfg = OpenKBConfig.load()
    from openkb.models import RoadmapModel, RoadmapPhase
    from openkb.roadmap_service import write_roadmap

    write_roadmap(
        cfg,
        "demo",
        RoadmapModel(phases=[RoadmapPhase(id="p1", title="One", status="active")]),
    )

    roadmap = runner.invoke(app, ["roadmap", "--json"])
    assert roadmap.exit_code == 0
    assert json.loads(roadmap.stdout)["progress"]["total"] == 1

    state_set = runner.invoke(
        app,
        ["state", "set", "--summary", "Working", "--next", "Ship it", "--json"],
    )
    assert state_set.exit_code == 0
    state = json.loads(state_set.stdout)["state"]
    assert state["summary"] == "Working"
    assert state["next_items"] == ["Ship it"]

    done = runner.invoke(app, ["task", "create", "--title", "Task", "--json"])
    task_id = json.loads(done.stdout)["task"]["id"]
    runner.invoke(app, ["checkout", task_id, "--json"])
    finished = runner.invoke(app, ["done", task_id, "--json"])
    payload = json.loads(finished.stdout)
    assert payload["removed_next_item"] == "Ship it"


def test_done_human_output_with_unicode_next(cli_env: Path) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    runner.invoke(
        app,
        ["state", "set", "--next", "下一步 «里程碑»", "--json"],
    )
    create = runner.invoke(app, ["task", "create", "--title", "中文任务", "--json"])
    task_id = json.loads(create.stdout)["task"]["id"]
    runner.invoke(app, ["checkout", task_id, "--json"])
    result = runner.invoke(app, ["done", task_id])
    assert result.exit_code == 0
    assert "Done" in result.stdout
    assert "Next advanced" in result.stdout


def test_task_delete_cli(cli_env: Path) -> None:
    (cli_env / ".openkb-link").write_text("demo\n", encoding="utf-8")
    create = runner.invoke(app, ["task", "create", "--title", "Trash", "--json"])
    task_id = json.loads(create.stdout)["task"]["id"]
    deleted = runner.invoke(app, ["task", "delete", task_id, "--json"])
    assert deleted.exit_code == 0
    assert json.loads(deleted.stdout)["deleted"] == task_id


def test_api_health() -> None:
    from fastapi.testclient import TestClient

    from openkb.api.app import app as api_app

    client = TestClient(api_app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}
