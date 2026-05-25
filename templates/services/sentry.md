---
module: sentry
category: observability
description: Sentry error tracking — 3-file config for Next.js (server + client + edge) + source maps upload in CI
install: vercel integration add sentry
---

# Module: sentry

Sentry error tracking configured for Next.js 15's three runtime environments (Node.js server, browser client, Edge runtime). Source map upload is wired into CI so stack traces are always symbolicated in production.

## Why this module

- Surface unhandled errors in production before users report them
- Full stack traces for Edge Function crashes (separate runtime from Node.js)
- Source map upload means minified production code maps back to your TypeScript source
- Integrates with Vercel deployments for release tracking

## Install

```bash
vercel integration add sentry
vercel env pull .env.local --yes
```

## Env vars provisioned

```bash
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
```

## Packages

```bash
npm install @sentry/nextjs
```

## Scaffold

**sentry.server.config.ts:**
```ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

**sentry.client.config.ts:**
```ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**sentry.edge.config.ts:**
```ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

**instrumentation.ts** (Next.js 15 instrumentation hook):
```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
```

**next.config.ts** — wrap with `withSentryConfig`:
```ts
import { withSentryConfig } from "@sentry/nextjs";
// ... your existing config ...
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

**CI — add to .github/workflows/ci.yml:**
```yaml
env:
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

## .env.example additions

```bash
# Sentry
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```
