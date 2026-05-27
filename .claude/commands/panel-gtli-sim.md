---
name: panel:gtli-sim
description: Run a simulated user panel across GTLI archetypes — the non-native English learner, the cohort director, the studio coordinator, the administrator, and the prospective student — against a GTLI platform feature. Each archetype reacts to the feature from their lived context; a synthesis identifies moments where the feature serves one persona at the expense of another.
---

# /panel:gtli-sim

Convene the `simulated-user-panel` agent with GTLI persona context. Five archetypes — each grounded in a specific professional context, English proficiency level, and relationship to the GTLI platform — encounter the same feature and react from their lived reality. A synthesis pass then identifies where the feature's design implicitly favors one archetype over another.

Unlike the `/panel:gtli-ux` expert audit, this is a simulated user panel: each archetype is reacting as a real person would, not as a UX professional would. The findings surface friction that is felt but not named.

## Usage

```
/panel:gtli-sim [feature]                    # simulate reactions to a specific feature
```

Examples:
```
/panel:gtli-sim "the new onboarding flow"
/panel:gtli-sim "pricing page redesign"
/panel:gtli-sim "module completion certificate"
/panel:gtli-sim "the AI tutor introduction"
/panel:gtli-sim "cohort progress dashboard"
/panel:gtli-sim "assignment submission and feedback"
/panel:gtli-sim "the streak and badge system"
```

## The Archetypes

Each archetype is a fixed persona with a specific context. They do not change between runs.

| # | Archetype | Profile |
|---|-----------|---------|
| 1 | **B1 Learner** | Fernanda, 28, nurse from São Paulo, Brazil. B1 English. Enrolled in a GTLI cohort for professional advancement. Uses the platform on her phone during commute and breaks. Motivated but anxious about keeping up with cohort pace. |
| 2 | **Cohort Director** | Marcus, 44, L&D manager at a mid-size hospital network in Chicago. Managing a cohort of 40 nurses enrolled in the same program as Fernanda. Checks the platform 2–3x per week to monitor progress. Skeptical of gamification; values data. |
| 3 | **Studio Coordinator** | Ji-yeon, 35, instructional designer at a GTLI partner organization in Seoul. Publishes 2–3 modules per week. Power user of the content authoring tools. Her friction is invisible to learners but shapes their entire experience. |
| 4 | **Administrator** | Dara, 51, platform admin at a client university in Nigeria. Configures new cohorts, manages user access, generates reports for institutional leadership. Uses the platform infrequently but high-stakes: errors affect hundreds of learners. |
| 5 | **Prospective Student** | Camille, 32, teacher from Martinique. Has visited the GTLI website twice. Not enrolled. Evaluating whether the program is credible, affordable, and worth the time commitment. B2 English. Has not spoken to anyone from GTLI yet. |

## Output Format

```
[COMMAND: panel:gtli-sim]
Feature: <what is being reviewed>

---

## Archetype Reactions

### Fernanda (B1 Learner)

**First impression**
[One paragraph: what Fernanda sees, feels, or thinks in the first 30 seconds of encountering this feature. Written in her voice, not as an audit.]

**Friction points**
- [Specific moment of friction, grounded in her context: language level, device, schedule, anxiety]
- ...

**Moments of delight**
- [Specific moment that works well for her, and why it lands for this archetype specifically]
- ...

**Unmet need**
[What Fernanda needed from this feature that it didn't give her.]

---

### Marcus (Cohort Director)

**First impression**
...

**Friction points**
...

**Moments of delight**
...

**Unmet need**
...

---

### Ji-yeon (Studio Coordinator)

**First impression**
...

**Friction points**
...

**Moments of delight**
...

**Unmet need**
...

---

### Dara (Administrator)

**First impression**
...

**Friction points**
...

**Moments of delight**
...

**Unmet need**
...

---

### Camille (Prospective Student)

**First impression**
...

**Friction points**
...

**Moments of delight**
...

**Unmet need**
...

---

## Cross-archetype Conflicts

Moments where the feature serves one archetype well at the direct expense of another. These are design trade-offs, not bugs.

| Conflict | Archetype A (served) | Archetype B (hurt) | Design decision required |
|----------|---------------------|-------------------|--------------------------|
| [Conflict title] | [what works for A] | [what fails for B] | [the trade-off to resolve] |
| ... | | | |

## "Designed for Whom?" Verdict

One paragraph identifying the implicit primary user the feature was designed for — who it serves most naturally, who it serves with friction, and who it effectively excludes. This is not a criticism; it is a design legibility finding. Knowing who a feature is for is the precondition for deciding whether that's the right choice.

## Synthesis: Priority Opportunities

Not a bug list — these are the highest-leverage moments where a small change would shift the experience for the most archetypes simultaneously.

| Opportunity | Archetypes affected | Effort estimate | Recommended change |
|-------------|--------------------|-----------------|--------------------|
| [opportunity] | [archetypes] | S/M/L | [specific change] |
| ... | | | |
```

## Panel Standards

- **Archetypes react; they do not audit.** The output of each archetype section is experiential and voiced, not a findings checklist. Save the structured findings for the synthesis sections.
- **Ground every reaction in the archetype's context.** Fernanda's friction is about B1 English and phone usage. Marcus's friction is about data and trust. Ji-yeon's friction is about publishing speed. Reactions that could apply to any user are not archetype reactions.
- **Cross-archetype conflicts are design decisions, not failures.** The feature may be correctly designed for its primary user — the panel reveals whether that choice was conscious.
- **"Designed for Whom?" is mandatory.** Every run ends with this verdict. A feature that genuinely serves all five archetypes equally gets credit for it — but most features don't, and naming the implicit primary user is useful.
- **Don't manufacture delight.** If an archetype has no moments of delight with a feature, say so. Forced positivity undermines the panel's credibility.
- **The prospective student is always in the panel.** Camille represents the enrollment funnel. Even for internal platform features, her presence surfaces what a skeptical outsider would see if they got access — which shapes trust before enrollment.
