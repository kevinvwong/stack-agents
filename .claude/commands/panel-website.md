---
name: panel:website
description: Run a full website audit panel — website-audit-redesign-planner (structural UX + conversion), gtli-student-lens-audit (persona-specific enrollment funnel), and visual-designer (aesthetic/trust layer) — against a target URL, then synthesize into a prioritized redesign roadmap. Use for pre-launch website reviews, conversion optimization, and brand trust audits.
---

# /panel:website

Convene all 3 website audit agents as a panel. Each agent reviews the same target URL from their domain's perspective, then a synthesis pass produces a unified, phased redesign roadmap. The roadmap is the canonical deliverable — not three separate audit reports.

## Usage

```
/panel:website TARGET_SITE: <url>                            # full website audit
/panel:website TARGET_SITE: <url> [focus]                   # audit with a specific lens
```

Examples:
```
/panel:website TARGET_SITE: https://example.com
/panel:website TARGET_SITE: https://example.com "focus on trial signup conversion"
/panel:website TARGET_SITE: https://gtli.edu "non-native English speaker perspective"
/panel:website TARGET_SITE: https://example.com "pre-launch review — is this ready?"
/panel:website TARGET_SITE: https://example.com "our bounce rate is high — diagnose the homepage"
```

`TARGET_SITE:` is required. The panel cannot run without a URL to review.

Note on `gtli-student-lens-audit`: this agent is GTLI-specific. When the target site is not a GTLI property, the agent runs a **generic student/prospect persona audit** instead — reviewing the site through the eyes of a first-visit prospective user evaluating whether to sign up or engage. The findings format is identical; only the persona assumptions change.

This is distinct from running each agent's audit in isolation: `/panel:website` is a **coordinated redesign exercise**. Later agents see earlier findings. The synthesis produces a phased roadmap with explicit ordering rationale — not just a list of issues.

## Execution Order

Run agents in strict dependency order. Each agent reviews the same URL and the full output of earlier agents before responding.

```
1. [AGENT: website-audit-redesign-planner]  — information architecture, conversion flow, structural UX, CTAs, navigation
2. [AGENT: gtli-student-lens-audit]         — prospect/student persona journey, enrollment funnel, messaging clarity, trust signals
3. [AGENT: visual-designer]                 — aesthetic cohesion, typography, color, whitespace, brand trust, visual hierarchy
```

All three agents live in the marketplace (`~/.claude/agents/`), not in the local `agents/` directory.

## Output Format

```
[COMMAND: panel:website]
Target: <url>
Focus: <focus area or "full review">

---

[AGENT: website-audit-redesign-planner] [COMMAND: audit]
Domain lens: information architecture, conversion funnel, CTA placement, navigation clarity, structural UX, page hierarchy

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

[AGENT: gtli-student-lens-audit] [COMMAND: audit]
Domain lens: [GTLI: prospective student enrollment journey | Non-GTLI: generic prospect/first-visit persona journey]
Persona assumption: [describe the persona used]

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

[AGENT: visual-designer] [COMMAND: audit]
Domain lens: aesthetic cohesion, typography legibility, color contrast + brand, whitespace rhythm, visual hierarchy, trust signal design

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

## Cross-domain Findings

Findings that reveal a conflict or gap *between* domains. Each cites the agents involved. These are the findings that would be missed if agents worked in isolation.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Gap: [what each domain expects that the other doesn't deliver]
  Fix: [specific remediation that touches both domains]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Unified Redesign Roadmap

Three-phase roadmap synthesizing all agent findings. Phase ordering is by impact-to-effort ratio: remove conversion blockers first, build trust second, polish last.

### Phase 1 — Critical Conversion Blockers
Changes that prevent users from completing the primary action (sign up, trial, purchase, enroll). Ship these before anything else.

| # | Change | Domain | Effort | Impact |
|---|--------|--------|--------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### Phase 2 — Trust + Credibility
Changes that increase confidence and reduce hesitation. These multiply the impact of Phase 1 changes.

| # | Change | Domain | Effort | Impact |
|---|--------|--------|--------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### Phase 3 — Polish + Brand Cohesion
Refinements that elevate perceived quality and brand trust. Ship after Phases 1–2 are stable.

| # | Change | Domain | Effort | Impact |
|---|--------|--------|--------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Panel Verdict

One-paragraph summary: the site's current conversion readiness, the most critical structural problem, and the estimated impact of Phase 1 changes if shipped.

**Conversion readiness:** [Blocked / At Risk / Acceptable / Strong]

- **Blocked** — critical structural or trust issue prevents primary action completion.
- **At Risk** — no blockers, but significant friction likely suppressing conversion.
- **Acceptable** — site converts; incremental improvements available.
- **Strong** — site is well-optimized; only polish remains.

---

## Rollup

| Agent | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| website-audit-redesign-planner | | | | |
| gtli-student-lens-audit | | | | |
| visual-designer | | | | |
| **cross-domain** | | | | |
| **Total** | | | | |

→ HANDOFF TO [notion-publisher]: publish this audit via `/notion:publish github-audit <site-url>` (or a dedicated website-audit page if your Notion workspace has one)
→ HANDOFF TO [presentation]: implement Phase 1 changes as a focused UI sprint
```

## Cross-domain Check Patterns

Look for these classes of conflict after all agents have run:

**Structure ↔ Persona mismatch** (`website-audit-redesign-planner` + `gtli-student-lens-audit`)
- The primary CTA is structurally well-placed but uses language the prospect persona doesn't recognize as relevant to their goal
- Navigation architecture is logical from an information design perspective but the persona's top question is not answerable in under 2 clicks
- Conversion funnel is short but the persona needs social proof at a step where none exists

**Structure ↔ Visual gap** (`website-audit-redesign-planner` + `visual-designer`)
- The structural hierarchy (H1 → H2 → CTA) is correct but visual weight does not match — the most important CTA is visually subordinate to decorative elements
- Information architecture groups content logically but visual design uses color and contrast to imply a different grouping, creating confusion
- Page sections are ordered correctly for conversion but section breaks have no visual separation — the page reads as a wall of content

**Persona ↔ Visual mismatch** (`gtli-student-lens-audit` + `visual-designer`)
- The persona values credibility and professionalism but the visual design uses informal illustration or playful typography that signals the opposite
- Trust signals (testimonials, logos, certifications) are present in the copy but not visually differentiated — the persona skims past them
- The persona's primary concern (e.g., "will this help me get a job?") is addressed in body copy but is not visible without scrolling — visual hierarchy buries the answer

**All domains: above-the-fold failure**
- The structural audit finds no CTA above the fold, the persona audit finds the value proposition is unclear at first glance, and the visual audit finds the hero section is aesthetically strong but content-light — all three problems compound into a high-bounce homepage

## Panel Standards

- **Each agent speaks from their domain.** `visual-designer` does not file navigation architecture bugs; `website-audit-redesign-planner` does not file typography issues. Cross-domain findings go in the synthesis section only.
- **The Unified Redesign Roadmap is mandatory.** Every `/panel:website` run ends with a three-phase roadmap. Do not produce only findings without a roadmap.
- **The Conversion Readiness verdict is mandatory.** State it explicitly with one of the four labels.
- **Persona transparency.** `gtli-student-lens-audit` must state its persona assumption explicitly at the top of its findings. For non-GTLI sites, the persona used must be described (e.g., "first-visit prospective user, 28–40, researching SaaS tools for their team").
- **Later agents reference earlier findings.** `visual-designer` may cite a structural finding when explaining why a visual fix alone won't resolve a conversion problem. Make the chain explicit.
- **Don't manufacture findings.** If a domain finds the site well-executed, say so. The rollup row shows zeros. Don't pad.
