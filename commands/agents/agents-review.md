---
name: agents:review
description: Quarterly performance review across the agent roster. Walks every Active agent and surfaces lifecycle candidates — agents to train (stale), combine (overlap), fire (unused), or eliminate (deprecated past the 90-day window with no references). Purely advisory; no mutations.
---

# /agents:review

Convene the `agent-lifecycle` meta-agent to run a workforce-wide review. For each Active agent, check usage, drift, overlap, and inbound references. For each Deprecated agent, check whether it's past the 90-day elimination window with zero references and zero usage.

Run this quarterly minimum. The report is the input to follow-up `/agents:train`, `/agents:combine`, and `/agents:fire` calls — this command does not mutate anything.

## Usage

```
/agents:review [--family <family>] [--threshold-usage <N>] [--threshold-stale <days>] [--threshold-elim <days>]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `--family <family>` | No | Restrict review to a single family (e.g. `Web Stack`, `GitHub`). Default: all families. |
| `--threshold-usage <N>` | No | Minimum `Usage 30d` value for an Active agent to escape the "fire candidate" flag. Default: `1`. |
| `--threshold-stale <days>` | No | Days since `Last upskilled` AND `Hired` after which an Active agent is flagged for `/agents:train`. Default: `180` (6 months). |
| `--threshold-elim <days>` | No | Days since `Status` flipped to `Deprecated` after which a deprecated agent with zero refs and zero usage is flagged for elimination. Default: `90`. |

## Behavior

For each **Active** agent in the Agents Notion database (data_source_id `13f4dfbb-5746-477e-b7b0-41215c07dc22`):

1. **Usage check** — read `Usage 30d`. If `< --threshold-usage`, flag for `Fire (low usage)` or `Train (low usage but recent hire)` depending on `Hired` date. If `Usage 30d` is null (telemetry not wired yet, per #34), skip this check with a note in the report header.
2. **Drift check** — if `Last upskilled` is null AND `Hired` is more than `--threshold-stale` days ago, flag for `Train (never upskilled)`. If `Last upskilled` is more than `--threshold-stale` days ago AND `Hired` is older still, flag for `Train (spec is stale)`.
3. **Overlap check** — compare `Family` and `Description` against every other Active agent in the same family. Surface pairs with description similarity above the overlap threshold (LLM-judged Jaccard-like score). Flag as `Combine candidates`.
4. **Reference check** — `node scripts/lint-references.mjs --json --root .` and count inbound `[AGENT: <name>]` references in `agents/*.md` and `commands/**/*.md`. If 0 inbound refs AND `Usage 30d < threshold`, flag as `Fire (no inbound)`.

For each **Deprecated** agent:

5. **Elimination check** — if the Notion row's last-edit date (proxy for when it was deprecated) is more than `--threshold-elim` days ago AND inbound refs = 0 AND `Usage 30d` = 0 (or null), flag as `Eliminate (ready)`.

## Output Format

```
[AGENT: agent-lifecycle] [COMMAND: review]
Date:             <ISO date>
Family scope:     <family or "all">
Thresholds:       usage=<N>, stale=<days>, elim=<days>
Telemetry:        present | MISSING (usage checks skipped — wire #34)

Roster summary:
  Active:        <N>
  Deprecated:    <N>
  Total:         <N>

---

## Train (spec is stale)

- <name> — Family: <family>. Last upskilled: <date or "never">. Hired: <date>.
  Recommendation: /agents:train <name>
  Why: Hired <X> months ago, never upskilled. Spec likely drifted from current stack.

- <name> — ...

## Combine candidates (overlap)

- <A> + <B> — Family: <family>. Description similarity: <score>.
  Recommendation: /agents:combine <A> <B> --into <new-name>
  Why: Both agents own <overlapping domain>. Handoff graph shows N cross-references.

## Fire (low usage)

- <name> — Family: <family>. Usage 30d: <N>. Inbound refs: <N>.
  Recommendation: /agents:fire <name> --reason "<suggested reason>"
  Why: <usage analysis>. Consider <replaced-by candidate> as the heir.

## Fire (no inbound)

- <name> — Family: <family>. Inbound refs: 0. Usage 30d: <N>.
  Recommendation: /agents:fire <name> --reason "no inbound handoffs; functionally orphaned"

## Eliminate (deprecated past window)

- <name> — Deprecated <X> days ago. Inbound refs: 0. Usage 30d: 0.
  Recommendation: rm agents/.deprecated/<name>.md && archive Notion row
  Why: Past the 90-day elimination window with no refs and no usage. Safe to delete.

  (or: "(none) — no deprecated agents meet the elimination criteria")

---

## Health summary

| Family       | Active | Train | Combine | Fire | Eliminate |
|--------------|--------|-------|---------|------|-----------|
| Web Stack    | 7      | 1     | 0       | 0    | 0         |
| Game Design  | 6      | 2     | 1       | 1    | 0         |
| GitHub       | 6      | 0     | 0       | 0    | 0         |
| ...          |        |       |         |      |           |
| TOTAL        | <N>    | <N>   | <N>     | <N>  | <N>       |

Verdict: <Healthy | Drifting | At risk>

Next:
  - Run the recommended lifecycle commands above (each prompts for confirmation)
  - Re-run /agents:review in 90 days
  - If telemetry is missing, wire #34 so usage checks become meaningful
```

## Acceptance criteria

- [ ] Walks every Active agent and every Deprecated agent (does not skip on missing data)
- [ ] Telemetry absence is surfaced clearly in the report header (does not silently skip usage checks)
- [ ] No mutations — purely advisory output
- [ ] Recommendations are concrete commands the user can copy-paste
- [ ] Runs in under 30 seconds for the current roster size (roughly 35 agents)
- [ ] `--family` filter restricts the walk; thresholds are respected per the args

## When Not to Use This

- One-agent question — use `/agents:train <name>` directly; this command is for roster-wide review.
- Right after `/agents:hire` of a new agent — usage and inbound-ref data won't be meaningful yet. Wait a quarter.
- As a pre-commit gate — this is a review, not a lint. The reference linter (`scripts/lint-references.mjs`) is what blocks commits.

Source: PLAN.md Phase 8b · Owned by `[AGENT: agent-lifecycle]` · Soft-depends on telemetry (issue #34)
