---
name: debug:env
description: Traces environment variable usage through the codebase, cross-references .env.example and deployment config, identifies vars present in one environment but absent in another, and finds client-side leaks (NEXT_PUBLIC_ on sensitive values). Works with Next.js, Vercel, Supabase Edge Functions, and GitHub Actions.
---

# /debug:env [scope]

Trace environment variable usage through the codebase, cross-reference `.env.example` and deployment config, find missing vars, and identify client-side leaks.

## Usage

```
/debug:env                          # full audit — all env vars across all environments
/debug:env --missing                # only vars referenced in code but absent in .env.example
/debug:env --leaks                  # only client-side exposure risks (NEXT_PUBLIC_ on sensitive values)
/debug:env [VAR_NAME]               # trace a single variable through the codebase
```

Examples:
```
/debug:env
/debug:env --missing
/debug:env --leaks
/debug:env NEXT_PUBLIC_SUPABASE_URL
/debug:env DATABASE_URL
/debug:env --missing --leaks
```

## Execution

```
[AGENT: env-debugger] [COMMAND: debug]
```

The agent scans the codebase for environment variable references and applies the following checklist:

**Reference Inventory**
- All `process.env.VAR_NAME`, `env.VAR_NAME`, and `${{ secrets.VAR }}` references in application code, scripts, and CI workflows
- Framework-specific patterns: `NEXT_PUBLIC_*`, `VITE_*`, `PUBLIC_*`
- Dynamic access patterns: `process.env[key]` (flagged as unsafe — cannot be statically analyzed)

**Cross-Environment Gap Analysis**
- Vars in code but absent from `.env.example`
- Vars in `.env.example` but not referenced anywhere (stale documentation)
- Vars defined in Vercel / deployment config but absent from `.env.example`
- Vars present in development config but missing from CI/CD secrets

**Client-Side Leak Detection**
- `NEXT_PUBLIC_` prefix on vars whose names suggest secret material: `*_SECRET`, `*_KEY`, `*_TOKEN`, `*_PASSWORD`, `*_PRIVATE*`
- Server-only vars accessed in client components (`'use client'` files or pages router client bundles)
- Vars logged or exposed in API responses

**Validation Completeness**
- Vars used at runtime without startup validation (no `zod`, `t3-env`, or equivalent check)
- Optional vars assumed to be present (no fallback, no null check)

## Output Format

```
[AGENT: env-debugger] [COMMAND: debug]
Scope: <full | --missing | --leaks | VAR_NAME>

### Per-Variable Findings Table

| Variable | Used In | Defined In | Risk | Finding |
|----------|---------|------------|------|---------|
| VAR_NAME | [files] | [.env.example / Vercel / CI / missing] | [C/H/M/L/OK] | [one-line description] |
| ...      | ...     | ...                                   | ...          | ...                   |

### Missing Variables
Variables referenced in code but absent from .env.example (and therefore likely missing from some environments):

- `VAR_NAME` — referenced in [file:line], not in .env.example
  Fix: Add `VAR_NAME=<description of expected value>` to .env.example

### Leak Candidates
Variables with NEXT_PUBLIC_ prefix that may expose sensitive values:

- [ ] **`NEXT_PUBLIC_VAR_NAME`** — [file:line]
  Risk: [why this value should not be public]
  Fix: [rename to non-public, move to server-side fetch, or confirm intentionally public]

### Stale Documentation
Variables in .env.example not referenced anywhere in the codebase:

- `VAR_NAME` — defined in .env.example but not found in any source file
  Action: Remove from .env.example or confirm it is used by a framework at build time

### Validation Gaps
Variables used without startup validation:

- `VAR_NAME` — read at [file:line] with no validation
  Fix: Add to env schema validation (t3-env, zod, or equivalent)

### Summary
X critical, Y high, Z medium, W low — N missing, N leak candidates, N stale docs
```

Severity tags:
| Tag | Definition |
|-----|-----------|
| **[C]ritical** | Secret value exposed client-side or in a public context |
| **[H]igh** | Var missing from a required environment (production likely broken) |
| **[M]edium** | Var undocumented in .env.example, or no startup validation |
| **[L]ow** | Stale .env.example entry or minor inconsistency |

## Debug Standards

- **Be specific about where vars are used**: cite file paths and line numbers. "DATABASE_URL is used in the data layer" is not actionable; "`db/client.ts:8`" is.
- **Dynamic access patterns are always flagged**: `process.env[someVariable]` cannot be statically analyzed and should be surfaced even if it looks intentional.
- **Don't assume NEXT_PUBLIC_ leaks are bugs**: some values (public API keys, public Supabase URLs) are intentionally public. Flag them and let the developer confirm — don't silently pass them.
- **Validate against the deployment platform**: if Vercel config or a `vercel.json` is present, cross-reference it. A var missing from Vercel is as dangerous as a var missing from `.env.example`.
