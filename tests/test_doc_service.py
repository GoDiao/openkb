from __future__ import annotations

from pathlib import Path

import pytest

from openkb.config import OpenKBConfig
from openkb.errors import NotFoundError
from openkb import doc_service
from openkb.project_service import create_project, update_project_docs


@pytest.fixture
def doc_project(tmp_openkb_root: Path) -> tuple[str, Path]:
    cfg = OpenKBConfig.load()
    slug = "docs"
    repo = tmp_openkb_root / "biz_repo"
    repo.mkdir()
    (repo / "docs").mkdir()
    create_project(cfg, slug, "Docs", str(repo))
    return slug, repo


def test_doc_status_unconfigured(doc_project: tuple[str, Path]) -> None:
    cfg = OpenKBConfig.load()
    slug, _ = doc_project
    status = doc_service.doc_status(cfg, slug)
    assert status["spec"]["configured"] is False
    assert status["spec"]["exists"] is False


def test_resolve_doc_under_repo_path(doc_project: tuple[str, Path]) -> None:
    cfg = OpenKBConfig.load()
    slug, repo = doc_project
    spec_path = repo / "docs" / "spec.md"
    spec_path.write_text("# Spec\n", encoding="utf-8")
    update_project_docs(cfg, slug, spec="docs/spec.md")
    doc = doc_service.read_doc(cfg, slug, "spec")
    assert doc["path"] == "docs/spec.md"
    assert "Spec" in doc["content"]


def test_list_decisions_includes_phases(doc_project: tuple[str, Path]) -> None:
    cfg = OpenKBConfig.load()
    slug, _ = doc_project
    decisions_dir = cfg.project_dir(slug) / "decisions"
    decisions_dir.mkdir(parents=True, exist_ok=True)
    (decisions_dir / "D001-sample.md").write_text(
        "---\nphases: [p1, p2]\n---\n\n# Sample ADR\n",
        encoding="utf-8",
    )
    items = doc_service.list_decisions(cfg, slug)
    assert len(items) == 1
    assert items[0]["phases"] == ["p1", "p2"]
    detail = doc_service.read_decision(cfg, slug, "D001-sample")
    assert detail["phases"] == ["p1", "p2"]
    assert "Sample ADR" in detail["content"]


def test_doc_status_missing_file(doc_project: tuple[str, Path]) -> None:
    cfg = OpenKBConfig.load()
    slug, _ = doc_project
    update_project_docs(cfg, slug, plan="docs/missing-plan.md")
    status = doc_service.doc_status(cfg, slug)
    assert status["plan"]["configured"] is True
    assert status["plan"]["exists"] is False
    with pytest.raises(NotFoundError):
        doc_service.read_doc(cfg, slug, "plan")
