from pathlib import Path

import pytest

from openkb.config import OpenKBConfig
from openkb.path_utils import resolve_repo_path


def _config_for(root: Path) -> OpenKBConfig:
    return OpenKBConfig(
        root=root,
        workspace=root / "workspace",
        projects_dir=root / "workspace" / "projects",
    )


def test_resolve_relative_repo_path(tmp_openkb_root) -> None:
    cfg = _config_for(tmp_openkb_root)

    resolved = resolve_repo_path(cfg, ".")

    assert resolved == tmp_openkb_root.resolve()


@pytest.mark.parametrize(
    ("repo_path", "expected"),
    [
        ("workspace/projects/demo/", "workspace/projects/demo"),
        (
            "workspace/projects/demo/board/todo/../todo/..",
            "workspace/projects/demo/board",
        ),
    ],
)
def test_resolve_relative_repo_path_edge_cases(
    tmp_openkb_root, repo_path: str, expected: str
) -> None:
    cfg = _config_for(tmp_openkb_root)

    resolved = resolve_repo_path(cfg, repo_path)

    assert resolved == (tmp_openkb_root / expected).resolve()


@pytest.mark.skipif(
    not Path("C:/").is_absolute(), reason="Windows drive paths are platform-specific"
)
def test_resolve_windows_drive_path(tmp_openkb_root) -> None:
    cfg = _config_for(tmp_openkb_root)
    drive_path = "C:/openkb/project"

    resolved = resolve_repo_path(cfg, drive_path)

    assert resolved == Path(drive_path).resolve()
