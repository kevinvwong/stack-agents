---
name: panel:design
description: Run the three design discipline agents as a panel — visual-designer, interaction-designer, information-architect — against the same UI or feature, then produce a cross-discipline synthesis surfacing conflicts between visual, behavioral, and structural design decisions. Use for new UI component reviews, information architecture audits, and design system critiques.
---

# /panel:design

Convene the three design discipline agents as a panel. Each agent reviews the UI or feature from their discipline's perspective, then a synthesis pass identifies conflicts between visual, behavioral, and structural design decisions that no single discipline would catch alone.

## Usage

```
/panel:design [scope]                  # review a UI, feature, or design artifact
```

Examples:
```
/panel:design "the settings page"
/panel:design "our onboarding flow"
/panel:design "the navigation structure"
/panel:design "new dashboard component"
```

This is a **coordinated design review**, not just parallel critiques. Each agent sees the same artifact and the full output of earlier agents before responding. The synthesis section surfaces where disciplines conflict — visual hierarchy that fights the IA, interaction patterns that undercut the visual design — which is where the real design decisions live.

## Execution Order

Run agents in the following order. There is no strict dependency between disciplines, but this order builds from structure to behavior to surface — each agent sees earlier findings before responding.

```
1. [AGENT: visual-designer]          — typography, color, spacing, visual hierarchy, brand consistency
2. [AGENT: interaction-designer]     — affordances, feedback, state transitions, interaction patterns, error handling
3. [AGENT: information-architect]    — labeling, navigation, content structure, mental models, findability
```

## Output Format

```
[COMMAND: panel:design]
Scope: <the UI, feature, or design artifact being reviewed>

---

[AGENT: visual-designer] [COMMAND: audit]
Domain lens: typography, color, spacing, visual hierarchy, brand consistency, design tokens

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

[AGENT: interaction-designer] [COMMAND: audit]
Domain lens: affordances, feedback loops, state transitions, interaction patterns, error states, micro-interactions

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

[AGENT: information-architect] [COMMAND: audit]
Domain lens: labeling, navigation taxonomy, content grouping, mental models, findability, progressive disclosure

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

Findings that reveal a conflict or gap *between* disciplines. Each cites the disciplines involved. These are the findings that would be missed if disciplines worked in isolation.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Conflict: [what each discipline expects that the other undermines]
  Fix: [specific remediation that addresses both disciplines]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important design decision this UI needs to make, what each discipline's stake in it is, and whether the design is ready to ship, needs iteration, or requires a structural rethink.

---

## Rollup

| Agent | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| visual-designer | | | | |
| interaction-designer | | | | |
| information-architect | | | | |
| **cross-discipline** | | | | |
| **Total** | | | | |

Top 3 design decisions to resolve before proceeding:
1. [decision + which disciplines it unblocks]
2. [decision + which disciplines it unblocks]
3. [decision + which disciplines it unblocks]

→ HANDOFF TO [notion-publisher]: publish this design audit via `/notion:publish runbook <scope-slug>`
```

## Cross-discipline Check Patterns

Look for these classes of conflict after all agents have run:

**Visual ↔ Interaction conflict** (`visual-designer` + `interaction-designer`)
- Visual hierarchy promotes secondary actions above primary ones, causing interaction confusion about what to do first
- Color is used to communicate state changes that interaction design relies on — fails for colorblind users and in reduced-motion contexts
- Spacing and density choices make touch targets too small for the interaction patterns defined (tap vs. click)
- Hover states defined by interaction design don't have a visual design treatment — states are invisible

**Visual ↔ Information Architecture conflict** (`visual-designer` + `information-architect`)
- Visual grouping implies a content relationship that the IA doesn't support — users will expect to navigate based on what they see grouped
- Typography scale creates a hierarchy (H1 > H2 > H3) that doesn't match the IA's content depth — visual weight misleads navigation
- Labels in the visual design are truncated or abbreviated in a way that breaks the IA's taxonomy — the visible label no longer matches the mental model
- Visual design uses iconography to represent IA categories — icons are ambiguous and don't survive localization

**Interaction ↔ Information Architecture conflict** (`interaction-designer` + `information-architect`)
- Interaction pattern uses progressive disclosure to reveal content, but IA has buried critical information behind too many disclosure steps — users won't find it
- Navigation interaction (tabs, accordions, breadcrumbs) doesn't match the IA's hierarchy — users lose their place
- Search interaction assumes users know the correct label from the IA taxonomy — labels don't match how users describe things
- Error messages reference IA category names that users haven't encountered yet in the flow

**Cross-discipline coverage gaps**
- No discipline in this panel covers content strategy — flag if the copy is a first-class design concern
- No discipline covers motion design — flag if animation is load-bearing for the interaction
- No discipline covers accessibility beyond visual contrast — flag if WCAG compliance is a requirement for this component

## Panel Standards

- **Each agent speaks from their discipline.** `visual-designer` does not file navigation taxonomy bugs; `information-architect` does not file color contrast violations. Cross-discipline findings go in the synthesis section only.
- **Cross-discipline findings require a fix.** Unlike single-discipline findings (which just need a fix in their domain), cross-discipline conflicts are design decisions — they need a specific remediation that addresses both sides.
- **Later agents reference earlier findings.** `information-architect` may cite `visual-designer`'s typography hierarchy when flagging a labeling inconsistency. Make the chain explicit.
- **The Panel Verdict is mandatory.** Every `/panel:design` run ends with the one-paragraph verdict.
- **Don't manufacture findings.** If a discipline finds no issues in their domain, say so. The rollup row shows zeros. Don't pad.
