# Security Policy

OpenKB **1.x** is built for **local or private-network** use by a trusted operator and their coding agents. It is **not** hardened for public internet exposure.

> **If you star, fork, or demo this project:** treat it as **self-hosted dev infra**, not a public SaaS. See [Public messaging](#public-messaging) below.

## Supported deployment model

| ✅ OK | ❌ Not supported in v1.x |
|-------|---------------------------|
| `127.0.0.1` on your machine | Public VPS without reverse proxy + auth |
| LAN / VPN among teammates | Multi-tenant SaaS |
| Docker on a private host | Exposing port `8788` directly to the internet |

## Public messaging

When describing OpenKB externally (README, talks, social posts):

- **Say:** “Run on localhost or your private network; agents use CLI, humans use the Hub.”
- **Do not say:** “Deploy to a public server” without adding TLS, firewall rules, and authentication you maintain yourself.
- **Future SaaS** (auth, multi-tenant, audit) is **v2+** scope — not included in 1.1.

## Threat model (summary)

- **No authentication or authorization** — anyone who can reach the API can read/write projects, tasks, STATE, and docs.
- **CORS is permissive** (`allow_origins=["*"]`) — convenient for dev; inappropriate for hostile networks.
- **WebSocket watch** (`/api/projects/{slug}/watch`) and **notify** (`POST .../watch/notify`) have **no token** — any client on the network can subscribe or trigger refreshes.
- **CLI identity** (`OPENKB_AGENT_ID`) is self-asserted — not cryptographically verified.
- **File system access** — the server reads/writes under `OPENKB_ROOT/workspace/` and linked `repo_path` directories; path traversal is guarded in normal API use, but the process should run with least privilege.

## Recommendations

1. Bind to localhost in dev: `uv run openkb serve --port 8788` (default host `127.0.0.1`).
2. For LAN/Docker, place **OpenKB behind** a reverse proxy with TLS and network ACLs; add auth at the proxy if multiple untrusted users share a host.
3. Do **not** commit secrets into task files, STATE, or Spec/Plan under `workspace/` or business repos.
4. Keep `workspace/` and business repos in backups; deletion via API/CLI is real (including `task delete`).

## Reporting vulnerabilities

If you find a security issue, please report privately via [GitHub Security Advisories](https://github.com/GoDiao/openkb/security/advisories/new). Do not open public issues for exploitable bugs until a fix is available.

## Related docs

- [README.md](README.md) — installation and production notes
- [docs/WHY_OPENKB.md](docs/WHY_OPENKB.md) — safe positioning for open source
- [UPGRADE.md](UPGRADE.md) — version changes
- [CHANGELOG.md](CHANGELOG.md) — release notes
