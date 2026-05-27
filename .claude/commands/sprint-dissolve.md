---
name: sprint:dissolve
description: Dissolve a sprint team — removes SPRINT.md from the target project and marks the sprint as dissolved in the registry. Non-destructive: the sprint definition in stack-agents/sprints/ and the registry record are preserved. Generated agents remain in the pool.
---

# /sprint:dissolve

Remove the sprint team from the target project and close out the registry entry. Safe and non-destructive — nothing is permanently deleted.

## Usage

```
/sprint:dissolve "<sprint-name>"
/sprint:dissolve "<sprint-name>" --project <path>
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `"<sprint-name>"` | Yes | Name of the sprint to dissolve (use `/sprint:list` to find it) |
| `--project <path>` | No | Target project path (inferred from registry if omitted) |

**Examples:**

```
/sprint:dissolve "ai-voice-coaching"
/sprint:dissolve "open-source-launch" --project ../my-app
```

## What Happens

1. **Reads registry** — confirms the sprint exists and is currently active
2. **Removes SPRINT.md** — deletes `<target-project>/.claude/SPRINT.md`
3. **Updates registry** — marks the sprint `"status": "dissolved"` and sets `"dissolved": "<ISO date>"`
4. **Reports** — confirms what was removed and what was preserved

## What Is Preserved

| Item | Preserved? |
|------|-----------|
| `sprints/<slug>/roster.md` | Yes |
| `sprints/<slug>/panel.md` | Yes |
| `sprints/<slug>/orchestrator.md` | Yes |
| `sprints/registry.json` entry | Yes (marked dissolved) |
| Generated agent files in `agents/` | Yes — they join the permanent pool |
| `<target>/.claude/SPRINT.md` | **Removed** |

Generated agents are **never removed** — they become permanent additions to the agent pool, available to future sprints.

## Output Format

```
[AGENT: meta-sprint-assembler] [COMMAND: dissolve]
Sprint: <name>
Project: <target path>

Removed:
  ✓ <target>/.claude/SPRINT.md

Preserved:
  ✓ sprints/<slug>/ (definition intact)
  ✓ registry entry (marked dissolved, <date>)
  ✓ generated agents: <list> (now in permanent pool)

Sprint <name> dissolved. Registry record retained for history.
```

## Reassembling

A dissolved sprint can be reassembled at any time:

```
/sprint:assemble "<goal>" --project <path>
```

Or reinstalled from its existing definition:

```
/sprint:assemble "<goal>" --project <path> --force
```
