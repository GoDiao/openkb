# 为什么选择 OpenKB？

**一句话：** Agent 用 CLI 对齐进度；人类在 Web Hub 里看 Spec、Plan 和路线图。

OpenKB 是 **Agent 中心化 Kanban + 项目状态 Hub**。任务文件、`STATE.md`、路线图、ADR 统一放在 `workspace/`，而不是在每个业务仓库里散落 `.openkb/`。

- **English:** [WHY_OPENKB.md](WHY_OPENKB.md)  
- **中文：** 本文件

---

## 30 秒价值主张

你在用 Coding Agent（Claude Code、Cursor、Codex…）。它们需要一个 **统一入口**：

1. **Checkout** 任务（`openkb checkout`）— 带锁与审计  
2. **Done** 收尾（`openkb done`）— 同步看板、STATE、会话日志、路线图  
3. 让 **人类** 在精致的 Web UI 里读 Spec / Plan / 决策，并实时看到 Agent 的变更  

OpenKB 就是这个入口。业务代码在 `{repo_path}`；Hub 元数据在 `OPENKB_ROOT/workspace/projects/{slug}/`。

---

## 对比一览

| | **OpenKB** | **Linear / Jira** | **纯 Markdown 仓库** | **各仓库 `.openkb/`** |
|---|------------|-------------------|----------------------|------------------------|
| **为 Coding Agent 设计** | ✅ CLI 优先 | ❌ 人类 PM 工具 | ⚠️ 手改文件 | ⚠️ 各自为政 |
| **看板 + STATE + 路线图 + ADR** | ✅ 一个 Hub | ⚠️ 靠插件拼凑 | ⚠️ 自建结构 | ⚠️ 容易漂移 |
| **CLI 变更 → UI 实时同步** | ✅ WebSocket | ✅ 云端 SaaS | ❌ 手动刷新 | ❌ 需自建 |
| **Spec/Plan 在业务仓库** | ✅ `repo_path` 只读 | ❌ 文档分离 | ✅ Git 原生 | ⚠️ 双份真相 |
| **自托管 / 离线** | ✅ uv + Docker | ❌ 厂商云 | ✅ 仅 Git | ✅ 若自建 |
| **鉴权 / 多租户 SaaS** | ❌ v1 可信内网 | ✅ | — | — |

**适合 OpenKB：** 已有 Agent CLI 工作流，希望 Kanban、STATE、路线图自动对齐，Hub 跑在本机或内网。

**不适合：** 需要完整企业 PM（OKR、迭代、计费），或要把 Hub **裸奔到公网** 且不加鉴权。

---

## 演示素材

| 素材 | 生成方式 |
|------|----------|
| **截图** | `cd web && npm run demo:capture` |
| **GIF / 短视频** | 见 [DEMO.md](DEMO.md) 60 秒脚本 |

---

## 安全提醒

OpenKB **1.x 无登录鉴权**：

| ✅ 可以 | ❌ 不要 |
|--------|--------|
| 本机 `127.0.0.1` | 公网直接暴露 `0.0.0.0:8788` |
| 局域网 / VPN / 私有 Docker | 当作多租户 SaaS 直接宣传 |
| 自建反代 + TLS + 鉴权 | 认为「开源 = 可以裸奔上 VPS」 |

详见 [SECURITY.md](../SECURITY.md)

---

## 快速开始

```bash
git clone https://github.com/GoDiao/openkb.git
cd openkb
uv sync --dev && cd web && npm ci && npm run build
export OPENKB_ROOT="$(pwd)" OPENKB_AGENT_ID="my-agent"
uv run openkb serve --port 8788
```

见 [README.zh-CN.md](../README.zh-CN.md)
