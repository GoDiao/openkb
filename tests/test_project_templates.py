from __future__ import annotations

from pathlib import Path

import pytest

from openkb.config import OpenKBConfig
from openkb.errors import OpenKBError
from openkb.project_templates import (
    TODO_MARKER,
    compute_project_pending,
    create_project_scaffold,
)


def test_create_project_scaffold(tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    repo = tmp_openkb_root / "new_biz"
    result = create_project_scaffold(
        cfg,
        "alpha",
        "Alpha App",
        str(repo),
        description="test",
    )
    assert result.slug == "alpha"
    assert (repo / "docs" / "spec.md").is_file()
    assert (repo / "docs" / "plan.md").is_file()
    assert TODO_MARKER in (repo / "docs" / "spec.md").read_text(encoding="utf-8")
    assert (cfg.project_dir("alpha") / "roadmap.yaml").is_file()
    assert (cfg.project_dir("alpha") / "STATE.md").is_file()
    assert any(p["id"] == "spec" and p["status"] == "template" for p in result.pending)
    assert any(p["id"] == "kanban" for p in result.pending)


def test_create_project_duplicate_raises(tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    repo = tmp_openkb_root / "dup"
    create_project_scaffold(cfg, "dup", "Dup", str(repo))
    with pytest.raises(OpenKBError):
        create_project_scaffold(cfg, "dup", "Dup", str(repo))


def test_pending_clears_when_spec_filled(tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    repo = tmp_openkb_root / "filled"
    create_project_scaffold(cfg, "filled", "Filled", str(repo))
    spec = repo / "docs" / "spec.md"
    spec.write_text("# Spec\n\nAll good.\n", encoding="utf-8")
    pending = compute_project_pending(cfg, "filled")
    assert not any(p["id"] == "spec" for p in pending)
