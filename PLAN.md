# Stack Agents — Project Plan

---

## ✅ Phase 1 — Project card links + richer status

- GitHub, production, and local dev links (auto-detected from git remote, env files, package.json scripts)
- Branch badge: green = main/master, amber = feature branch
- Ahead/behind/dirty stats via `git status --porcelain=v2 --branch` (single spawn)
- Relative commit age folded into existing `git log` call
- Issues count inline in stats row; click to expand details
- Card min-width bumped 300→340px

---

## ✅ Phase 2 — GitHub CI/repo hygiene

All 7 open issues resolved.

| # | Item | How |
|---|------|-----|
| #3 | CODEOWNERS | `.github/CODEOWNERS` |
| #4 | SECURITY.md | `.github/SECURITY.md` |
| #5 | Git tags + GitHub Releases | v1.0.0–v1.3.0 tagged and published |
| #6 | CI hardening | `permissions: read-all`, SHA-pinned actions, concurrency, ubuntu-24.04 |
| #7 | CI badge | Added to README header |
| #8 | Marketplace sync | PR template + CONTRIBUTING updated |
| #9 | Dependabot @types/node 24→25 | Merged PR #1 |
| — | Dependabot github-actions ecosystem | Added to `dependabot.yml` |

---

## ✅ Phase 3 — Docs completeness

| Item | What changed |
|------|-------------|
| Prerequisites section | Added to README |
| install.ps1 documented | "Quick install (Windows)" in README |
| Missing command families | "More commands" table in README |
| `agents/README.md` roster | Synced to full 33-agent roster |
| CONTRIBUTING stale step | install.ps1 clarification |
| ADR-001 | `docs/adr/ADR-001-agents-as-markdown.md` |

---

## ✅ Phase 4 — GitHub settings + issue infrastructure

### Done (file changes)

| Item | What |
|------|------|
| `release.yml` | Tag-triggered workflow: build + `gh release create --generate-notes` |
| Issue templates migrated | `bug.yml`, `new-agent.yml` — `.yml` format with required fields, Projects v2 labels, status:triage auto-label |
| `feature-request.yml` | New template: problem, solution, alternatives, area, affected agents |
| `config.yml` | Blank issues disabled; Discussions link as contact |
| Labels | Added `agent`, `priority:critical/high/medium/low`, `status:triage/in-progress/blocked` |
| Milestone `v1.4.0` | Created — "GitHub settings + issue infrastructure (Phase 4)" |

### Done (GitHub API)

| Setting | Value |
|---------|-------|
| Branch protection on `main` | 1 required review, `Dashboard — lint + build` status check required, force push blocked, deletions blocked, enforce_admins on |
| Squash merge only | merge commit + rebase disabled |
| Auto-delete head branches | enabled |

---

## ✅ Phase 5 — Dashboard enhancements

| Item | What |
|------|------|
| Stack filter chips | Clickable tech badges above grid; OR within selection, AND with text search |
| Sort cards | Dropdown: A-Z name / most recent commit / issue count |
| Pinned projects | Star toggle per card; persisted to `localStorage`; pinned cards float to top with purple border |
| Vercel deployment status badge | Lazy-fetches `/__api/vercel-status` per card; shows READY/BUILDING/ERROR; links to deployment URL when `VERCEL_TOKEN` env var present |

---

## 🔲 Phase 6 — Claude Code feature leverage

Unlock the remaining Claude Code primitives that are available but not yet wired up.

### 6a — Hooks

| Item | What | File |
|------|------|------|
| `PostToolUse` format-on-write | Auto-format/lint every file after `Edit` or `Write` tool calls | `.claude/settings.json` + hook script |
| `PreToolUse` Bash guard | Block `rm -rf` and other destructive patterns without an explicit flag | `.claude/settings.json` + hook script |
| `Stop` hook → auto session-state | Write session state automatically at end of every turn so `/session:close` data is always fresh | `.claude/settings.json` + hook script |
| `Notification` hook → system toast | Pipe Claude notifications to a Windows toast or terminal bell | `.claude/settings.json` + hook script |

### 6b — Project context files

| Item | What | File |
|------|------|------|
| `frcapp` CLAUDE.md | Add project-specific context (stack, constraints, key paths) to the frcapp repo so every session starts informed | `C:\Users\kwong318\GitHub\frcapp\CLAUDE.md` |

### 6c — Scheduled agents

| Item | What | Cadence |
|------|------|---------|
| Daily CI + dependency audit | `/schedule` task running `gh-actions` + `gh-repo` agents against this repo | Daily |
| Weekly PR health check | `/schedule` task running `gh-prs` agent to surface stale PRs | Weekly |

### 6d — MCP server gaps

| Item | What | Config |
|------|------|--------|
| Sentry MCP | Let agents read real error traces during observability audits | `~/.claude/mcp.json` |
| Slack MCP | Route hook notifications to Slack | `~/.claude/mcp.json` |

### 6e — Worktree isolation in agent specs

| Item | What |
|------|------|
| Add `isolation: worktree` guidance to destructive agent specs | Agents that scaffold or rewrite large files should run in isolated worktrees to protect the working tree |
