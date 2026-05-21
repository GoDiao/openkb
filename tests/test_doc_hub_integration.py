from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest
from typer.testing import CliRunner

from openkb.cli.main import app
from openkb.config import OpenKBConfig
from openkb import doc_service
from openkb.project_service import create_project, update_project_docs

runner = CliRunner()


@pytest.fixture
def hub_doc_project(tmp_openkb_root: Path) -> tuple[str, Path]:
    """Mirror openkb project's repo-relative doc layout in an isolated workspace."""
    cfg = OpenKBConfig.load()
    slug = "hub-docs"
    repo = tmp_openkb_root / "openkb_repo"
    repo.mkdir()

    repo_root = Path(__file__).resolve().parents[1]
    spec_src = repo_root / "docs/superpowers/specs/2026-05-20-openkb-design.md"
    plan_src = repo_root / "docs/superpowers/plans/2026-05-20-openkb.md"
    spec_dest = repo / spec_src.relative_to(repo_root)
    plan_dest = repo / plan_src.relative_to(repo_root)
    spec_dest.parent.mkdir(parents=True, exist_ok=True)
    plan_dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(spec_src, spec_dest)
    shutil.copy(plan_src, plan_dest)

    create_project(cfg, slug, "Hub Docs", str(repo))
    update_project_docs(
        cfg,
        slug,
        spec=str(spec_src.relative_to(repo_root)).replace("\\", "/"),
        plan=str(plan_src.relative_to(repo_root)).replace("\\", "/"),
    )
    return slug, repo


def test_doc_verify_all_hub_visible(hub_doc_project: tuple[str, Path]) -> None:
    slug, _ = hub_doc_project
    result = runner.invoke(app, ["doc", "verify", "--project", slug, "--json"])
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data["all_hub_visible"] is True


def test_read_spec_plan_from_repo_path(hub_doc_project: tuple[str, Path]) -> None:
    cfg = OpenKBConfig.load()
    slug, _ = hub_doc_project
    spec = doc_service.read_doc(cfg, slug, "spec")
    plan = doc_service.read_doc(cfg, slug, "plan")
    assert "OpenKB Design Spec" in spec["content"]
    assert "Phase 0" in plan["content"] or "Repository Foundation" in plan["content"]
