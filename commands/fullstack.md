---
name: fullstack
description: Run all 7 stack agents in dependency order, then synthesize cross-cutting findings that no single agent would catch alone. Use for pre-launch audits, architectural health checks, and onboarding reviews of an unfamiliar codebase.
---

# /fullstack

Run every agent against the full stack, then produce a cross-cutting synthesis pass that identifies issues spanning multiple layers.

## Usage

```
/fullstack                        # full audit of the entire codebase
/fullstack STACK: auth=NextAuth   # with stack override
```

This is distinct from `/audit` with no scope: `/audit` fans out per-layer findings in isolation. `/fullstack` does the same, then adds a **Cross-cutting** section that surfaces contradictions and gaps between layers — things no individual agent would file on its own.

## Execution Order

Run agents in strict dependency order. Do not begin a later agent until the earlier one is complete — later agents may reference earlier findings.

```
1. [AGENT: data]
2. [AGENT: security]
3. [AGENT: ai-llm]
4. [AGENT: application]
5. [AGENT: infrastructure]
6. [AGENT: observability]
7. [AGENT: presentation]
```

Each agent runs its `/audit` checklist in full. Output each agent's section before starting the next.

## Output Format

```
[COMMAND: fullstack]

---

[AGENT: data] [COMMAND: audit]
Target: database schema, migrations, query patterns

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: security] [COMMAND: audit]
Target: auth, RBAC, rate limiting, RLS, headers
...

---

[AGENT: ai-llm] [COMMAND: audit]
Target: prompts, Claude API usage, voice pipeline, cost controls
...

---

[AGENT: application] [COMMAND: audit]
Target: API routes, input validation, webhook handlers, error handling
...

---

[AGENT: infrastructure] [COMMAND: audit]
Target: CI/CD, environment config, secrets, deployment pipeline
...

---

[AGENT: observability] [COMMAND: audit]
Target: error tracking, structured logging, AI call monitoring, alerting
...

---

[AGENT: presentation] [COMMAND: audit]
Target: Next.js App Router structure, Server/Client boundaries, accessibility, performance
...

---

## Cross-cutting Findings

Findings that span two or more layers. Each cites the agents involved.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Why it matters: [consequence]
  Fix: [specific remediation that touches both layers]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Rollup

| Agent | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| data | | | | |
| security | | | | |
| ai-llm | | | | |
| application | | | | |
| infrastructure | | | | |
| observability | | | | |
| presentation | | | | |
| **cross-cutting** | | | | |
| **Total** | | | | |

Estimated remediation effort: [S/M/L/XL]
Recommended fix order: [ordered list of top 3–5 findings by impact × effort]
```

## Cross-cutting Check Patterns

Look for these classes of contradiction after all 7 agents have run:

**Schema ↔ RLS mismatch** (`data` + `security`)
- Tables exist in Drizzle schema without corresponding RLS policies
- RLS policies reference columns that don't exist or were renamed

**Auth ↔ API route mismatch** (`security` + `application`)
- Routes that security agent flagged as unprotected but application agent didn't flag
- Middleware matcher misses route segments present in `app/` directory

**AI logging gap** (`ai-llm` + `observability`)
- `streamClaude()` calls exist that don't invoke `logAiCall` from `lib/ai/logger`
- AI call logs not queryable per-user (cost runaway undetectable)

**Type drift** (`application` + `presentation`)
- `types/api.ts` defines response shapes that don't match what route handlers actually return
- Frontend uses locally-defined types instead of shared `types/api.ts`

**Environment gap** (`infrastructure` + `security`)
- Secrets referenced in code but absent from `vercel.json` or `.env.example`
- Clerk/AI keys present in preview env but not production, or vice versa

**Error visibility gap** (`application` + `observability`)
- Route handlers catch errors but don't log them to Sentry/Axiom before returning 500
- Unhandled promise rejections in Edge Functions not captured by Sentry

**CI coverage gap** (`infrastructure` + `presentation`)
- axe-core not running in CI despite being installed
- Playwright tests exist but not wired into the GitHub Actions workflow

## Fullstack Standards

- **Deduplicate**: if `data` and `security` both flag missing RLS, `data` owns it in their section. The cross-cutting section only files it again if the *interaction* between layers is the finding (e.g., "RLS policy exists but the Drizzle client uses the service role, bypassing it entirely").
- **Reference earlier findings**: cross-cutting findings may reference specific findings from earlier agent sections by title.
- **Rollup is mandatory**: every `/fullstack` run ends with the summary table and top fix order.
- **Don't manufacture findings**: if a layer is clean, say so. The rollup row shows zeros. Don't pad.
