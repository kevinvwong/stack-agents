# Service Modules

Composable service modules for `--services` and preset composition. Each module documents:
- What env vars it provisions
- What packages to install
- What files to scaffold
- Vercel integration command (if applicable)

Modules are orthogonal — install any combination. Presets are named bundles of modules.

---

## Base Services (always installed with --mode bootstrap)

| Module | File | Notes |
|--------|------|-------|
| github | `base/github.md` | `gh repo create` |
| vercel | `base/vercel.md` | `vercel link` |
| neon | `base/neon.md` | `vercel integration add neon` → DATABASE_URL + DATABASE_URL_UNPOOLED |

## Default Services (all nextjs-based presets)

| Module | File | Notes |
|--------|------|-------|
| api-usage | `api-usage.md` | Neon table — tracks Anthropic, external APIs, routes, DB queries. DB query tracking off by default (`--track-queries` to enable). |

## Optional Services

| Module | File | Category | Notes |
|--------|------|----------|-------|
| upstash | `upstash.md` | Cache / Rate limiting | `vercel integration add upstash` |
| blob | `blob.md` | File storage | `@vercel/blob` SDK |
| sentry | `sentry.md` | Error tracking | `vercel integration add sentry` |
| posthog | `posthog.md` | Product analytics | Manual API key |
| elevenlabs | `elevenlabs.md` | Voice generation (TTS) | Manual API key |
| anthropic | `anthropic.md` | LLM inference | Manual API key + 3-tier model config |
| clerk | `clerk.md` | Auth (alternative to Neon Auth) | `vercel integration add clerk` |
| neon-auth | `neon-auth.md` | Auth (Neon-native) | Requires Neon base module |
| resend | `resend.md` | Transactional email | Manual API key |
| twilio | `twilio.md` | SMS / telephony | Manual API key |
| stripe | `stripe.md` | Payments | Manual API key + webhook secret |
| cloudinary | `cloudinary.md` | Image/video CDN | Manual API key |
| deepgram | `deepgram.md` | Speech-to-text | Manual API key |
| pronunciation | `pronunciation.md` | Pronunciation engine | espeak-ng + CMU dict (system deps) |
| i18n | `i18n.md` | Internationalization | next-intl |
| pgvector | `pgvector.md` | Vector search | Requires Neon base module |
| tiptap | `tiptap.md` | Rich text editor | @tiptap/react |
| recharts | `recharts.md` | Data visualization | recharts |

## Experimental Services (labeled in output)

| Module | File | Notes |
|--------|------|-------|
| remotion | `experimental/remotion.md` | Programmatic video rendering |
| clickhouse | `experimental/clickhouse.md` | Columnar analytics DB |
| thirdweb | `experimental/thirdweb.md` | Web3 / wallet / token gating |

## Presets

Named bundles — see `../presets/` directory.

| Preset | Use case |
|--------|----------|
| `nextjs` | Minimal Next.js 15 + Neon + Drizzle skeleton |
| `nextjs-ai` | Full AI/voice product stack |
| `nextjs-edu` | Language learning / education platform |
| `nextjs-events` | Event management / registration platform |
| `nextjs-knowledge` | Knowledge management / second brain |
| `vite-react` | Lightweight SPA — no SSR |
