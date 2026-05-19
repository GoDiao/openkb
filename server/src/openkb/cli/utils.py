from __future__ import annotations

import os
import socket


def get_agent_id() -> str:
    return os.environ.get("OPENKB_AGENT_ID") or f"{socket.gethostname()}-cli"
