from __future__ import annotations

from openkb.config import OpenKBConfig


def get_config() -> OpenKBConfig:
    return OpenKBConfig.load()
