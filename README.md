[![CI](https://github.com/kevinvwong/stack-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/kevinvwong/stack-agents/actions/workflows/ci.yml)
[![Marketplace](https://img.shields.io/badge/marketplace-1.9.1-blue)](./CHANGELOG.md)
[![Dashboard](https://img.shields.io/badge/dashboard-local-blue)](./dashboard/README.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

# stack-agents

38 specialist Claude Code agents + a master orchestrator + a Notion-integrated dashboard for solo and small-team multi-agent workflows.

## Why this exists

Claude Code can run any prompt, but on a real project the hard part is knowing which prompt to run and where the answer lives a week later. stack-agents gives you a routing layer (the master orchestrator in `CLAUDE.md`), a roster of opinionated specialists for the layers of a modern web/game stack, and persistent project memory in Notion via the bundled publishing and import commands. The dashboard makes the agent graph and your project portfolio browsable so the system stays legible as it grows.

![Dashboard agent graph](docs/screenshots/dashboard-agent-graph.png)

<!-- The image above is a 1×1 placeholder. See docs/screenshots/README.md for how to capture a real screenshot from the local dashboard. -->

## Install

```
/plugin marketplace add kevinvwong/kwong-claude-marketplace
/plugin install kwong-stack-agents kwong-commands kwong-skills
```

Full install options (manual, Windows, macOS/Linux, per-project) in [`docs/SETUP.md`](./docs/SETUP.md).

## Top 5 commands

| Command                                                          | What it does                                |
| ---------------------------------------------------------------- | ------------------------------------------- |
| `/stack:audit data`                                              | Audit one stack layer                       |
| `/panel:github`                                                  | Full GitHub-repo health review (6 agents)   |
| `/sprint:assemble "<goal>" --project <path>`                     | Convene a custom sprint team                |
| `/notion:bootstrap --parent <url>`                               | Wire up a Notion workspace for a repo       |
| `/setup:project --target <path> --mode bootstrap --stack nextjs` | Create a new repo with the canonical layout |

Routing rules for every command and agent live in [`CLAUDE.md`](./CLAUDE.md). Catalogs in [`agents/README.md`](./agents/README.md) and [`commands/README.md`](./commands/README.md).

## Full docs

Live dashboard: <https://stack-agents-dashboard.vercel.app/>

---

## Architecture

### Prerequisites

- [Claude Code](https://claude.ai/code) CLI installed and authenticated
- Node.js 18+ (for the dashboard)
- PowerShell 5.1+ (Windows — for `install.ps1`) or Bash 3.2+ (macOS / Linux — for `install.sh`)
- [GitHub CLI](https://cli.github.com/) (`gh`) — optional, enables project issue loading in the dashboard

### What it is

**Agent system** — specialist `.md` agents invoked through Claude Code slash commands. Each agent has an opinionated `/audit` checklist, `/scaffold` templates, and a `/advise` mode. The master orchestrator (`CLAUDE.md`) routes requests to the right agents in dependency order and synthesizes cross-cutting findings.

**Dashboard** — a local Vite + React app that renders the agent graph (nodes, dependency chains, handoff edges), lets you browse agent specs, and shows a project explorer with git status, stack detection, links, and open GitHub issues across all your repos.

### Web Stack dependency chain

```
data → security → ai-llm → application → infrastructure → observability → presentation
```

### Default stack (override with `STACK: key=value`)

| Layer     | Default                                              |
| --------- | ---------------------------------------------------- |
| Frontend  | Next.js 15 App Router + Tailwind CSS 4               |
| Backend   | Vercel Edge Functions (TypeScript strict)            |
| Database  | Neon (Postgres) + Drizzle ORM                        |
| Auth      | Neon Auth (`@neondatabase/auth`)                     |
| Cache     | Upstash Redis                                        |
| AI        | Anthropic Claude API + ElevenLabs TTS + Deepgram STT |
| Analytics | PostHog + Sentry                                     |

### Structure

```
agents/              — 38 specialist agent .md files (see agents/README.md)
commands/
  web/               — /stack:* commands
  game/              — /panel:game command
  github/            — /panel:github command
  sprint/            — /sprint:* commands
  setup/             — /setup:* commands
  orchestrate.md     — master orchestrator command
dashboard/           — Vite + React local dashboard
  src/
    components/      — AgentGraph, AgentDetail, ProjectDashboard
    data/            — agents.ts (graph builder), layout
docs/
  adr/               — Architecture Decision Records
sprints/             — sprint registry and assembled sprint definitions
templates/           — agent template, stack/service presets
CLAUDE.md            — master orchestrator (loaded in every Claude session)
```

---

## Agent roster

| Family            | Agents | Covers                                                                |
| ----------------- | ------ | --------------------------------------------------------------------- |
| **Web Stack**     | 7      | Next.js, Drizzle/Neon, Clerk, Claude API, Vercel, Sentry, React       |
| **Game Design**   | 6      | Mechanics, narrative, level design, UX, tech architecture, production |
| **GitHub**        | 6      | Branch protection, Actions, issues, PRs, releases, docs               |
| **Quality**       | 4      | Playwright E2E, Vitest, WCAG accessibility, Core Web Vitals           |
| **Research**      | 4      | User interviews, usability testing, focus groups, heuristic review    |
| **Product**       | 2      | PRDs, RICE prioritization, OKRs, PostHog analytics                    |
| **Cross-cutting** | 2      | next-intl i18n, AI/infra cost tracking (finops)                       |
| **Meta**          | 2      | Sprint assembler, project setup                                       |

### Dashboard

A local interactive graph of all agents, dependency chains, and handoff edges — plus a project explorer.

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:5173
```

- **Agent Graph tab** — 38 agents as nodes, colored by family. Click any node to read the full agent spec. Filter by family. Solid edges = dependency chain, dashed = handoff.
- **Projects tab** — auto-discovers all git repos in `~/GitHub/`, shows detected stack, recent commits, git status (ahead/behind/dirty), GitHub/production/local links, and open issues.

### Commands

#### Orchestrator (works from any project)

```
/orchestrate audit my auth setup
/orchestrate scaffold a webhook handler
/orchestrate full web stack
```

Routes requests to the correct agent(s), emits output in dependency order, synthesizes cross-cutting findings after multi-agent runs.

#### Web Stack

| Command                    | Usage                            |
| -------------------------- | -------------------------------- |
| `/stack:audit [scope]`     | Audit one or more layers         |
| `/stack:scaffold [target]` | Generate boilerplate             |
| `/stack:advise [question]` | Architectural recommendation     |
| `/stack:fullstack`         | All 7 agents in dependency order |

#### Panels

| Command                      | Agents                                                          |
| ---------------------------- | --------------------------------------------------------------- |
| `/panel:github [focus]`      | All 6 GitHub agents                                             |
| `/panel:game [artifact]`     | All 6 Game Design agents                                        |
| `/panel:stack`               | All 7 Web agents                                                |
| `/panel:quality [scope]`     | web-qa + accessibility + performance                            |
| `/panel:research [question]` | user-research + usability-testing + focus-group + expert-review |

#### Sprints

```
/sprint:assemble "voice coaching feature" --project ../GTLI_YLAI
/sprint:list
/sprint:status
/sprint:dissolve "voice coaching feature"
```

#### More commands

| Command                       | Usage                                                                |
| ----------------------------- | -------------------------------------------------------------------- |
| `/review:code [file]`         | Code quality — correctness, complexity, naming, dead code            |
| `/review:data-model [schema]` | Schema — entities, relationships, normalization                      |
| `/review:artifact [file]`     | Agent/skill/command quality gate before publishing                   |
| `/debug:env [scope]`          | Trace env vars, find missing vars, NEXT*PUBLIC* violations           |
| `/ai:prompt-design [feature]` | Design or review a system prompt                                     |
| `/ai:prompt-test [prompt]`    | Regression test suite for a prompt or AI feature                     |
| `/auth:clerk [scope]`         | Clerk authentication security audit                                  |
| `/auth:nextauth [scope]`      | NextAuth.js security audit                                           |
| `/docs:audit`                 | Audit documentation for completeness and accuracy                    |
| `/docs:write [file]`          | Rewrite documentation in the correct voice for its audience          |
| `/security:baseline`          | First-pass security sweep (semgrep, insecure defaults, supply chain) |

For the full command reference see `CLAUDE.md`.

#### Setup

```
/setup:project --target ../my-app --mode config        # add orchestration to existing repo
/setup:project --target ../my-app --mode bootstrap --stack nextjs  # bootstrap new repo
/setup:hooks --add format-on-write
```

#### Lifecycle hooks (Phase 6)

This repo ships a set of Claude Code lifecycle hooks in `.claude/hooks/`:

| Hook                 | Event                      | What it does                                                                                  |
| -------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| `bash-guard.sh`      | `PreToolUse / Bash`        | Blocks destructive shell patterns (`rm -rf` unscoped, `git reset --hard`, `DROP TABLE`, etc.) |
| `format-on-write.sh` | `PostToolUse / Edit+Write` | Runs Prettier after every file write (async, silent no-op if Prettier absent)                 |
| `session-stop.sh`    | `Stop`                     | Writes `.claude/session-state.json` with branch, SHA, clean/dirty status                      |
| `notify.sh`          | `Notification`             | Routes Claude notifications to Slack (if `SLACK_BOT_TOKEN` set), BurntToast, or terminal bell |

Hooks are pre-configured in `.claude/settings.json`. To install user-scope hooks (apply to every project on this machine) run `/setup:hooks --add lint-references,notion-url-sanitize --scope user`.

#### Scheduled agents

Two cron-style health checks ship in `.claude/scheduled/`:

| Script                | Cadence      | Output                                                                                |
| --------------------- | ------------ | ------------------------------------------------------------------------------------- |
| `daily-ci-audit.sh`   | Daily 08:00  | CI run status + Dependabot PR triage → `.claude/debug/ci-audit-YYYY-MM-DD.md`         |
| `weekly-pr-health.sh` | Monday 09:00 | PRs open > 7d, no reviewer, or stale review → `.claude/debug/pr-health-YYYY-MM-DD.md` |

---

## Marketplace

### Quick install

**Windows** (PowerShell 5.1+):

```powershell
.\install.ps1
```

**macOS / Linux** (Bash 3.2+):

```bash
./install.sh
```

Both copy all agents, commands, and skills into `~/.claude/` with hash-based deduplication and backup, and sync `CLAUDE.md` to `~/.claude/CLAUDE.md`. Idempotent — re-running skips anything that hasn't changed. Restart Claude Code after running.

### Manual install (per-project)

Scoped to one repo:

```bash
cp -r agents/ your-project/.claude/agents/
cp CLAUDE.md your-project/.claude/CLAUDE.md
```

---

## Contributing

### Adding a new agent

1. Copy `templates/agent-template.md` → `agents/<name>.md`
2. Fill in: frontmatter (`name`, `description`), persona, `## Stack`, `## Opinions`, `## /audit`, `## /scaffold`, `## /advise`, `## Handoffs`
3. Add the agent to the family table in `CLAUDE.md` and to `agents/README.md`
4. Run `.\install.ps1` (Windows) or `./install.sh` (macOS / Linux) to sync to `~/.claude/` (no manual copy needed)
5. Run `cd dashboard && npm run dev` — the agent appears in the graph automatically

See `agents/README.md` for the full agent index and [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow.

---

## Security

Report vulnerabilities privately — see [`.github/SECURITY.md`](./.github/SECURITY.md) for the disclosure policy, scope, and response SLA. Please **do not** open a public GitHub issue for security reports.

---

## License

MIT — Kevin Wong
