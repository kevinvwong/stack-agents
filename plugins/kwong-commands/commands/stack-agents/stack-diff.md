---
name: stack:diff
description: Produce a migration plan for swapping one technology in the stack for another (e.g., Clerk → NextAuth, Neon → Supabase). Parses `STACK: from=X to=Y` plus a scope, routes to the agents responsible for the changed layer and any downstream agents whose configuration would shift, and outputs a per-layer change diff, what stays the same, migration risks, an ordered runbook, and a rollback plan.
---

# /diff [scope] STACK: from=X to=Y

Produce a migration plan for a technology swap. Parses a `STACK: from=X to=Y` override plus a scope (e.g., `auth`, `database`, `cache`), routes to the agent that owns the changed layer plus any downstream agents whose configuration shifts as a consequence, and emits a structured migration plan.

## Usage

```
/diff auth STACK: from=Clerk to=NextAuth
/diff database STACK: from=Neon to=Supabase
/diff cache STACK: from=Upstash to=Vercel-KV
/diff ai STACK: from=OpenAI to=Anthropic
/diff storage STACK: from=Vercel-Blob to=S3
/diff observability STACK: from=Sentry to=Axiom
```

The scope token selects the primary agent. The `from=`/`to=` pair tells the agents which two technologies to reason about. Both halves are required — `/diff` is not for greenfield decisions; use `/advise` for those.

## Routing

The scope maps to a primary agent and a set of downstream agents whose configuration shifts when the primary changes. Follow the dependency chain `data → security → ai-llm → application → infrastructure → observability → presentation` — downstream agents are the ones that come after the primary in the chain and have a real dependency on it.

| Scope                        | Primary agent    | Likely downstream agents                                                                                                                            |
| ---------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`                       | `security`       | `application` (route protection, session reads), `data` (user table shape), `presentation` (auth UI, hooks)                                         |
| `database`                   | `data`           | `security` (RLS / row policies), `application` (query layer), `infrastructure` (connection strings, migrations in CI), `observability` (DB metrics) |
| `cache` / `rate-limit`       | `application`    | `infrastructure` (env vars), `observability` (cache hit metrics)                                                                                    |
| `ai` / `llm`                 | `ai-llm`         | `application` (API route shape), `observability` (call logging), `finops` (cost model) — flag `finops` as a cross-cutting handoff                   |
| `storage`                    | `data`           | `application` (upload routes), `security` (signed URLs, ACLs)                                                                                       |
| `observability`              | `observability`  | `infrastructure` (DSN/secret wiring), `application` (instrumentation calls)                                                                         |
| `ci` / `infrastructure`      | `infrastructure` | `observability` (deploy hooks), `security` (secret rotation)                                                                                        |
| `framework` / `presentation` | `presentation`   | `application` (route handler shape), `infrastructure` (build config)                                                                                |

If the scope is ambiguous, ask exactly one clarifying question before routing.

## Output Format

```
[AGENT: <primary>] [COMMAND: diff]
Migration: <from> → <to>  (scope: <scope>)
Downstream agents consulted: <list>

## What Changes Per Layer

### <primary layer>
- [Concrete change 1 — config, code shape, env var, package]
- [Concrete change 2]

### <downstream layer A>
- [What shifts here as a consequence — be specific about file/route/config]

### <downstream layer B>
- [What shifts here]

## What Stays The Same

- [Module / boundary / contract that is not touched — name it so the engineer knows what NOT to rewrite]
- [Existing types, route shapes, or schemas that survive the swap]

## Migration Risks (Per Layer)

### <primary layer>
- ⚠️  **[Risk title]** — [why it matters, blast radius, who notices first]
  Mitigation: [specific action]

### <downstream layer A>
- ⚠️  **[Risk title]** — [why it matters]
  Mitigation: [specific action]

## Recommended Order Of Operations

Ordered, each step independently deployable and reversible where possible.

1. [Step 1 — prep / shadow read / dual-write setup]
2. [Step 2 — backfill / data parity check]
3. [Step 3 — cutover for non-critical surface]
4. [Step 4 — cutover for critical surface]
5. [Step 5 — decommission old system]

Mark each step `[reversible]` or `[point of no return]`.

## Rollback Plan

- **Trigger**: [what signal causes a rollback decision — error rate, auth failure rate, latency, manual call]
- **Procedure**: [exact steps to revert — env var flip, feature flag, deploy of previous tag]
- **Point of no return**: [the step after which rollback requires data migration, not just a config flip]
- **Data implications**: [what writes to the new system get lost or need replay on rollback]

## Cross-Layer Handoffs

→ HANDOFF TO [agent]: [what this migration creates as their problem]
→ HANDOFF TO finops: [if cost model shifts materially]
```

For multi-agent diffs, the primary agent emits the full section; each downstream agent contributes only the layers it owns, then the primary stitches the order-of-operations and rollback plan.

## Diff Standards

- **Both halves required.** `/diff` will not run with only `from=` or only `to=`. If a user wants a greenfield recommendation, route them to `/advise`.
- **Name what stays the same.** The most expensive mistake in a migration is rewriting code that did not need to change. Every diff explicitly names the surfaces that are not touched.
- **Order matters.** The runbook is ordered for safety, not convenience. Steps that are independently deployable come before steps that require a flag flip. Steps that require data backfill are sequenced after a parity check, not before.
- **Mark the point of no return.** Every migration has one. Name it. Once data is dual-written and the old system is decommissioned, rollback is no longer a config flip.
- **Be honest about partial migrations.** Some swaps cannot be fully decoupled (e.g., a database swap that drags the auth user table with it). Say so up front in the routing section, not hidden in a risk.
- **Cite agent boundaries.** When a downstream agent owns a piece of the migration, attribute it: "→ Application agent owns the `/api/auth/[...nextauth]` route shape." Don't smear responsibility.
- **Cost is a first-class risk.** When the swap changes the cost model (per-request pricing, new free tier, egress costs), flag `finops` as a handoff. Migration plans that ignore the new bill regularly cause post-cutover surprises.
