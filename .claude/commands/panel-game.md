---
name: panel:game
description: Run all 6 game design agents as a panel — each reviews the same design artifact or question from their discipline, then produces a cross-discipline synthesis that surfaces conflicts and gaps no single agent would catch alone. Use for GDD reviews, feature design critiques, pre-milestone readiness checks, and design retrospectives.
---

# /gamepanel

Convene all 6 game design agents as a panel. Each agent reviews the same artifact or question from their discipline's perspective, then a synthesis pass identifies cross-discipline conflicts and gaps.

## Usage

```
/gamepanel                              # panel review of all available design documents
/gamepanel [artifact]                   # focus the panel on a specific artifact or question
/gamepanel ENGINE: Godot                # with engine override for game-tech scaffolding hints
```

Examples:
```
/gamepanel "design a crafting system"
/gamepanel GDD                          # review the full Game Design Document
/gamepanel "is our alpha scope realistic?"
/gamepanel "the combat loop feels bad — diagnose it"
/gamepanel ENGINE: Unity
```

This is distinct from running `/audit` per agent: `/gamepanel` is a **discussion format**, not just a findings list. Each agent speaks from their discipline's values, and the synthesis section surfaces where those values conflict — which is where the real design decisions live.

## Execution Order

Run agents in strict dependency order. Each agent sees the same artifact and the full output of earlier agents before responding.

```
1. [AGENT: game-design]   — mechanics, systems, core loop
2. [AGENT: narrative]     — story, dialogue, character
3. [AGENT: level-design]  — spaces, pacing, encounters
4. [AGENT: game-ux]       — controls, feedback, accessibility
5. [AGENT: game-tech]     — architecture, data structures, feasibility
6. [AGENT: production]    — scope, risk, milestone readiness
```

## Output Format

```
[COMMAND: gamepanel]
Artifact: <what is being reviewed>
ENGINE: <engine override or engine-agnostic>

---

[AGENT: game-design] [COMMAND: audit]
Discipline lens: core mechanics, systems coherence, game loop

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

[AGENT: narrative] [COMMAND: audit]
Discipline lens: story structure, dialogue systems, lore consistency

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: level-design] [COMMAND: audit]
Discipline lens: spatial design, pacing, encounter flow

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: game-ux] [COMMAND: audit]
Discipline lens: controls, feedback, accessibility, onboarding

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: game-tech] [COMMAND: audit]
Discipline lens: systems architecture, feasibility, data structures

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: production] [COMMAND: audit]
Discipline lens: scope realism, risk, milestone readiness

### Critical
...
### High
...
Summary: X critical, Y high, Z medium, W low

---

## Cross-discipline Findings

Findings that reveal a conflict or gap *between* disciplines. Each cites the agents involved. These are the findings that would be missed if agents worked in isolation.

### Critical
- [ ] **[Finding title]** — [agents: X + Y]
  Conflict: [what each discipline wants that contradicts the other]
  Resolution: [recommended decision, with tradeoff noted]

### High
- [ ] ...

### Medium
- [ ] ...

---

## Panel Verdict

One-paragraph summary: the most important decision the team needs to make, and what each discipline's stake in it is.

---

## Rollup

| Agent | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| game-design | | | | |
| narrative | | | | |
| level-design | | | | |
| game-ux | | | | |
| game-tech | | | | |
| production | | | | |
| **cross-discipline** | | | | |
| **Total** | | | | |

Top 3 decisions to make before proceeding:
1. [decision + which agents it unblocks]
2. [decision + which agents it unblocks]
3. [decision + which agents it unblocks]
```

## Cross-discipline Check Patterns

Look for these classes of conflict after all 6 agents have run:

**Mechanics ↔ Narrative conflict** (`game-design` + `narrative`)
- A core mechanic creates player behavior that contradicts character motivation
- Story gating (locked doors, conversation checks) conflicts with the intended game loop pacing
- Player verbs don't match narrative agency: player can kill anything but the story requires diplomacy

**Mechanics ↔ Level pacing conflict** (`game-design` + `level-design`)
- Level beat map assumes player verbs that game-design hasn't finalized
- Encounter design requires tuning parameters that aren't isolated in the mechanics spec
- Level uses a mechanic flagged as post-launch in the design pillars

**Narrative ↔ Level conflict** (`narrative` + `level-design`)
- Environmental storytelling contradicts lore established in the story bible
- Level pacing forces narrative beats at moments that undercut their emotional impact
- A story revelation lands in a high-tension arena beat (player can't receive it)

**Mechanics ↔ UX conflict** (`game-design` + `game-ux`)
- A mechanic requires simultaneous inputs that accessibility guidelines flag
- HUD design exposes tuning parameters the player shouldn't see
- Core loop's fail state creates a UX dead-end (no feedback, no re-entry path)

**Design ↔ Tech feasibility** (`game-design` + `game-tech`)
- A mechanic requires real-time state that the proposed architecture doesn't support
- Balance parameters are hard-coded in logic rather than data-driven
- Save/load design doesn't account for mid-mechanic states a new system creates

**Scope ↔ Any discipline** (`production` + any agent)
- A mechanic, level, or system has no assigned owner or milestone
- A "v1" feature has unresolved dependencies that require post-launch features
- Writing, VO, or level content volume exceeds what's achievable before the stated Beta date

**UX ↔ Tech conflict** (`game-ux` + `game-tech`)
- Feedback design (particles, screen shake, haptics) has no architecture spec
- Input remapping is required by UX but the input system is hard-coded
- Dialogue UI requires a string localization system that isn't in the tech plan

## Panel Standards

- **Each agent speaks from their discipline.** A finding is only filed by the agent who owns that domain. `game-ux` does not file architecture bugs; `game-tech` does not file pacing issues.
- **Cross-discipline findings require a resolution.** Unlike single-agent audit findings (which just need a fix), cross-discipline findings are design decisions — they need a recommended resolution and an explicit tradeoff statement.
- **The Panel Verdict is mandatory.** Every `/gamepanel` run ends with the one-paragraph verdict naming the single most important decision.
- **Don't manufacture findings.** If a discipline has nothing to flag, say so. The rollup row shows zeros. Don't pad.
- **Later agents reference earlier findings.** `production` may cite `game-tech`'s feasibility findings when assessing scope risk. Make the chain explicit.
