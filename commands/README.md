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

## agents/ — Agent lifecycle commands

Routes to the `agent-lifecycle` meta-agent. Treat the agent roster as staff.

| File | Command | Description |
|------|---------|-------------|
| [agents/agents-hire.md](agents/agents-hire.md) | `/agents:hire <name> --family <X>` | Create new agent file from template + insert Notion row atomically |
| [agents/agents-fire.md](agents/agents-fire.md) | `/agents:fire <name> --reason "<text>"` | Deprecate: Status=Deprecated, file → `.deprecated/`, surface stale refs |
| [agents/agents-train.md](agents/agents-train.md) | `/agents:train <name>` | Self-audit + propose unified-diff spec improvements |
| [agents/agents-combine.md](agents/agents-combine.md) | `/agents:combine A B --into C` | Merge two agents into one; interactive reference rewrite |
| [agents/agents-review.md](agents/agents-review.md) | `/agents:review` | Quarterly performance review across roster; advisory only |

---

## notion/ — Notion Workspace Commands

Routes to the four Notion specialists: `notion-architect`, `notion-publisher`, `notion-importer`, `notion-governance`.

| File | Command | Routes To | Description |
|------|---------|-----------|-------------|
| [notion/notion-bootstrap.md](notion/notion-bootstrap.md) | `/notion:bootstrap --parent <page-url-or-id>` | `notion-architect` | One-shot first-time setup: parent resolution + database scaffold + writes `.notion/config.json`. Idempotent. **Run this first.** |
| [notion/notion-setup.md](notion/notion-setup.md) | `/notion:setup --parent <page-url-or-id>` | `notion-architect` | Lower-level: scaffold canonical Notion databases only (no config file). Use bootstrap unless you need this. |
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

## web/ — Additional Panel Commands

| File | Command | Description |
|------|---------|-------------|
| [web/stack-panel.md](web/stack-panel.md) | `/panel:stack` | All 7 web stack agents in dependency order + cross-layer synthesis |
| [web/website-panel.md](web/website-panel.md) | `/panel:website TARGET_SITE: <url>` | website-audit + student-lens + UX persona review |
| [web/ai-feature-panel.md](web/ai-feature-panel.md) | `/panel:ai-feature [feature]` | ai-llm + prompt-engineer + application — AI feature review |
| [web/launch-panel.md](web/launch-panel.md) | `/panel:launch` | Full pre-launch sweep across all layers → Ship / No-Ship verdict |

---

## quality/ — Quality Panel

| File | Command | Description |
|------|---------|-------------|
| [quality/quality-panel.md](quality/quality-panel.md) | `/panel:quality [scope]` | web-qa + accessibility + performance — full quality sweep |

---

## research/ — Research Panel

| File | Command | Description |
|------|---------|-------------|
| [research/research-panel.md](research/research-panel.md) | `/panel:research [question]` | user-research + usability-testing + focus-group + expert-review — full research pass |

---

## design/ — Design Panels

| File | Command | Description |
|------|---------|-------------|
| [design/design-panel.md](design/design-panel.md) | `/panel:design [scope]` | visual-designer + interaction-designer + information-architect |
| [design/psych-panel.md](design/psych-panel.md) | `/panel:psych [scope]` | cognitive-psychologist + behavioral-psychologist |

---

## security/ — Security Commands

| File | Command | Description |
|------|---------|-------------|
| [security/security-panel.md](security/security-panel.md) | `/panel:security` | security + env-debugger + static analysis — security sweep |
| [security/security-baseline.md](security/security-baseline.md) | `/security:baseline` | First-pass security sweep (semgrep, insecure defaults, supply chain) |

---

## review/ — Code Review Commands

| File | Command | Description |
|------|---------|-------------|
| [review/review-code.md](review/review-code.md) | `/review:code [file or dir]` | Code quality — correctness, complexity, naming, dead code |
| [review/review-data-model.md](review/review-data-model.md) | `/review:data-model [schema]` | Schema — entities, relationships, normalization, domain fitness |
| [review/review-artifact.md](review/review-artifact.md) | `/review:artifact [file]` | Agent/skill/command quality gate before publishing |

---

## debug/ — Debugging Commands

| File | Command | Description |
|------|---------|-------------|
| [debug/debug-env.md](debug/debug-env.md) | `/debug:env [scope]` | Trace env vars, find missing vars, NEXT_PUBLIC_ violations |

---

## ai/ — AI & Prompt Commands

| File | Command | Description |
|------|---------|-------------|
| [ai/ai-prompt-test.md](ai/ai-prompt-test.md) | `/ai:prompt-test [prompt]` | Regression test suite for a prompt or AI feature |
| [ai/ai-prompt-design.md](ai/ai-prompt-design.md) | `/ai:prompt-design [feature]` | Design or review a system prompt |

---

## auth/ — Auth Audit Commands

| File | Command | Description |
|------|---------|-------------|
| [auth/auth-clerk.md](auth/auth-clerk.md) | `/auth:clerk [scope]` | Clerk authentication security audit |
| [auth/auth-nextauth.md](auth/auth-nextauth.md) | `/auth:nextauth [scope]` | NextAuth.js security audit |

---

## docs/ — Documentation Commands

| File | Command | Description |
|------|---------|-------------|
| [docs/docs-audit.md](docs/docs-audit.md) | `/docs:audit` | Audit documentation for completeness and accuracy |
| [docs/docs-write.md](docs/docs-write.md) | `/docs:write [file]` | Rewrite documentation in the correct voice for its audience |

---

## gtli/ — GTLI Commands

| File | Command | Description |
|------|---------|-------------|
| [gtli/gtli-student-audit.md](gtli/gtli-student-audit.md) | `/gtli:student-audit TARGET_SITE: <url>` | Prospective student enrollment funnel audit |
| [gtli/gtli-ux-panel.md](gtli/gtli-ux-panel.md) | `/panel:gtli-ux` | All 5 GTLI UX persona agents + synthesis |
| [gtli/gtli-jgcc-panel.md](gtli/gtli-jgcc-panel.md) | `/panel:gtli-jgcc` | All 11 JGCC learning quality agents + synthesis |
| [gtli/gtli-sim-panel.md](gtli/gtli-sim-panel.md) | `/panel:gtli-sim [feature]` | Simulated user panel across GTLI archetypes |

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
| `panel-stack.md` | `/panel:stack` |
| `panel-game.md` | `/panel:game` |
| `panel-github.md` | `/panel:github` |
| `panel-quality.md` | `/panel:quality` |
| `panel-research.md` | `/panel:research` |
| `panel-design.md` | `/panel:design` |
| `panel-psych.md` | `/panel:psych` |
| `panel-security.md` | `/panel:security` |
| `panel-website.md` | `/panel:website` |
| `panel-ai-feature.md` | `/panel:ai-feature` |
| `panel-content.md` | `/panel:content` |
| `panel-launch.md` | `/panel:launch` |
| `panel-notion.md` | `/panel:notion` |
| `panel-knowledge.md` | `/panel:knowledge` |
| `panel-publish.md` | `/panel:publish` |
| `panel-gtli-ux.md` | `/panel:gtli-ux` |
| `panel-gtli-jgcc.md` | `/panel:gtli-jgcc` |
| `panel-gtli-sim.md` | `/panel:gtli-sim` |
| `sprint-assemble.md` | `/sprint:assemble` |
| `sprint-list.md` | `/sprint:list` |
| `sprint-status.md` | `/sprint:status` |
| `sprint-dissolve.md` | `/sprint:dissolve` |
| `setup-project.md` | `/setup:project` |
| `setup-hooks.md` | `/setup:hooks` |
| `notion-bootstrap.md` | `/notion:bootstrap` |
| `notion-setup.md` | `/notion:setup` |
| `notion-publish.md` | `/notion:publish` |
| `notion-import.md` | `/notion:import` |
| `notion-audit.md` | `/notion:audit` |
| `agents-hire.md` | `/agents:hire` |
| `agents-fire.md` | `/agents:fire` |
| `agents-train.md` | `/agents:train` |
| `agents-combine.md` | `/agents:combine` |
| `agents-review.md` | `/agents:review` |
| `review-code.md` | `/review:code` |
| `review-data-model.md` | `/review:data-model` |
| `review-artifact.md` | `/review:artifact` |
| `debug-env.md` | `/debug:env` |
| `ai-prompt-test.md` | `/ai:prompt-test` |
| `ai-prompt-design.md` | `/ai:prompt-design` |
| `auth-clerk.md` | `/auth:clerk` |
| `auth-nextauth.md` | `/auth:nextauth` |
| `docs-audit.md` | `/docs:audit` |
| `docs-write.md` | `/docs:write` |
| `security-baseline.md` | `/security:baseline` |
| `gtli-student-audit.md` | `/gtli:student-audit` |
| `session-open.md` | `/session:open` |
| `session-close.md` | `/session:close` |
