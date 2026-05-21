from __future__ import annotations

import shutil
from pathlib import Path

import pytest


@pytest.fixture
def tmp_openkb_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    root = tmp_path / "openkb"
    for sub in ["workspace/projects", "workspace/projects/demo/board/todo"]:
        (root / sub).mkdir(parents=True, exist_ok=True)
    repo_root = Path(__file__).resolve().parents[1]
    agent_src = repo_root / "agent"
    if agent_src.is_dir():
        shutil.copytree(agent_src, root / "agent")
    monkeypatch.setenv("OPENKB_ROOT", str(root))
    return root
