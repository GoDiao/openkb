from __future__ import annotations

from pathlib import Path

import pytest

from openkb.errors import ProjectNotFoundError
from openkb.project_resolver import resolve_project_slug
from openkb.project_service import write_project_yaml


def test_resolve_from_env(tmp_openkb_root, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENKB_PROJECT", "forced")
    slug = resolve_project_slug(Path("E:/anywhere"))
    assert slug == "forced"


def test_resolve_from_openkb_link(
    tmp_openkb_root: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("OPENKB_PROJECT", raising=False)
    repo = tmp_openkb_root / "external_repo"
    repo.mkdir()
    (repo / ".openkb-link").write_text("linked\n", encoding="utf-8")
    write_project_yaml(tmp_openkb_root, "linked", name="Linked", repo_path=str(repo))
    assert resolve_project_slug(repo) == "linked"


def test_resolve_from_repo_path(
    tmp_openkb_root: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("OPENKB_PROJECT", raising=False)
    repo = tmp_openkb_root / "myrepo"
    repo.mkdir()
    write_project_yaml(tmp_openkb_root, "myproj", name="My", repo_path=str(repo))
    assert resolve_project_slug(repo / "src" / "deep") == "myproj"


def test_resolve_raises_when_unbound(
    tmp_openkb_root: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("OPENKB_PROJECT", raising=False)
    orphan = tmp_openkb_root / "orphan"
    orphan.mkdir()
    with pytest.raises(ProjectNotFoundError):
        resolve_project_slug(orphan)
