# 参与 OpenKB 贡献

感谢你改进 OpenKB。本项目定位为**单用户 / 可信网络**的 Agent Hub；请保持改动聚焦且经过测试。

## 开发环境准备

```bash
uv sync --extra dev
cd web && npm ci && npm run build
export OPENKB_ROOT="$(pwd)/.."
uv run pytest
cd web && npm run test:e2e
```

参考 [README.md](README.md) 与 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。产品叙事见 [docs/WHY_OPENKB.md](docs/WHY_OPENKB.md)。

## Pull Request 规范

1. 从 `master` / `main` 创建分支。
2. 运行 **pytest** 和 **`npm run build`**；若改动涉及 Hub 或 API 同步，请额外运行 E2E。
3. 遵循现有代码风格；避免无关重构。
4. 若改动对用户可见，请在 **CHANGELOG.md** 的 `[Unreleased]` 下更新条目。

## 安全

不要在公开 issue 中披露可被利用的漏洞。请查看 [SECURITY.md](SECURITY.md)。

## 许可

提交贡献即表示你同意按 [MIT License](LICENSE) 进行许可。
