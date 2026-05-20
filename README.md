# stack-agents

Seven specialized Claude Code agents covering every layer of a modern TypeScript web stack, plus three slash commands to audit, scaffold, and advise across them.

## Install

```
/plugin marketplace add kwong318/stack-agents
/plugin install stack-agents@kwong318
```

Or copy `CLAUDE.md` and the `agents/` directory into any project's `.claude/` folder.

## Default Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Vercel Edge Functions (TypeScript) |
| Database | Neon (Postgres) + Drizzle ORM |
| Auth | Clerk |
| AI | Anthropic Claude API + Deepgram (STT) + ElevenLabs (TTS) |
| CI/CD | GitHub Actions + Vercel Preview Deployments |
| Observability | Sentry + Axiom + Vercel Analytics |

Override any layer per-request with `STACK: layer=alternative`.

## Agents

| Agent | Covers |
|-------|--------|
| `presentation` | React 18, Vite, Tailwind, shadcn/ui, Zustand, TanStack Query, Playwright |
| `application` | Vercel Edge Functions, REST envelopes, Zod, webhooks, Resend, QStash |
| `ai-llm` | Claude API, Deepgram STT, ElevenLabs TTS, prompt versioning, cost tracking |
| `data` | Neon, Drizzle ORM, migrations, Vercel Blob, R2, full-text search |
| `infrastructure` | Vercel, GitHub Actions, secrets, feature flags, pnpm workspaces |
| `security` | Clerk, RBAC, Upstash rate limiting, RLS, CSP/HSTS headers |
| `observability` | Sentry, Axiom, Vercel Analytics, AI call logging, alerting |

## Commands

### `/audit [scope]`

Review existing code. Output: findings grouped Critical / High / Medium / Low, each as checkboxes with finding, why it matters, and recommended fix.

```
/audit
/audit auth
/audit database schema
/audit API routes
```

### `/scaffold [target]`

Generate production-ready boilerplate. Output: files in dependency order, setup steps, required env vars.

```
/scaffold new feature
/scaffold webhook handler
/scaffold AI voice pipeline
/scaffold auth middleware
```

### `/advise [question]`

Architectural recommendation. Output: Recommendation → Reasoning → Tradeoffs → Alternatives → Next step.

```
/advise should I use RLS or application-level auth checks?
/advise Drizzle vs Prisma for this project
/advise how should I structure multi-turn Claude conversations?
```

## Multi-agent coordination

For requests spanning multiple layers, the orchestrator (CLAUDE.md) runs agents in dependency order:

```
Data → Security → AI-LLM → Application → Infrastructure → Observability → Presentation
```

Handoffs between agents are explicit: each agent flags what the next one needs.

## License

MIT — Kevin Wong
