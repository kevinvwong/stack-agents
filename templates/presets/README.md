# Presets

Named bundles of service modules for common project patterns. Each preset encodes architectural decisions derived from real projects — not just what to install, but why, and what the resulting structure looks like.

Use a preset with: `/setup:project --target <path> --mode bootstrap --stack <preset-name>`

---

## Choosing a Preset

| Preset | Use case | Key services |
|--------|----------|-------------|
| [`nextjs`](../../agents/project-setup.md#--stack-nextjs) | Any Next.js project starting point | Neon + Drizzle only |
| [`nextjs-ai`](../../agents/project-setup.md#--stack-nextjs-ai) | AI/voice product with full observability | + Neon Auth, Anthropic, Upstash, ElevenLabs, Sentry, PostHog |
| [`nextjs-edu`](nextjs-edu.md) | Language learning / education platform | + Deepgram, pronunciation engine, i18n, Resend, Recharts |
| [`nextjs-events`](nextjs-events.md) | Event management / volunteer coordination | + Clerk, Stripe, Resend, Twilio, Cloudinary, Recharts |
| [`nextjs-knowledge`](nextjs-knowledge.md) | Knowledge base / second brain with AI search | + pgvector, Tiptap, Anthropic RAG, Recharts |
| [`vite-react`](vite-react.md) | Lightweight SPA — no SSR, internal tools | + Recharts, Sentry |

---

## Standard Defaults (all nextjs-based presets)

These are included in every Next.js preset — not optional:

| Default | Why |
|---------|-----|
| API usage tracking | Single Neon table capturing Anthropic tokens/cost, external API calls, route latency. Zero additional services. DB query tracking opt-in via `--track-queries`. |
| Vitest + Playwright | Unit + E2E testing setup out of the box |
| Zod | Schema validation at all system boundaries |
| shadcn/ui | Component library (Tailwind-native, customizable) |
| Recharts | Data visualization (most presets show some metrics) |
| TypeScript strict | `strict: true` in tsconfig — catch errors at compile time |
| dotenv-cli | Safely load `.env.local` for db migration scripts |
| Dependabot | Weekly npm + GitHub Actions updates |
| CI workflow | Typecheck + lint on push/PR |

---

## Preset vs. Custom Services

Presets are starting points. You can always add individual modules on top:

```
/setup:project --target <path> --mode bootstrap --stack nextjs-edu --services stripe,twilio
```

Or start minimal and add later:

```
/setup:project --target <path> --mode bootstrap --stack nextjs --services upstash,anthropic,elevenlabs
```

---

## Experimental Modules

These can be added to any preset but are labeled `[EXPERIMENTAL]` in output:

| Module | Use case |
|--------|----------|
| [`remotion`](../services/experimental/remotion.md) | Programmatic video rendering — lesson thumbnails, social clips |
| [`clickhouse`](../services/experimental/clickhouse.md) | High-volume event analytics — custom funnels, retention queries |
| [`thirdweb`](../services/experimental/thirdweb.md) | Web3 credentials — soulbound certificates, token-gated content |
