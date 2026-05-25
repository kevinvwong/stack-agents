---
module: anthropic
category: ai
description: Anthropic Claude API — 3-tier model config (heavy/standard/light) + per-user daily caps + monthly budget kill switch via Upstash
install: manual (vercel env add)
---

# Module: anthropic

Anthropic SDK with a 3-tier model configuration pattern: separate env vars for heavy (Opus), standard (Sonnet), and light (Haiku) workloads. Per-user daily spend caps and a monthly budget kill switch tracked via Upstash Redis.

## Why this module

- Ops-safe: you can swap model versions in Vercel env without a deploy
- Budget-safe: per-user caps prevent runaway spend from a single user's session
- Kill switch: `ANTHROPIC_DAILY_SPEND_KILL_SWITCH_USD` hard-stops all inference if daily spend exceeds threshold
- Separation of concerns: model selection logic stays in application code, not hardcoded strings

## Depends on

- `upstash` module — budget tracking requires Redis

## Install

```bash
vercel env add ANTHROPIC_API_KEY production preview development
vercel env add ANTHROPIC_MODEL_HEAVY production preview development
# value: claude-opus-4-7
vercel env add ANTHROPIC_MODEL_STANDARD production preview development
# value: claude-sonnet-4-6
vercel env add ANTHROPIC_MODEL_LIGHT production preview development
# value: claude-haiku-4-5-20251001
vercel env add ANTHROPIC_DAILY_USER_CAP production preview development
# value: 10  (requests per user per day)
vercel env add ANTHROPIC_DAILY_SPEND_KILL_SWITCH_USD production preview development
# value: 5
vercel env add ANTHROPIC_MONTHLY_BUDGET_USD production preview development
# value: 50
vercel env pull .env.local --yes
```

## Packages

```bash
npm install @anthropic-ai/sdk
```

## Scaffold

**lib/ai/client.ts:**
```ts
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const models = {
  heavy: process.env.ANTHROPIC_MODEL_HEAVY ?? "claude-opus-4-7",
  standard: process.env.ANTHROPIC_MODEL_STANDARD ?? "claude-sonnet-4-6",
  light: process.env.ANTHROPIC_MODEL_LIGHT ?? "claude-haiku-4-5-20251001",
} as const;
```

**lib/ai/budget.ts:**
```ts
import { redis } from "@/lib/redis";

const DAILY_USER_CAP = Number(process.env.ANTHROPIC_DAILY_USER_CAP ?? 10);
const KILL_SWITCH_USD = Number(process.env.ANTHROPIC_DAILY_SPEND_KILL_SWITCH_USD ?? 5);

export async function checkUserBudget(userId: string): Promise<boolean> {
  const key = `ai:usage:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 86400);
  return count <= DAILY_USER_CAP;
}

export async function checkGlobalKillSwitch(): Promise<boolean> {
  const spend = await redis.get<number>("ai:daily_spend_usd") ?? 0;
  return spend < KILL_SWITCH_USD;
}
```

## .env.example additions

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_HEAVY=claude-opus-4-7
ANTHROPIC_MODEL_STANDARD=claude-sonnet-4-6
ANTHROPIC_MODEL_LIGHT=claude-haiku-4-5-20251001
ANTHROPIC_DAILY_USER_CAP=10
ANTHROPIC_DAILY_SPEND_KILL_SWITCH_USD=5
ANTHROPIC_MONTHLY_BUDGET_USD=50
```
