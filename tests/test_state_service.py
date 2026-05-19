from __future__ import annotations

from openkb.config import OpenKBConfig
from openkb.models import StateModel, StateNow
from openkb.state_service import read_state, write_state


def test_state_roundtrip(tmp_openkb_root) -> None:
    cfg = OpenKBConfig.load()
    slug = "demo"
    pdir = cfg.project_dir(slug)
    pdir.mkdir(parents=True, exist_ok=True)
    state = StateModel(
        now=StateNow(
            active_task="001-foo",
            owner="agent-a",
            branch="main",
            blocker="none",
        ),
        summary="Working on foo.",
        next_items=["Finish foo", "Start bar"],
        recent_done=["- [x] 2026-05-19 Init"],
        watch_out=["Do not touch legacy"],
        last_updated="2026-05-20 12:00",
        updated_by="test",
    )
    write_state(pdir / "STATE.md", state, project_slug=slug)
    back = read_state(pdir / "STATE.md")
    assert back.now.active_task == "001-foo"
    assert back.summary == "Working on foo."
    assert back.next_items[0] == "Finish foo"
