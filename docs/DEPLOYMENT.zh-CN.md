# 生产部署

OpenKB 1.0 以 **Python API + 静态 React Hub** 形式发布。一个进程即可同时提供两者。

## 方案 A — 本地 / 局域网（推荐）

```bash
cd /path/to/OpenKB
uv sync
cd web && npm ci && npm run build
uv run openkb serve --port 8788 --host 127.0.0.1
```

打开 `http://127.0.0.1:8788`。当 `web/dist` 存在时，FastAPI 会将其挂载到 `/`。

如需局域网访问：

```bash
uv run openkb serve --port 8788 --host 0.0.0.0
```

请在前面放置 TLS + 鉴权（nginx、Caddy）— 见 [SECURITY.md](../SECURITY.md)。

## 方案 B — Docker Compose

```bash
docker compose up --build -d
```

- 镜像：多阶段构建（Node 构建 UI，Python 运行 API）
- 卷：`./workspace` → 持久化项目
- 健康检查：`GET /api/health`

## 环境变量

| 变量 | 生产环境 |
|----------|------------|
| `OPENKB_ROOT` | Docker 中自动设置；否则为仓库绝对路径 |
| `OPENKB_AGENT_ID` | 在主机上使用 CLI 的 agent 必填 |
| `UV_CACHE_DIR` | 可选缓存位置 |

## 容器中不包含什么

业务 git 仓库（`repo_path`）仍保留在主机上。请将它们挂载或克隆到 `project.yaml` 指向的位置。

## CI 参考

GitHub Actions 会运行 `pytest`、`npm run build` 和 Playwright E2E — 见 `.github/workflows/ci.yml`。
