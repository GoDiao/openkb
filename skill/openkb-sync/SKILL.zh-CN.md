---
name: openkb-sync
description: >-
  OpenKB 项目档案员。支持：①新项目 create ②已有项目增量同步（更新 task/进度/Spec/Plan）。
  Spec/Plan 写在 repo_path；写完后 doc verify。OPENKB_ROOT + openkb.cmd。
---

# OpenKB Sync

Agent 职责：**用户打开 Hub 任意一页，都能看到真实项目。**  
只写 markdown 但 **Hub 加载不到** = 失败（Hermes/YONOH 曾因此 Spec/Plan 页空白）。

---

## 用哪个模式？（Agent 先判断用户意图）

| 用户 / 场景 | 模式 | 不要做什么 |
|-------------|------|-----------|
| 「新建项目」「做个新 idea」「还没有 OpenKB 项目」 | **§4 新项目** → `project create` | 不要 create 已有 slug |
| 「更新进度」「同步看板」「我做了 xxx」「继续 Hermes/YONOH」 | **§5 已有项目 · 增量同步** | 不要 project create；不要盖掉 Spec |
| 「改 Spec/Plan」「讨论出了新方案」 | **§2 + §5.3 文档更新** | 不要只改代码不更新 Hub |
| 「领任务 / 做完 / 关单」 | **§5.2 看板运行态** | 不要只 commit 不 `done` |

**同一个 Skill，两种主流程：** 新建 = create；已有 = context → 增量更新。

---

## 0. 环境


| 变量                | 必填         |
| ----------------- | ---------- |
| `OPENKB_ROOT`     | OpenKB 根目录 |
| `OPENKB_AGENT_ID` | Agent 身份   |


执行：`openkb.cmd …`（或 `uv run --directory $env:OPENKB_ROOT openkb …`）。

API/UI 开发时：`uv run openkb serve --port 8788` + `cd web && npm run dev`（5173）。

---

## 1. Hub 怎么读到 Spec / Plan（必懂）

```
Web UI  /projects/{slug}/spec
    → GET /api/projects/{slug}/docs/spec
        → 读 project.yaml 的 docs.spec（相对路径）
        → 打开文件：{repo_path}/{docs.spec}   ← 唯一正确位置
        → 返回 content 渲染 Markdown
```

**Plan 页** 同理，读 `docs.plan`。


| 字段          | 在 project.yaml        | 实际文件位置                                 |
| ----------- | --------------------- | -------------------------------------- |
| `repo_path` | `E:/.../hermes-agent` | 业务 git 仓库根                             |
| `docs.spec` | `docs/spec.md`        | `**E:/.../hermes-agent/docs/spec.md`** |
| `docs.plan` | `docs/plan.md`        | `**E:/.../hermes-agent/docs/plan.md`** |


### 写错位置的典型错误


| Agent 写的位置                                                      | Hub 能否显示 |
| --------------------------------------------------------------- | -------- |
| `OpenKB/workspace/projects/{slug}/spec.md`                      | ❌ 永远不显示  |
| `OpenKB/docs/spec.md`（除非 repo_path 就是 OpenKB）                   | ❌ 通常不显示  |
| `{repo_path}/docs/spec.md` 且 `set-docs` 已登记                     | ✅        |
| `{repo_path}/其它路径/design.md` + `set-docs --spec 其它路径/design.md` | ✅        |


**结论：Spec/Plan 是业务 repo 里的文件；workspace 只存指针（project.yaml），不存 Spec/Plan 正文。**

---

## 2. 如何写 Spec / Plan（逐步操作）

### 2.1 确认项目绑定

```powershell
openkb.cmd project show --json
```

记下：

- `project.repo_path` → 业务仓库根目录  
- `project.docs.spec` / `project.docs.plan` → 相对路径（可能为空）

### 2.2 选定路径并登记

默认推荐（可改）：

- Spec → `{repo_path}/docs/spec.md`  
- Plan → `{repo_path}/docs/plan.md`

```powershell
openkb.cmd project set-docs --spec docs/spec.md --plan docs/plan.md --json
```

若项目已有文档（如 `docs/design/yonoh-spec.md`），**登记真实路径**，不要强行覆盖为默认路径：

```powershell
openkb.cmd project set-docs --spec docs/design/yonoh-spec.md --json
```

### 2.3 在业务 repo 写文件

在 `**repo_path` 下** 创建或编辑 Markdown（用编辑器/Write 工具，不是 workspace）：

**Spec 建议结构：**

```markdown
# {项目名} — Design Spec
**Status:** Draft | Approved
**Project slug:** `{slug}`

## Summary
（一段话说明项目是什么）

## Problem / Goals / Non-Goals
## Architecture
## Current Status / Phases
```

**Plan 建议结构：**

```markdown
# {项目名} — Implementation Plan
**Status:** Active
**Spec:** `docs/spec.md`

## Goal
（一句话）

## Phase 0: 标题
（步骤、验收）

## Phase 1: 标题
...
```

Plan 的 `**## Phase N:` 标题** 必须与 `roadmap.yaml` 的 `plan_ref: "Phase N"` 一致，Plan 页侧边栏才显示 ✓/●。

### 2.4 写完后必须验证（不验证不算完成）

```powershell
openkb.cmd doc verify --json
```

期望：

```json
"hub_checks": [
  { "kind": "spec", "hub_visible": true, "absolute_path": "E:/.../hermes-agent/docs/spec.md" },
  { "kind": "plan", "hub_visible": true, ... }
],
"all_hub_visible": true
```

任一项 `hub_visible: false` → 文件不在 `repo_path/相对路径`，或路径未登记 → **修正后再 verify**。

可选：确认 API 能读到内容：

```powershell
openkb.cmd doc spec --json
openkb.cmd doc plan --json
```

### 2.5 同步 roadmap（否则 Graph/Plan 进度仍错）

Spec/Plan 写好后 **必须** 重写 `workspace/projects/{slug}/roadmap.yaml`，phase 与 Plan 的 Phase 对齐（**删掉** create 自带的 spec/plan/build 三格模板）。

---

## 3. Hub 各页数据源（一览）


| 页面            | 数据从哪来                           | Agent 维护                      |
| ------------- | ------------------------------- | ----------------------------- |
| **Spec**      | `{repo_path}/{docs.spec}`       | 写业务 repo 文件 + set-docs        |
| **Plan**      | `{repo_path}/{docs.plan}`       | 同上                            |
| **Graph**     | `workspace/.../roadmap.yaml`    | 手写 yaml，与 Plan Phase 对齐       |
| **Decisions** | `workspace/.../decisions/D*.md` | 写 D001-….md                   |
| **Overview**  | STATE.md + roadmap 摘要           | `state set`                   |
| **Kanban**    | board/*                         | CLI task create/checkout/done |


---

## 4. 新项目流程

```powershell
openkb.cmd project create --slug X --name "..." --repo-path E:/path/to/repo --link --json
# 1. 编辑 E:/path/to/repo/docs/spec.md 和 plan.md（替换 [TODO]）
# 2. openkb.cmd doc verify --json  → all_hub_visible true
# 3. 重写 roadmap.yaml
# 4. state set / task create / decisions
```

---

## 5. 已有项目 · 增量同步（最常用）

**适用：** 项目已在 OpenKB 里（如 `hermes-agent-yonoh`），Agent 刚完成或讨论了新工作，用户要你「更新进度 / 同步看板 / 反映到 OpenKB」。

### 5.1 会话开始（30 秒）

在**业务 repo 根目录**（或已设 `OPENKB_PROJECT`）：

```powershell
openkb.cmd context --json
openkb.cmd project show --json      # pending、docs 路径
openkb.cmd status --json            # 看板现状
openkb.cmd roadmap --json           # 当前 phase
```

确认 `project` 字段已是目标 slug，**不要** `project create`。

### 5.2 只改了代码 / 完成了任务 → 更新看板

```powershell
# 若有进行中任务
openkb.cmd checkout <id> --json
openkb.cmd note <id> "做了什么、测了什么" --json

# 完成
openkb.cmd done <id> --json
# → 自动：Next 划第一项、可能推进 roadmap phase

# 更新一句话现状
openkb.cmd state set --summary "完成了 X；下一步 Y" --json
openkb.cmd state set --next "下一项" --next "再下一项" --json

# 整个 phase 做完
openkb.cmd roadmap complete p2 --json
```

**新发现的工作项**（Plan 里没写过的）：

```powershell
openkb.cmd task create --title "具体描述" --priority P1 --json
```

### 5.3 讨论/product 有变 → 更新文档 + 进度图

| 变了什么 | 做什么 |
|----------|--------|
| 范围 / 架构 | **编辑** `{repo_path}/{docs.spec}`（增补章节，勿整篇覆盖） |
| 步骤 / 新 Phase | **编辑** `{repo_path}/{docs.plan}` + **同步** `roadmap.yaml` |
| 新决策 | 新建 `workspace/.../decisions/D00N-….md` |
| Phase 状态 | `roadmap complete/set` 或改 roadmap.yaml 的 status |

写完后：

```powershell
openkb.cmd doc verify --json
```

### 5.4 增量同步 checklist（会话结束前）

- [ ] `state.summary` 反映**今天**做了什么  
- [ ] 已完成 task 已 `done`（不在 doing 挂着）  
- [ ] 新 task 已 create（若用户口头布置了新工作）  
- [ ] Spec/Plan/roadmap 与讨论一致（有变更才改）  
- [ ] `roadmap` 里 active phase 对应当前工作  
- [ ] 可选：`doc verify` + 浏览器扫一眼 Overview/Kanban  

### 5.5 给用户的一句话汇报模板

> 已同步 OpenKB `{slug}`：完成 task `{id}` / 更新 STATE / roadmap `{phase}` → active|done。Hub Overview 与 Kanban 已更新。

---

## 6. 接手已有 repo（首次接入 OpenKB）

1. `project show` 看 repo_path 和 docs 指针  
2. **Read** `{repo_path}/{docs.spec}` — 若已有内容，**增补**而非盖模板  
3. `doc verify` — 直到 hub_visible  
4. 对齐 roadmap / STATE / Kanban  

（若尚无 OpenKB 项目记录，才用 `project create`，见 §4。）

---

## 7. 运行态 CLI

```powershell
openkb.cmd checkout <id> --json
openkb.cmd done <id> --json
openkb.cmd state set --summary "…" --json
openkb.cmd roadmap complete p2 --json
openkb.cmd task create --title "…" --priority P0 --json
openkb.cmd task delete <id> --json          # 仅 backlog/todo/doing/review；done 需 --force
```

禁止手改 `board/*.md`、`STATE.md`。允许手改 Spec/Plan/decisions/roadmap.yaml（在正确路径）。

### 看板拖拽 vs CLI（重要）

| | Hub 拖拽 | CLI `checkout` / `done` |
|--|----------|---------------------------|
| 任务列/文件 | ✅ | ✅ |
| STATE.md | ❌ | ✅ |
| Session 日志 | ❌ 拖拽不写 | ✅ done/release 写入 |
| 锁 | ❌ | ✅ |
| Roadmap 阶段 | ❌ | ✅ 任务齐时可自动完成 phase |

**Agent 必须用 CLI 完成工作**，不要用 Hub 拖拽代替 `openkb done`。Hub 帮助页 `/help` 有对照表。WebSocket V2（`/api/projects/{slug}/watch`）在 CLI/API 变更后近实时刷新 UI。

---

## 8. 会话结束前自检

- `doc verify` → `all_hub_visible: true`  
- Graph phase = Plan 里的 Phase，不是「Spec定稿/Plan定稿/开发」  
- Decisions 页有 D*.md（非仅 _README）  
- Overview Summary 描述**本项目**

**在浏览器打开** `/projects/{slug}/spec` 和 `/plan` 能见到正文，才允许结束。

---

## 9. 故障


| 现象                       | 原因                            | 处理                                  |
| ------------------------ | ----------------------------- | ----------------------------------- |
| Spec 页「无法加载」或一直加载        | 文件不在 `repo_path/路径` 或 API 未重启 | `doc verify`；修正路径；重启 `openkb serve` |
| `exists: false`          | 写错目录                          | 移到 `{repo_path}/{docs.spec}`        |
| 写了长文但 UI 空白              | 写在 workspace 或 OpenKB 根       | 改写到业务 repo                          |
| Graph 与 Plan 无关          | roadmap 仍是 create 模板          | 重写 roadmap.yaml                     |
| `doc verify` OK 但 UI 404 | 旧 API 进程                      | 重启 serve（需带 OPENKB_ROOT）            |


---

## 10. 示例 Hermes Agent / YONOH

- slug: `hermes-agent-yonoh`  
- repo_path: `E:/AProject/TianX/Personal/hermes-agent`  
- Spec: `hermes-agent/docs/spec.md`  
- Plan: `hermes-agent/docs/plan.md`  
- 验证: `openkb.cmd doc verify --project hermes-agent-yonoh --json`

