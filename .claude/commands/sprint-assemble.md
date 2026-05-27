---
name: sprint:assemble
description: Assemble a custom sprint team from the agent pool for a target project. Proposes a roster, generates any missing agents, installs a scoped sprint orchestrator into the target project, and registers the sprint in the usage log. This is how all sprint teams are created.
---

# /sprint:assemble

Convene the `sprint-assembler` to design and install a custom sprint team for a project.

## Usage

```
/sprint:assemble "<goal>" --project <path> [--duration <duration>] [--agents <list>] [--force]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `"<goal>"` | Yes | Sprint goal in plain language — the assembler uses this to select agents |
| `--project <path>` | Yes | Path to the target project (relative or absolute) |
| `--duration <duration>` | No | Sprint length, e.g. `1w`, `2w`, `4w` (default: `2w`) |
| `--agents <list>` | No | Comma-separated agent names to force-include (assembler still proposes additional agents) |
| `--force` | No | Overwrite an existing SPRINT.md in the target project |

**Examples:**

```
/sprint:assemble "build the AI voice coaching feature" --project ../my-app
/sprint:assemble "prepare repo for open-source launch" --project ../my-app --agents gh-repo,gh-docs
/sprint:assemble "ship the crafting system" --project ../games/my-game --duration 3w --force
/sprint:assemble "migrate auth from NextAuth to Clerk" --project ../my-app --duration 1w
```

## What Happens

The assembler runs in 8 steps:

1. **Reads the agent pool** — scans all `agents/*.md` to build the current roster
2. **Proposes agents** — selects agents whose responsibilities serve the sprint goal; presents for confirmation
3. **Generates missing agents** — creates any new agent files needed that don't exist yet
4. **Builds the dependency chain** — orders the roster so handoffs are correct
5. **Writes the sprint definition** — `sprints/<slug>/roster.md`, `panel.md`, `orchestrator.md`
6. **Installs into target project** — writes `<target>/.claude/SPRINT.md` (non-destructive without `--force`)
7. **Registers the sprint** — appends to `sprints/registry.json`
8. **Verifies** — reads back all written files and confirms correctness

## What Gets Installed

In the target project:

```
<target-project>/
  .claude/
    SPRINT.md    ← sprint orchestrator (activated in all Claude sessions for this project)
```

In `stack-agents`:

```
sprints/
  <sprint-slug>/
    roster.md        ← agent list, goal, duration, dependency chain
    panel.md         ← /panel:sprint:<name> command for this sprint
    orchestrator.md  ← source for SPRINT.md
  registry.json      ← updated with this sprint's entry
```

## The Installed Orchestrator

`SPRINT.md` activates a scoped Claude orchestrator in the target project. It includes:

- Sprint goal and duration
- Agent roster with routing rules
- Dependency chain
- Sprint-specific commands: `/sprint:status`, `/sprint:daily`, `/sprint:dissolve`
- Handoff protocol

The sprint orchestrator is **scoped** — it only routes to its assembled agents. Requests outside the roster are flagged explicitly.

## Output

```
[AGENT: meta-sprint-assembler] [COMMAND: scaffold]
Sprint: <name>
Goal: <goal>
...
Panel command: /panel:sprint:<name>
```

See `agents/meta-sprint-assembler.md` for the full output format.
