from __future__ import annotations

from pathlib import Path

import pytest

from openkb.config import OpenKBConfig
from openkb.errors import NotFoundError, OpenKBError
from openkb.project_service import (
    archive_project,
    create_project,
    list_projects,
    read_project,
    write_project_yaml,
)
from openkb.state_service import read_state


def test_list_and_create_project(tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    assert list_projects(cfg) == []

    project = create_project(
        cfg,
        slug="alpha",
        name="Alpha",
        repo_path=str(tmp_openkb_root / "alpha_repo"),
        description="Test project",
    )
    assert project.slug == "alpha"
    assert project.name == "Alpha"
    assert project.status == "active"

    projects = list_projects(cfg)
    assert len(projects) == 1
    assert projects[0].slug == "alpha"

    pdir = cfg.project_dir("alpha")
    for col in ["backlog", "todo", "doing", "review", "done"]:
        assert (pdir / "board" / col).is_dir()
    assert (pdir / "decisions").is_dir()
    assert (pdir / "sessions").is_dir()
    assert (pdir / "project.yaml").is_file()
    state = read_state(pdir / "STATE.md")
    assert state.now.active_task == "none"


def test_read_project_and_write_yaml(tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    repo = tmp_openkb_root / "beta_repo"
    repo.mkdir()
    write_project_yaml(
        tmp_openkb_root,
        "beta",
        name="Beta",
        repo_path=str(repo),
        description="Beta desc",
    )
    project = read_project(cfg, "beta")
    assert project.name == "Beta"
    assert project.description == "Beta desc"


def test_create_project_duplicate_raises(tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    create_project(cfg, "dup", "Dup", str(tmp_openkb_root / "dup"))
    with pytest.raises(OpenKBError):
        create_project(cfg, "dup", "Dup Again", str(tmp_openkb_root / "dup2"))


def test_read_missing_project_raises(tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    with pytest.raises(NotFoundError):
        read_project(cfg, "missing")


def test_archive_project(tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    create_project(cfg, "arch", "Arch", str(tmp_openkb_root / "arch"))
    archived = archive_project(cfg, "arch")
    assert archived.status == "archived"
    assert read_project(cfg, "arch").status == "archived"
