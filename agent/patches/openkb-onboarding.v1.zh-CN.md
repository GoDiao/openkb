## OpenKB（中心化项目看板）

本机已安装 OpenKB。多 Agent / 多项目的 **Kanban、STATE、Roadmap、Spec/Plan 索引** 在 OpenKB Hub 维护，不在业务 repo 散落 board 文件。

**环境变量：** `OPENKB_ROOT={OPENKB_ROOT}` · `OPENKB_AGENT_ID`（必填）  
**CLI：** `openkb.cmd …` 或 `uv run --directory {OPENKB_ROOT} openkb …`

### 会话开始（在业务 repo 或已设 `OPENKB_PROJECT`）

1. `openkb context --json` — 项目全貌（STATE / roadmap / docs 状态）
2. `openkb next --json` — 或读 context 中的 next，领取下一项任务
3. `openkb status --json` — 看板列与进行中任务

### 四种工作模式

| 场景 | 做法 |
|------|------|
| 从零新建 OpenKB 项目 | Skill §4 → `project create` |
| 已有 repo 首次接入看板 | Skill §6 → `project show` + 对齐 Spec/Plan/roadmap |
| 日常更新进度 | Skill §5 → `checkout` → 工作 → `done` + `state set` |
| Spec/Plan 变更 | 写 **业务 repo** 内文件 + `doc verify` |

**完整流程：** `{OPENKB_ROOT}/skill/openkb-sync/SKILL.md`

### 关键约定

- Spec/Plan 正文在 `{repo_path}`（业务仓库），Hub 通过 `project.yaml` 的 `docs.spec` / `docs.plan` 读取
- 运行态 Kanban/STATE 用 CLI 维护，勿手改 `workspace/projects/*/board/`、`STATE.md`
- 业务 repo 绑定：根目录 `.openkb-link`（一行 slug）或 `OPENKB_PROJECT`

**Hub（本地）：** `http://127.0.0.1:5173/projects/{slug}` · API `openkb serve --port 8788`
