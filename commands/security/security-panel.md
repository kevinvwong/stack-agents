---
name: panel:security
description: Run three security-focused agents as a panel — web-security (auth/RBAC/rate-limiting), env-debugger (env var leaks/misconfig), and a static analysis pass — against the same codebase or feature, then produce a cross-domain synthesis. Use for pre-launch security gates, new auth feature reviews, and handling a security incident.
---

# /panel:security

Convene two security agents and a structured static analysis pass as a panel. Each agent reviews the same codebase or feature from their domain's perspective, then a synthesis pass identifies cross-domain gaps and conflicts. The static analysis step is not a separate agent — it is a structured checklist the panel itself runs after both agents have reported.

## Usage

```
/panel:security                                   # full security review of the codebase
/panel:security [scope]                           # focus the panel on a specific concern or feature
```

Examples:
```
/panel:security
/panel:security "we just added OAuth"
/panel:security "pre-launch gate"
/panel:security "new payment flow review"
/panel:security "audit the API surface"
```

This is distinct from running each agent's audit in isolation: `/panel:security` is a **coordinated security review**. The env-debugger sees the web-security findings before responding. The static analysis pass synthesizes both. The final verdict is the canonical ship/no-ship signal for security.

## Execution Order

Run agents and passes in strict dependency order. Each step sees the same codebase and the full output of earlier steps before responding.

```
1. [AGENT: web-security]    — auth flows, RBAC, rate limiting, session management, security headers
2. [AGENT: env-debugger]    — env var leaks, NEXT_PUBLIC_ violations, secret exposure, misconfig
3. [PASS: static-analysis]  — panel-run checklist: secrets in code, dependency vulns, insecure defaults, supply chain
```

## Output Format

```
[COMMAND: panel:security]
Scope: <codebase, feature, or area being reviewed>

---

[AGENT: web-security] [COMMAND: audit]
Domain lens: auth flows, RBAC, rate limiting, session management, CORS, CSP, security headers

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

[AGENT: env-debugger] [COMMAND: audit]
Domain lens: env var exposure, NEXT_PUBLIC_ violations, secret leakage, .env hygiene, misconfiguration

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

[PASS: static-analysis] [COMMAND: audit]
Domain lens: secrets in source, dependency vulnerabilities, insecure defaults, supply chain (SHA-pinned actions)

Checklist results:

#### Secrets in Code
- [ ] No hardcoded API keys, tokens, or passwords in source files
- [ ] .gitignore covers all .env variants; no .env committed
- [ ] Git history scan: no secrets in previous commits

#### Dependency Vulnerabilities
- [ ] Dependabot alerts: zero open critical/high CVEs
- [ ] npm audit (or equivalent): zero critical/high
- [ ] Lockfile committed and up to date

#### Insecure Defaults
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] No `eval()` or `Function()` constructor with user input
- [ ] SQL queries use parameterized statements / ORM (no string interpolation)
- [ ] File upload handlers validate MIME type + size
- [ ] Error responses do not expose stack traces in production

#### Supply Chain (CI/CD)
- [ ] All GitHub Actions pinned to a SHA (not a mutable tag)
- [ ] No third-party actions with `write` permissions to secrets
- [ ] OIDC used for cloud credentials (no long-lived secrets in CI)

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

## Cross-domain Findings

Findings that reveal a conflict or gap *between* domains. Each cites the domains involved. These are the findings that would be missed if agents worked in isolation.

### Critical
- [ ] **[Finding title]** — [domains: X + Y]
  Gap: [what each domain expects that the other doesn't deliver]
  Fix: [specific remediation that touches both domains]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important security risk this codebase carries, which domain it originates from, and whether it is safe to proceed to the next milestone.

SECURITY VERDICT: **[Blocked | High Risk | Medium Risk | Low Risk]**

- **Blocked** — one or more Critical findings. Do not ship. Fix before proceeding.
- **High Risk** — no Critical, but High findings present. Ship only with explicit owner sign-off and a remediation deadline.
- **Medium Risk** — no Critical or High. Medium findings present. Ship with a tracked remediation plan.
- **Low Risk** — only Low findings or clean. Ship.

---

## Rollup

| Domain | Critical | High | Medium | Low |
|--------|----------|------|--------|-----|
| web-security | | | | |
| env-debugger | | | | |
| static-analysis | | | | |
| **cross-domain** | | | | |
| **Total** | | | | |

Top 3 actions to take before proceeding:
1. [action + which domains it unblocks]
2. [action + which domains it unblocks]
3. [action + which domains it unblocks]

→ HANDOFF TO [notion-publisher]: publish this audit via `/notion:publish github-audit <scope>` to the GitHub audits database (or create a security-audit page if none exists)
```

## Cross-domain Check Patterns

Look for these classes of conflict after all agents have run:

**web-security ↔ env-debugger mismatch**
- Auth secret (`NEXTAUTH_SECRET`, `JWT_SECRET`) is referenced in middleware but exposed via `NEXT_PUBLIC_` prefix
- Rate-limiting Redis client uses a `NEXT_PUBLIC_UPSTASH_URL` that is visible in the browser bundle
- OAuth client secret is present in a `NEXT_PUBLIC_` variable — secret is now public

**web-security ↔ static-analysis gap**
- Auth headers (CSP, CORS) are configured in code but the dependency that implements them has a known CVE
- RBAC logic guards routes but a dependency with a path-traversal vulnerability bypasses the guard
- Rate limiting is implemented but the Redis client library has an unpatched deserialization issue

**env-debugger ↔ static-analysis gap**
- Secrets are correctly in `.env.local` (not committed) but also appear hardcoded in test fixtures committed to the repo
- Dependabot is configured but the lockfile in the repo is stale — vulnerability fixes are not reflected
- CI/CD workflow reads secrets from env but those secrets are also echoed in a `console.log` in the application code

**All domains: secrets lifecycle**
- Secret is not in source (env-debugger clean) and no CVE in the library using it (static-analysis clean), but it is logged on every request (web-security finding) — the secret is effectively public in your logging backend

## Panel Standards

- **Each agent speaks from their domain.** `web-security` does not file missing Dependabot alerts; `env-debugger` does not file CORS misconfigurations. Cross-domain findings go in the synthesis section only.
- **The static-analysis pass is a checklist, not an agent.** It runs every item in the checklist and reports results, but it does not have opinions about architecture — it only reports pass/fail per item.
- **The SECURITY VERDICT is mandatory.** Every `/panel:security` run ends with a verdict. "Blocked" means no ship. Do not soften it.
- **Later steps reference earlier findings.** The static-analysis pass may cite a `web-security` finding when a checklist item is related. Make the chain explicit.
- **Don't manufacture findings.** If a domain is clean, say so. The rollup row shows zeros. Don't pad.
