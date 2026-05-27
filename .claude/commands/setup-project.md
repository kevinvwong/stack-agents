---
name: setup:project
description: Install Claude Code orchestration into an existing repository (--mode config) or bootstrap a new repository from scratch with GitHub, Vercel, Neon, and optional services (--mode bootstrap). Non-destructive by default.
---

# /setup:project

Wire up GitHub, Vercel, and Neon as the base services layer, then install Claude Code orchestration into a project — or bootstrap a new one from scratch.

## Usage

```
/setup:project --target <path> --mode config
/setup:project --target <path> --mode bootstrap --stack nextjs
/setup:project --target <path> --mode bootstrap --stack nextjs-ai
/setup:project --target <path> --mode bootstrap --stack nextjs-edu
/setup:project --target <path> --mode bootstrap --stack nextjs-events
/setup:project --target <path> --mode bootstrap --stack nextjs-knowledge
/setup:project --target <path> --mode bootstrap --stack vite-react
/setup:project --target <path> --mode bootstrap --stack nextjs --services upstash,sentry,anthropic
/setup:project --target <path> --mode config --hooks format-on-write,sprint-banner
/setup:project --target <path> --mode config --force
```

## Flags

| Flag | Description |
|------|-------------|
| `--target <path>` | Target directory (required) |
| `--mode config` | Add Claude orchestration to an existing repo |
| `--mode bootstrap` | Create a new repo from scratch |
| `--stack <name>` | Preset to scaffold — see Stacks table below |
| `--services <list>` | Extra service modules to add on top of a preset |
| `--hooks <list>` | Project-scope hook recipes: `format-on-write`, `log-bash`, `sprint-banner`. User-scope recipes (`lint-references`, `notion-url-sanitize`) are checked separately — see User-scope hooks below. |
| `--commands <list>` | Command families to copy: `web`, `game`, `github`, `sprint`, `setup` |
| `--force` | Overwrite existing files (default: skip with warning) |

## Stacks / Presets

All `nextjs-*` presets include these defaults: **Vitest + Playwright, Zod, shadcn/ui, TypeScript strict, dotenv-cli, Dependabot, CI workflow**.

| Stack | Pattern | Key services added |
|-------|---------|-------------------|
| `nextjs` | Minimal Next.js 15 starting point | Neon + Drizzle only |
| `nextjs-ai` | Full AI/voice product | + Neon Auth, Anthropic (3-tier model), Upstash, ElevenLabs, Sentry, PostHog |
| `nextjs-edu` | Language learning / education platform | + Deepgram STT, pronunciation engine (espeak-ng + CMU dict), next-intl i18n, Resend, Recharts |
| `nextjs-events` | Event management / volunteer coordination | + Clerk auth, Stripe + webhooks, Resend, Twilio SMS, Cloudinary, Recharts |
| `nextjs-knowledge` | Knowledge base / second brain with AI search | + pgvector (semantic search), Tiptap editor, Anthropic RAG, Recharts |
| `vite-react` | Lightweight SPA — no SSR, internal tools | Vite + React 19, TanStack Query, Recharts, Sentry (no server, no API routes) |
| `game` | Game design document workspace | GDD.md + DESIGN_PILLARS.md + docs/ — no services |
| `empty` | Blank slate | README.md only — prompts for services |

## Default Service Modules (all nextjs presets)

| Module | Category | Notes |
|--------|----------|-------|
| `api-usage` | Observability | Neon table — tracks Anthropic tokens/cost, external API calls, route latency. No additional services. DB query tracking off by default (`--track-queries` to enable). |

## Available Service Modules (`--services`)

| Module | Category | Install method |
|--------|----------|----------------|
| `upstash` | Cache / rate limiting | `vercel integration add upstash` |
| `blob` | File storage | `@vercel/blob` SDK |
| `sentry` | Error tracking | `vercel integration add sentry` (3-file Next.js config) |
| `posthog` | Product analytics | Manual API key |
| `anthropic` | LLM inference | Manual API key + 3-tier model config + budget controls |
| `elevenlabs` | Text-to-speech | Manual API key |
| `deepgram` | Speech-to-text | Manual API key |
| `pronunciation` | Pronunciation engine | espeak-ng (system dep) + CMU dict |
| `i18n` | Internationalization | next-intl |
| `resend` | Transactional email | Manual API key + React Email templates |
| `twilio` | SMS | Manual API key |
| `stripe` | Payments | Manual API key + webhook scaffold |
| `cloudinary` | Image/video CDN | Manual API key |
| `pgvector` | Vector search | SQL migration on Neon |
| `tiptap` | Rich text editor | npm only |
| `recharts` | Data visualization | npm only |
| `remotion` | [EXPERIMENTAL] Video rendering | npm + AWS Lambda or Docker |
| `clickhouse` | [EXPERIMENTAL] Columnar analytics | External ClickHouse instance |
| `thirdweb` | [EXPERIMENTAL] Web3 / on-chain credentials | npm only |

## Service Installation Order

Base services install in dependency order (each depends on the previous):

```
1. GitHub repo         gh repo create / link
2. Vercel project      vercel link / vercel init
3. Neon                vercel integration add neon  →  DATABASE_URL + DATABASE_URL_UNPOOLED
4. Env pull            vercel env pull .env.local
─────────────────────── optional services below ────────────────────────
5. Upstash Redis       vercel integration add upstash  →  KV_REST_API_URL etc.
6. Sentry              vercel integration add sentry   →  SENTRY_DSN etc.
7. PostHog             manual env vars: NEXT_PUBLIC_POSTHOG_KEY + HOST
8. ElevenLabs          manual env var: ELEVENLABS_API_KEY
9. Anthropic           manual env vars: ANTHROPIC_API_KEY + model vars
10. Vercel Blob        via @vercel/blob SDK (no separate integration)
```

Neon provisions two connection strings — use each correctly:
- `DATABASE_URL` → pooled (pgBouncer) → app queries in serverless functions
- `DATABASE_URL_UNPOOLED` → direct → Drizzle migrations only

## What Gets Installed

### `--mode config` (existing repo)

```
<target>/
  CLAUDE.md                          ← project-scoped orchestration instructions
  .claude/
    settings.json                    ← permissions + Vercel MCP allow list (merged if exists)
    commands/                        ← flat command files for slash commands
  .gitignore                         ← .env.local, .claude/settings.local.json, .vercel/ appended
  .env.example                       ← missing env var placeholders appended
```

### `--mode bootstrap` (new repo)

Phase 1 — Repo + services:
1. `git init` + empty commit
2. GitHub repo creation + remote link (`gh repo create`)
3. Vercel project link (`vercel link`)
4. Neon integration (`vercel integration add neon`)
5. Env pull (`vercel env pull .env.local`)
6. Optional services per `--services` flag

Phase 2 — Stack scaffold (files, package.json, drizzle config, CI)

Phase 3 — Claude Code config (same as `--mode config`)

Phase 4 — First migration + verify (`npm run db:migrate && npm run dev`)

Phase 5 — Initial git commit

## Non-destructive Contract

- **Skip, don't overwrite** — if a file already exists, log a warning and skip it. Use `--force` to overwrite.
- **Merge, don't replace** — `.claude/settings.json` is read first; new config is merged in. Existing permissions and hooks are preserved.
- **Gitignore before writing** — `.env.local` and `.claude/settings.local.json` are added to `.gitignore` before any content is written to them.
- **`.env.example` is append-only** — existing vars are never removed, only new ones added.

## Post-install Output

```
## Setup Complete

Services:
✓ GitHub repo linked (origin: github.com/<org>/<repo>)
✓ Vercel project linked (.vercel/project.json)
✓ Neon provisioned (DATABASE_URL + DATABASE_URL_UNPOOLED)
[ ] Upstash Redis   (run: vercel integration add upstash)
[ ] Sentry          (run: vercel integration add sentry)
[ ] PostHog         (manual: vercel env add NEXT_PUBLIC_POSTHOG_KEY)
[ ] ElevenLabs      (manual: vercel env add ELEVENLABS_API_KEY)
[ ] Anthropic       (manual: vercel env add ANTHROPIC_API_KEY)

Claude Code:
✓ CLAUDE.md installed
✓ .claude/settings.json installed (or merged)
✓ .gitignore updated
✓ .env.example scaffolded
✓ User-scope hooks checked — `lint-references` and `notion-url-sanitize` are
   recommended for every project. If they aren't yet in `~/.claude/settings.json`,
   run: /setup:hooks --add lint-references,notion-url-sanitize --scope user
[ ] Project-scope hooks: run /setup:hooks to add (format-on-write, sprint-banner, etc.)
[ ] Commands: <installed families>

Next steps:
1. vercel env pull .env.local --yes
2. npm run db:migrate
3. npm run dev                   (verify app boots on :3100)
4. git add -A && git commit -m "chore: project setup"
5. git push
```

## Examples

**Add Claude orchestration to an existing project:**
```
/setup:project --target ~/projects/my-app --mode config --hooks format-on-write --commands web,sprint
```

**Bootstrap a full AI/voice product:**
```
/setup:project --target ~/projects/new-ai-app --mode bootstrap --stack nextjs-ai
```

**Bootstrap a language learning platform (GTLI pattern):**
```
/setup:project --target ~/projects/my-lms --mode bootstrap --stack nextjs-edu
```

**Bootstrap an event management platform (arscca-VMS pattern):**
```
/setup:project --target ~/projects/my-events --mode bootstrap --stack nextjs-events
```

**Bootstrap a knowledge base with semantic search:**
```
/setup:project --target ~/projects/my-secondbrain --mode bootstrap --stack nextjs-knowledge
```

**Bootstrap a lightweight internal tool SPA:**
```
/setup:project --target ~/projects/my-dashboard --mode bootstrap --stack vite-react
```

**Bootstrap minimal Next.js + add specific services:**
```
/setup:project --target ~/projects/my-site --mode bootstrap --stack nextjs --services upstash,anthropic,sentry
```

**Bootstrap a game project (no services):**
```
/setup:project --target ~/projects/my-game --mode bootstrap --stack game --commands game,sprint
```
