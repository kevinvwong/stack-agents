---
description: Run a first-pass security sweep of the current project using a curated subset of ernest skills — semgrep, codeql, insecure-defaults, supply-chain-risk-auditor, and agentic-actions-auditor. Requires kwong-skills.
---

Run a security baseline sweep of this project. This is a first-pass triage, not a deep audit — it surfaces the highest-confidence issues quickly so you know where to focus.

## Skills to invoke

Run these five in parallel:

- **semgrep** — static analysis for common vulnerability patterns across the codebase
- **codeql** — interprocedural data flow and taint tracking (if a CodeQL database exists or can be built)
- **insecure-defaults** — detect fail-open configurations, hardcoded secrets, weak auth, permissive security defaults
- **supply-chain-risk-auditor** — assess dependency and supply chain risk
- **agentic-actions-auditor** — if this project has GitHub Actions workflows that invoke AI agents, audit them for prompt injection and privilege escalation risks

## Scope guidance

- Focus on the production code path. Test files and dev tooling are lower priority unless they handle secrets or run in CI.
- Flag anything that could reach production: API routes, auth middleware, database queries, environment variable handling, third-party integrations.
- For supply chain: check `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, or equivalent for unpinned deps, typosquatting candidates, and packages with recent ownership changes.
- For agentic actions: only run if `.github/workflows/` contains workflows that invoke Claude Code, Gemini CLI, OpenAI Codex, or similar AI coding agents.

## Output format

### Executive Summary
2–3 sentences. Overall risk posture: Low / Medium / High / Critical. Top finding in one sentence.

### Findings by Skill

For each skill that produced findings:

**[Skill name]**
| Severity | File | Line | Finding | Remediation |
|----------|------|------|---------|-------------|

Severity: Critical (exploitable now) / High (likely exploitable) / Medium (needs investigation) / Low (hygiene).

### Prioritized Fix List
All findings merged and ranked. Critical and High items first. Format:
**[C/H/M/L]** | **[Category]** | Finding | Recommended fix | Effort (S/M/L)

### What's Not Covered
Explicit list of what this baseline does NOT check — so you know what a deeper audit would add (e.g., manual code review, dynamic testing, infrastructure review, cryptographic analysis).

### Suggested Next Steps
If findings warrant deeper investigation, which ernest skills to run next and why.
