---
name: panel:launch
description: Full pre-launch sweep across all disciplines — runs web stack (all 7), quality (web-qa + accessibility + performance), GitHub (repo + actions), and security — then synthesizes into a SHIP / NO-SHIP verdict with a prioritized fix list. Use as the final gate before any production launch.
---

# /panel:launch

Run a full pre-launch sweep across the web stack, quality, GitHub, and security disciplines. Each sub-panel runs in sequence, later sub-panels see earlier findings, and a final synthesis pass produces a single SHIP / NO-SHIP verdict with a prioritized fix list.

## Usage

```
/panel:launch
```

Always run against the full repo and product. No scoping — partial launch sweeps produce unreliable verdicts.

## Execution Order

Run sub-panels in dependency order. Each sub-panel sees the same codebase and the full output of preceding sub-panels.

```
1. /panel:stack    — all 7 web stack agents (data → security → ai-llm → application → infrastructure → observability → presentation)
2. /panel:quality  — web-qa + accessibility + performance
3. GitHub check    — gh-repo + gh-actions (branch protection, CI security, workflow health)
4. /panel:security — security agent + env-debugger + static analysis
5. Synthesis       — cross-domain blockers + SHIP / NO-SHIP verdict
```

## Output Format

```
[COMMAND: panel:launch]
Repo: <repo name or path>
Run date: <date>

---

## Sub-panel: Stack
[Delegate to /panel:stack — emit full output]

Sub-panel summary:
- <bullet 1>
- <bullet 2>
- <bullet 3>
Stack verdict: X critical, Y high, Z medium

---

## Sub-panel: Quality
[Delegate to /panel:quality — emit full output]

Sub-panel summary:
- <bullet 1>
- <bullet 2>
- <bullet 3>
Quality verdict: X critical, Y high, Z medium

---

## Sub-panel: GitHub
[AGENT: gh-repo] [COMMAND: audit]
Domain lens: branch protection, CODEOWNERS, Dependabot, secret scanning, community health

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: gh-actions] [COMMAND: audit]
Domain lens: workflow security, permissions, action pinning, CI structure, caching

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

GitHub sub-panel summary:
- <bullet 1>
- <bullet 2>
- <bullet 3>
GitHub verdict: X critical, Y high, Z medium

---

## Sub-panel: Security
[Delegate to /panel:security — emit full output]

Sub-panel summary:
- <bullet 1>
- <bullet 2>
- <bullet 3>
Security verdict: X critical, Y high, Z medium

---

## Cross-domain Blockers

Issues that appear in two or more sub-panels. These are the highest-confidence findings — multiple disciplines flagged the same underlying problem independently.

### Critical (blocks launch)
- [ ] **[Issue title]** — [sub-panels: X + Y]
  Chain: [how the issue manifests across disciplines]
  Fix: [specific remediation, effort: S/M/L]

### High (resolve before launch)
- [ ] **[Issue title]** — [sub-panels: X + Y]
  Chain: [how the issue manifests across disciplines]
  Fix: [specific remediation, effort: S/M/L]

---

## Launch Verdict

### SHIP / NO-SHIP

**[SHIP | NO-SHIP]** — [N critical blockers, M high issues]

> One-paragraph synthesis: the overall health of this codebase for production launch, the most important action to take, and the specific domains where risk is concentrated.

---

## Ordered Fix List

Tackle in this order. Critical blockers first, then cross-domain highs, then single-domain highs, then nice-to-haves.

### Critical Blockers (must fix before launch)
| # | Fix | Domain(s) | Effort |
|---|-----|-----------|--------|
| 1 | | | S/M/L |
| 2 | | | S/M/L |

### Cross-domain Highs (resolve before launch)
| # | Fix | Domain(s) | Effort |
|---|-----|-----------|--------|
| 1 | | | S/M/L |
| 2 | | | S/M/L |

### Single-domain Highs (resolve before launch)
| # | Fix | Domain | Effort |
|---|-----|--------|--------|
| 1 | | | S/M/L |

### Nice-to-haves (post-launch)
| # | Fix | Domain | Effort |
|---|-----|--------|--------|
| 1 | | | S/M/L |

---

## Rollup

| Sub-panel | Critical | High | Medium | Low |
|-----------|----------|------|--------|-----|
| stack | | | | |
| quality | | | | |
| github | | | | |
| security | | | | |
| **cross-domain** | | | | |
| **Total** | | | | |

→ HANDOFF TO [notion-publisher]: publish this launch audit via `/notion:publish quality-audit <repo-name>-launch-<date>`
```

## Cross-domain Blocker Patterns

Look for these classes of issue that span multiple sub-panels:

**Stack + Security: unprotected secrets**
- `web-infrastructure` flags a secret in source; security panel confirms it's reachable from a public route
- Environment variable missing from Vercel production config (stack) and not in `.env.example` (docs/security)

**Stack + GitHub: CI/CD integrity**
- `web-infrastructure` flags a CI step that's broken; `gh-actions` confirms workflow permissions are too broad
- Required status checks in branch protection (GitHub) don't match job names in CI workflows (stack infrastructure)

**Quality + Stack: untested critical paths**
- `web-qa` flags a missing E2E test for a flow; `web-application` flags the same route has no input validation
- Accessibility (`quality-accessibility`) flags a focus trap issue that `web-presentation` has no test coverage for

**Quality + GitHub: coverage not enforced**
- `web-qa` flags test coverage below threshold; `gh-actions` confirms no coverage gate exists in CI
- Playwright E2E tests exist locally but `gh-actions` confirms they're excluded from the CI workflow

**Security + GitHub: exposure vectors**
- Security panel flags a leaked API key pattern; `gh-repo` confirms secret scanning is not enabled
- Security panel flags overly permissive CORS; `gh-actions` confirms no headers check in CI

**Stack + Quality: performance regressions**
- `web-infrastructure` has no bundle size budget; `quality-performance` flags a large bundle — no enforcement path
- `web-observability` missing Core Web Vitals monitoring; `quality-performance` flags LCP above threshold

## Verdict Criteria

**SHIP** — No critical blockers across any sub-panel or cross-domain synthesis. High issues may exist but have a clear post-launch remediation path.

**NO-SHIP** — At least one critical blocker exists in any sub-panel or cross-domain finding. The fix list must be worked before launch.

Effort scale:
- **S** — Under 2 hours. Single file change or config update.
- **M** — Half-day. Touches multiple files or requires coordination between two layers.
- **L** — Multi-day. Requires design decisions, new infrastructure, or cross-team coordination.

## Panel Standards

- **Run all four sub-panels.** A partial launch sweep (e.g., skipping security) produces an unreliable verdict. If a sub-panel cannot run (e.g., no GitHub Actions workflows exist), note it explicitly — absence of evidence is not evidence of absence.
- **Cross-domain blockers require a fix with effort estimate.** A cross-domain blocker without a remediation path is not actionable.
- **The Launch Verdict is mandatory.** Every `/panel:launch` run ends with an explicit SHIP or NO-SHIP verdict and the blocker count.
- **Don't pad.** If a sub-panel is clean, the rollup row shows zeros. The verdict reflects actual findings, not a precautionary NO-SHIP.
- **Later sub-panels reference earlier findings.** The security panel may cite a `web-application` finding to confirm an injection surface. The GitHub check may cite `web-infrastructure` to confirm a CI gap. Make the chain explicit.
