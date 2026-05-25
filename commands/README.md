# commands/

Command definitions for the Stack Agents orchestration system.

**How Claude Code loads commands:** `.claude/commands/` must be flat — Claude Code does not load from subdirectories. The subdirectory structure here (`web/`, `game/`, `github/`, `sprint/`) is for readability only. Every command file must also exist as a flat copy in `.claude/commands/`.

---

## Command Types

```
Individual Agent Commands    /stack:*          Invoke one specialist agent
Panel Commands               /panel:*          Convene a full agent family
Sprint Commands              /sprint:*         Manage assembled project sprint teams
Setup Commands               /setup:*          Install Claude Code config into projects
```

**Individual agent commands** route to one specialist. The agent answers from its domain.

**Panel commands** convene all agents in a family around a shared artifact. Each agent responds from their discipline; a synthesis pass surfaces cross-domain conflicts. Panels are read-only assessments — they don't install anything.

**Sprint commands** are different: `/sprint:assemble` installs a scoped orchestrator into a target project. Once installed, the sprint team operates from that project's Claude sessions, not from here.

**Setup commands** install or configure Claude Code orchestration infrastructure. Non-destructive by default.

---

## web/ — Individual Web Stack Commands

| File | Command | Description |
|------|---------|-------------|
| [web/stack-audit.md](web/stack-audit.md) | `/stack:audit [scope]` | Route to the right web agent(s) by scope. Findings grouped Critical / High / Medium / Low. |
| [web/stack-scaffold.md](web/stack-scaffold.md) | `/stack:scaffold [target]` | Production-ready boilerplate in dependency order. |
| [web/stack-advise.md](web/stack-advise.md) | `/stack:advise [question]` | Architectural recommendation with tradeoffs. |
| [web/stack-fullstack.md](web/stack-fullstack.md) | `/stack:fullstack` | All 7 web agents in dependency order + cross-layer synthesis. |

---

## game/ — Game Design Panel

| File | Command | Description |
|------|---------|-------------|
| [game/game-panel.md](game/game-panel.md) | `/panel:game [artifact]` | All 6 game design agents as a panel + cross-discipline synthesis. |

---

## github/ — GitHub Panel

| File | Command | Description |
|------|---------|-------------|
| [github/github-panel.md](github/github-panel.md) | `/panel:github [focus]` | All 6 GitHub agents as a panel + cross-domain synthesis. |

---

## notion/ — Notion Workspace Commands

Routes to the four Notion specialists: `notion-architect`, `notion-publisher`, `notion-importer`, `notion-governance`.

| File | Command | Routes To | Description |
|------|---------|-----------|-------------|
| [notion/notion-setup.md](notion/notion-setup.md) | `/notion:setup --parent <page-url-or-id>` | `notion-architect` | Bootstrap canonical Notion databases (Sprints, PRDs, Research, Analytics, GitHub audits, etc.) with default views |
| [notion/notion-publish.md](notion/notion-publish.md) | `/notion:publish <type> <identifier>` | `notion-publisher` | Idempotent upsert by `Source` URL — types: `sprint`, `prd`, `research`, `analytics`, `github-audit`, `quality-audit`, `game-design`, `runbook` |
| [notion/notion-import.md](notion/notion-import.md) | `/notion:import <url-or-id> [--as <type>] [--into <agent>]` | `notion-importer` | Read a Notion page or database into session context for a downstream agent |
| [notion/notion-audit.md](notion/notion-audit.md) | `/notion:audit [--scope <list>] [--auto-flag] [--propose-archives]` | `notion-governance` | Workspace health: ownership, freshness, duplicates, source integrity, schema drift, permissions |
| [notion/notion-panel.md](notion/notion-panel.md) | `/panel:notion [focus]` | All 4 Notion specialists | Coordinated workspace review with cross-specialty synthesis |

---

## knowledge/ — Cross-surface Documentation Panel

| File | Command | Description |
|------|---------|-------------|
| [knowledge/knowledge-panel.md](knowledge/knowledge-panel.md) | `/panel:knowledge [focus]` | notion-architect + notion-governance + gh-docs — audits docs across Notion and the repo |

---

## publish/ — Publish-readiness Gate

| File | Command | Description |
|------|---------|-------------|
| [publish/publish-panel.md](publish/publish-panel.md) | `/panel:publish <artifact>` | product + analytics + notion-publisher — quality gate before publishing a PRD or analytics spec |

---

## sprint/ — Sprint Commands

| File | Command | Description |
|------|---------|-------------|
| [sprint/sprint-assemble.md](sprint/sprint-assemble.md) | `/sprint:assemble "<goal>" --project <path>` | Assemble a sprint team, generate missing agents, install scoped orchestrator |
| [sprint/sprint-list.md](sprint/sprint-list.md) | `/sprint:list [--status] [--project]` | List all sprints + usage history from registry |
| [sprint/sprint-status.md](sprint/sprint-status.md) | `/sprint:status` | Sprint health check — run from target project |
| [sprint/sprint-dissolve.md](sprint/sprint-dissolve.md) | `/sprint:dissolve "<name>"` | Remove sprint orchestrator from target project (non-destructive) |

---

## setup/ — Setup Commands

| File | Command | Description |
|------|---------|-------------|
| [setup/setup-project.md](setup/setup-project.md) | `/setup:project --target <path> --mode config\|bootstrap` | Add Claude orchestration to an existing repo or bootstrap a new one. Stacks: `nextjs`, `nextjs-ai`, `nextjs-edu`, `nextjs-events`, `nextjs-knowledge`, `vite-react`, `game` |
| [setup/setup-hooks.md](setup/setup-hooks.md) | `/setup:hooks [--add <recipe>]` | Install hook recipes into `.claude/settings.json` |

---

## Naming Convention

Files: `namespace-verb.md`
Frontmatter `name:`: `namespace:verb`

That `name:` value is the slash command Claude Code registers (e.g., `/sprint:assemble`).

---

## Adding a New Command

1. Write the command definition in the appropriate subdirectory (`commands/web/`, `commands/sprint/`, etc.)
2. Copy the identical file to `.claude/commands/<namespace>-<verb>.md` (flat — no subdirectory)
3. Add a row to this README
4. Add a row to the `## Commands` table in `CLAUDE.md`
5. Sync `CLAUDE.md` to `~/.claude/CLAUDE.md`

---

## .claude/commands/ — Flat Registry

These are the files Claude Code actually loads:

| File | Command |
|------|---------|
| `stack-audit.md` | `/stack:audit` |
| `stack-scaffold.md` | `/stack:scaffold` |
| `stack-advise.md` | `/stack:advise` |
| `stack-fullstack.md` | `/stack:fullstack` |
| `panel-game.md` | `/panel:game` |
| `panel-github.md` | `/panel:github` |
| `sprint-assemble.md` | `/sprint:assemble` |
| `sprint-list.md` | `/sprint:list` |
| `sprint-status.md` | `/sprint:status` |
| `sprint-dissolve.md` | `/sprint:dissolve` |
| `setup-project.md` | `/setup:project` |
| `setup-hooks.md` | `/setup:hooks` |
| `notion-setup.md` | `/notion:setup` |
| `notion-publish.md` | `/notion:publish` |
| `notion-import.md` | `/notion:import` |
| `notion-audit.md` | `/notion:audit` |
| `panel-notion.md` | `/panel:notion` |
| `panel-knowledge.md` | `/panel:knowledge` |
| `panel-publish.md` | `/panel:publish` |
