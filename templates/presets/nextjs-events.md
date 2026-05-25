---
preset: nextjs-events
base: nextjs
description: |
  Event management and volunteer coordination platform — the arscca-VMS pattern. Adds NextAuth for flexible multi-provider auth (Google OAuth + email magic link), Resend for event confirmations and volunteer notifications, Twilio for SMS reminders, Stripe for event registration payments, Cloudinary for event photo management, and Recharts for event attendance dashboards. Built for organizations that run recurring events with volunteer workforces.
modules:
  - neon
  - clerk
  - api-usage
  - upstash
  - resend
  - twilio
  - stripe
  - cloudinary
  - recharts
  - sentry
  - posthog
defaults_included:
  - vitest
  - playwright
  - zod
  - shadcn
---

# Preset: nextjs-events

**The arscca-VMS pattern.** A Next.js 15 platform for managing events, volunteer registration, and participant coordination — with payments, SMS reminders, and photo management.

## What this preset is for

You're building a platform where:
- An organization runs recurring events (races, competitions, tournaments, conferences)
- Volunteers sign up for specific roles or time slots
- Participants register and pay online
- Staff send reminder emails and SMS before each event
- Photos and media from events need to be stored and shared
- Organizers review attendance dashboards and export reports

## Architecture it produces

```
app/
  (public)/
    events/[id]/          ← event detail + registration
    register/             ← Stripe checkout flow
  (dashboard)/
    admin/
      events/             ← CRUD for events, volunteer slots
      volunteers/         ← volunteer roster, assignment
      analytics/          ← Recharts attendance + revenue dashboards
    volunteer/
      my-shifts/          ← personal schedule, check-in
  api/
    auth/[...nextauth]/   ← NextAuth handlers (Google + email)
    stripe/
      webhook/            ← Stripe event handler (signature verified)
      checkout/           ← create checkout session
    notifications/
      email/              ← Resend batch send (Vercel Cron triggered)
      sms/                ← Twilio SMS dispatch
    upload/               ← Cloudinary upload (server-side signed)

lib/
  auth/
    config.ts             ← NextAuth config (Google provider + Neon adapter)
  stripe/
    client.ts             ← Stripe SDK init
  email/
    client.ts             ← Resend init
    templates/
      registration-confirm.tsx
      volunteer-reminder.tsx
      event-recap.tsx
  sms/
    client.ts             ← Twilio init
    send.ts               ← typed SMS dispatch
  media/
    cloudinary.ts         ← upload + transformation helpers
```

## Key decisions encoded in this preset

**Clerk over Neon Auth** — multi-role apps (participant / volunteer / admin / organizer) benefit from Clerk's Organizations feature, which maps cleanly to "per-event access control." Clerk also handles magic-link email auth without custom code, which is appropriate for volunteer audiences who may not have Google accounts.

**Stripe webhooks over polling** — payment status must come from Stripe webhook events, not polling the API. The scaffold includes signature verification using `stripe.webhooks.constructEvent` — the single most common footgun in Stripe integrations.

**Twilio over email-only** — volunteers skimming email in bulk may miss event-day reminders. SMS has dramatically higher open rates for time-sensitive coordination. Reserve SMS for day-of reminders; use Resend for longer-lead confirmations.

**Cloudinary over Vercel Blob for photos** — event photos require transformation (crop to 16:9, watermark, format conversion). Vercel Blob serves raw files; Cloudinary handles transformation at the CDN edge.

**Vercel Cron for scheduled notifications** — email/SMS reminders are triggered by Vercel Cron Jobs, not by the user action. Wire `/api/notifications/email` and `/api/notifications/sms` as cron targets in `vercel.json`.

## .env.example (complete)

```bash
# Neon
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard

# Upstash Redis (rate limiting)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=Events <noreply@yourdomain.com>

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Sentry
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Post-install notes

- Register the Stripe webhook endpoint in the Stripe dashboard pointing to `https://yourdomain.com/api/stripe/webhook`. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
- Wire Vercel Cron jobs in `vercel.json`:
  ```json
  {
    "crons": [
      { "path": "/api/notifications/email", "schedule": "0 9 * * *" },
      { "path": "/api/notifications/sms", "schedule": "0 8 * * *" }
    ]
  }
  ```
- Cloudinary upload API routes must run in `nodejs` runtime (not Edge) for server-side signature generation.
