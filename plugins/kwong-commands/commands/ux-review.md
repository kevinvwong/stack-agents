---
description: Run all five UX persona agents in parallel against the current project, then synthesize findings into a unified priority list. Requires kwong-agents.
---

Run a full UX review of the current project across all five GTLI personas.

## Step 1 — Run all five persona agents in parallel

Spawn these five agents simultaneously. Each reviews the codebase independently from their persona's perspective.

<agents>
- ux-admin
- ux-coordinator
- ux-director
- ux-learner
- ux-synthesis
</agents>

Wait for all five to complete before proceeding.

## Step 2 — Synthesize

Pass all five reports to the `ux-synthesis` agent with this instruction:

> You have received reports from ux-admin, ux-coordinator, ux-director, and ux-learner. Identify systemic issues that appear across multiple personas, surface conflicting priorities, and produce a unified set of high-impact improvements ranked by: (1) issues blocking multiple personas, (2) issues unique to a single persona but severe, (3) polish and consistency.

## Output format

### Per-Persona Verdict
For each persona: one-paragraph summary + top 3 findings (severity, finding, recommendation).

### Cross-Persona Issues
Issues flagged by 2+ personas — highest confidence, highest priority.

### Conflicting Priorities
Where one persona's ideal UX conflicts with another's — call out the tension and recommend a resolution.

### Unified Backlog
All findings merged, deduplicated, and ranked. Format each item as:
**[P0/P1/P2]** | **[Persona(s)]** | Finding | Recommended fix

### Suggested Next Sprint
3–5 implementation tasks derived from the highest-priority findings, ordered by impact-to-effort ratio.
