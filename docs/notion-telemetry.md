# Notion integration telemetry — event schema

Spec for instrumenting the Notion specialist agents (`notion-architect`, `notion-publisher`, `notion-importer`, `notion-governance`) so we can answer real operational questions: publish frequency, success rate per type, latency distribution, which types are iterating fastest, hook false-positive rate.

**Status**: spec only. PostHog wiring is gated on an account + env var. See [#34](https://github.com/kevinvwong/stack-agents/issues/34).

---

## Why

After 7.x of building this integration we still can't answer:

- How often does `/notion:publish` actually run? Which type wins?
- What's the success rate per type? Per agent?
- How long do publishes take (p50, p95)? Where are the slow steps?
- Which `Source` URLs get republished most (= artifacts iterating fastest = areas of active work)?
- How often does the URL sanitizer block a publish? Is the false-positive rate acceptable, or is it noisy?

Without data, every future tuning decision is a guess. PostHog is already in the default stack (`agents/product-analytics.md`, `agents/web-observability.md`); five well-placed events would unlock the answers.

## Events

Five event types, one per logical operation. Same envelope for all.

| Event name | Fired by | When |
|---|---|---|
| `notion_publish_attempted` | `notion-publisher` | At the start of every `/notion:publish` call, before any MCP write |
| `notion_publish_completed` | `notion-publisher` | After verification — both create and update paths emit |
| `notion_publish_blocked` | hook (`notion-url-sanitize.sh`) | When the sanitize hook exits non-zero |
| `notion_import_attempted` | `notion-importer` | At the start of every `/notion:import` and `/notion:promote-to-repo` |
| `notion_audit_completed` | `notion-governance` | After every `/notion:audit` run |

## Event envelope

All events share this property shape. Anything not in this list does not get sent.

```json
{
  "$event": "notion_publish_completed",
  "type": "sprint|prd|research|analytics|github-audit|quality-audit|game-design|runbook|null",
  "outcome": "create|update|skip|fail|blocked|null",
  "latency_ms": 0,
  "agent": "notion-publisher|notion-importer|notion-governance|notion-architect|null",
  "repo": "owner/name",
  "branch": "main|<other>|null",
  "schema_version": 1,
  "error_code": "string|null",
  "$timestamp": "ISO-8601 (PostHog sets automatically)"
}
```

## Strict NOT-in-properties list

- ❌ `Source` URL — it can contain identifiers; even sanitized, treat as PII-adjacent
- ❌ Page title, page ID, database ID — workspace identifiers
- ❌ User email, name, or any Notion user ID
- ❌ Body content snippets
- ❌ Property values from the published page
- ❌ Free-form error message bodies (use `error_code` slugs only)

The intent: enough signal to answer "what types succeed/fail and how fast," with zero workspace fingerprint.

## Where the code lives

This is a spec; no code yet. When wiring lands:

- A small `lib/telemetry.ts` (or `.mjs` for Node hooks) exporting `emit(eventName, props)`. No-op when `STACK_AGENTS_TELEMETRY` env var is unset or `0`.
- `notion-publisher` calls `emit('notion_publish_attempted', ...)` and `emit('notion_publish_completed', ...)` from its publish flow.
- `notion-url-sanitize.sh` calls `emit('notion_publish_blocked', ...)` via a node one-liner before its `exit 2`.
- `notion-importer` calls `emit('notion_import_attempted', ...)` from its fetch flow.
- `notion-governance` calls `emit('notion_audit_completed', ...)` at the end of `/notion:audit`.

PostHog client choice: `posthog-node` for Node contexts (publisher/importer/governance — they run inside Claude Code via MCP, so a Node call site is plausible if a wrapper script is added). Hook scripts shell out to `node -e` for the single emit. Don't add a Python or curl path; one client surface.

## Opt-in toggles

```
export STACK_AGENTS_TELEMETRY=1
export POSTHOG_PROJECT_API_KEY=phc_...
export POSTHOG_HOST=https://app.posthog.com   # or self-hosted
```

When `STACK_AGENTS_TELEMETRY` is unset or `0`, all `emit()` calls return immediately — zero network traffic. Failure modes (network down, PostHog 5xx) never block the underlying operation.

## Dashboards (when data lands)

Once events start flowing, build these in PostHog:

| Dashboard | Insight |
|---|---|
| Weekly publish volume by type | Bar chart, last 8 weeks |
| Success rate per agent | Donut, last 30 days |
| p50 / p95 latency per type | Line chart, last 30 days |
| Hook block rate (false-positive proxy) | Single number: `notion_publish_blocked / notion_publish_attempted * 100` |
| Top `repo` values by publish count | Table |

These dashboards live alongside the existing analytics specs — they should be added to the Notion Analytics specs database once the events are flowing.

## Order of work when this gets built

1. Add `STACK_AGENTS_TELEMETRY` toggle to `docs/SETUP.md` (off by default; document the env vars).
2. Add `lib/telemetry.ts` (or `.mjs`) with the no-op gate.
3. Wire the 5 emit points (one PR per specialist? or all in one — author's call).
4. Update each affected agent's spec to note "emits telemetry per `docs/notion-telemetry.md`."
5. Create the 5 PostHog dashboards manually.
6. After 30 days of data, write up a Notion Research row with the findings — what surprised, what's slow, what's noisy.

## Source

PLAN.md Phase 7c · Issue [#34](https://github.com/kevinvwong/stack-agents/issues/34)
