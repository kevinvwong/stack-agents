---
name: sprint:standup
description: Daily sprint check-in — pulls current activity (last 3 commits, open PRs, open issues, SPRINT.md blockers), routes the context to every agent in the sprint roster for a ≤3-bullet status, then writes a 1-paragraph standup summary at the top. Use as a lightweight daily ritual to keep installed sprint orchestrators active. Run from within the target project (requires SPRINT.md to be active).
---

# /sprint:standup

Daily check-in for an installed sprint team. Pulls fresh activity from the repo, routes it to every agent on the roster, collects short status replies, then synthesizes a single-paragraph standup summary.

`/sprint:standup` is the lightweight daily companion to `/sprint:status`. Where `/sprint:status` asks every agent for a full domain audit, `/sprint:standup` is a fast pulse — same roster, tighter format, intended to be run every working day without ceremony.

## Usage

```
/sprint:standup
/sprint:standup --agent <name>
/sprint:standup --since <duration>
```

Run from within the target project where `SPRINT.md` is active.

**Arguments:**

| Argument             | Required | Description                                                                        |
| -------------------- | -------- | ---------------------------------------------------------------------------------- |
| `--agent <name>`     | No       | Restrict the standup to a single agent on the roster                               |
| `--since <duration>` | No       | Override the activity window (default: last 3 commits + currently open PRs/issues) |

**Examples:**

```
/sprint:standup
/sprint:standup --agent data
/sprint:standup --since 24h
```

## What It Does

1. **Reads `SPRINT.md`** for the team roster, sprint goal, and the `Blockers` section.
2. **Pulls current activity:**
   - Last 3 commits via `git log -3 --oneline`
   - Open PRs via `mcp__github__list_pull_requests` (state: `open`)
   - Open issues via `mcp__github__list_issues` (state: `open`)
   - Existing `Blockers` section from `SPRINT.md`
3. **Routes the activity bundle to each sprint agent** in the roster's dependency order. Each agent sees the same activity context — they interpret it through their own domain lens.
4. **Each agent responds with ≤3 bullets**, each tagged with a domain status:
   - `Unblocked` — work is moving, no concerns
   - `Concern` — something to watch, not yet blocking
   - `Blocker` — sprint goal is at risk without resolution
5. **A synthesis pass writes a 1-paragraph standup summary** at the top of the output, summarizing the team's overall posture for the day and naming any blockers by owner.

## Output Format

```
[SPRINT: <sprint-name>] [COMMAND: sprint:standup]
Goal: <sprint goal>
Date: <today> | Day N of <duration>

## Standup Summary

<1-paragraph synthesis: overall posture, what landed since yesterday, what's
at risk today, named blockers with owners, single most important thing the
team should focus on next.>

---

## Activity Pulled

Commits (last 3):
  - <sha> <subject>
  - <sha> <subject>
  - <sha> <subject>

Open PRs (<N>):
  - #<num> <title> — <author>
  - ...

Open issues (<N>):
  - #<num> <title> — <labels>
  - ...

SPRINT.md Blockers:
  - <blocker> (owner: <agent>)
  - ...

---

## Per-Agent Status

[AGENT: <agent1>] [COMMAND: standup]
  - <Unblocked|Concern|Blocker> · <bullet>
  - <Unblocked|Concern|Blocker> · <bullet>
  - <Unblocked|Concern|Blocker> · <bullet>

[AGENT: <agent2>] [COMMAND: standup]
  - ...

---

Verdict: On track | At risk | Blocked
Blockers: N (owners: <agent>, <agent>)
Concerns: N
```

## When NOT to Use

- **No `SPRINT.md` present in the target project.** This command is sprint-scoped. Without an installed sprint orchestrator there is no roster to route to. Use `/sprint:list` to find the sprint and `/sprint:assemble --force` to reinstall it.
- **`SPRINT.md` present but no roster section.** A malformed or hand-edited `SPRINT.md` without a recognizable roster cannot be routed. Re-run `/sprint:assemble` to regenerate from the canonical `sprints/<slug>/orchestrator.md`.
- **You need a full domain audit, not a pulse.** Use `/sprint:status` — each agent reports Done / In progress / Blocking / Handoffs in detail rather than a 3-bullet summary.
- **The sprint has been dissolved.** A dissolved sprint has no live orchestrator. Use `/sprint:list --status dissolved` to confirm, then reassemble if needed.

## Acceptance Criteria

- Errors out clearly with a remediation pointer when `SPRINT.md` is missing or has no roster.
- Pulls exactly the four context sources listed under "What it does" before routing to any agent — never asks an agent to fetch its own activity.
- Routes the same activity bundle to every agent on the roster, in the sprint's dependency chain order.
- Every per-agent block ends with ≤3 bullets, each tagged `Unblocked`, `Concern`, or `Blocker`.
- The standup summary paragraph appears **above** the activity dump and per-agent blocks — it is the first thing the user reads.
- The verdict line at the bottom is one of `On track`, `At risk`, `Blocked` and names blocker owners when blockers exist.
- Idempotent and read-only: never writes to `SPRINT.md`, the registry, or any agent file.

## Notes

- This command is injected into the target project's `SPRINT.md` by the assembler alongside `/sprint:status` and `/sprint:dissolve`.
- The activity bundle is small by design — the goal is a daily ritual that fits in one screen, not an audit.
- If a single agent is invoked via `--agent <name>`, the standup summary is omitted and only that agent's 3 bullets are emitted with the activity context.
