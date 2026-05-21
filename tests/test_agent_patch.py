from __future__ import annotations

import json
from pathlib import Path

import pytest
from typer.testing import CliRunner

from openkb.agent_patch_service import (
    apply_patch_to_text,
    build_patch_block,
    file_has_patch,
    install_patch,
    load_manifest,
    remove_patch_from_text,
    scan_targets,
    uninstall_patch,
)
from openkb.cli.main import app
from openkb.config import OpenKBConfig

runner = CliRunner()


@pytest.fixture
def patch_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, tmp_openkb_root: Path) -> Path:
    agent_home = tmp_path / "agent_home"
    cursor_dir = agent_home / ".cursor"
    cursor_dir.mkdir(parents=True)
    monkeypatch.setenv("OPENKB_ROOT", str(tmp_openkb_root))
    monkeypatch.setattr("openkb.agent_patch_service.Path.home", lambda: agent_home)
    return cursor_dir


def test_build_and_apply_patch(tmp_openkb_root: Path, patch_home: Path) -> None:
    cfg = OpenKBConfig.load()
    manifest, _ = load_manifest(cfg)
    block = build_patch_block("Hello OpenKB", manifest)
    target = patch_home / "AGENTS.md"

    target.write_text("# My agents\n", encoding="utf-8")
    updated = apply_patch_to_text(target.read_text(encoding="utf-8"), block)
    target.write_text(updated, encoding="utf-8")

    text = target.read_text(encoding="utf-8")
    assert file_has_patch(text)
    assert "Hello OpenKB" in text
    assert tmp_openkb_root.as_posix() in text or str(tmp_openkb_root) in text or "Hello OpenKB" in text


def test_reinstall_replaces_block(tmp_openkb_root: Path, patch_home: Path) -> None:
    cfg = OpenKBConfig.load()
    manifest, _ = load_manifest(cfg)
    block_v1 = build_patch_block("Version A", manifest)
    target = patch_home / "AGENTS.md"
    target.write_text(apply_patch_to_text("", block_v1), encoding="utf-8")

    block_v2 = build_patch_block("Version B", manifest)
    target.write_text(apply_patch_to_text(target.read_text(encoding="utf-8"), block_v2), encoding="utf-8")
    text = target.read_text(encoding="utf-8")
    assert text.count("openkb:patch") == 2
    assert "Version B" in text
    assert "Version A" not in text


def test_uninstall_removes_block(tmp_openkb_root: Path, patch_home: Path) -> None:
    cfg = OpenKBConfig.load()
    manifest, _ = load_manifest(cfg)
    block = build_patch_block("To remove", manifest)
    target = patch_home / "AGENTS.md"
    target.write_text("# keep\n\n" + block, encoding="utf-8")

    cleaned = remove_patch_from_text(target.read_text(encoding="utf-8"))
    assert not file_has_patch(cleaned)
    assert "# keep" in cleaned
    assert "To remove" not in cleaned


def test_install_and_uninstall_cli(tmp_openkb_root: Path, patch_home: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_openkb_root)
    scan = runner.invoke(app, ["agent", "scan", "--json", "--no-discover"])
    assert scan.exit_code == 0
    data = json.loads(scan.stdout)
    cursor = next(t for t in data["targets"] if t["target_id"] == "cursor-agents")
    assert cursor["selectable"] is True

    install = runner.invoke(
        app,
        ["agent", "install", "--target", "cursor-agents", "--yes", "--json"],
    )
    assert install.exit_code == 0
    result = json.loads(install.stdout)["results"][0]
    assert result["ok"] is True

    path = Path(result["path"])
    assert file_has_patch(path.read_text(encoding="utf-8"))

    uninstall = runner.invoke(app, ["agent", "uninstall", "--all", "--yes", "--json"])
    assert uninstall.exit_code == 0
    assert not file_has_patch(path.read_text(encoding="utf-8"))


def test_scan_targets_selectable_when_parent_exists(patch_home: Path, tmp_openkb_root: Path) -> None:
    cfg = OpenKBConfig.load()
    scans = scan_targets(cfg)
    cursor = next(s for s in scans if s.target_id == "cursor-agents")
    assert cursor.selectable is True
    assert cursor.parent_exists is True
