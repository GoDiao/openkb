# 为 OpenKB 做贡献

感谢你帮助改进 OpenKB。本项目维护为一个 **单用户 / 可信网络** 的 Agent hub；请保持变更聚焦并经过测试。

## 开发环境设置

```bash
uv sync --extra dev
cd web && npm ci && npm run build
export OPENKB_ROOT="$(pwd)/.."
uv run pytest
cd web && npm run test:e2e
```

请参阅 [README.zh-CN.md](README.zh-CN.md) 和 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。产品叙事：[docs/WHY_OPENKB.zh-CN.md](docs/WHY_OPENKB.zh-CN.md)。

## Pull request

1. 从 `master` / `main` 创建分支。
2. 运行 **pytest** 和 **`npm run build`**；如果你修改了 Hub 或 API 同步相关内容，也请运行 E2E。
3. 匹配现有代码风格；避免无关重构。
4. 如有面向用户可见的变更，请在 **CHANGELOG.md** 的 `[Unreleased]` 下更新。

## 安全

不要为可被利用的漏洞创建公开 issue。请参阅 [SECURITY.md](SECURITY.md)。

## 许可证

贡献即表示你同意自己的贡献基于 [MIT License](LICENSE) 授权。
