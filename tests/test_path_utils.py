from openkb.config import OpenKBConfig
from openkb.path_utils import resolve_repo_path


def test_resolve_relative_repo_path(tmp_openkb_root) -> None:
    cfg = OpenKBConfig(
        root=tmp_openkb_root,
        workspace=tmp_openkb_root / "workspace",
        projects_dir=tmp_openkb_root / "workspace" / "projects",
    )
    resolved = resolve_repo_path(cfg, ".")
    assert resolved == tmp_openkb_root.resolve()
