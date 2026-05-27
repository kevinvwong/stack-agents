# ADR-003: Agent lifecycle / workforce management pattern

**Status:** Accepted
**Date:** 2026-05-27
**Author:** Kevin Wong

---

## Context

The roster grew from 7 web agents to 40+ across web, quality, research, product, workspace, game design, GitHub, and meta families. Each new file in `agents/` is a new agent — there is no admission process, no review, no exit.

Three problems compound as the roster grows:

1. **No pruning ritual.** Once added, an agent stays. Nobody asks "is this still useful?" on any cadence. Dead agents accumulate quietly.
2. **Overlap is invisible.** Two agents covering adjacent ground (e.g., `web-qa` and a hypothetical `e2e-tester`) don't trip any alarm until someone manually notices and proposes a merge.
3. **No justification trail.** Why does `i18n` exist? Who hired it? When? What problem did it solve? The git log answers some of this, the spec answers none of it.

The Agents Notion database (added in 1.7.4) gave us a place to store lifecycle metadata. This ADR codifies the operations that read and write that metadata, and the rituals that exercise them.

The metaphor is workforce management — agents are staff. You hire them, train them, upskill them, combine roles, fire underperformers, and eventually eliminate roles that no longer exist. This is not novel; it is borrowed wholesale from how real organizations manage headcount.

---

## Decision

**Treat the agent roster as staff. Provide six explicit lifecycle verbs, backed by commands, a Notion mirror, and rituals.**

`agents/*.md` in the repo remains canonical — Claude Code only reads from there. The Agents Notion database is the operational substrate for metadata that doesn't belong in the spec (hire date, deprecation reason, ownership, usage, status). A sync hook keeps them aligned.

### Verbs

| Verb | Command | What it does | Issue |
|------|---------|--------------|-------|
| **Hire** | `/agents:hire <name> --family <X>` | Create new agent file from template; insert Notion row with `Status=Active`, `Hired=today`, `Owner=<author>`. Justification required in command args. | #39 |
| **Train** | `/agents:train <name>` | Run the agent's own `/audit` against itself. Surface missing handoffs, outdated tool refs, broken `[AGENT:]` cross-refs, drift from the template. Propose a spec diff. Does not auto-apply. | #41 |
| **Upskill** | implicit | Any `Write`/`Edit` to `agents/<name>.md` stamps `Last upskilled = today` on the Notion row via the sync hook. No explicit command — editing is upskilling. | #44 |
| **Combine** | `/agents:combine A B --into C` | Merge two agents into one. A and B move to `Status=Deprecated` with `Replaced by → C`. C is proposed as a new spec for review; not auto-created. | #42 |
| **Fire** | `/agents:fire <name> --reason "<text>"` | Set `Status=Deprecated`, populate `Deprecation reason`, optionally `Replaced by`. Move `agents/<name>.md` to `agents/.deprecated/`. Reversible — un-fire is `mv` back and flip status. | #40 |
| **Eliminate** | manual, after 90 days | Hard-delete the file and the Notion row. Only permitted when: `Status=Deprecated` for ≥90 days, 0 references in `agents/`, `commands/`, `sprints/`, `docs/`, and `Usage 30d = 0`. `/agents:review` (#43) flags candidates; elimination is always a human decision. | #43, #45 |

The `agent-lifecycle` meta-agent (#45) owns the five `/agents:*` commands. It sits in the Meta family alongside `sprint-assembler` and `project-setup`.

### Why six verbs and not fewer

Fewer verbs collapse distinct operations. Specifically:

- **Fire vs. eliminate** are separate because reversible deprecation is the common case and irreversible deletion is rare. Merging them encourages premature deletion.
- **Train vs. upskill** are separate because training is a triggered audit (you run it on a specific agent when you suspect drift) while upskilling is the continuous side-effect of editing the spec. Merging them either over-instruments edits or under-instruments audits.
- **Combine** is its own verb because two-into-one is a structurally different operation than fire-then-hire — it preserves provenance via `Replaced by`.

---

## Definitions

**Active** — In roster. File exists in `agents/<name>.md`. Notion row `Status=Active`, `Hired` populated, `Owner` populated. Available for routing, panels, and sprint assembly. Loaded by Claude Code at session start. The default state — every newly hired agent starts here.

**Deprecated** — Marked but not deleted. File moved to `agents/.deprecated/<name>.md` (the leading dot keeps it out of Claude's load path while preserving git history). Notion row `Status=Deprecated`, `Deprecation reason` required, `Replaced by` optional (used by combine). Not loaded by Claude Code. Not available for new sprint assembly. References to the agent in other agents, commands, sprints, or docs are flagged by `lint-references` as stale — these references must be resolved before elimination. Reversible: un-fire is `mv agents/.deprecated/<name>.md agents/<name>.md` and flip the Notion status back to `Active`. Reversibility is the point — firing should be cheap.

**Eliminated** — Permanently removed. File deleted from `agents/.deprecated/`. Notion row deleted (not archived — the row goes away to keep the database clean). Only permitted when all four conditions hold:

1. `Status=Deprecated` for ≥90 days
2. 0 references in `agents/`, `commands/`, `sprints/`, `docs/`
3. `Usage 30d = 0`
4. Explicit human approval (no command auto-eliminates)

There is no record other than git history. Elimination is rare and intentional; the 90-day window exists so that "I deprecated it last week" doesn't immediately become "I lost it."

State transitions:

```
            hire                fire (reversible)         90-day expiry + 0 refs + 0 usage
   ∅  ─────────────▶  Active  ────────────────▶  Deprecated  ───────────────────────────▶  Eliminated  ─▶  ∅
                       ▲  ▲                          │
                       │  └──── un-fire (mv back) ───┘
                       │
                       └──── combine: A,B → Deprecated; new C → Active
```

---

## Rituals

The verbs are dead weight without cadence. Four rituals exercise them.

**Weekly — `/agents:review --weekly`** (advisory)
Quick scan run by a human, output by the `agent-lifecycle` meta-agent. Flags three cohorts:

- Agents with `Usage 30d = 0` (candidate for fire)
- Agents not edited in 180 days (candidate for train — drift likely)
- Agents with no `Owner` (governance gap — assign or fire)

Output is a Markdown checklist, not a verdict. Used to seed conversation, not to act. No state changes happen during weekly review; any firing or training is an explicit follow-up command.

**On commit to `agents/*.md` — sync hook** (automated, #44)
PostToolUse hook on `Write`/`Edit` to any file matching `agents/*.md` runs `/notion:publish agent <name>`. Upserts the Notion row by `Source` URL. Stamps `Last upskilled = today`. On delete, sets `Status=Deprecated` rather than deleting the row — elimination is always manual. The hook is idempotent and silent on success; failures log to `~/.claude/logs/` without blocking the edit.

**Quarterly — combine evaluation**
Whole-roster overlap check. Pairs of agents with similar `description` frontmatter (cosine similarity >0.85) or overlapping `/scaffold` sections (>50% shared headings) are flagged for human review. The output is a list of combine candidates with a recommended `Replaced by` target and a rough diff of the two specs. Combine is never automatic — the meta-agent proposes, a human decides. Quarterly also includes the elimination sweep: any Deprecated agent past its 90-day window with 0 references and 0 usage is listed for human-approved deletion.

**After every panel run — usage telemetry** (depends on #34)
Panel and sprint runs emit a structured event per invoked agent. The dashboard rolls these into `Usage 30d` on the Notion row, rebuilt nightly. This is the input to both weekly review and quarterly combine eval — without it, "unused" is a guess.

---

## Consequences

**Positive:**

- Pruning becomes a normal cadence, not a special event. Weekly review surfaces candidates; firing is cheap because it's reversible.
- Every agent has an ownership trail: who hired it, when, what reason. Deprecation includes a reason. The trail survives the agent itself.
- New agents require justification. The hire command takes a `--family` and an implicit "why" — you can't add an agent by dropping a file without going through the command (the sync hook will create the Notion row with `Owner=∅`, which the weekly review flags immediately).
- The reference linter becomes a governance check, not just a syntax check. A broken `[AGENT:x]` reference after firing `x` is a deprecation signal, not a typo.
- Combine is a first-class operation. Two-into-one preserves history via `Replaced by`, instead of being a fire-and-rehire that loses the connection.

**Negative:**

- Overhead. Six verbs, four rituals, a sync hook, a meta-agent, and a Notion mirror are not free. Small rosters (<10 agents) don't need this — the cost exceeds the benefit until ~20 agents.
- Ritual fatigue. Weekly review can become a checkbox if nobody acts on it. The 90-day deprecation window can become "deprecated forever" if nobody runs the elimination ritual.
- Notion dependency. The operational substrate is a hosted service. If Notion is down, sync silently fails and the dashboard's `Usage 30d` goes stale. The repo remains canonical, so routing still works, but governance is blind.
- Authoring friction. `/agents:hire` is more steps than `touch agents/new-agent.md`. The hook backfills the row if you bypass the command, but the friction is the point — it pushes people through the justification step.

**Mitigations:**

- Below 20 agents, the verbs still work but the rituals are optional. The hook is the only mandatory piece.
- The sync hook is idempotent and runs in the background — no foreground cost on edit.
- `/agents:review` output is a Markdown checklist, not a prompt — it can be ignored without breaking anything.

---

## Alternatives considered

**Leave it free-form.** No verbs, no rituals, no Notion mirror. Add agents by dropping files; prune by manual `git rm` when someone notices. This is the current state. Rejected because the symptoms (overlap, dead weight, no justification trail) are already visible at 40 agents and will get worse. The cost of doing nothing scales with roster size; the cost of the pattern is roughly fixed.

**Delete by hand quarterly.** Keep the free-form authoring model but schedule a quarterly "agent garage sale" — a human reviews the roster and deletes what looks unused. Rejected because it loses the ownership trail (no `Replaced by`, no `Deprecation reason`), it's irreversible (no Deprecated state), and "looks unused" is not the same as "is unused" without `Usage 30d` telemetry. The quarterly cadence is fine; the lack of structure around it is not.

**Database-first roster.** Move the canonical source to the Notion database; generate `agents/*.md` from rows. Rejected for the same reason ADR-001 rejected database-backed agents: Claude Code reads from files, not databases. Inverting the canonical source means every agent edit goes through a render step, and offline use breaks. The mirror direction (file → Notion) preserves the file as canonical.

**Per-agent expiration dates.** Every agent gets a `Sunset` date at hire time; the agent auto-deprecates on that date unless renewed. Rejected because most agents are long-lived (the web stack agents have been stable for months) and arbitrary expiration creates churn. The verbs already provide the deprecation path — adding a timer is solving the wrong problem.

---

## References

- Issue spec: [#46](https://github.com/kevinvwong/stack-agents/issues/46)
- PLAN.md Phase 8 — sub-issues #37–#45 implement this ADR
- ADR-001 — establishes `agents/*.md` as canonical (the constraint this ADR works within)
- ADR-002 — same template; precedent for the "operational substrate vs. canonical source" split
- `agents/agent-lifecycle.md` (#45) — meta-agent that owns the `/agents:*` commands
- `agents/sprint-assembler.md` — sibling meta-agent; precedent for the Meta family pattern
- `agents/notion-architect.md` — owns the Agents database schema this ADR depends on
