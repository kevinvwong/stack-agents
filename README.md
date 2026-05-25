# stack-agents

A system of 33 specialist Claude Code agents across 8 domains, a master orchestrator, and a local dashboard for visualizing agents and your project portfolio.

---

## What it is

**Agent system** — specialist `.md` agents invoked through Claude Code slash commands. Each agent has an opinionated `/audit` checklist, `/scaffold` templates, and a `/advise` mode. The master orchestrator (`CLAUDE.md`) routes requests to the right agents in dependency order and synthesizes cross-cutting findings.

**Dashboard** — a local Vite + React app that renders the agent graph (nodes, dependency chains, handoff edges), lets you browse agent specs, and shows a project explorer with git status, stack detection, and open GitHub issues across all your repos.

---

## Agent Families

| Family | Agents | Covers |
|--------|--------|--------|
| **Web Stack** | 7 | Next.js, Drizzle/Neon, Clerk, Claude API, Vercel, Sentry, React |
| **Game Design** | 6 | Mechanics, narrative, level design, UX, tech architecture, production |
| **GitHub** | 6 | Branch protection, Actions, issues, PRs, releases, docs |
| **Quality** | 4 | Playwright E2E, Vitest, WCAG accessibility, Core Web Vitals |
| **Research** | 4 | User interviews, usability testing, focus groups, heuristic review |
| **Product** | 2 | PRDs, RICE prioritization, OKRs, PostHog analytics |
| **Cross-cutting** | 2 | next-intl i18n, AI/infra cost tracking (finops) |
| **Meta** | 2 | Sprint assembler, project setup |

### Web Stack dependency chain

```
data → security → ai-llm → application → infrastructure → observability → presentation
```

### Default stack (override with `STACK: key=value`)

| Layer | Default |
|-------|---------|
| Frontend | Next.js 15 App Router + Tailwind CSS 4 |
| Backend | Vercel Edge Functions (TypeScript strict) |
| Database | Neon (Postgres) + Drizzle ORM |
| Auth | Clerk |
| Cache | Upstash Redis |
| AI | Anthropic Claude API + ElevenLabs TTS + Deepgram STT |
| Analytics | PostHog + Sentry |

---

## Dashboard

A local interactive graph of all agents, dependency chains, and handoff edges — plus a project explorer.

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:5173
```

- **Agent Graph tab** — 33 agents as nodes, colored by family. Click any node to read the full agent spec. Filter by family. Solid edges = dependency chain, dashed = handoff.
- **Projects tab** — auto-discovers all git repos in `~/GitHub/`, shows detected stack, recent commits, open sprints, and lazy-loaded GitHub issues.

---

## Commands

### Orchestrator (works from any project)

```
/orchestrate audit my auth setup
/orchestrate scaffold a webhook handler
/orchestrate full web stack
```

Routes requests to the correct agent(s), emits output in dependency order, synthesizes cross-cutting findings after multi-agent runs.

### Web Stack

| Command | Usage |
|---------|-------|
| `/stack:audit [scope]` | Audit one or more layers |
| `/stack:scaffold [target]` | Generate boilerplate |
| `/stack:advise [question]` | Architectural recommendation |
| `/stack:fullstack` | All 7 agents in dependency order |

### Panels

| Command | Agents |
|---------|--------|
| `/panel:github [focus]` | All 6 GitHub agents |
| `/panel:game [artifact]` | All 6 Game Design agents |
| `/panel:stack` | All 7 Web agents |
| `/panel:quality [scope]` | web-qa + accessibility + performance |
| `/panel:research [question]` | user-research + usability-testing + focus-group + expert-review |

### Sprints

```
/sprint:assemble "voice coaching feature" --project ../GTLI_YLAI
/sprint:list
/sprint:status
/sprint:dissolve "voice coaching feature"
```

### Setup

```
/setup:project --target ../my-app --mode config        # add orchestration to existing repo
/setup:project --target ../my-app --mode bootstrap --stack nextjs  # bootstrap new repo
/setup:hooks --add format-on-write
```

---

## Install

### Global (available in all Claude Code sessions)

Copy `CLAUDE.md` to `~/.claude/CLAUDE.md` and copy `agents/` to `~/.claude/agents/`.

Or copy just the commands you want to `~/.claude/commands/`.

### Per-project

Copy `CLAUDE.md` and `agents/` into your project's `.claude/` folder.

```bash
cp -r agents/ your-project/.claude/agents/
cp CLAUDE.md your-project/.claude/CLAUDE.md
```

---

## Structure

```
agents/              — 33 specialist agent .md files
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
sprints/             — sprint registry and assembled sprint definitions
templates/           — agent template, stack/service presets
CLAUDE.md            — master orchestrator (loaded in every Claude session)
```

---

## Adding a new agent

1. Copy `templates/agent-template.md` → `agents/<name>.md`
2. Fill in: frontmatter (`name`, `description`), persona, `## Stack`, `## Opinions`, `## /audit`, `## /scaffold`, `## /advise`, `## Handoffs`
3. Add the agent to the family table in `CLAUDE.md` and `~/.claude/CLAUDE.md`
4. Run `cd dashboard && npm run dev` — the agent appears in the graph automatically

See `agents/README.md` for the full agent index.

---

## License

MIT — Kevin Wong
