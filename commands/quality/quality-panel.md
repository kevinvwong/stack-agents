---
name: panel:quality
description: Run the three quality agents as a panel — web-qa (test pyramid), accessibility (WCAG), and performance (Core Web Vitals) — against the same feature or codebase, then produce a cross-discipline synthesis. Use for pre-launch QA gates, new component reviews, and CI pipeline audits.
---

# /panel:quality

Convene all 3 quality agents as a panel. Each reviews the target from their discipline's perspective, then a synthesis pass identifies cross-discipline gaps that no single agent would catch alone.

## Usage

```
/panel:quality                              # full quality sweep of the codebase
/panel:quality [scope]                      # focus the panel on a feature, component, or file path
```

Examples:
```
/panel:quality
/panel:quality "the checkout flow"
/panel:quality "new dashboard component"
/panel:quality "pre-launch gate"
/panel:quality "we added a modal — review it"
```

This is distinct from running each agent's `/audit` in isolation: `/panel:quality` is a **coordinated review**. Later agents see earlier findings. The synthesis section surfaces where disciplines conflict — a test gap that overlaps an accessibility blocker, or a performance fix that breaks keyboard navigation.

## Execution Order

Run agents in strict dependency order. Each agent sees the same target and the full output of earlier agents before responding.

```
1. [AGENT: web-qa]              — test pyramid, Playwright E2E, Vitest unit/integration, CI pipeline
2. [AGENT: accessibility]       — WCAG 2.1/2.2 AA/AAA, axe-core, ARIA, focus management, screen readers
3. [AGENT: quality-performance] — Core Web Vitals, Lighthouse CI, bundle size, rendering strategy, caching
```

## Output Format

```
[COMMAND: panel:quality]
Target: <feature name, component, file path, or description of what is being reviewed>

---

[AGENT: web-qa] [COMMAND: audit]
Discipline lens: test pyramid coverage, E2E flows, unit/integration tests, CI test pipeline, flake risks

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

[AGENT: accessibility] [COMMAND: audit]
Discipline lens: WCAG 2.1/2.2 AA conformance, axe-core findings, ARIA authoring, focus management, screen reader compatibility

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

[AGENT: quality-performance] [COMMAND: audit]
Discipline lens: Core Web Vitals (LCP, CLS, INP), Lighthouse CI, bundle analysis, rendering strategy, edge caching

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

## Cross-discipline Findings

Findings that reveal a conflict or gap *between* disciplines. Each cites the agents involved. These are the findings that would be missed if agents worked in isolation.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Gap: [what each discipline expects that the other doesn't deliver]
  Fix: [specific remediation that touches both disciplines]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important action this feature or codebase needs to take, and what each discipline's stake in it is. If this is a pre-launch gate, state whether the feature is ready to ship.

---

## Rollup

| Agent | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| web-qa | | | | |
| accessibility | | | | |
| quality-performance | | | | |
| **cross-discipline** | | | | |
| **Total** | | | | |

Top 3 actions to take before proceeding:
1. [action + which disciplines it unblocks]
2. [action + which disciplines it unblocks]
3. [action + which disciplines it unblocks]

→ HANDOFF TO [notion-publisher]: publish this audit via `/notion:publish quality-audit <feature-or-component>`
```

## Cross-discipline Check Patterns

Look for these classes of conflict after all agents have run:

**QA ↔ Accessibility test gap** (`web-qa` + `accessibility`)
- axe-core or jest-axe not included in the Vitest/Playwright test suite — accessibility regressions have no automated backstop
- Playwright E2E tests interact only via mouse; no keyboard-navigation test paths exist
- Focus trap present in a modal but QA test suite never asserts focus is captured or restored on close
- Missing focus trap identified by `accessibility` — `web-qa` has no test covering it, meaning the gap ships silently
- Screen-reader text (`aria-label`, `aria-describedby`) changed without any test asserting accessible name

**Accessibility ↔ Performance rendering conflict** (`accessibility` + `quality-performance`)
- Lazy-loaded images lack `alt` attributes — fixing the accessibility issue requires re-evaluating the lazy-load boundary
- `prefers-reduced-motion` not respected; animation removal required for WCAG but animation drives a CLS fix
- Font subsetting removes glyphs used by screen readers or high-contrast mode stylesheets
- Skeleton loaders improve perceived LCP but introduce layout shift that triggers a WCAG 1.4.12 reflow issue
- `aria-live` regions added for dynamic content cause forced reflows that degrade INP

**QA ↔ Performance CI gap** (`web-qa` + `quality-performance`)
- Playwright E2E tests exist but not wired into the Lighthouse CI step — performance regressions not caught per PR
- Bundle size budget check absent from CI; `quality-performance` flags a large bundle but there is no automated gate
- Test fixtures use large uncompressed assets that inflate CI run time without mirroring production bundle size
- No test covers the critical rendering path — a performance regression in LCP is indistinguishable from a test environment anomaly

**QA ↔ Accessibility coverage overlap** (`web-qa` + `accessibility`)
- `accessibility` flags missing visible focus indicators; `web-qa` has focus-related assertions that pass because the test runner doesn't apply the default browser stylesheet
- ARIA role mismatch flagged by `accessibility` — the component is rendered differently in test vs. production DOM

**Accessibility ↔ Performance asset chain** (`accessibility` + `quality-performance`)
- SVG icons inlined for performance don't carry `role="img"` or `aria-label` — both agents need to agree on the inline vs. `<img>` boundary
- High-contrast mode CSS doubles asset weight; performance budget set without accounting for it

## Panel Standards

- **Each agent speaks from their discipline.** `web-qa` does not file WCAG violations; `accessibility` does not file bundle size findings. Cross-discipline findings go in the synthesis section only.
- **Cross-discipline findings require a fix.** Unlike single-discipline findings, these are coordination decisions — they need a specific remediation that addresses both sides.
- **Later agents reference earlier findings.** `quality-performance` may cite `accessibility`'s missing `alt` finding when recommending lazy-load boundaries. Make the chain explicit.
- **The Panel Verdict is mandatory.** Every `/panel:quality` run ends with the one-paragraph verdict.
- **Don't manufacture findings.** If a discipline is clean, say so. The rollup row shows zeros. Don't pad.
