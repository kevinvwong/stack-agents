---
name: panel:stack
description: Run all 7 web stack agents as a panel — data, security, ai-llm, application, infrastructure, observability, presentation — each reviews the same feature or codebase from their layer, then produces a cross-layer synthesis surfacing integration gaps no single agent catches. Use for new feature reviews, architecture audits, security sweeps, and pre-launch readiness checks.
---

# /panel:stack

Convene all 7 web stack agents as a panel. Each agent reviews the target from their layer's perspective, then a synthesis pass identifies cross-layer gaps and integration chains that no single agent would catch alone.

## Usage

```
/panel:stack                                           # full review of the codebase
/panel:stack [scope]                                   # focus the panel on a feature or concern
/panel:stack STACK: database=Supabase                  # with stack override
```

Examples:
```
/panel:stack
/panel:stack "adding a new API endpoint"
/panel:stack "pre-launch readiness check"
/panel:stack "we just added auth — review the full stack impact"
/panel:stack STACK: database=Supabase
```

This is distinct from running `/audit` per agent: `/panel:stack` is a **coordinated review**, not just parallel findings. Later agents see earlier findings. The synthesis section surfaces where layers conflict — which is where the real decisions live.

## Execution Order

Run agents in strict dependency order. Each agent sees the same target and the full output of earlier agents before responding.

```
1. [AGENT: web-data]           — schema, migrations, query patterns, blob storage
2. [AGENT: web-security]       — auth, RBAC, RLS, rate limiting, headers
3. [AGENT: web-ai-llm]         — Claude API, prompts, ElevenLabs, Deepgram, cost controls
4. [AGENT: web-application]    — Edge Functions, API routes, input validation, webhooks
5. [AGENT: web-infrastructure] — Vercel, GitHub Actions, secrets, feature flags, CI
6. [AGENT: web-observability]  — Sentry, Axiom, structured logging, AI call monitoring
7. [AGENT: web-presentation]   — React components, Server/Client boundaries, state, accessibility
```

## Output Format

```
[COMMAND: panel:stack]
Target: <feature name, file path, or description of what is being reviewed>
Stack overrides: <none, or STACK: key=value pairs>

---

[AGENT: web-data] [COMMAND: audit]
Layer lens: schema, migrations, query patterns, RLS, blob storage

### Critical
...
### High
...
### Medium
...
### Low
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: web-security] [COMMAND: audit]
Layer lens: auth, RBAC, rate limiting, RLS policies, security headers, secret hygiene

### Critical
...
### High
...
### Medium
...
### Low
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: web-ai-llm] [COMMAND: audit]
Layer lens: Claude API usage, prompt design, ElevenLabs/Deepgram integration, token cost controls

### Critical
...
### High
...
### Medium
...
### Low
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: web-application] [COMMAND: audit]
Layer lens: API routes, Edge Functions, input validation, webhook handlers, error handling

### Critical
...
### High
...
### Medium
...
### Low
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: web-infrastructure] [COMMAND: audit]
Layer lens: CI/CD pipeline, Vercel config, environment secrets, feature flags, deployment strategy

### Critical
...
### High
...
### Medium
...
### Low
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: web-observability] [COMMAND: audit]
Layer lens: error tracking, structured logging, AI call monitoring, alerting, dashboards

### Critical
...
### High
...
### Medium
...
### Low
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: web-presentation] [COMMAND: audit]
Layer lens: Next.js App Router structure, Server/Client boundaries, component design, state, accessibility

### Critical
...
### High
...
### Medium
...
### Low
...
Summary: X critical, Y high, Z medium, W low

---

## Cross-layer Findings

Findings that reveal a conflict or gap *between* layers. Each cites the agents involved. These are the findings that would be missed if agents worked in isolation.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Chain: [how the gap propagates across layers]
  Fix: [specific remediation that touches both layers]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important action this feature or codebase needs to take, and what each layer's stake in it is. If this is a pre-launch readiness check, state whether the stack is ready to ship.

---

## Rollup

| Agent | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| web-data | | | | |
| web-security | | | | |
| web-ai-llm | | | | |
| web-application | | | | |
| web-infrastructure | | | | |
| web-observability | | | | |
| web-presentation | | | | |
| **cross-layer** | | | | |
| **Total** | | | | |

Top 3 actions to take before proceeding:
1. [action + which layers it unblocks]
2. [action + which layers it unblocks]
3. [action + which layers it unblocks]

→ HANDOFF TO [notion-publisher]: publish this audit to the quality audits database via `/notion:publish quality-audit <feature-or-repo>`
```

## Cross-layer Check Patterns

Look for these classes of integration chain after all agents have run:

**Data ↔ Security mismatch** (`web-data` + `web-security`)
- Tables exist in Drizzle schema without corresponding RLS policies
- RLS policies reference columns that don't exist or were renamed in a migration
- Drizzle client uses service role key, bypassing RLS entirely
- New table added but auth guard not updated to cover the new route that queries it

**Security ↔ Application gap** (`web-security` + `web-application`)
- Routes that `web-security` flagged as unprotected that `web-application` didn't flag independently
- Middleware matcher misses route segments present in `app/` directory
- Input validation present in the route but auth check happens after the expensive operation

**Data ↔ Application type drift** (`web-data` + `web-application`)
- Drizzle schema updated but API route still references old column names
- `types/api.ts` response shapes don't match what route handlers actually return
- Migration adds NOT NULL column with no default — existing rows break running queries

**AI-LLM ↔ Observability logging gap** (`web-ai-llm` + `web-observability`)
- `streamClaude()` or direct SDK calls that don't invoke `logAiCall` from `lib/ai/logger`
- AI call logs lack user-id context — cost runaway undetectable per-user
- ElevenLabs or Deepgram calls not captured in observability layer, creating billing blind spots

**AI-LLM ↔ Security exposure** (`web-ai-llm` + `web-security`)
- System prompts include user-supplied data without sanitization — prompt injection surface
- AI responses returned to the client contain PII that security headers don't filter
- Claude API key accessible in client-side environment variables

**Application ↔ Infrastructure environment gap** (`web-application` + `web-infrastructure`)
- Secrets referenced in route handlers absent from `vercel.json` or `.env.example`
- Feature flags hard-coded in application code rather than wired through environment config
- Edge Function runtime requirements incompatible with CI build configuration

**Infrastructure ↔ Observability gap** (`web-infrastructure` + `web-observability`)
- Sentry DSN present in code but not set as a Vercel environment variable in production
- CI pipeline doesn't run Sentry source map upload — stack traces in production are unreadable
- No alerting rule for Edge Function cold start timeouts despite CI checks passing

**Observability ↔ Application error chain** (`web-observability` + `web-application`)
- Route handlers catch errors and return 500 but never call `Sentry.captureException`
- Unhandled promise rejections in Edge Functions not captured before the runtime swallows them
- Structured log fields inconsistent across routes — queries against Axiom return partial results

**Infrastructure ↔ Presentation CI gap** (`web-infrastructure` + `web-presentation`)
- axe-core installed but not wired into the GitHub Actions workflow
- Playwright E2E tests exist but excluded from CI — regressions ship silently
- Bundle size budget check not enforced in CI; `web-presentation` flags a large bundle

**Data ↔ AI-LLM PII chain** (`web-data` + `web-ai-llm`)
- Database tables store raw user PII; AI prompts include full row contents without redaction
- Vector embeddings stored in Neon expose user content without access controls
- Drizzle query results passed directly to Claude context window — no field allowlist

## Panel Standards

- **Each agent speaks from their layer.** `web-data` does not file prompt injection bugs; `web-security` does not file migration gaps. Cross-layer findings go in the synthesis section only.
- **Cross-layer findings require a fix.** Unlike single-layer findings, cross-layer findings are coordination decisions — they need a specific remediation that addresses both sides.
- **Later agents reference earlier findings.** `web-presentation` may cite `web-security`'s missing CSP header finding when flagging inline script usage. Make the chain explicit.
- **The Panel Verdict is mandatory.** Every `/panel:stack` run ends with the one-paragraph verdict.
- **Don't manufacture findings.** If a layer is clean, say so. The rollup row shows zeros. Don't pad.
- **STACK: override applies to all agents.** If `STACK: database=Supabase` is set, every agent substitutes Supabase guidance for Neon/Drizzle guidance throughout their section.
