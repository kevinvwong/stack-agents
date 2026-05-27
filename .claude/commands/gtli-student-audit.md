---
name: gtli:student-audit
description: Audits a website from the perspective of a prospective GTLI student — specifically a non-native English speaker who is uncertain about program fit, cost, and trustworthiness, and is not yet ready to apply. Diagnoses enrollment funnel failures, trust signal gaps, and multilingual usability issues that generic UX audits miss.
---

# /gtli:student-audit

Convene the `gtli-student-lens-audit` agent to audit a website through the eyes of a prospective GTLI student. This persona is distinct from a general UX audit target: they are a non-native English speaker who is uncertain about program fit, skeptical of cost, and evaluating trustworthiness long before they are ready to apply.

## Usage

```
/gtli:student-audit TARGET_SITE: <url>
/gtli:student-audit TARGET_SITE: <url> "<focus>"
```

**Required:**

| Argument | Description |
|----------|-------------|
| `TARGET_SITE: <url>` | The website to audit. Must be a full URL. |

**Optional:**

| Argument | Description |
|----------|-------------|
| `"<focus>"` | Narrow the audit to a specific page, section, or concern. |

Examples:
```
/gtli:student-audit TARGET_SITE: https://example.edu
/gtli:student-audit TARGET_SITE: https://gtli-example.edu "focus on pricing page"
/gtli:student-audit TARGET_SITE: https://gtli-example.edu "application requirements section"
/gtli:student-audit TARGET_SITE: https://gtli-example.edu "homepage trust signals"
```

## The Persona

The audit is conducted from the perspective of a **prospective student at the consideration stage**:

- Non-native English speaker (B1–B2 proficiency), likely from Brazil, Mexico, Colombia, or a similar GTLI target market
- Working professional (nurse, teacher, coordinator) evaluating whether this program fits their career goals
- Not yet ready to apply — actively looking for reasons to trust or distrust the program
- Has seen other English programs online; is comparing GTLI against general alternatives
- Price-sensitive; does not understand US higher education pricing norms
- Skeptical of marketing language; looks for concrete evidence of outcomes

**What this persona cannot do that a generic UX tester can:**
- Skim confidently through ambiguous English academic prose
- Infer cost from institutional pricing pages designed for US audiences
- Recognize accreditation markers as meaningful trust signals without explanation
- Tolerate a 3-click enrollment process that assumes program familiarity

## Enrollment Stages

The audit organizes findings by stage in the enrollment funnel:

| Stage | What the student needs at this stage |
|-------|--------------------------------------|
| **Awareness** | Understand what the program is and whether it's for someone like them |
| **Consideration** | Evaluate program fit, credibility, cost, and outcomes — without committing |
| **Intent** | Find a clear, low-friction path to learn more or start an application |
| **Application** | Complete the application without confusion, anxiety, or needing to call for help |

## Output Format

```
[AGENT: gtli-student-lens-audit] [COMMAND: audit]
Target site: <url>
Focus: <specific focus or "full enrollment funnel">
Persona: Non-native English speaker, B1–B2, consideration stage, price-sensitive

---

## Enrollment Stage Findings

### Stage 1 — Awareness

**Critical**
- [ ] **[Finding title]** — [page or section]
  Persona impact: [how this blocks or confuses this specific persona]
  Fix: [specific, actionable copy/UX recommendation]

**High**
- [ ] ...

**Medium / Low**
- [ ] ...

Summary: X critical, Y high, Z medium, W low

---

### Stage 2 — Consideration

**Critical**
- [ ] ...

---

### Stage 3 — Intent

**Critical**
- [ ] ...

---

### Stage 4 — Application

**Critical**
- [ ] ...

---

## Trust Signal Gaps

Items a skeptical non-native English speaker would look for that are absent, ambiguous, or mistranslated.

| Trust signal | Status | Impact | Recommendation |
|-------------|--------|--------|----------------|
| Graduate outcome data | Missing | High — "what did past students get?" is a top-3 consideration question | Add a graduates section with job titles + countries |
| Accreditation explanation | Present but jargon-heavy | Medium — "ACCET-accredited" means nothing to a Brazilian RN | Add one plain-language sentence: what accreditation means for them |
| Payment plan options | Buried in FAQ | High — price is a primary objection for this persona | Surface payment options on the program page, not just checkout |
| ... | | | |

---

## Multilingual / Language-level Issues

Copy, UI, or flows that fail for B1–B2 English proficiency or for non-US-English readers.

| Page / element | Issue | Severity | Fix |
|----------------|-------|----------|-----|
| Hero headline | Uses idiom ("take the leap") that doesn't translate | Medium | Replace with direct value statement |
| Application instructions | B2+ reading level throughout | High | Rewrite to B1 level (Flesch-Kincaid 60+) |
| ... | | | |

---

## Rollup

| Stage | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| Awareness | | | | |
| Consideration | | | | |
| Intent | | | | |
| Application | | | | |
| Trust signals | | | | |
| Language/multilingual | | | | |
| **Total** | | | | |

Top 3 fixes to unblock the enrollment funnel:
1. [fix + which stage it unblocks]
2. [fix + which stage it unblocks]
3. [fix + which stage it unblocks]
```

## Audit Standards

- **All findings are from the persona's perspective.** A finding is only filed if it would materially affect a non-native English speaker at the consideration stage. Generic UX issues that affect all users equally are noted but not the focus.
- **Copy recommendations are concrete.** "Improve the CTA" is not a recommendation. "Change 'Enroll Now' to 'See Program Details' — this persona is not ready to enroll and a premature CTA creates distrust" is.
- **Trust signal gaps are first-class findings.** Missing outcome data, unexplained accreditation, and hidden pricing are as serious as broken UI flows.
- **Don't audit what you can't see.** If a page requires login or is behind a form wall, note it as an access blocker — don't speculate about content behind it.
