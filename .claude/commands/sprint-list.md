---
name: sprint:list
description: List all sprint teams — active, dissolved, and by project. Shows the usage registry with agent composition, goals, dates, and status. Use to find an existing sprint before assembling a new one, or to audit sprint usage patterns across projects.
---

# /sprint:list

Read `sprints/registry.json` and display all sprint teams with their status.

## Usage

```
/sprint:list
/sprint:list --status active
/sprint:list --status dissolved
/sprint:list --project <path>
/sprint:list --agent <agent-name>
```

**Filters:**

| Filter | Description |
|--------|-------------|
| `--status active` | Only sprints currently active |
| `--status dissolved` | Only dissolved sprints |
| `--project <path>` | Only sprints for a specific target project |
| `--agent <name>` | Only sprints that include a specific agent |

**Examples:**

```
/sprint:list
/sprint:list --status active
/sprint:list --project ../my-app
/sprint:list --agent ai-llm
```

## Output Format

```
[AGENT: meta-sprint-assembler] [COMMAND: list]

Active sprints (N)
──────────────────
Sprint: <name>
  Goal:     <goal>
  Project:  <target path>
  Created:  <date>
  Duration: <duration> (ends <end date>)
  Agents:   <agent1>, <agent2>, ...
  Panel:    /panel:sprint:<name>
  Status:   active

...

Dissolved sprints (N)
─────────────────────
Sprint: <name>
  Goal:      <goal>
  Project:   <target path>
  Created:   <date>
  Dissolved: <date>
  Agents:    <agent1>, <agent2>, ...
  Status:    dissolved

...

Usage summary
─────────────
Total sprints assembled: N
Active: N  |  Dissolved: N
Most-used agents: <agent> (N sprints), <agent> (N sprints), ...
Projects served: N
Generated agents: <list of agents created during assembly>
```

## Registry Location

`sprints/registry.json` — append-only. Dissolved sprints are marked, never deleted.
