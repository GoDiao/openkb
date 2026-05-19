from __future__ import annotations

from datetime import date
from pathlib import Path

import yaml

from openkb.config import OpenKBConfig
from openkb.errors import NotFoundError, OpenKBError
from openkb.models import ProjectModel, StateModel
from openkb.state_service import write_state

BOARD_COLUMNS = ("backlog", "todo", "doing", "review", "done")


def write_project_yaml(
    root: Path,
    slug: str,
    *,
    name: str,
    repo_path: str,
    description: str = "",
    status: str = "active",
    default_branch: str = "main",
    lock_ttl_hours: int = 4,
    created: str | None = None,
) -> Path:
    pdir = root / "workspace" / "projects" / slug
    pdir.mkdir(parents=True, exist_ok=True)
    data = {
        "slug": slug,
        "name": name,
        "repo_path": repo_path,
        "description": description,
        "status": status,
        "default_branch": default_branch,
        "lock_ttl_hours": lock_ttl_hours,
        "created": created or date.today().isoformat(),
    }
    path = pdir / "project.yaml"
    path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    return path


def _read_yaml(path: Path) -> ProjectModel:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return ProjectModel.model_validate(data)


def list_projects(cfg: OpenKBConfig) -> list[ProjectModel]:
    if not cfg.projects_dir.is_dir():
        return []
    projects: list[ProjectModel] = []
    for child in sorted(cfg.projects_dir.iterdir()):
        if not child.is_dir():
            continue
        yaml_path = child / "project.yaml"
        if yaml_path.is_file():
            projects.append(_read_yaml(yaml_path))
    return projects


def read_project(cfg: OpenKBConfig, slug: str) -> ProjectModel:
    path = cfg.project_dir(slug) / "project.yaml"
    if not path.is_file():
        raise NotFoundError(f"Project not found: {slug}")
    return _read_yaml(path)


def create_project(
    cfg: OpenKBConfig,
    slug: str,
    name: str,
    repo_path: str,
    description: str = "",
) -> ProjectModel:
    pdir = cfg.project_dir(slug)
    if pdir.exists() and (pdir / "project.yaml").is_file():
        raise OpenKBError(f"Project already exists: {slug}")

    for col in BOARD_COLUMNS:
        (pdir / "board" / col).mkdir(parents=True, exist_ok=True)
    (pdir / "decisions").mkdir(exist_ok=True)
    (pdir / "sessions").mkdir(exist_ok=True)

    write_project_yaml(
        cfg.root,
        slug,
        name=name,
        repo_path=repo_path,
        description=description,
    )
    write_state(pdir / "STATE.md", StateModel(), project_slug=slug)
    return read_project(cfg, slug)


def archive_project(cfg: OpenKBConfig, slug: str) -> ProjectModel:
    project = read_project(cfg, slug)
    write_project_yaml(
        cfg.root,
        slug,
        name=project.name,
        repo_path=project.repo_path,
        description=project.description,
        status="archived",
        default_branch=project.default_branch,
        lock_ttl_hours=project.lock_ttl_hours,
        created=project.created,
    )
    return read_project(cfg, slug)
