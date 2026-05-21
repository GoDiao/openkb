---
assignee: cursor-agent
branch: main
created: '2026-05-20'
id: '026'
lock_expires: ''
locked_at: ''
locked_by: ''
priority: P1
related_files:
- server/src/openkb/cli/console.py
- server/src/openkb/cli/main.py
- tests/test_cli_console.py
- tests/test_cli.py
status: done
tags:
- maint
- cli
- windows
title: '[MAINT] Windows CLI UTF-8 输出（GBK 控制台不崩溃）'
updated: '2026-05-20T19:05:00Z'
---

## Goal

`openkb done` 等命令在 Windows GBK 控制台输出中文或 «» 时不应抛 `UnicodeEncodeError`；优先 UTF-8，不可编码字符安全降级。

## Acceptance

- [x] 启动时 `ensure_stdio_utf8()` 尝试将 stdout/stderr 设为 UTF-8
- [x] 所有人类可读输出经 `cli_echo`，GBK 流下用 `errors=replace` 兜底
- [x] 单元测试：模拟 GBK stdout 输出中文 + guillemets 不抛异常
- [x] CLI 集成测试：`done` 人类模式 + Unicode Next 项 exit 0

## Context

收尾时 `openkb done 005` 首行已打印但第二行 `«Next»` 触发 GBK 编码失败；任务实际已完成。

## Notes

- 2026-05-20 完成：`cli/console.py` + Typer callback + `test_cli_console.py`
