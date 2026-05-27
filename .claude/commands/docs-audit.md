---
name: docs:audit
description: Reviews all documentation in the project for completeness, accuracy, audience fit, and voice consistency. Covers README, CHANGELOG, CONTRIBUTING, API docs, user guides, architecture docs, runbooks, and ADRs. Reports stale content, missing sections, and tone mismatches.
---

# /docs:audit

Convene the `doc-writer` agent in audit mode. It reviews all documentation in scope for completeness, accuracy, audience fit, voice consistency, and staleness — then produces per-file findings and a coverage gap table showing what documentation should exist but doesn't.

## Usage

```
/docs:audit                          # audit all documentation in the project
/docs:audit [scope]                  # audit a specific file or directory
/docs:audit --stale                  # only flag docs not updated in 90+ days
```

Examples:
```
/docs:audit
/docs:audit README.md
/docs:audit docs/
/docs:audit CONTRIBUTING.md
/docs:audit docs/api/
/docs:audit --stale
/docs:audit docs/ --stale
```

## What Gets Audited

| Doc type | What the audit checks |
|----------|-----------------------|
| **README** | Hook, quickstart, install, usage, badges, links, audience fit |
| **CHANGELOG** | Format (Keep a Changelog), completeness, semver alignment, unreleased section |
| **CONTRIBUTING** | Setup steps still accurate, PR/issue workflow matches actual process, code of conduct presence |
| **API docs** | Coverage (all endpoints/exports documented), parameter accuracy, example completeness |
| **User guides** | Task-based structure, accurate screenshots/commands, progression logic |
| **Architecture docs / ADRs** | Decisions recorded, status current, superseded entries marked |
| **Runbooks** | Incident steps actionable, contacts current, not contradicting current infra |

## Output Format

```
[AGENT: doc-writer] [COMMAND: audit]
Scope: <file, directory, or "full project">

---

### Per-file Findings

#### <filename>
Audience: <who this doc is for>
Last updated: <date or "unknown">

**Critical**
- [ ] **[Finding title]**
  Why it matters: [consequence]
  Fix: [specific, actionable remediation]

**High**
- [ ] ...

**Medium**
- [ ] ...

**Low**
- [ ] ...

Summary: X critical, Y high, Z medium, W low

---

### Coverage Gaps

Docs that should exist based on the project structure but are absent.

| Missing doc | Why needed | Priority |
|-------------|-----------|----------|
| CONTRIBUTING.md | No contributor guidance exists | High |
| docs/runbooks/deploy.md | CI deploys to production but no runbook | High |
| SECURITY.md | Repo is public and accepts contributions | Medium |
| CHANGELOG | Package is versioned but has no change history | Medium |
| ... | | |

---

### Staleness Report

Only shown when `--stale` is passed, or when stale docs are found during a full audit.

| File | Last updated | Age | Reason flagged |
|------|-------------|-----|----------------|
| docs/api/webhooks.md | 2024-11-03 | 180+ days | API endpoints changed since last update |
| README.md | 2024-09-15 | 250+ days | Install instructions reference removed dependency |
| ... | | | |

---

### Rollup

| File | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| README.md | | | | |
| CHANGELOG.md | | | | |
| CONTRIBUTING.md | | | | |
| **Total** | | | | |

Top 3 actions:
1. [action]
2. [action]
3. [action]

→ HANDOFF TO [doc-writer] (write mode): use `/docs:write <file>` to rewrite any file flagged Critical or High
```

## Severity Definitions

| Severity | Definition |
|----------|-----------|
| **Critical** | Doc is actively misleading — wrong commands, deleted features, broken install steps |
| **High** | Doc is materially incomplete — a reader cannot complete their task from it alone |
| **Medium** | Doc exists and works but has voice mismatches, outdated screenshots, or missing examples |
| **Low** | Typos, minor formatting issues, or trivial gaps that don't affect comprehension |

## Audit Standards

- **Be specific**: cite the exact heading, section, or line that is the problem. "The README is thin" is not actionable; "README: Installation section missing — no `npm install` command or env var setup" is.
- **Audience matters**: a README finding must reference the intended reader (developer, end user, contributor). The same gap is Critical for a README and Low for an internal ADR.
- **Don't invent missing content**: the audit identifies gaps — it does not write copy. The fix should describe what needs to be added, not add it.
- **Staleness threshold**: 90 days for docs tied to actively-changing code (API docs, runbooks, setup guides); 365 days for stable architectural docs (ADRs, design docs).
- **Don't pad**: if a file is clean, say so. Zeros in the rollup are fine.
