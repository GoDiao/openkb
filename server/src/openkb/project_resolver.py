from __future__ import annotations

import os
import sys
from pathlib import Path

import yaml

from openkb.config import OpenKBConfig
from openkb.errors import ProjectNotFoundError
from openkb.path_utils import resolve_repo_path


def _normalize_path(path: Path) -> Path:
    return path.resolve()


def _paths_equal(a: Path, b: Path) -> bool:
    na, nb = _normalize_path(a), _normalize_path(b)
    if sys.platform == "win32":
        return str(na).lower() == str(nb).lower()
    return na == nb


def _is_under(child: Path, parent: Path) -> bool:
    try:
        child.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def _read_link_slug(link_path: Path) -> str | None:
    if not link_path.is_file():
        return None
    line = link_path.read_text(encoding="utf-8").strip().splitlines()[0].strip()
    return line or None


def _slug_from_repo_path(cfg: OpenKBConfig, cwd: Path) -> str | None:
    if not cfg.projects_dir.is_dir():
        return None
    resolved_cwd = _normalize_path(cwd)
    for child in cfg.projects_dir.iterdir():
        if not child.is_dir():
            continue
        yaml_path = child / "project.yaml"
        if not yaml_path.is_file():
            continue
        data = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
        repo = data.get("repo_path")
        if not repo:
            continue
        repo_path = resolve_repo_path(cfg, str(repo))
        if _paths_equal(resolved_cwd, repo_path) or _is_under(resolved_cwd, repo_path):
            return str(data.get("slug", child.name))
    return None


def resolve_project_slug(cwd: Path) -> str:
    env_slug = os.environ.get("OPENKB_PROJECT", "").strip()
    if env_slug:
        return env_slug

    current = _normalize_path(cwd)
    for directory in [current, *current.parents]:
        slug = _read_link_slug(directory / ".openkb-link")
        if slug:
            return slug

    cfg = OpenKBConfig.load()
    matched = _slug_from_repo_path(cfg, cwd)
    if matched:
        return matched

    raise ProjectNotFoundError(
        "No project bound to this directory. Set OPENKB_PROJECT, add .openkb-link, "
        "or register repo_path in project.yaml."
    )
