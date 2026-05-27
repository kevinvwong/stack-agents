---
name: security:baseline
description: First-pass security sweep covering semgrep static analysis, insecure defaults detection, supply chain risk (SHA-pinned actions, dependency audit), and known-bad patterns. Not a penetration test — produces a triage list for a human security review. Works on any JavaScript/TypeScript project.
---

# /security:baseline

First-pass security sweep. Produces a triage list across four categories: static analysis, insecure defaults, supply chain, and secrets exposure. Not a penetration test.

## Usage

```
/security:baseline                  # full sweep across all four categories
/security:baseline --semgrep        # static analysis only
/security:baseline --supply-chain   # supply chain only (SHA pinning, dependency audit)
/security:baseline --deps           # dependency vulnerability audit only
/security:baseline --secrets        # secrets exposure only
```

Examples:
```
/security:baseline
/security:baseline --semgrep
/security:baseline --supply-chain
/security:baseline --deps
/security:baseline --secrets
```

## Execution

```
[AGENT: web-security] [COMMAND: baseline]
```

The agent runs the codebase through four structured check categories in dependency order. Each category builds on the previous — supply chain findings inform how to weight static analysis findings.

### Check Categories

**Category 1: Static Analysis**

Semgrep rule families applied to all TypeScript/JavaScript source:
- `javascript.lang.security.detect-eval-with-expression` — `eval()` with non-literal argument
- `javascript.lang.security.detect-non-literal-require` — dynamic `require()` calls
- `javascript.react.security.audit.react-dangerouslysetinnerhtml` — unguarded XSS vectors
- `typescript.express.security.audit.express-sqli` — SQL string interpolation
- `typescript.lang.security.audit.path-traversal` — path construction from user input
- Generic injection patterns: template literals used as SQL, shell commands, or file paths

**Category 2: Insecure Defaults**

- `dangerouslySetInnerHTML` without sanitization (DOMPurify or equivalent)
- `eval()`, `Function()`, `setTimeout(string)`, `setInterval(string)` with user-controlled input
- SQL queries with string interpolation (not parameterized)
- File upload handlers that do not validate MIME type AND file size
- Error responses that expose stack traces in non-development environments
- CORS set to `*` on routes that accept cookies or auth tokens
- `Content-Security-Policy` header absent or set to `unsafe-inline` / `unsafe-eval`
- `X-Frame-Options` or `frame-ancestors` CSP absent (clickjacking)
- `httpOnly` and `Secure` flags absent on auth cookies
- Password reset tokens that do not expire

**Category 3: Supply Chain**

- GitHub Actions: actions pinned to a mutable tag (e.g., `actions/checkout@v4`) rather than a full SHA (`actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683`)
- GitHub Actions: third-party actions with `write` permissions to secrets or `id-token: write` without OIDC justification
- `npm audit` (or `pnpm audit` / `yarn audit`): critical and high CVEs in production dependencies
- Lockfile: present, committed, and consistent with `package.json` (no phantom dependencies)
- Dependabot: configured in `.github/dependabot.yml` or equivalent

**Category 4: Secrets Exposure**

- Hardcoded credentials: patterns matching `api_key`, `secret`, `password`, `token`, `private_key` assigned to string literals
- `.env` files committed to the repository (outside of `.env.example`)
- Secrets logged via `console.log`, `console.error`, or logging libraries at INFO level or above
- Secrets in comments
- Secrets in test fixtures committed to the repo

## Output Format

```
[AGENT: web-security] [COMMAND: baseline]
Scope: <full | category name>

---

### Category 1: Static Analysis

| Rule | File:Line | Severity | Finding |
|------|-----------|----------|---------|
| [rule id] | [file:line] | [C/H/M/L] | [one-line description] |
| ...       | ...         | ...       | ...                    |

Findings:
### Critical
- [ ] **[Finding title]** — [file:line]
  Why it matters: [attack vector]
  Fix: [specific remediation]

### High
- [ ] ...

Summary: X critical, Y high, Z medium, W low

---

### Category 2: Insecure Defaults

Checklist:
- [x] No `dangerouslySetInnerHTML` without sanitization
- [ ] **FAIL**: `eval()` with user input — [file:line]
- [x] SQL queries use parameterized statements
- [ ] **FAIL**: File upload does not validate MIME type — [file:line]
- [x] Errors do not expose stack traces in production
- [ ] **FAIL**: CSP absent — [file:line]
- ...

Findings:
### Critical
- [ ] ...
### High
- [ ] ...

Summary: X critical, Y high, Z medium, W low

---

### Category 3: Supply Chain

Checklist:
- [ ] **FAIL**: N GitHub Actions pinned to mutable tags — [list]
- [x] No third-party actions with unsafe `write` permissions
- [ ] **FAIL**: N high CVEs in production deps — [package names]
- [x] Lockfile committed and consistent
- [x] Dependabot configured

Findings:
### Critical
- [ ] ...
### High
- [ ] ...

Summary: X critical, Y high, Z medium, W low

---

### Category 4: Secrets Exposure

Checklist:
- [x] No hardcoded credentials found
- [x] No .env files committed (only .env.example)
- [ ] **FAIL**: Secret logged at [file:line]
- [x] No secrets in comments
- [x] No secrets in test fixtures

Findings:
### Critical
- [ ] ...
### High
- [ ] ...

Summary: X critical, Y high, Z medium, W low

---

## Cross-Category Findings

Findings that span more than one category — the most dangerous class of issue.

- [ ] **[Finding title]** — [categories: X + Y]
  Gap: [what each category found in isolation and why together they are worse]
  Fix: [remediation that addresses both sides]

---

## SECURITY VERDICT

SECURITY VERDICT: **[Blocked | High Risk | Medium Risk | Low Risk]**

- **Blocked** — one or more Critical findings. Do not ship. Fix before proceeding.
- **High Risk** — no Critical, but High findings present. Ship only with explicit owner sign-off and a remediation deadline.
- **Medium Risk** — no Critical or High. Medium findings present. Ship with a tracked remediation plan.
- **Low Risk** — only Low findings or clean. Ship.

---

## Rollup

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Static Analysis | | | | |
| Insecure Defaults | | | | |
| Supply Chain | | | | |
| Secrets Exposure | | | | |
| **Cross-category** | | | | |
| **Total** | | | | |

Top 3 actions to take before proceeding:
1. [action + category it addresses]
2. [action + category it addresses]
3. [action + category it addresses]

→ HANDOFF TO [notion-publisher]: publish this audit via `/notion:publish github-audit <scope>` if this is a pre-launch gate
→ HANDOFF TO [panel:security]: if Blocked or High Risk, escalate to full `/panel:security` for deeper investigation
```

## Sweep Standards

- **This is a triage list, not a penetration test**: findings are based on static analysis and pattern matching. A clean baseline does not mean the application is secure — it means no obvious issues were found.
- **Be specific about semgrep rules**: cite the rule ID when possible. "Potential injection" is not actionable. "`javascript.lang.security.detect-eval-with-expression` matched `eval(userInput)` at `src/utils/template.ts:23`" is.
- **Supply chain findings must name the package**: "a dependency has a CVE" is not actionable. "Package `lodash@4.17.20` has CVE-2021-23337 (command injection, CVSS 7.2)" is.
- **Don't manufacture findings**: if a category is clean, the checklist items are all checked and the finding section is empty with a "No findings in this category" note. Don't pad.
- **The SECURITY VERDICT is mandatory**: every `/security:baseline` run ends with a verdict. Do not omit it.
