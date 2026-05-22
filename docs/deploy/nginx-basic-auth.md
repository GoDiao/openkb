# Nginx reverse proxy with basic auth

OpenKB 1.x does not include built-in authentication. If you bind `openkb serve` beyond localhost for a LAN or VPN setup, put it behind a reverse proxy that adds access control. See [SECURITY.md](../../SECURITY.md) for the full threat model.

This example keeps OpenKB listening on localhost and exposes it through nginx with HTTP Basic Authentication.

## 1. Start OpenKB on localhost

```bash
cd /path/to/OpenKB
uv run openkb serve --host 127.0.0.1 --port 8788
```

## 2. Create a password file

Install `htpasswd` if needed (`apache2-utils` on Debian/Ubuntu, `httpd-tools` on Fedora/RHEL, or `brew install httpd` on macOS), then create credentials:

```bash
sudo htpasswd -c /etc/nginx/.openkb.htpasswd openkb
```

Use a strong password and keep the file readable only by nginx/root.

## 3. Configure nginx

Create a server block such as `/etc/nginx/conf.d/openkb.conf`:

```nginx
server {
    listen 80;
    server_name openkb.lan;

    auth_basic "OpenKB";
    auth_basic_user_file /etc/nginx/.openkb.htpasswd;

    location / {
        proxy_pass http://127.0.0.1:8788;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Required for live updates in the Hub.
    location /api/projects/ {
        proxy_pass http://127.0.0.1:8788;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

For public or untrusted networks, also add TLS, firewall rules, and network ACLs. Do not expose OpenKB directly without a proxy-level auth layer.

## 4. Reload and verify

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Open `http://openkb.lan/` and confirm nginx prompts for the username and password before the Hub loads.
