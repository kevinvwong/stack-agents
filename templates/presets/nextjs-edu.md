---
preset: nextjs-edu
base: nextjs
description: |
  Language learning and education platform — the GTLI pattern. Adds a full pronunciation engine (espeak-ng + CMU dictionary + Deepgram STT for phoneme scoring), ElevenLabs TTS for spoken feedback, internationalization for serving learners in their native language, Resend for cohort digest emails, and Recharts for learner progress dashboards. Anthropic provides CEFR placement and conversational AI coaching. Upstash handles per-user daily AI call limits.
modules:
  - neon
  - neon-auth
  - api-usage
  - upstash
  - anthropic
  - elevenlabs
  - deepgram
  - pronunciation
  - i18n
  - resend
  - recharts
  - sentry
  - posthog
defaults_included:
  - vitest
  - playwright
  - zod
  - shadcn
---

# Preset: nextjs-edu

**The GTLI pattern.** A Next.js 15 platform for delivering language learning content to non-native English speakers, with pronunciation assessment, AI tutoring, and cohort management.

## What this preset is for

You're building a platform where:
- Learners are non-native English speakers working toward a language proficiency goal (CEFR A1–C2, IELTS, TOEFL)
- Content is structured: video lessons → exercises → pronunciation practice → assessment
- A human coordinator or coach monitors cohort progress and flags learners who need intervention
- The platform serves multiple language backgrounds, so the UI needs to be available in learners' native languages
- AI provides personalized feedback on pronunciation and grammar — not just multiple choice

## Architecture it produces

```
app/
  [locale]/               ← next-intl locale routing (/en, /es, /ar, /ko)
    (learner)/
      learn/              ← lesson player, pronunciation practice
      progress/           ← Recharts progress dashboard
    (admin)/
      cohorts/            ← coordinator views, coaching flags
      analytics/          ← learning outcomes, completion rates
  api/
    auth/[...path]/       ← Neon Auth handlers
    tts/                  ← ElevenLabs TTS streaming endpoint
    transcribe/           ← Deepgram STT endpoint (nodejs runtime)
    chat/                 ← Anthropic AI coach (streaming)
    ai-usage/             ← Upstash budget check middleware

lib/
  voice/
    tts.ts                ← ElevenLabs synthesis
    stt.ts                ← Deepgram transcription
  pronunciation/
    ipa.ts                ← espeak-ng IPA generation
    cmu.ts                ← CMU phoneme dictionary
    score.ts              ← phoneme-level scoring pipeline
  ai/
    client.ts             ← Anthropic 3-tier model config
    budget.ts             ← per-user daily cap + kill switch
  email/
    client.ts             ← Resend
    templates/
      cohort-digest.tsx   ← weekly cohort progress email

messages/
  en.json
  es.json
  ar.json
```

## Key decisions encoded in this preset

**Neon Auth over Clerk** — learners often share devices or are redirected from an LMS. Neon Auth is simpler to integrate with session handoffs and lacks Clerk's per-user pricing overhead for large cohorts.

**Deepgram Nova-3 over Whisper** — real-time WebSocket streaming is required for conversational pronunciation practice. Whisper (batch STT) cannot stream word-by-word confidence scores.

**espeak-ng runs server-side only** — native binary, not compatible with Edge runtime. All pronunciation API routes use `export const runtime = "nodejs"`.

**next-intl with `[locale]` segment routing** — `/en/learn`, `/es/learn`, `/ar/learn` — gives SEO-correct pages per locale and enables RTL layout switching for Arabic learners.

**Recharts over D3** — GTLI dashboards show simple time-series and bar charts. Recharts is adequate and significantly simpler than D3 in a React context.

## .env.example (complete)

```bash
# Neon
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Neon Auth
NEON_AUTH_BASE_URL=https://...
NEON_AUTH_COOKIE_SECRET=<32-char random string>

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_HEAVY=claude-opus-4-7
ANTHROPIC_MODEL_STANDARD=claude-sonnet-4-6
ANTHROPIC_MODEL_LIGHT=claude-haiku-4-5-20251001
ANTHROPIC_DAILY_USER_CAP=10
ANTHROPIC_DAILY_SPEND_KILL_SWITCH_USD=5
ANTHROPIC_MONTHLY_BUDGET_USD=50

# Upstash Redis
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
KV_URL=redis://...

# ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...

# Deepgram
DEEPGRAM_API_KEY=...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=GTLI <noreply@yourdomain.com>

# Sentry
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# App
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Post-install notes

- espeak-ng must be installed as a system dependency. For Vercel, pre-generate IPA for your vocabulary set and store in the database rather than calling espeak-ng at runtime.
- Run `next-intl` codegen to extract translation keys: `npx @next-intl/cli extract`
- Wire Deepgram and ElevenLabs API keys before running `npm run dev` — voice features will silently fail without them.
