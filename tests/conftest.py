from __future__ import annotations

from pathlib import Path

import pytest


@pytest.fixture
def tmp_openkb_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    root = tmp_path / "openkb"
    for sub in ["workspace/projects", "workspace/projects/demo/board/todo"]:
        (root / sub).mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("OPENKB_ROOT", str(root))
    return root
