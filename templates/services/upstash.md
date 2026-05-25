---
module: upstash
category: cache
description: Upstash Serverless Redis — rate limiting, caching, session store, AI budget tracking
install: vercel integration add upstash
---

# Module: upstash

Upstash Redis for serverless-safe caching and rate limiting. The right choice when you need sub-millisecond reads without a persistent TCP connection — Upstash uses HTTP under the hood, which is compatible with Vercel Edge Functions.

## Why this module

- Rate limiting AI endpoints without a DB round-trip
- Caching expensive API responses (pronunciation lookups, AI completions)
- Tracking per-user daily spend for AI budget controls
- Session data that doesn't need ACID guarantees

## Install

```bash
vercel integration add upstash
vercel env pull .env.local --yes
```

## Env vars provisioned

```bash
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
KV_URL=redis://...
```

## Packages

```bash
npm install @upstash/redis @upstash/ratelimit
```

## Scaffold

```ts
// lib/redis.ts
import { Redis } from "@upstash/redis";
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
```

```ts
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
});
```

## .env.example additions

```bash
# Upstash Redis
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
KV_URL=redis://...
```
