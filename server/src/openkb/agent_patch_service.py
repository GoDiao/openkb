from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

from openkb.config import OpenKBConfig
from openkb.errors import OpenKBError

PATCH_ID = "openkb-onboarding"
PATCH_VERSION = 1

BEGIN_MARKER = f"<!-- openkb:patch v={PATCH_VERSION} id={PATCH_ID} begin -->"
END_MARKER = f"<!-- openkb:patch v={PATCH_VERSION} id={PATCH_ID} end -->"

BLOCK_PATTERN = re.compile(
    rf"<!-- openkb:patch v=\d+ id={re.escape(PATCH_ID)} begin -->\n?"
    rf"[\s\S]*?"
    rf"<!-- openkb:patch v=\d+ id={re.escape(PATCH_ID)} end -->\n?",
    re.MULTILINE,
)


@dataclass(frozen=True)
class PatchManifest:
    patch_id: str
    version: int
    body_file: Path


@dataclass(frozen=True)
class AgentTargetDef:
    id: str
    label: str
    path: Path


@dataclass(frozen=True)
class AgentTargetScan:
    target_id: str
    label: str
    path: str
    file_exists: bool
    parent_exists: bool
    patched: bool
    selectable: bool
    status: str


@dataclass(frozen=True)
class PatchInstallRecord:
    target_id: str
    path: str
    patch_id: str
    version: int
    installed_at: str


def _agent_dir(cfg: OpenKBConfig) -> Path:
    return cfg.root / "agent"


def _install_state_path(cfg: OpenKBConfig) -> Path:
    return _agent_dir(cfg) / "install-state.json"


def _expand_user(path_text: str) -> Path:
    text = path_text.strip().replace("\\", "/")
    if text.startswith("~/"):
        return Path.home() / text[2:]
    if text.startswith("~"):
        return Path.home() / text[1:].lstrip("/\\")
    return Path(text)


def load_manifest(cfg: OpenKBConfig) -> tuple[PatchManifest, list[AgentTargetDef]]:
    manifest_path = _agent_dir(cfg) / "manifest.yaml"
    if not manifest_path.is_file():
        raise OpenKBError(f"Missing agent manifest: {manifest_path}")
    raw = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
    patch = raw["patch"]
    body = _agent_dir(cfg) / patch["body_file"]
    manifest = PatchManifest(
        patch_id=patch["id"],
        version=int(patch["version"]),
        body_file=body,
    )
    targets: list[AgentTargetDef] = []
    for item in raw.get("targets", []):
        targets.append(
            AgentTargetDef(
                id=item["id"],
                label=item["label"],
                path=_expand_user(item["path"]),
            )
        )
    return manifest, targets


def _load_patch_body(cfg: OpenKBConfig, manifest: PatchManifest) -> str:
    if not manifest.body_file.is_file():
        raise OpenKBError(f"Missing patch body: {manifest.body_file}")
    body = manifest.body_file.read_text(encoding="utf-8").strip()
    root = str(cfg.root).replace("\\", "/")
    return body.replace("{OPENKB_ROOT}", root)


def build_patch_block(body: str, manifest: PatchManifest) -> str:
    begin = f"<!-- openkb:patch v={manifest.version} id={manifest.patch_id} begin -->"
    end = f"<!-- openkb:patch v={manifest.version} id={manifest.patch_id} end -->"
    return f"{begin}\n{body.strip()}\n{end}\n"


def file_has_patch(text: str, patch_id: str = PATCH_ID) -> bool:
    return f"id={patch_id} begin" in text and f"id={patch_id} end" in text


def apply_patch_to_text(existing: str, block: str, patch_id: str = PATCH_ID) -> str:
    if file_has_patch(existing, patch_id):
        updated = BLOCK_PATTERN.sub(block, existing)
        if updated != existing:
            return updated
        # fallback: append if pattern failed
        return existing.rstrip() + "\n\n" + block
    stripped = existing.rstrip()
    if not stripped:
        return block
    return stripped + "\n\n" + block


def remove_patch_from_text(text: str) -> str:
    updated = BLOCK_PATTERN.sub("", text)
    return updated.rstrip() + ("\n" if updated.strip() else "")


def read_install_state(cfg: OpenKBConfig) -> dict[str, Any]:
    path = _install_state_path(cfg)
    if not path.is_file():
        return {"installs": []}
    return json.loads(path.read_text(encoding="utf-8"))


def write_install_state(cfg: OpenKBConfig, state: dict[str, Any]) -> None:
    path = _install_state_path(cfg)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _upsert_install_record(
    state: dict[str, Any],
    record: PatchInstallRecord,
) -> None:
    installs = state.setdefault("installs", [])
    installs = [item for item in installs if item.get("target_id") != record.target_id]
    installs.append(
        {
            "target_id": record.target_id,
            "path": record.path,
            "patch_id": record.patch_id,
            "version": record.version,
            "installed_at": record.installed_at,
        }
    )
    state["installs"] = installs


def _remove_install_record(state: dict[str, Any], target_id: str) -> None:
    state["installs"] = [item for item in state.get("installs", []) if item.get("target_id") != target_id]


def scan_targets(cfg: OpenKBConfig) -> list[AgentTargetScan]:
    _, targets = load_manifest(cfg)
    results: list[AgentTargetScan] = []
    for target in targets:
        path = target.path
        file_exists = path.is_file()
        parent_exists = path.parent.is_dir()
        patched = False
        if file_exists:
            patched = file_has_patch(path.read_text(encoding="utf-8"))
        if file_exists or parent_exists:
            status = "installed" if patched else "available"
            selectable = True
        else:
            status = "missing"
            selectable = False
        results.append(
            AgentTargetScan(
                target_id=target.id,
                label=target.label,
                path=str(path),
                file_exists=file_exists,
                parent_exists=parent_exists,
                patched=patched,
                selectable=selectable,
                status=status,
            )
        )
    return results


def discover_dynamic_targets(cfg: OpenKBConfig) -> list[AgentTargetScan]:
    """Scan common agent home dirs for AGENTS.md / CLAUDE.md not in manifest."""
    _, manifest_targets = load_manifest(cfg)
    known_paths = {str(t.path.resolve()) for t in manifest_targets if t.path.exists()}
    extras: list[AgentTargetScan] = []
    home = Path.home()
    search_roots = [
        home / ".cursor",
        home / ".claude",
        home / ".codex",
        home / ".config" / "codex",
        home / ".config" / "cursor",
    ]
    names = {"AGENTS.md", "CLAUDE.md", "CLAUDE.local.md"}
    seen: set[str] = set()
    for root in search_roots:
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.name not in names:
                continue
            resolved = str(path.resolve())
            if resolved in known_paths or resolved in seen:
                continue
            seen.add(resolved)
            text = path.read_text(encoding="utf-8")
            extras.append(
                AgentTargetScan(
                    target_id=f"discovered:{path.name}:{hash(resolved) & 0xFFFF:x}",
                    label=f"Discovered · {path.relative_to(home)}",
                    path=resolved,
                    file_exists=True,
                    parent_exists=True,
                    patched=file_has_patch(text),
                    selectable=True,
                    status="installed" if file_has_patch(text) else "available",
                )
            )
    return extras


def install_patch(cfg: OpenKBConfig, target_ids: list[str]) -> list[dict[str, Any]]:
    manifest, targets = load_manifest(cfg)
    if manifest.patch_id != PATCH_ID:
        raise OpenKBError(f"Unsupported patch id: {manifest.patch_id}")
    body = _load_patch_body(cfg, manifest)
    block = build_patch_block(body, manifest)
    by_id = {t.id: t for t in targets}
    state = read_install_state(cfg)
    results: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    for target_id in target_ids:
        target = by_id.get(target_id)
        if target is None:
            results.append({"target_id": target_id, "ok": False, "error": "unknown target"})
            continue
        path = target.path
        if not path.parent.is_dir():
            results.append({"target_id": target_id, "ok": False, "error": "parent directory missing", "path": str(path)})
            continue
        existing = path.read_text(encoding="utf-8") if path.is_file() else ""
        updated = apply_patch_to_text(existing, block, manifest.patch_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(updated, encoding="utf-8")
        record = PatchInstallRecord(
            target_id=target.id,
            path=str(path.resolve()),
            patch_id=manifest.patch_id,
            version=manifest.version,
            installed_at=now,
        )
        _upsert_install_record(state, record)
        results.append({"target_id": target_id, "ok": True, "path": str(path.resolve()), "action": "installed"})
    write_install_state(cfg, state)
    return results


def install_patch_to_path(cfg: OpenKBConfig, path: Path, target_id: str) -> dict[str, Any]:
    manifest, _ = load_manifest(cfg)
    body = _load_patch_body(cfg, manifest)
    block = build_patch_block(body, manifest)
    if not path.parent.is_dir():
        path.parent.mkdir(parents=True, exist_ok=True)
    existing = path.read_text(encoding="utf-8") if path.is_file() else ""
    updated = apply_patch_to_text(existing, block, manifest.patch_id)
    path.write_text(updated, encoding="utf-8")
    state = read_install_state(cfg)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    _upsert_install_record(
        state,
        PatchInstallRecord(
            target_id=target_id,
            path=str(path.resolve()),
            patch_id=manifest.patch_id,
            version=manifest.version,
            installed_at=now,
        ),
    )
    write_install_state(cfg, state)
    return {"target_id": target_id, "ok": True, "path": str(path.resolve()), "action": "installed"}


def uninstall_patch(cfg: OpenKBConfig, target_ids: list[str] | None = None) -> list[dict[str, Any]]:
    state = read_install_state(cfg)
    installs = state.get("installs", [])
    if target_ids is None:
        selected = installs
    else:
        selected = [item for item in installs if item.get("target_id") in target_ids]

    results: list[dict[str, Any]] = []
    for item in selected:
        target_id = item.get("target_id", "")
        path = Path(item.get("path", ""))
        if not path.is_file():
            _remove_install_record(state, target_id)
            results.append({"target_id": target_id, "ok": True, "action": "removed_state_only", "path": str(path)})
            continue
        text = path.read_text(encoding="utf-8")
        if not file_has_patch(text):
            _remove_install_record(state, target_id)
            results.append({"target_id": target_id, "ok": True, "action": "already_absent", "path": str(path)})
            continue
        path.write_text(remove_patch_from_text(text), encoding="utf-8")
        _remove_install_record(state, target_id)
        results.append({"target_id": target_id, "ok": True, "action": "uninstalled", "path": str(path)})

    write_install_state(cfg, state)
    return results


def patch_status(cfg: OpenKBConfig) -> dict[str, Any]:
    manifest, _ = load_manifest(cfg)
    scans = scan_targets(cfg)
    state = read_install_state(cfg)
    return {
        "patch_id": manifest.patch_id,
        "patch_version": manifest.version,
        "openkb_root": str(cfg.root),
        "targets": [scan.__dict__ for scan in scans],
        "installs": state.get("installs", []),
    }


def print_patch_block(cfg: OpenKBConfig) -> str:
    manifest, _ = load_manifest(cfg)
    body = _load_patch_body(cfg, manifest)
    return build_patch_block(body, manifest)
