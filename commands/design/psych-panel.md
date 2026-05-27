---
name: panel:psych
description: Run the two psychology agents as a panel — cognitive-psychologist (working memory, attention, mental models) and behavioral-psychologist (motivation, habit formation, persuasion, dark patterns) — against the same feature or product experience, then produce a synthesis. Use when a feature "feels off," for engagement system reviews, onboarding critiques, and learning product design.
---

# /panel:psych

Convene the cognitive-psychologist and behavioral-psychologist as a panel. Each agent reviews the same feature or product experience from their discipline's lens, then a synthesis pass surfaces where the two disciplines conflict — which is where the most consequential design decisions live.

## Usage

```
/panel:psych [scope]                # review a feature, flow, or product area
```

Examples:
```
/panel:psych "our streak/badge system"
/panel:psych "the onboarding flow"
/panel:psych "does our reward design feel manipulative"
/panel:psych "the dashboard is overwhelming — diagnose"
/panel:psych "is our gamification helping learning or hurting it"
```

This is distinct from running each agent separately: `/panel:psych` is a **coordinated critique**. The behavioral-psychologist sees the cognitive findings before responding. The synthesis section surfaces where cognitive load and motivational design pull in opposite directions — the class of conflict most likely to cause a feature to "feel off" without an obvious root cause.

## Execution Order

Run agents in strict dependency order. Each agent sees the same artifact and the full output of earlier agents before responding.

```
1. [AGENT: cognitive-psychologist]   — working memory, attention, mental models, cognitive load, schema formation
2. [AGENT: behavioral-psychologist]  — motivation, habit formation, variable rewards, persuasion, dark pattern risk
```

Note: Both agents live in the marketplace (`~/.claude/agents/`), not in the local `agents/` directory. They activate via standard agent routing.

## Output Format

```
[COMMAND: panel:psych]
Scope: <feature, flow, or product area being reviewed>

---

[AGENT: cognitive-psychologist] [COMMAND: review]
Domain lens: working memory load, attention management, mental model alignment, information architecture, cognitive schema formation

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

[AGENT: behavioral-psychologist] [COMMAND: review]
Domain lens: intrinsic vs. extrinsic motivation, habit loop design, variable reward schedules, persuasion patterns, dark pattern risk, autonomy/competence/relatedness (SDT)

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

Findings that reveal a conflict or gap *between* cognitive and behavioral psychology. These are the tensions no single discipline would surface alone — where fixing one dimension creates a problem in the other.

### Critical
- [ ] **[Finding title]** — [disciplines: cognitive + behavioral]
  Tension: [what each discipline demands that conflicts with the other]
  Resolution: [design approach that satisfies or consciously trades off both]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Synthesis

One-paragraph summary of the dominant psychological dynamic at play: is the product working with or against how the user's mind works? Identify the single highest-leverage change.

**Dominant pattern:** [e.g., "Extrinsic reward schedule is undermining intrinsic motivation while simultaneously increasing cognitive load at the exact moment users need to form durable habits."]

**Highest-leverage change:** [specific, actionable]

**Dark pattern risk:** [None / Low / Medium / High — with rationale]

---

## Rollup

| Discipline | Critical | High | Medium | Low |
|-----------|----------|------|--------|-----|
| cognitive-psychologist | | | | |
| behavioral-psychologist | | | | |
| **cross-discipline** | | | | |
| **Total** | | | | |

Top 3 changes to consider:
1. [change + which discipline tension it resolves]
2. [change + which discipline tension it resolves]
3. [change + which discipline tension it resolves]

→ HANDOFF TO [presentation]: implement the highest-leverage cognitive/behavioral recommendation as a UI change
→ HANDOFF TO [product-product]: surface dark-pattern risk findings in the PRD risk section
```

## Cross-discipline Tension Patterns

Look for these classes of conflict after both agents have run:

**Friction asymmetry**
- Behavioral design uses high-friction commitment devices (e.g., goal-setting) to increase motivation
- Cognitive design finds that the same friction occurs at peak working-memory load, causing abandonment
- Resolution: decouple the commitment moment from the task execution moment

**Variable reward + cognitive load collision**
- Behavioral: variable reward schedule (streaks, loot boxes) drives engagement
- Cognitive: uncertainty about reward outcome consumes working memory that should be on the primary task (learning, completing, deciding)
- Resolution: make the reward state predictable during the task; vary it at task completion only

**Gamification parasitism on intrinsic motivation**
- Behavioral: badges and points increase early engagement metrics
- Cognitive: extrinsic reward frames shift the user's mental model from "I am learning" to "I am earning points," reducing depth of processing
- This is the classic overjustification effect — flag it if the product's core value depends on intrinsic motivation (education, creativity, health)

**Onboarding overload**
- Behavioral: front-load feature discovery to create habit anchors
- Cognitive: first-session information density exceeds working memory capacity (Miller's Law: 7±2 chunks); users can't form mental models of what they just saw
- Resolution: progressive disclosure — introduce features at the moment of need, not on first launch

**Feedback loop timing**
- Behavioral: delayed gratification (weekly progress reports) can sustain long-term motivation for some users
- Cognitive: feedback loops that are too long prevent error-correction and schema formation
- Resolution: provide immediate micro-feedback (cognitive) while preserving a slower reward arc (behavioral)

**Dark pattern proximity**
- A design that is behaviorally effective (high conversion, high engagement) may exploit cognitive biases (anchoring, scarcity framing, loss aversion) in ways that undermine user autonomy
- Flag any feature where the behavioral optimization depends on a cognitive bias the user would object to if made explicit

## Panel Standards

- **Each agent speaks from their discipline.** `cognitive-psychologist` does not assess whether rewards are manipulative; `behavioral-psychologist` does not assess working memory capacity. Cross-discipline findings go in the synthesis section only.
- **The Synthesis is mandatory.** Every `/panel:psych` run ends with the dominant-pattern statement, highest-leverage change, and dark-pattern risk rating.
- **The dark-pattern risk rating is non-negotiable.** Even if both agents find no issues, the risk rating must be stated explicitly (None).
- **Later agents reference earlier findings.** `behavioral-psychologist` may cite a cognitive load finding when assessing whether a persuasion pattern is likely to work. Make the chain explicit.
- **Don't manufacture findings.** If a discipline finds the design sound, say so. The rollup row shows zeros. Don't pad.
