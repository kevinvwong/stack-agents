---
module: clickhouse
category: experimental
description: "[EXPERIMENTAL] ClickHouse columnar analytics database — high-volume event ingestion and aggregation for product analytics dashboards. Alternative to PostHog self-host or Amplitude."
install: npm + external service
---

# Module: clickhouse (EXPERIMENTAL)

ClickHouse is a columnar database optimized for analytical queries over billions of events. Use it when PostHog's self-service dashboards aren't sufficient and you need custom SQL over raw event data — session replays, funnel analysis, cohort retention.

**Experimental status:** Requires an external ClickHouse instance (ClickHouse Cloud, Altinity, or self-hosted). Not a Vercel-native service. Adds operational complexity. For most projects, PostHog handles analytics adequately.

## When to consider this

- You need to query raw event data with custom SQL (PostHog's query editor is limited)
- Event volume exceeds PostHog's free tier and you don't want vendor lock-in
- You're building a multi-tenant analytics product (each customer sees their own data)
- You need sub-second aggregation over 100M+ rows

## External service options

- **ClickHouse Cloud** — managed, usage-based pricing, free tier available
- **Altinity.Cloud** — managed ClickHouse, better for enterprise
- **Self-hosted** — Docker or Kubernetes, full control

## Packages

```bash
npm install @clickhouse/client
```

## Scaffold

**lib/analytics/clickhouse.ts:**
```ts
import { createClient } from "@clickhouse/client";

export const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST!,
  username: process.env.CLICKHOUSE_USERNAME!,
  password: process.env.CLICKHOUSE_PASSWORD!,
  database: process.env.CLICKHOUSE_DATABASE!,
});
```

**lib/analytics/events.ts:**
```ts
import { clickhouse } from "./clickhouse";

export interface Event {
  event: string;
  userId: string;
  sessionId: string;
  properties: Record<string, unknown>;
  timestamp?: Date;
}

export async function trackEvent(event: Event) {
  await clickhouse.insert({
    table: "events",
    values: [{
      event: event.event,
      user_id: event.userId,
      session_id: event.sessionId,
      properties: JSON.stringify(event.properties),
      timestamp: (event.timestamp ?? new Date()).toISOString(),
    }],
    format: "JSONEachRow",
  });
}

export async function queryFunnel(steps: string[], since: Date) {
  const result = await clickhouse.query({
    query: `
      SELECT event, count() as count
      FROM events
      WHERE event IN ({steps: Array(String)})
        AND timestamp >= {since: DateTime}
      GROUP BY event
      ORDER BY count DESC
    `,
    query_params: { steps, since: since.toISOString() },
  });
  return result.json();
}
```

**SQL — create events table (run in ClickHouse):**
```sql
CREATE TABLE IF NOT EXISTS events (
  event       String,
  user_id     String,
  session_id  String,
  properties  String,
  timestamp   DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (timestamp, user_id, event);
```

## .env.example additions

```bash
# ClickHouse
CLICKHOUSE_HOST=https://...clickhouse.cloud:8443
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=...
CLICKHOUSE_DATABASE=default
```
