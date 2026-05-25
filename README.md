# stack-agents

Two panels of specialized Claude Code agents: **Web Stack** (7 agents) and **Game Design** (6 agents), plus slash commands to audit, scaffold, advise, and run full-panel reviews.

## Install

```
/plugin marketplace add kwong318/stack-agents
/plugin install stack-agents@kwong318
```

Or copy `CLAUDE.md` and the `agents/` directory into any project's `.claude/` folder.

---

## Web Stack

Seven agents covering every layer of a modern TypeScript web stack.

| Agent | Covers |
|-------|--------|
| `presentation` | Next.js 15 App Router, Server Components, Server Actions, Tailwind, shadcn/ui, Zustand, TanStack Query, Playwright |
| `application` | Vercel Edge Functions, REST envelopes, Zod, webhooks, Resend, QStash |
| `ai-llm` | Claude API, Deepgram STT, ElevenLabs TTS, prompt versioning, cost tracking |
| `data` | Neon, Drizzle ORM, migrations, Vercel Blob, R2, full-text search |
| `infrastructure` | Vercel, GitHub Actions, secrets, feature flags, pnpm workspaces |
| `security` | Clerk, RBAC, Upstash rate limiting, RLS, CSP/HSTS headers |
| `observability` | Sentry, Axiom, Vercel Analytics, AI call logging, alerting |

**Default stack** — override any layer per-request with `STACK: layer=alternative`:

| Layer | Default |
|-------|---------|
| Frontend | Next.js 15 App Router + Tailwind CSS + shadcn/ui |
| Backend | Vercel Edge Functions (TypeScript) |
| Database | Neon (Postgres) + Drizzle ORM |
| Auth | Clerk |
| AI | Anthropic Claude API + Deepgram (STT) + ElevenLabs (TTS) |
| CI/CD | GitHub Actions + Vercel Preview Deployments |
| Observability | Sentry + Axiom + Vercel Analytics |

---

## Game Design

Six agents covering the full game design discipline stack. Engine-agnostic by default — override with `ENGINE: Godot | Unity | Unreal | Web`.

| Agent | Covers |
|-------|--------|
| `game-design` | Core mechanics, systems design, game loop, balance, design pillars |
| `narrative` | Story structure, dialogue systems, branching narrative, lore |
| `level-design` | Spaces, pacing, encounter design, player flow, beat maps |
| `game-ux` | Controls, HUD, feedback, accessibility (Game Accessibility Guidelines), onboarding |
| `game-tech` | ECS architecture, state machines, save/load, behavior trees, asset pipeline |
| `production` | Scope, milestones (Alpha/Beta/Gold), playtesting protocols, risk register, release checklist |

---

## Commands

### `/audit [scope]`

Review existing code or design documents. Output: findings grouped Critical / High / Medium / Low with checkboxes, why-it-matters, and actionable fix.

```
/audit                    # full-stack — all web agents
/audit auth
/audit database schema
/audit GDD                # routes to game agents
/audit level-design
```

### `/scaffold [target]`

Generate production-ready boilerplate or design document templates. Output: files/documents in dependency order, setup steps, required env vars.

```
/scaffold new feature
/scaffold webhook handler
/scaffold game feature "crafting system"
/scaffold GDD
```

### `/advise [question]`

Architectural or design recommendation. Output: Recommendation → Reasoning → Tradeoffs → Alternatives → Next step.

```
/advise should I use RLS or application-level auth?
/advise Drizzle vs Prisma
/advise how should I structure a branching dialogue system?
```

### `/fullstack`

All 7 web agents in dependency order, then cross-cutting synthesis that surfaces contradictions no single agent would catch — schema/RLS mismatches, type drift, secrets gaps, etc.

```
/fullstack
/fullstack STACK: auth=NextAuth
```

### `/gamepanel [artifact]`

All 6 game design agents as a panel reviewing the same artifact. Each speaks from their discipline, then a synthesis pass identifies cross-discipline conflicts (mechanics vs. narrative, scope vs. feasibility, UX vs. tech). Ends with a mandatory Panel Verdict naming the single most important decision.

```
/gamepanel "design a crafting system"
/gamepanel GDD
/gamepanel "the combat loop feels bad — diagnose it"
/gamepanel "is our alpha scope realistic?"
/gamepanel ENGINE: Unity
```

---

## Structure

```
agents/
  web-presentation.md     — web stack agents (web-* prefix)
  web-application.md
  web-ai-llm.md
  web-data.md
  web-infrastructure.md
  web-security.md
  web-observability.md
  game-design.md          — game design agents (game-* prefix)
  game-narrative.md
  game-level-design.md
  game-ux.md
  game-tech.md
  game-production.md
  README.md               — agent index

commands/
  web/        — web command definitions (human-readable mirror)
  game/       — game command definitions (human-readable mirror)
  README.md   — command index

.claude/
  commands/   — flat command files loaded by Claude Code
```

> `.claude/commands/` must stay flat — Claude Code does not load from subdirectories.

---

## Multi-agent coordination

**Web chain:**
```
Data → Security → AI-LLM → Application → Infrastructure → Observability → Presentation
```

**Game chain:**
```
game-design → narrative → level-design → game-ux → game-tech → production
```

Handoffs between agents are explicit: each agent flags what the next one needs.

---

## License

MIT — Kevin Wong
