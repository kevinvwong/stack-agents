---
name: panel:gtli-ux
description: Run all 5 GTLI UX persona agents as a panel — ux-learner, ux-director, ux-coordinator, ux-admin, and ux-synthesis — against the same GTLI platform feature or route, then produce a cross-persona synthesis. Use when auditing the GTLI platform for role-specific UX gaps.
---

# /panel:gtli-ux

Convene all 5 GTLI UX persona agents as a panel. Each agent reviews the same platform feature or route from their role's perspective — how they actually use the platform, what they need, and where the design fails them. A synthesis pass then identifies where one persona's experience is improved at another's expense.

These agents exist in `~/.claude/agents/` (kwong-agents plugin). Each embodies a specific GTLI platform role with real context: job responsibilities, technical comfort, frequency of use, and tolerance for friction.

## Usage

```
/panel:gtli-ux                              # full platform review from all 5 personas
/panel:gtli-ux [feature or route]           # focus all personas on a specific feature
```

Examples:
```
/panel:gtli-ux
/panel:gtli-ux "the cohort dashboard"
/panel:gtli-ux "module player flow"
/panel:gtli-ux "onboarding"
/panel:gtli-ux "the notification system"
/panel:gtli-ux "progress tracking"
/panel:gtli-ux "the assignment submission flow"
```

## Execution Order

Run agents in strict dependency order. Each persona sees the same feature and the full output of earlier personas before responding. `ux-synthesis` runs last and has access to all prior outputs.

```
1. [AGENT: ux-learner]      — the enrolled student experience
2. [AGENT: ux-director]     — the cohort director managing learners
3. [AGENT: ux-coordinator]  — the studio coordinator publishing content
4. [AGENT: ux-admin]        — the platform administrator configuring cohorts
5. [AGENT: ux-synthesis]    — cross-persona conflict detection and priority backlog
```

## Output Format

```
[COMMAND: panel:gtli-ux]
Feature: <what is being reviewed>

---

[AGENT: ux-learner] [COMMAND: audit]
Role lens: enrolled student — content consumption, progress, assignments, communication

### Critical
- [ ] **[Finding title]** — [feature/screen/flow]
  Persona impact: [how this specifically affects a learner in their workflow]
  Fix: [specific, actionable UX recommendation]

### High
- [ ] ...

### Medium
- [ ] ...

### Low
- [ ] ...

Summary: X critical, Y high, Z medium, W low

---

[AGENT: ux-director] [COMMAND: audit]
Role lens: cohort director — learner monitoring, progress visibility, communications, reporting

### Critical
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: ux-coordinator] [COMMAND: audit]
Role lens: studio coordinator — module publishing, content management, schedule management

### Critical
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: ux-admin] [COMMAND: audit]
Role lens: platform administrator — cohort configuration, user management, platform settings

### Critical
...
Summary: X critical, Y high, Z medium, W low

---

[AGENT: ux-synthesis] [COMMAND: synthesis]

## Cross-persona Conflicts

Findings that reveal a design trade-off between personas — where the feature serves one role at the expense of another. Each cites the personas involved.

### Critical
- [ ] **[Conflict title]** — [personas: X vs. Y]
  Tension: [what each persona needs that the current design can't satisfy simultaneously]
  Recommended resolution: [specific decision, with trade-off acknowledged]

### High
- [ ] ...

### Medium
- [ ] ...

## Panel Verdict

One paragraph: the most significant role-experience gap in this feature, which personas are most affected, and the single highest-leverage design change.

## Unified Priority Backlog

Ordered by cross-persona impact. Issues that affect multiple personas or create cross-role friction are ranked above single-persona issues of equal severity.

| Priority | Finding | Affects | Owner |
|----------|---------|---------|-------|
| P0 | [finding] | learner + director | [agent] |
| P1 | [finding] | coordinator | [agent] |
| ... | | | |

## Rollup

| Persona | Critical | High | Medium | Low |
|---------|----------|------|--------|-----|
| ux-learner | | | | |
| ux-director | | | | |
| ux-coordinator | | | | |
| ux-admin | | | | |
| **cross-persona** | | | | |
| **Total** | | | | |

Top 3 actions before next release:
1. [action + which personas it unblocks]
2. [action + which personas it unblocks]
3. [action + which personas it unblocks]
```

## Cross-persona Check Patterns

Look for these classes of conflict after all 4 persona agents have run:

**Learner ↔ Director tension**
- Learner-facing progress display shows different data than what directors see in their dashboard
- Notifications sent to directors about learner inactivity create anxiety for learners who are active but slow
- Director bulk actions (e.g., extending deadlines for all) override individual learner settings without warning

**Learner ↔ Coordinator tension**
- Module structure optimized for content publishing (coordinator) creates a disjointed consumption experience (learner)
- Coordinator-set pacing locks learners out of modules they're ready for
- Rich media formats that coordinators can publish require bandwidth learners in target markets don't have

**Director ↔ Admin tension**
- Directors expect to configure cohort settings but admins have locked them at the platform level
- Reporting views available to admins don't match the reporting views directors need for their organizations
- Admin-managed user roles create ambiguity about who owns a learner's record

**Coordinator ↔ Any persona**
- Publishing workflows optimized for speed create quality gaps that directors and learners notice
- Content versioning decisions (coordinator) affect learner progress state (learner) in ways neither anticipates

## Panel Standards

- **Each persona speaks from their role's lived context.** `ux-learner` does not file publishing pipeline bugs; `ux-coordinator` does not file learner progress visibility gaps. Cross-persona findings go in the synthesis section only.
- **Findings must cite a specific feature, screen, or flow.** "The dashboard is confusing" is not a finding. "Director dashboard: cohort health metric shows % active but uses a 7-day window not disclosed anywhere — directors interpret it as lifetime activity" is.
- **Cross-persona conflicts require a resolution.** Unlike single-persona findings (which just need a fix), cross-persona conflicts are design decisions — they need a recommended resolution with the trade-off stated.
- **The Panel Verdict is mandatory.** Every `/panel:gtli-ux` run ends with the one-paragraph verdict.
- **Don't manufacture findings.** If a persona has nothing to flag, say so. Zeros in the rollup. No padding.
- **Later agents reference earlier findings.** `ux-synthesis` must cite specific findings from the four persona agents. Synthesis that doesn't reference prior findings is not synthesis.
