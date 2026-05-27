---
name: panel:research
description: Run all 4 research agents as a panel — user-research, usability-testing, focus-group, expert-review — against the same product question or feature, then produce a cross-discipline synthesis that maps method gaps and conflicting findings. Use for new feature validation, launch readiness research plans, and when any single research method would leave blind spots.
---

# /panel:research

Convene all 4 research agents as a panel. Each agent designs a research plan or synthesizes findings from their method's perspective, then a synthesis pass identifies cross-method gaps, conflicting signals, and the recommended next steps ranked by confidence needed vs. cost.

## Usage

```
/panel:research [question]             # validate a feature, flow, or product question
```

Examples:
```
/panel:research "is the onboarding flow clear to non-technical users"
/panel:research "validate our pricing page redesign"
/panel:research "we're getting low trial conversion — diagnose"
/panel:research "pre-launch validation for the cohort dashboard"
```

This is a **planning and advisory panel** — agents design research plans and synthesize findings; they do not conduct actual research in the session. Later agents see earlier findings. The synthesis section surfaces where methods conflict or leave gaps — which is where the real research investment decisions live.

## Execution Order

Run agents in dependency order. Each agent sees the same product question and the full output of earlier agents before responding.

```
1. [AGENT: research-user-research]       — interviews, surveys, personas, JTBD, affinity mapping
2. [AGENT: research-usability-testing]   — think-aloud, task analysis, moderated/unmoderated sessions
3. [AGENT: research-focus-group]         — concept testing, group facilitation, synthesis, insight reporting
4. [AGENT: research-expert-review]       — heuristic evaluation, design critique, structured walkthroughs
```

## Output Format

```
[COMMAND: panel:research]
Question: <the product question or feature being researched>

---

[AGENT: research-user-research] [COMMAND: plan]
Domain lens: interviews, surveys, personas, JTBD, affinity mapping, research planning

### Critical Gaps
...
### Recommended Methods
...
### Risks if Skipped
...
Summary: X critical gaps, Y recommended methods

---

[AGENT: research-usability-testing] [COMMAND: plan]
Domain lens: think-aloud protocols, task analysis, moderated/unmoderated studies, session recording

### Critical Gaps
...
### Recommended Methods
...
### Risks if Skipped
...
Summary: X critical gaps, Y recommended methods

---

[AGENT: research-focus-group] [COMMAND: plan]
Domain lens: concept testing, group facilitation, synthesis, insight reporting

### Critical Gaps
...
### Recommended Methods
...
### Risks if Skipped
...
Summary: X critical gaps, Y recommended methods

---

[AGENT: research-expert-review] [COMMAND: plan]
Domain lens: heuristic evaluation (Nielsen, Mayer, PLAY), design critique, structured walkthroughs

### Critical Gaps
...
### Recommended Methods
...
### Risks if Skipped
...
Summary: X critical gaps, Y recommended methods

---

## Cross-method Findings

Findings that reveal a conflict or gap *between* research methods. Each cites the agents involved. These are the findings that would be missed if methods were run in isolation or sequentially without coordination.

### Method Gaps
- [ ] **[Finding title]** — [agents: X + Y]
  Gap: [what this method would catch that the other misses]
  Recommendation: [which method to prioritize or how to combine them]

### Conflicting Signals
- [ ] **[Finding title]** — [agents: X + Y]
  Conflict: [what each method's findings say that contradicts the other]
  Resolution: [how to reconcile or which signal to trust and why]

### Coverage Blind Spots
- [ ] **[Finding title]** — [agent: X]
  Blind spot: [what no method in this panel covers]
  Recommendation: [additional method or proxy signal to address it]

---

## Panel Verdict

One-paragraph summary: the most important research question this product needs answered, what combination of methods gives the highest confidence at lowest cost, and whether the current feature/flow is ready for launch or needs more validation first.

---

## Rollup

| Agent | Critical Gaps | Recommended Methods | Risks if Skipped |
|-------|---------------|---------------------|-----------------|
| research-user-research | | | |
| research-usability-testing | | | |
| research-focus-group | | | |
| research-expert-review | | | |
| **cross-method** | | | |

Top 3 research investments to make before proceeding:
1. [method + what confidence it unlocks]
2. [method + what confidence it unlocks]
3. [method + what confidence it unlocks]

→ HANDOFF TO [notion-publisher]: publish this research plan to the research database via `/notion:publish research <question-slug>`
```

## Cross-method Check Patterns

Look for these classes of conflict or gap after all agents have run:

**User Research ↔ Usability Testing gap** (`research-user-research` + `research-usability-testing`)
- Interviews surface stated preferences that observed task performance contradicts
- Survey data suggests feature is understood, but think-aloud reveals users can't complete the task
- JTBD framing from interviews doesn't align with the tasks defined for usability sessions

**Usability Testing ↔ Focus Group conflict** (`research-usability-testing` + `research-focus-group`)
- Individual task performance is strong, but group concept testing surfaces social desirability bias (participants claim to like it more in a group than they perform in solo tasks)
- Usability session reveals a specific interaction failure; focus group frames it as a conceptual misunderstanding — different fix required
- Task success rate is high but focus group consensus flags the language as off-brand or confusing

**Focus Group ↔ Expert Review divergence** (`research-focus-group` + `research-expert-review`)
- Focus group participants express preference for an interaction pattern that violates a heuristic flagged by the expert review
- Expert review flags a critical accessibility issue that focus group facilitators didn't probe
- Group synthesis found a mental model mismatch; expert review confirms it maps to a recognized IA anti-pattern

**User Research ↔ Expert Review misalignment** (`research-user-research` + `research-expert-review`)
- Expert review flags violations that users in interviews never mentioned — either the heuristic doesn't apply to this audience or users have adapted around the problem
- User research found a JTBD that the current design doesn't address; expert review scores the existing design highly — the mismatch is about scope, not quality
- Personas built from interviews describe a non-technical user; expert review was conducted assuming a technical baseline

**Coverage blind spots**
- No method in this panel covers longitudinal use (all are point-in-time) — flag if retention is the question
- No method covers accessibility for assistive technology users — flag if WCAG compliance is at stake
- Quantitative signal (analytics, A/B results) is absent — flag if the question requires statistical significance

## Panel Standards

- **Each agent speaks from their method.** `research-expert-review` does not file interview recruitment plans; `research-user-research` does not file heuristic scores. Cross-method findings go in the synthesis section only.
- **Cross-method findings require a resolution.** Unlike single-method findings (which just need execution), cross-method conflicts are prioritization decisions — they need a specific recommendation that addresses both signals.
- **Later agents reference earlier findings.** `research-expert-review` may cite `research-usability-testing`'s task failure when framing its heuristic violation. Make the chain explicit.
- **The Panel Verdict is mandatory.** Every `/panel:research` run ends with the one-paragraph verdict.
- **Don't manufacture findings.** If a method has no gaps to flag for the given question, say so. The rollup row shows zeros. Don't pad.
- **This is a planning panel.** Agents design research plans and synthesize findings; they do not conduct interviews, facilitate sessions, or run evaluations in the session itself.
