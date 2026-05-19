from __future__ import annotations

from pathlib import Path

from openkb.config import OpenKBConfig


def test_config_resolves_workspace(tmp_path: Path, monkeypatch) -> None:
    root = tmp_path / "openkb"
    (root / "workspace" / "projects").mkdir(parents=True)
    monkeypatch.setenv("OPENKB_ROOT", str(root))
    cfg = OpenKBConfig.load()
    assert cfg.root == root.resolve()
    assert cfg.workspace == root / "workspace"
    assert cfg.projects_dir == root / "workspace" / "projects"
