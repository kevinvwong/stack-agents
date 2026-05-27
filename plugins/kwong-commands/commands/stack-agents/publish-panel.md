---
name: panel:publish
description: Run the publishing-readiness panel — product + analytics + notion-publisher — against a PRD or analytics spec. Catches PRDs that aren't testable (product), aren't measurable (analytics), or aren't shaped for the canonical PRDs database (notion-publisher) before they get published. Use as a quality gate before /notion:publish prd or /notion:publish analytics.
---

# /panel:publish

Convene the publishing-readiness panel. Before a PRD or analytics spec goes into Notion, three agents review it: `product` (is the problem and scope tight?), `analytics` (is the success metric measurable and instrumented?), `notion-publisher` (is the artifact shaped for the canonical database, will the upsert be clean?).

## Usage

```
/panel:publish <artifact-path-or-slug>     # review a single artifact for publish readiness
/panel:publish <artifact> --type <type>    # disambiguate type when not inferrable
/panel:publish <artifact> --gate-only      # report only — do not publish even if green
/panel:publish <artifact> --auto-publish   # publish automatically if all three agents pass
/panel:publish <artifact> --json           # emit a single JSON block (see schema below) — for CI scripting
```

## `--json` Output Schema

When `--json` is set, emit **only** a single fenced JSON block matching this shape — no preamble, no trailing prose. Designed for `gh pr review` and CI gating.

```json
{
  "command": "panel:publish",
  "artifact": "<path or slug>",
  "type": "prd | analytics",
  "verdict": "READY | READY_WITH_FIXES | NOT_READY",
  "agents": {
    "product":          { "critical": 0, "high": 0, "medium": 1, "low": 2 },
    "analytics":        { "critical": 0, "high": 0, "medium": 0, "low": 1 },
    "notion-publisher": { "critical": 0, "high": 0, "medium": 0, "low": 0 }
  },
  "findings": [
    { "agent": "product", "severity": "medium", "title": "Out-of-scope section missing", "fix": "Add a v1 scope block." }
  ],
  "blockers": [],
  "auto_published": false,
  "published_url": null,
  "rationale": "One-paragraph reasoning..."
}
```

Exit semantics for scripts:
- `verdict == READY` → exit 0
- `verdict == READY_WITH_FIXES` → exit 0 (advisory)
- `verdict == NOT_READY` → exit 1

When both `--auto-publish` and `--json` are set, the JSON includes `auto_published: true` and `published_url` on success.

**Examples:**

```
/panel:publish ./docs/prds/voice-onboarding.md
/panel:publish voice-onboarding --type prd
/panel:publish ./docs/analytics/checkout-funnel.md --type analytics
/panel:publish voice-onboarding --auto-publish
/panel:publish ./docs/prds/voice-onboarding.md --gate-only
```

Supported types: `prd`, `analytics`.

## Execution Order

```
1. [AGENT: product]            — problem framing, scope, acceptance criteria, prioritization
2. [AGENT: analytics]          — success metric definition, instrumentation plan, A/B test design
3. [AGENT: notion-publisher]   — payload shape, property mapping, idempotency, body block fitness
```

The chain matters: `notion-publisher` reads the upstream findings to know whether the artifact is even ready to publish.

## Output Format

```
[COMMAND: panel:publish]
Artifact: <path or slug>
Type:     <prd | analytics>

---

[AGENT: product] [COMMAND: audit]
Domain lens: problem definition, user segment, scope, acceptance criteria, prioritization

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

[AGENT: analytics] [COMMAND: audit]
Domain lens: primary metric, guardrails, instrumentation readiness, A/B test design

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

[AGENT: notion-publisher] [COMMAND: audit]
Domain lens: payload shape vs canonical schema, property mapping, idempotency, body block hygiene

### Critical
### High
### Medium
### Low
Summary: X critical, Y high, Z medium, W low

---

## Publish-readiness verdict

One of:
- **READY** — all three agents pass with no Critical / High findings. Safe to publish.
- **READY WITH FIXES** — minor (Medium / Low) findings only. Author can publish or address first.
- **NOT READY** — any Critical / High finding from any agent. Do not publish.

Rationale: one paragraph naming the most important blocker (or, if READY, the highest-value follow-up).

---

## Rollup

| Agent              | Critical | High | Medium | Low |
|--------------------|----------|------|--------|-----|
| product            |          |      |        |     |
| analytics          |          |      |        |     |
| notion-publisher   |          |      |        |     |
| **Total**          |          |      |        |     |

---

## Action

If verdict = READY and `--auto-publish` was set: invoke `/notion:publish <type> <artifact>`. Report the resulting page URL.
If verdict = READY WITH FIXES: list the fixes, await confirmation before publishing.
If verdict = NOT READY: list the blockers grouped by agent, route handoffs:
  → HANDOFF TO [product]: <fixes needed>
  → HANDOFF TO [analytics]: <fixes needed>
  → HANDOFF TO [notion-publisher]: <payload fixes needed>
```

## When This Panel Catches Things `/notion:publish` Alone Misses

- **PRD with no testable acceptance criteria.** `notion-publisher` will happily publish it. `product` catches it.
- **PRD with a vanity metric.** Same — publisher doesn't evaluate metric quality. `analytics` catches it.
- **A/B test with no minimum detectable effect or duration.** `analytics` catches it.
- **Source URL that's a personal Notion link (not a stable PR or file path).** `notion-publisher` catches it — would break idempotency on future runs.
- **PRD missing the `Linked sprint` relation that the schema expects.** `notion-publisher` catches it before the silent publish.
- **Analytics spec without a linked PRD.** Cross-agent finding — `product` + `analytics` + `notion-publisher` all care.

## Panel Standards

- **Each agent reviews from their lens — no overlap into others' territory.** `product` does not file Notion schema findings; `notion-publisher` does not redesign the metric.
- **Verdict is binary on the publish question.** READY / READY WITH FIXES / NOT READY. No "kind of ready."
- **`--gate-only` produces a report, never a publish.** Use when the publish should be a human decision regardless of verdict.
- **`--auto-publish` only runs if verdict is READY (not READY WITH FIXES).** Avoids silent publishes of "good enough" artifacts.
