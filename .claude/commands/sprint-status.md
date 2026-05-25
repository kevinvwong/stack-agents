---
name: sprint:status
description: Run a sprint health check — each agent on the current sprint reports what they flag as blocking, in-progress, or done against the sprint goal. Use at any point during a sprint to surface blockers early. Run from within the target project (requires SPRINT.md to be active).
---

# /sprint:status

Each agent on the sprint evaluates the current project state from their domain and reports against the sprint goal.

## Usage

```
/sprint:status
/sprint:status --agent <name>
```

Run from within the target project where `SPRINT.md` is active.

**Examples:**

```
/sprint:status
/sprint:status --agent data
```

## What Each Agent Reports

Each agent reads the sprint goal and current project state (via `gh` CLI and available files), then reports:

- **Done**: what's complete in their domain
- **In progress**: active work in their domain
- **Blocking**: what is blocking the sprint goal from their domain's perspective
- **Handoffs pending**: outputs ready for the next agent in the dependency chain

## Output Format

```
[SPRINT: <sprint-name>] [COMMAND: sprint:status]
Goal: <sprint goal>
Date: <today> | Day N of <duration>

---

[AGENT: <agent1>] [COMMAND: status]
✓ Done:         <items>
→ In progress:  <items>
✗ Blocking:     <items>
⇢ Handoffs:     <items>

---

[AGENT: <agent2>] [COMMAND: status]
...

---

## Sprint Health

Blockers:    N (Critical: N, High: N)
In progress: N items across N agents
Handoffs:    N pending

Verdict: On track | At risk | Blocked

If blocked: <specific blocker and which agent owns resolving it>
```

## Notes

- This command is injected into the target project's SPRINT.md by the assembler
- It runs every agent in the sprint's dependency order
- If no `SPRINT.md` is active, use `/sprint:list` to find the sprint and `/sprint:assemble` to reinstall
