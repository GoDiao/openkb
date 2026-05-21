from __future__ import annotations

from pathlib import Path

from openkb.config import OpenKBConfig


def resolve_repo_path(cfg: OpenKBConfig, repo_path: str) -> Path:
    """Resolve repo_path; relative paths are anchored at OPENKB_ROOT."""
    path = Path(repo_path)
    if path.is_absolute():
        return path.resolve()
    return (cfg.root / path).resolve()
