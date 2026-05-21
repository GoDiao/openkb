# Production deployment

OpenKB 1.0 ships as a **Python API + static React Hub**. One process can serve both.

## Option A — Local / LAN (recommended)

```bash
cd /path/to/OpenKB
uv sync
cd web && npm ci && npm run build
uv run openkb serve --port 8788 --host 127.0.0.1
```

Open `http://127.0.0.1:8788`. When `web/dist` exists, FastAPI mounts it at `/`.

For LAN access:

```bash
uv run openkb serve --port 8788 --host 0.0.0.0
```

Put TLS + auth in front (nginx, Caddy) — see [SECURITY.md](../SECURITY.md).

## Option B — Docker Compose

```bash
docker compose up --build -d
```

- Image: multi-stage build (Node builds UI, Python runs API)
- Volume: `./workspace` → persist projects
- Health: `GET /api/health`

## Environment

| Variable | Production |
|----------|------------|
| `OPENKB_ROOT` | Set automatically in Docker; else absolute repo path |
| `OPENKB_AGENT_ID` | Required for agents using CLI on the host |
| `UV_CACHE_DIR` | Optional cache location |

## What is *not* in the container

Business git repos (`repo_path`) stay on the host. Mount or clone them where `project.yaml` points.

## CI reference

GitHub Actions runs `pytest`, `npm run build`, and Playwright E2E — see `.github/workflows/ci.yml`.


## Option C — Caddy reverse proxy + basic auth

For LAN or exposed deployments, put Caddy in front of `openkb serve` to handle TLS and authentication. OpenKB has no built-in auth (see [SECURITY.md](../SECURITY.md)), so a reverse proxy is the recommended approach.

### Caddyfile

```caddyfile
# Replace with your domain or LAN hostname
openkb.example.com {
    # Basic auth — generate password with: caddy hash-password
    basicauth {
        admin $2a$14$...
    }

    reverse_proxy localhost:8788

    # Optional: enforce HTTPS (Caddy does this automatically with `caddy run`)
    # encode gzip
}
```

### Setup steps

1. **Install Caddy:**

   ```bash
   # Debian/Ubuntu
   sudo apt install -y caddy

   # macOS
   brew install caddy
   ```

2. **Generate a basic auth password:**

   ```bash
   caddy hash-password
   # Enter password: ******
   # Paste the output ($2a$14$...) into the Caddyfile above
   ```

3. **Start OpenKB:**

   ```bash
   cd /path/to/OpenKB
   uv run openkb serve --port 8788 --host 127.0.0.1
   ```

4. **Start Caddy:**

   ```bash
   sudo caddy run --config /etc/caddy/Caddyfile
   ```

5. **Access:** `https://openkb.example.com` — you will be prompted for the username and password.

### nginx alternative

For nginx users, the equivalent configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name openkb.example.com;

    ssl_certificate     /etc/ssl/certs/openkb.crt;
    ssl_certificate_key /etc/ssl/private/openkb.key;

    auth_basic "OpenKB";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:8788;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Generate the htpasswd file:

```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

