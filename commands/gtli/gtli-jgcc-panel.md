---
name: panel:gtli-jgcc
description: Run all 11 JGCC (Joan Ganz Cooney Center) learning quality agents as a panel against a GTLI educational product, module, or feature. Covers active learning, engagement, meaningfulness, equity/access, privacy, social/JME, developmental appropriateness, diversity, family/stakeholder, student usability, and RITEC well-being. Any zero on Safety or DEI is a hard fail.
---

# /panel:gtli-jgcc

Convene all 11 JGCC (Joan Ganz Cooney Center) learning quality agents as a panel. Each agent reviews the same GTLI educational artifact — module, feature, or product — from their quality dimension. A synthesis pass scores the artifact against the RITEC-8 well-being principles and delivers a panel verdict.

These agents exist in `~/.claude/agents/` (kwong-agents plugin). They are mandatory reviewers for all GTLI educational products.

**Hard-fail rule:** Any score of zero (0) on RITEC Principle 1 (Safety & Security) or RITEC Principle 2 (Healthy Bodies, Healthy Minds) triggers an automatic panel verdict of **FAIL**, regardless of scores on all other dimensions.

## Usage

```
/panel:gtli-jgcc                             # review the full product or current context
/panel:gtli-jgcc [module or feature]         # focus all 11 agents on a specific artifact
```

Examples:
```
/panel:gtli-jgcc
/panel:gtli-jgcc "Module 3: Business Writing"
/panel:gtli-jgcc "the streak/badge system"
/panel:gtli-jgcc "onboarding flow"
/panel:gtli-jgcc "the cohort leaderboard feature"
/panel:gtli-jgcc "assessment and grading system"
/panel:gtli-jgcc "the AI tutor conversation interface"
```

## Execution Order

Run agents in strict dependency order. Each agent sees the same artifact and the full output of earlier agents before responding. `jgcc-wellbeing-ritec8` runs last and produces the RITEC-8 score table and panel verdict.

```
 1. [AGENT: jgcc-learning-scientist]          — active learning principles, pedagogy, knowledge transfer
 2. [AGENT: jgcc-engagement-auditor]          — motivation, engagement design, feedback loops
 3. [AGENT: jgcc-meaningfulness-transfer]     — real-world relevance, transfer, authentic contexts
 4. [AGENT: jgcc-equity-access]               — access equity, language, disability, socioeconomic access
 5. [AGENT: jgcc-privacy-commercialism]       — data privacy, commercialism, advertising appropriateness
 6. [AGENT: jgcc-social-jme-reviewer]         — social/emotional learning, joint media engagement
 7. [AGENT: jgcc-developmental-appropriateness] — age/level appropriateness, scaffolding, challenge calibration
 8. [AGENT: jgcc-diversity-representation]    — diverse representation, bias, stereotype avoidance
 9. [AGENT: jgcc-family-stakeholder]          — family engagement, stakeholder transparency, reporting
10. [AGENT: jgcc-student-usability]           — student-facing usability, navigation, cognitive load
11. [AGENT: jgcc-wellbeing-ritec8]            — RITEC-8 scoring, synthesis, panel verdict
```

## Output Format

```
[COMMAND: panel:gtli-jgcc]
Artifact: <what is being reviewed>

---

[AGENT: jgcc-learning-scientist] [COMMAND: audit]
Dimension: Active learning, pedagogy, knowledge transfer

### Critical
- [ ] **[Finding title]**
  Learning impact: [consequence for learner outcomes]
  Fix: [specific, actionable recommendation]

### High / Medium / Low
- [ ] ...

Score: <0–3> — <rationale in one sentence>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-engagement-auditor] [COMMAND: audit]
Dimension: Motivation, engagement loops, feedback design

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-meaningfulness-transfer] [COMMAND: audit]
Dimension: Real-world relevance, transfer, authentic task design

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-equity-access] [COMMAND: audit]
Dimension: Access equity, language accommodation, disability access, socioeconomic barriers

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-privacy-commercialism] [COMMAND: audit]
Dimension: Data privacy, data collection transparency, commercialism and advertising

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-social-jme-reviewer] [COMMAND: audit]
Dimension: Social/emotional learning, joint media engagement, community design

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-developmental-appropriateness] [COMMAND: audit]
Dimension: Level appropriateness, scaffolding, challenge calibration

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-diversity-representation] [COMMAND: audit]
Dimension: Representation, bias, stereotype avoidance, cultural responsiveness

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-family-stakeholder] [COMMAND: audit]
Dimension: Family engagement, stakeholder transparency, progress reporting

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-student-usability] [COMMAND: audit]
Dimension: Student-facing usability, navigation clarity, cognitive load

### Critical
...
Score: <0–3>
Summary: X critical, Y high, Z medium, W low

---

[AGENT: jgcc-wellbeing-ritec8] [COMMAND: synthesis]

## RITEC-8 Score Table

Scores 0–3 per principle. A score of 0 on Principle 1 or Principle 2 triggers an automatic FAIL.

| # | RITEC Principle | Score (0–3) | Rationale |
|---|----------------|-------------|-----------|
| 1 | Safety & Security | | |
| 2 | Healthy Bodies, Healthy Minds | | |
| 3 | Privacy & Data | | |
| 4 | Equity & Inclusion | | |
| 5 | Transparency | | |
| 6 | Engagement & Learning | | |
| 7 | Social Connection | | |
| 8 | Empowerment & Agency | | |
| — | **Total** | **/24** | |

## Panel Verdict

**PASS** / **FLAG** / **FAIL**

Verdict criteria:
- **FAIL** — any zero on Principle 1 (Safety) or Principle 2 (Healthy Bodies/Minds), OR total score < 12
- **FLAG** — total score 12–16 with at least one Critical finding from any agent
- **PASS** — total score 17+ with no Critical findings

[One paragraph: the most significant quality gap found, which principles it touches, and the single highest-leverage improvement.]

## Priority Fix List

Issues to resolve before the artifact is approved for learners. Ordered by RITEC principle impact, with hard-fail items listed first.

| Priority | Finding | Agent | RITEC Principle | Severity |
|----------|---------|-------|-----------------|----------|
| P0 (hard-fail) | [finding] | [agent] | Principle 1 or 2 | Critical |
| P1 | [finding] | [agent] | [principle] | Critical |
| P2 | [finding] | [agent] | [principle] | High |
| ... | | | | |

## Rollup

| Agent | Critical | High | Medium | Low | Score |
|-------|----------|------|--------|-----|-------|
| jgcc-learning-scientist | | | | | /3 |
| jgcc-engagement-auditor | | | | | /3 |
| jgcc-meaningfulness-transfer | | | | | /3 |
| jgcc-equity-access | | | | | /3 |
| jgcc-privacy-commercialism | | | | | /3 |
| jgcc-social-jme-reviewer | | | | | /3 |
| jgcc-developmental-appropriateness | | | | | /3 |
| jgcc-diversity-representation | | | | | /3 |
| jgcc-family-stakeholder | | | | | /3 |
| jgcc-student-usability | | | | | /3 |
| **RITEC-8 Total** | | | | | **/24** |
```

## Scoring Guide

Each agent scores their dimension on a 0–3 scale:

| Score | Meaning |
|-------|---------|
| **3** | Exemplary — exceeds standard; could be cited as a model |
| **2** | Meets standard — no significant gaps, minor improvements possible |
| **1** | Partially meets — notable gaps that should be addressed before wide deployment |
| **0** | Does not meet — serious deficiency that must be remediated before any learner use |

## Panel Standards

- **Each agent speaks from their quality dimension only.** `jgcc-equity-access` does not file engagement bugs; `jgcc-engagement-auditor` does not file privacy findings. Cross-dimension issues that can't be filed by a single agent go in the RITEC-8 synthesis.
- **Hard-fail is unconditional.** A zero on Principle 1 or Principle 2 is a FAIL regardless of how high other scores are. `jgcc-wellbeing-ritec8` does not have discretion to override this.
- **Later agents reference earlier findings.** `jgcc-wellbeing-ritec8` must cite specific findings from prior agents when assigning RITEC scores. A RITEC score that doesn't reference any agent finding is not supported.
- **Scores are for the artifact, not the organization.** A single module can score 3 on meaningfulness and 0 on safety simultaneously. Score what is in front of you.
- **Don't manufacture findings.** If a dimension is clean, say so. Zeros in the finding columns are fine. Padding with Low findings to appear thorough is explicitly discouraged.
- **The Panel Verdict is mandatory.** Every `/panel:gtli-jgcc` run ends with the explicit PASS / FLAG / FAIL verdict and the one-paragraph rationale.
