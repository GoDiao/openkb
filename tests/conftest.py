import pytest
from pathlib import Path


@pytest.fixture
def tmp_openkb_root(tmp_path, monkeypatch):
    root = tmp_path / "openkb"
    for sub in ["workspace/projects", "workspace/projects/demo/board/todo"]:
        (root / sub).mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("OPENKB_ROOT", str(root))
    return root
