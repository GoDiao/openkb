# Good first issues

Welcome! These tasks are scoped for first-time contributors. Comment on an issue before opening a PR.

| Label | Idea | Skills |
|-------|------|--------|
| `good first issue` | Improve i18n strings (EN ↔ 中文) | React, copy |
| `good first issue` | Add keyboard shortcut to Help page table | TypeScript |
| `good first issue` | Extend Playwright test for Decisions page | Playwright |
| `good first issue` | Document a deployment recipe (Caddy/nginx + auth) | Markdown |
| `good first issue` | Theme contrast tweak for `--chart-*` tokens | CSS |
| `help wanted` | Windows installer script (no C: cache) | PowerShell |
| `help wanted` | `.devcontainer` for GitHub Codespaces | Docker |

## Maintainer: seed issues

Create GitHub issues from this list and add labels:

```
gh issue create --title "i18n: audit overview.emptyStates in zh-CN" --label "good first issue,documentation"
gh issue create --title "e2e: Decisions page read progress bar" --label "good first issue,testing"
gh issue create --title "docs: Caddy reverse proxy + basic auth example" --label "good first issue,documentation,help wanted"
```

## How to contribute

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) and [WHY_OPENKB.md](../docs/WHY_OPENKB.md)  
2. Pick an issue or propose a small PR  
3. Run pytest + web build before submitting  

We are **not** accepting public-internet SaaS features in v1.x without a dedicated design (auth, multi-tenant) — see [SECURITY.md](../SECURITY.md).
