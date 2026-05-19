from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _detect_root() -> Path:
    env = os.environ.get("OPENKB_ROOT")
    if env:
        return Path(env).resolve()
    # package at server/src/openkb → repo root is 3 levels up
    return Path(__file__).resolve().parents[3]


@dataclass(frozen=True)
class OpenKBConfig:
    root: Path
    workspace: Path
    projects_dir: Path

    @classmethod
    def load(cls) -> OpenKBConfig:
        root = _detect_root()
        workspace = root / "workspace"
        return cls(root=root, workspace=workspace, projects_dir=workspace / "projects")

    def project_dir(self, slug: str) -> Path:
        return self.projects_dir / slug
